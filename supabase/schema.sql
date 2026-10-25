create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  images text[] not null default '{}',
  available boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  customer_phone text not null,
  customer_location text not null,
  delivery_address text not null default '',
  notes text not null default '',
  items jsonb not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));
create index if not exists products_code_idx on public.products(code);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_public_idx on public.products(published, available);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);

drop policy if exists "Public can read published available products" on public.products;
create policy "Public can read published available products" on public.products
for select to anon, authenticated using (published = true and available = true);

-- No direct public insert/update/delete policies are created.
-- Admin writes and order creation go through server API routes that verify admin identity
-- or validate product prices before using the server-only service-role key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
