begin;

create table if not exists public.maintenance_notification_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  maintenance_service_id uuid not null references public.maintenance_services(id) on delete cascade,
  status text not null check (status in ('PROXIMO','VENCIDO')),
  channel text not null check (channel in ('EMAIL','WHATSAPP')),
  target text not null check (target in ('CLIENT','ADMIN')),
  recipient text,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint maintenance_notification_log_once_per_cycle
    unique (maintenance_service_id, status, channel, target)
);

create index if not exists maintenance_notification_log_equipment_idx
  on public.maintenance_notification_log(equipment_id, sent_at desc);

create index if not exists maintenance_notification_log_customer_idx
  on public.maintenance_notification_log(customer_id, sent_at desc);

alter table public.maintenance_notification_log enable row level security;

-- No public/authenticated policies are created intentionally.
-- The Edge Function accesses this table with the service role key.

create or replace function public.maintenance_alert_candidates()
returns table (
  customer_id uuid,
  full_name text,
  phone text,
  email text,
  equipment_id uuid,
  maintenance_service_id uuid,
  brand text,
  equipment_type text,
  location text,
  last_maintenance date,
  recommended_months integer,
  status text,
  technician_name text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as customer_id,
    c.full_name,
    c.phone,
    c.email,
    e.id as equipment_id,
    lm.id as maintenance_service_id,
    e.brand,
    e.equipment_type,
    e.location,
    lm.service_date as last_maintenance,
    e.recommended_months,
    public.maintenance_state(lm.service_date, e.recommended_months) as status,
    t.full_name as technician_name
  from public.customers c
  join public.equipment e on e.customer_id = c.id
  join lateral (
    select ms.id, ms.service_date, ms.technician_id, ms.created_at
    from public.maintenance_services ms
    where ms.equipment_id = e.id
    order by ms.service_date desc, ms.created_at desc
    limit 1
  ) lm on true
  left join public.technicians t on t.id = lm.technician_id
  where public.maintenance_state(lm.service_date, e.recommended_months)
    in ('PROXIMO','VENCIDO');
$$;

revoke all on function public.maintenance_alert_candidates() from public;

commit;
