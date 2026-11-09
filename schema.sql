-- Run this entire file in Supabase Dashboard > SQL Editor.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category text not null default 'Uncategorized',
  description text not null default '',
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Authenticated users can manage inventory. Public visitors cannot read this private dashboard.
create policy "Authenticated users can view products"
on public.products for select to authenticated using (true);
create policy "Authenticated users can insert products"
on public.products for insert to authenticated with check (true);
create policy "Authenticated users can update products"
on public.products for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete products"
on public.products for delete to authenticated using (true);

-- Create a private bucket named product-images in Storage, then apply these policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Authenticated users upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');
create policy "Product images are viewable"
on storage.objects for select to public
using (bucket_id = 'product-images');
create policy "Authenticated users delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');
