-- Sales data synced from iiko: daily aggregates, per-product, hourly breakdown, and sync logs.
-- Follows the auth model from 006_auth.sql / 007_iiko.sql:
--   authenticated role, user_id = auth.uid(), ownership scoped via iiko_connections.
-- Safe to re-run (IF NOT EXISTS / drop-before-create policies).

-- ========== sales_daily ==========
-- One row per connection + business date + department (iiko OLAP daily aggregate).

create table if not exists public.sales_daily (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.iiko_connections (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text not null default '',
  department_id text not null default '',
  business_date date not null,
  gross_revenue numeric(14, 2) not null default 0,
  discount_total numeric(14, 2) not null default 0,
  revenue numeric(14, 2) not null default 0,
  orders_count integer not null default 0,
  guests_count integer not null default 0,
  average_check numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, department_id, business_date)
);

-- ========== sales_products ==========
-- Sales per nomenclature item per business date (what was sold, how much, for how much).

create table if not exists public.sales_products (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.iiko_connections (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business_date date not null,
  product_id text not null,
  product_name text not null default '',
  category text not null default '',
  quantity numeric(14, 3) not null default 0,
  revenue numeric(14, 2) not null default 0,
  cost numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, business_date, product_id)
);

-- ========== sales_hourly ==========
-- Sales split into 24 hourly buckets per business date (used for peak-hour analytics).

create table if not exists public.sales_hourly (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.iiko_connections (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business_date date not null,
  hour smallint not null check (hour >= 0 and hour <= 23),
  revenue numeric(14, 2) not null default 0,
  orders_count integer not null default 0,
  guests_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, business_date, hour)
);

-- ========== sales_sync_logs ==========
-- Audit trail of sales sync runs (period, status, counts, errors).

