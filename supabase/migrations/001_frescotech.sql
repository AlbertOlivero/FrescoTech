create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  document_id text unique,
  phone text,
  full_name text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers(phone);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text not null default 'Sin especificar',
  equipment_type text not null,
  location text not null,
  recommended_months integer not null default 4 check (recommended_months in (3,4)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_services (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  service_date date not null default current_date,
  technical_notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists maintenance_equipment_date_idx on public.maintenance_services(equipment_id, service_date desc);

alter table public.customers enable row level security;
alter table public.equipment enable row level security;
alter table public.maintenance_services enable row level security;

create policy "authenticated manage customers" on public.customers for all to authenticated using (true) with check (true);
create policy "authenticated manage equipment" on public.equipment for all to authenticated using (true) with check (true);
create policy "authenticated manage maintenance" on public.maintenance_services for all to authenticated using (true) with check (true);

create or replace function public.maintenance_state(p_last date, p_months integer)
returns text
language sql
stable
as $$
  select case
    when p_last is null then 'VENCIDO'
    when current_date < (p_last + make_interval(months => greatest(p_months - 1, 0)))::date then 'AL_DIA'
    when current_date < (p_last + make_interval(months => p_months))::date then 'PROXIMO'
    else 'VENCIDO'
  end;
$$;

create or replace function public.public_equipment_status(p_identifier text)
returns table (
  equipment_id uuid,
  brand text,
  equipment_type text,
  location text,
  last_maintenance date,
  recommended_months integer,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.brand,
    e.equipment_type,
    e.location,
    max(ms.service_date) as last_maintenance,
    e.recommended_months,
    public.maintenance_state(max(ms.service_date), e.recommended_months) as status
  from public.customers c
  join public.equipment e on e.customer_id = c.id
  left join public.maintenance_services ms on ms.equipment_id = e.id
  where regexp_replace(coalesce(c.document_id,''), '\D', '', 'g') = regexp_replace(p_identifier, '\D', '', 'g')
     or regexp_replace(coalesce(c.phone,''), '\D', '', 'g') = regexp_replace(p_identifier, '\D', '', 'g')
  group by e.id, e.brand, e.equipment_type, e.location, e.recommended_months;
$$;

revoke all on function public.public_equipment_status(text) from public;
grant execute on function public.public_equipment_status(text) to anon, authenticated;

create or replace function public.admin_maintenance_dashboard()
returns table (
  customer_id uuid,
  full_name text,
  document_id text,
  phone text,
  email text,
  equipment_id uuid,
  brand text,
  equipment_type text,
  location text,
  last_maintenance date,
  recommended_months integer,
  status text
)
language sql
security invoker
as $$
  select c.id, c.full_name, c.document_id, c.phone, c.email,
         e.id, e.brand, e.equipment_type, e.location,
         max(ms.service_date), e.recommended_months,
         public.maintenance_state(max(ms.service_date), e.recommended_months)
  from public.customers c
  join public.equipment e on e.customer_id = c.id
  left join public.maintenance_services ms on ms.equipment_id = e.id
  group by c.id, c.full_name, c.document_id, c.phone, c.email,
           e.id, e.brand, e.equipment_type, e.location, e.recommended_months
  order by c.full_name, e.location;
$$;

grant execute on function public.admin_maintenance_dashboard() to authenticated;

create or replace function public.register_maintenance_service(
  p_document_id text,
  p_phone text,
  p_full_name text,
  p_email text,
  p_brand text,
  p_equipment_type text,
  p_location text,
  p_service_date date,
  p_recommended_months integer,
  p_notes text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_customer_id uuid;
  v_equipment_id uuid;
begin
  select id into v_customer_id
  from public.customers
  where (p_document_id is not null and document_id = p_document_id)
     or (p_phone is not null and phone = p_phone)
  limit 1;

  if v_customer_id is null then
    insert into public.customers(document_id, phone, full_name, email)
    values (p_document_id, p_phone, p_full_name, p_email)
    returning id into v_customer_id;
  else
    update public.customers set
      document_id = coalesce(p_document_id, document_id),
      phone = coalesce(p_phone, phone),
      full_name = p_full_name,
      email = coalesce(p_email, email),
      updated_at = now()
    where id = v_customer_id;
  end if;

  select id into v_equipment_id
  from public.equipment
  where customer_id = v_customer_id
    and lower(location) = lower(p_location)
    and lower(equipment_type) = lower(p_equipment_type)
  limit 1;

  if v_equipment_id is null then
    insert into public.equipment(customer_id, brand, equipment_type, location, recommended_months)
    values (v_customer_id, p_brand, p_equipment_type, p_location, p_recommended_months)
    returning id into v_equipment_id;
  else
    update public.equipment set
      brand = p_brand,
      recommended_months = p_recommended_months,
      updated_at = now()
    where id = v_equipment_id;
  end if;

  insert into public.maintenance_services(equipment_id, service_date, technical_notes, created_by)
  values (v_equipment_id, p_service_date, p_notes, auth.uid());

  return v_equipment_id;
end;
$$;

grant execute on function public.register_maintenance_service(text,text,text,text,text,text,text,date,integer,text) to authenticated;
