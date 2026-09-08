begin;

-- 1) Cédula deja de ser necesaria. Conservamos la columna por compatibilidad, pero ya no se usa.
alter table public.customers alter column document_id drop not null;

-- 2) Técnicos: hoy puedes ser tú; mañana pueden ser empleados.
create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  active boolean not null default true,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3) Una visita/servicio agrupa varios equipos del mismo cliente y un solo cobro.
create table if not exists public.service_visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_date date not null default current_date,
  technician_id uuid references public.technicians(id) on delete set null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_method text not null default 'Efectivo',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.maintenance_services add column if not exists visit_id uuid references public.service_visits(id) on delete set null;
alter table public.maintenance_services add column if not exists technician_id uuid references public.technicians(id) on delete set null;

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_email_lower on public.customers(lower(email));
create index if not exists idx_service_visits_date on public.service_visits(service_date);
create index if not exists idx_service_visits_technician on public.service_visits(technician_id);

alter table public.technicians enable row level security;
alter table public.service_visits enable row level security;

drop policy if exists "authenticated manage technicians" on public.technicians;
create policy "authenticated manage technicians" on public.technicians for all to authenticated using (true) with check (true);
drop policy if exists "authenticated manage service visits" on public.service_visits;
create policy "authenticated manage service visits" on public.service_visits for all to authenticated using (true) with check (true);

-- Normaliza teléfonos para comparar aunque tengan guiones, espacios o paréntesis.
create or replace function public.normalize_phone(p_value text)
returns text language sql immutable as $$ select regexp_replace(coalesce(p_value,''), '[^0-9]', '', 'g'); $$;

-- Búsqueda pública SOLO por correo o teléfono. Devuelve información limitada del equipo.
create or replace function public.public_equipment_status_v2(p_identifier text)
returns table (
  equipment_id uuid,
  brand text,
  equipment_type text,
  location text,
  last_maintenance date,
  recommended_months integer,
  status text
)
language sql security definer set search_path = public
as $$
  with matched_customers as (
    select c.id
    from public.customers c
    where (c.email is not null and lower(c.email) = lower(trim(p_identifier)))
       or (c.phone is not null and public.normalize_phone(c.phone) = public.normalize_phone(p_identifier))
  ), latest as (
    select e.id equipment_id, e.brand, e.equipment_type, e.location, e.recommended_months,
           max(ms.service_date)::date last_maintenance
    from public.equipment e
    join matched_customers mc on mc.id = e.customer_id
    left join public.maintenance_services ms on ms.equipment_id = e.id
    group by e.id, e.brand, e.equipment_type, e.location, e.recommended_months
  )
  select l.equipment_id,l.brand,l.equipment_type,l.location,l.last_maintenance,l.recommended_months,
         public.maintenance_state(l.last_maintenance,l.recommended_months) status
  from latest l order by l.location;
$$;
revoke all on function public.public_equipment_status_v2(text) from public;
grant execute on function public.public_equipment_status_v2(text) to anon, authenticated;

-- Dashboard admin sin cédula y con técnico del último mantenimiento.
create or replace function public.admin_maintenance_dashboard_v2()
returns table (
  customer_id uuid, full_name text, phone text, email text,
  equipment_id uuid, brand text, equipment_type text, location text,
  last_maintenance date, recommended_months integer, status text, technician_name text
)
language sql security definer set search_path = public
as $$
  select c.id, c.full_name, c.phone, c.email,
         e.id, e.brand, e.equipment_type, e.location,
         lm.service_date, e.recommended_months,
         public.maintenance_state(lm.service_date,e.recommended_months), t.full_name
  from public.customers c
  join public.equipment e on e.customer_id=c.id
  left join lateral (
    select ms.service_date, ms.technician_id
    from public.maintenance_services ms where ms.equipment_id=e.id
    order by ms.service_date desc, ms.created_at desc limit 1
  ) lm on true
  left join public.technicians t on t.id=lm.technician_id
  order by coalesce(lm.service_date,'1900-01-01'::date) desc, c.full_name;
$$;
grant execute on function public.admin_maintenance_dashboard_v2() to authenticated;

create or replace function public.admin_technicians()
returns setof public.technicians
language sql security definer set search_path=public
as $$ select * from public.technicians order by active desc, full_name; $$;
grant execute on function public.admin_technicians() to authenticated;

create or replace function public.admin_create_technician(p_full_name text,p_phone text default null,p_email text default null)
returns uuid language plpgsql security definer set search_path=public
as $$ declare v_id uuid; begin
  insert into public.technicians(full_name,phone,email) values(trim(p_full_name),nullif(trim(p_phone),''),nullif(trim(p_email),'')) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.admin_create_technician(text,text,text) to authenticated;

