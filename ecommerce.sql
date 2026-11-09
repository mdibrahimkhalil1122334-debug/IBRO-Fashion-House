-- IBRO Fashion House E-commerce migration
-- Run AFTER schema.sql in Supabase Dashboard > SQL Editor.

-- Allow public storefront visitors to read products that are in stock.
drop policy if exists "Public visitors can view available products" on public.products;
create policy "Public visitors can view available products"
on public.products for select to anon, authenticated
using (stock > 0);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  payment_method text not null check (payment_method in ('cod','bkash','nagad')),
  payment_status text not null default 'unpaid',
  payment_transaction_id text,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  notes text,
  whatsapp_notified boolean not null default false,
  whatsapp_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders" on public.orders for select to authenticated using (true);
drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders" on public.orders for update to authenticated using (true) with check (true);
drop policy if exists "Admins can view order items" on public.order_items;
create policy "Admins can view order items" on public.order_items for select to authenticated using (true);

-- No public INSERT policy: orders are created by the secure server route using the service role key.
-- Keep SUPABASE_SERVICE_ROLE_KEY private; never prefix it with NEXT_PUBLIC_.
