begin;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Split', 'Central', 'Repuesto')),
  brand text not null,
  btu integer,
  price numeric(12,2),
  description text not null default '',
  image text not null default '',
  published boolean not null default true,
  stock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_idx
  on public.products(published);

create index if not exists products_category_idx
  on public.products(category);

alter table public.products enable row level security;

drop policy if exists "Public can view published products"
on public.products;

create policy "Public can view published products"
on public.products
for select
to anon, authenticated
using (published = true);

drop policy if exists "Authenticated users manage products"
on public.products;

create policy "Authenticated users manage products"
on public.products
for all
to authenticated
using (true)
with check (true);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at
on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

insert into public.products (
  name,
  category,
  brand,
  btu,
  price,
  description,
  image,
  published,
  stock
)
select *
from (
  values
    (
      'Aire Split Inverter 12,000 BTU',
      'Split',
      'Disponible por cotización',
      12000,
      null::numeric,
      'Equipo eficiente para habitaciones y espacios medianos.',
      'https://images.unsplash.com/photo-1631545806609-8a0b4b3f1a36?w=700&h=500&fit=crop&auto=format',
      true,
      null::integer
    ),
    (
      'Aire Split Inverter 18,000 BTU',
      'Split',
      'Disponible por cotización',
      18000,
      null::numeric,
      'Ideal para salas, oficinas y habitaciones amplias.',
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=700&h=500&fit=crop&auto=format',
      true,
      null::integer
    ),
    (
      'Sistema Central 36,000 BTU',
      'Central',
      'Disponible por cotización',
      36000,
      null::numeric,
      'Solución para espacios comerciales o residencias de mayor tamaño.',
      'https://images.unsplash.com/photo-1581092919535-7146ff1a590b?w=700&h=500&fit=crop&auto=format',
      true,
      null::integer
    ),
    (
      'Capacitor para A/C',
      'Repuesto',
      'Varias marcas',
      null::integer,
      null::numeric,
      'Repuesto eléctrico para mantenimiento y reparación de unidades.',
      'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=700&h=500&fit=crop&auto=format',
      true,
      null::integer
    ),
    (
      'Contactor para A/C',
      'Repuesto',
      'Varias marcas',
      null::integer,
      null::numeric,
      'Componente de reemplazo para sistemas de climatización.',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700&h=500&fit=crop&auto=format',
      true,
      null::integer
    )
) as seed(
  name,
  category,
  brand,
  btu,
  price,
  description,
  image,
  published,
  stock
)
where not exists (
  select 1
  from public.products
);

commit;