-- Registro V2: encuentra cliente por correo/teléfono, crea una visita y N equipos.
create or replace function public.register_maintenance_service_v2(
  p_full_name text,
  p_phone text,
  p_email text,
  p_service_date date,
  p_technician_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text,
  p_equipment jsonb
)
returns uuid language plpgsql security definer set search_path=public
as $$
declare
  v_customer_id uuid;
  v_visit_id uuid;
  v_item jsonb;
  v_equipment_id uuid;
  v_location text;
  v_type text;
  v_brand text;
  v_months integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select c.id into v_customer_id from public.customers c
  where (p_email is not null and c.email is not null and lower(c.email)=lower(trim(p_email)))
     or (p_phone is not null and c.phone is not null and public.normalize_phone(c.phone)=public.normalize_phone(p_phone))
  order by c.created_at asc limit 1;

  if v_customer_id is null then
    insert into public.customers(full_name,phone,email)
    values(trim(p_full_name),nullif(trim(p_phone),''),nullif(trim(p_email),'')) returning id into v_customer_id;
  else
    update public.customers set full_name=trim(p_full_name),
      phone=coalesce(nullif(trim(p_phone),''),phone),
      email=coalesce(nullif(trim(p_email),''),email), updated_at=now()
    where id=v_customer_id;
  end if;

  insert into public.service_visits(customer_id,service_date,technician_id,amount,payment_method,notes,created_by)
  values(v_customer_id,coalesce(p_service_date,current_date),p_technician_id,coalesce(p_amount,0),coalesce(nullif(trim(p_payment_method),''),'Efectivo'),p_notes,auth.uid())
  returning id into v_visit_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_equipment,'[]'::jsonb)) loop
    v_location := trim(coalesce(v_item->>'location',''));
    v_type := coalesce(nullif(trim(v_item->>'equipment_type'),''),'Split');
    v_brand := coalesce(nullif(trim(v_item->>'brand'),''),'Sin especificar');
    v_months := greatest(3,least(4,coalesce((v_item->>'recommended_months')::integer,4)));
    if v_location='' then raise exception 'Cada equipo necesita una ubicación'; end if;

    select e.id into v_equipment_id from public.equipment e
    where e.customer_id=v_customer_id and lower(e.location)=lower(v_location) and lower(e.equipment_type)=lower(v_type)
    limit 1;
    if v_equipment_id is null then
      insert into public.equipment(customer_id,brand,equipment_type,location,recommended_months)
      values(v_customer_id,v_brand,v_type,v_location,v_months) returning id into v_equipment_id;
    else
      update public.equipment set brand=v_brand,recommended_months=v_months where id=v_equipment_id;
    end if;
    insert into public.maintenance_services(equipment_id,service_date,technical_notes,created_by,visit_id,technician_id)
    values(v_equipment_id,coalesce(p_service_date,current_date),p_notes,auth.uid(),v_visit_id,p_technician_id);
  end loop;

  return v_visit_id;
end $$;
grant execute on function public.register_maintenance_service_v2(text,text,text,date,uuid,numeric,text,text,jsonb) to authenticated;

create or replace function public.admin_service_accounting(p_from date,p_to date)
returns table (
  visit_id uuid, service_date date, full_name text, phone text, email text,
  equipment_count bigint, amount numeric, payment_method text, technician_name text, notes text
)
language sql security definer set search_path=public
as $$
  select sv.id,sv.service_date,c.full_name,c.phone,c.email,count(ms.id),sv.amount,sv.payment_method,t.full_name,sv.notes
  from public.service_visits sv
  join public.customers c on c.id=sv.customer_id
  left join public.maintenance_services ms on ms.visit_id=sv.id
  left join public.technicians t on t.id=sv.technician_id
  where sv.service_date between p_from and p_to
  group by sv.id,sv.service_date,c.full_name,c.phone,c.email,sv.amount,sv.payment_method,t.full_name,sv.notes
  order by sv.service_date desc, sv.created_at desc;
$$;
grant execute on function public.admin_service_accounting(date,date) to authenticated;

-- Datos para el job de alertas. No se concede a anon/authenticated; se usa con service role.
create or replace function public.maintenance_alert_candidates()
returns table (
  customer_id uuid, full_name text, phone text, email text,
  equipment_id uuid, brand text, equipment_type text, location text,
  last_maintenance date, recommended_months integer, status text, technician_name text
)
language sql security definer set search_path=public
as $$
  select d.customer_id,d.full_name,d.phone,d.email,d.equipment_id,d.brand,d.equipment_type,d.location,d.last_maintenance,d.recommended_months,d.status,d.technician_name
  from public.admin_maintenance_dashboard_v2() d
  where d.status in ('PROXIMO','VENCIDO');
$$;
revoke all on function public.maintenance_alert_candidates() from public;

commit;
