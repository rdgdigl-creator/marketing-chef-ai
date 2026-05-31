-- Brand Kit — единый бренд ресторана для всех креативов
create table if not exists public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default '',
  logo_url text,
  slogan text not null default '',
  primary_color text not null default '#ff6b2b',
  secondary_color text not null default '#1a1a1a',
  whatsapp text not null default '',
  instagram text not null default '',
  address text not null default '',
  phone text not null default '',
  website text not null default '',
  watermark_enabled boolean not null default true,
  logo_position text not null default 'bottom_right' check (
    logo_position in ('top_left', 'top_right', 'bottom_left', 'bottom_right', 'center')
  ),
  logo_size text not null default 'medium' check (
    logo_size in ('small', 'medium', 'large')
  ),
  logo_opacity integer not null default 80 check (logo_opacity >= 0 and logo_opacity <= 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_brand_kits_created_at
  on public.brand_kits (created_at desc);

alter table public.brand_kits enable row level security;

drop policy if exists "Allow anon read brand_kits" on public.brand_kits;
drop policy if exists "Allow anon insert brand_kits" on public.brand_kits;
drop policy if exists "Allow anon update brand_kits" on public.brand_kits;

create policy "Allow anon read brand_kits"
  on public.brand_kits for select to anon using (true);

create policy "Allow anon insert brand_kits"
  on public.brand_kits for insert to anon with check (true);

create policy "Allow anon update brand_kits"
  on public.brand_kits for update to anon using (true) with check (true);