create table if not exists public.sales_sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.iiko_connections (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sync_type text not null default 'daily' check (
    sync_type in ('daily', 'products', 'hourly', 'full')
  ),
  status text not null default 'in_progress' check (
    status in ('in_progress', 'success', 'error')
  ),
  period_from date,
  period_to date,
  records_synced integer not null default 0,
  error_message text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== Indexes ==========

create index if not exists idx_sales_daily_user_id
  on public.sales_daily (user_id, business_date desc);

create index if not exists idx_sales_daily_connection_date
  on public.sales_daily (connection_id, business_date desc);

create index if not exists idx_sales_products_user_id
  on public.sales_products (user_id, business_date desc);

create index if not exists idx_sales_products_connection_date
  on public.sales_products (connection_id, business_date desc);

create index if not exists idx_sales_products_product
  on public.sales_products (connection_id, product_id, business_date desc);

create index if not exists idx_sales_hourly_user_id
  on public.sales_hourly (user_id, business_date desc);

create index if not exists idx_sales_hourly_connection_date
  on public.sales_hourly (connection_id, business_date desc);

create index if not exists idx_sales_sync_logs_user_id
  on public.sales_sync_logs (user_id, created_at desc);

create index if not exists idx_sales_sync_logs_connection_id
  on public.sales_sync_logs (connection_id, created_at desc);

-- ========== updated_at triggers (reuses public.set_updated_at from 006_auth.sql) ==========

drop trigger if exists sales_daily_updated_at on public.sales_daily;
create trigger sales_daily_updated_at
  before update on public.sales_daily
  for each row execute function public.set_updated_at();

drop trigger if exists sales_products_updated_at on public.sales_products;
create trigger sales_products_updated_at
  before update on public.sales_products
  for each row execute function public.set_updated_at();

drop trigger if exists sales_hourly_updated_at on public.sales_hourly;
create trigger sales_hourly_updated_at
  before update on public.sales_hourly
  for each row execute function public.set_updated_at();

-- ========== RLS ==========

alter table public.sales_daily enable row level security;
alter table public.sales_products enable row level security;
alter table public.sales_hourly enable row level security;
alter table public.sales_sync_logs enable row level security;

-- sales_daily
drop policy if exists "Users select own sales_daily" on public.sales_daily;
drop policy if exists "Users insert own sales_daily" on public.sales_daily;
drop policy if exists "Users update own sales_daily" on public.sales_daily;
drop policy if exists "Users delete own sales_daily" on public.sales_daily;

create policy "Users select own sales_daily"
  on public.sales_daily for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own sales_daily"
  on public.sales_daily for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.iiko_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own sales_daily"
  on public.sales_daily for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own sales_daily"
  on public.sales_daily for delete to authenticated
  using (user_id = auth.uid());

-- sales_products
drop policy if exists "Users select own sales_products" on public.sales_products;
drop policy if exists "Users insert own sales_products" on public.sales_products;
drop policy if exists "Users update own sales_products" on public.sales_products;
drop policy if exists "Users delete own sales_products" on public.sales_products;

create policy "Users select own sales_products"
  on public.sales_products for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own sales_products"
  on public.sales_products for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.iiko_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own sales_products"
  on public.sales_products for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own sales_products"
  on public.sales_products for delete to authenticated
  using (user_id = auth.uid());

-- sales_hourly
drop policy if exists "Users select own sales_hourly" on public.sales_hourly;
drop policy if exists "Users insert own sales_hourly" on public.sales_hourly;
drop policy if exists "Users update own sales_hourly" on public.sales_hourly;
drop policy if exists "Users delete own sales_hourly" on public.sales_hourly;

create policy "Users select own sales_hourly"
  on public.sales_hourly for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own sales_hourly"
  on public.sales_hourly for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.iiko_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own sales_hourly"
  on public.sales_hourly for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own sales_hourly"
  on public.sales_hourly for delete to authenticated
  using (user_id = auth.uid());

-- sales_sync_logs
drop policy if exists "Users select own sales_sync_logs" on public.sales_sync_logs;
drop policy if exists "Users insert own sales_sync_logs" on public.sales_sync_logs;
drop policy if exists "Users update own sales_sync_logs" on public.sales_sync_logs;

create policy "Users select own sales_sync_logs"
  on public.sales_sync_logs for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own sales_sync_logs"
  on public.sales_sync_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.iiko_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own sales_sync_logs"
  on public.sales_sync_logs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ========== Comments ==========

comment on table public.sales_daily is 'Daily sales aggregates synced from iiko, one row per connection + department + business date.';
comment on column public.sales_daily.connection_id is 'Owning iiko connection (FK to iiko_connections).';
comment on column public.sales_daily.organization_id is 'iiko organization id this aggregate belongs to.';
comment on column public.sales_daily.department_id is 'iiko department / store id; empty string when aggregated across the whole organization.';
comment on column public.sales_daily.business_date is 'iiko business day (accounting date, may differ from calendar date for late-night shifts).';
comment on column public.sales_daily.gross_revenue is 'Revenue before discounts.';
comment on column public.sales_daily.discount_total is 'Total discounts applied.';
comment on column public.sales_daily.revenue is 'Net revenue after discounts.';
comment on column public.sales_daily.orders_count is 'Number of closed checks / receipts.';
comment on column public.sales_daily.guests_count is 'Number of guests served.';
comment on column public.sales_daily.average_check is 'Average check = revenue / orders_count.';

comment on table public.sales_products is 'Per-product sales per business date synced from iiko nomenclature.';
comment on column public.sales_products.product_id is 'iiko nomenclature item id.';
comment on column public.sales_products.product_name is 'Snapshot of product name at sync time.';
comment on column public.sales_products.category is 'Product category / group name.';
comment on column public.sales_products.quantity is 'Quantity sold (supports fractional units, e.g. weight goods).';
comment on column public.sales_products.revenue is 'Net revenue for this product on this date.';
comment on column public.sales_products.cost is 'Cost of goods sold for this product, if available.';

comment on table public.sales_hourly is 'Hourly sales buckets per business date, used for peak-hour analytics.';
comment on column public.sales_hourly.hour is 'Hour of the business day, 0-23.';
comment on column public.sales_hourly.revenue is 'Net revenue within this hour.';
comment on column public.sales_hourly.orders_count is 'Number of closed checks within this hour.';
comment on column public.sales_hourly.guests_count is 'Number of guests within this hour.';

comment on table public.sales_sync_logs is 'Audit trail of sales sync runs from iiko (period, status, counts, errors).';
comment on column public.sales_sync_logs.sync_type is 'Which sales dataset was synced: daily | products | hourly | full.';
comment on column public.sales_sync_logs.status is 'Run status: in_progress | success | error.';
comment on column public.sales_sync_logs.period_from is 'Inclusive start business date of the synced range.';
comment on column public.sales_sync_logs.period_to is 'Inclusive end business date of the synced range.';
comment on column public.sales_sync_logs.records_synced is 'Number of rows upserted across the target table(s).';
comment on column public.sales_sync_logs.details is 'Free-form JSON metadata about the run (request params, per-table counts, etc.).';
