-- iiko integration: connections (API credentials per user) and sync logs
-- Follows the auth model from 006_auth.sql: authenticated role + user_id = auth.uid()

-- ========== iiko_connections ==========

create table if not exists public.iiko_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text not null default '',
  organization_name text not null default '',
  api_login text not null,
  is_active boolean not null default true,
  sync_status text not null default 'pending' check (
    sync_status in ('pending', 'connected', 'syncing', 'error')
  ),
  error_message text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- ========== iiko_sync_logs ==========

create table if not exists public.iiko_sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.iiko_connections (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sync_type text not null check (
    sync_type in ('nomenclature', 'menu', 'sales', 'stop_list', 'organizations')
  ),
  status text not null default 'in_progress' check (
    status in ('in_progress', 'success', 'error')
  ),
  records_synced integer not null default 0,
  error_message text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== Indexes ==========

create index if not exists idx_iiko_connections_user_id
  on public.iiko_connections (user_id, created_at desc);

create index if not exists idx_iiko_connections_active
  on public.iiko_connections (user_id, is_active);

create index if not exists idx_iiko_sync_logs_connection_id
  on public.iiko_sync_logs (connection_id, created_at desc);

create index if not exists idx_iiko_sync_logs_user_id
  on public.iiko_sync_logs (user_id, created_at desc);

-- ========== updated_at trigger ==========

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists iiko_connections_updated_at on public.iiko_connections;

create trigger iiko_connections_updated_at
  before update on public.iiko_connections
  for each row execute function public.set_updated_at();

-- ========== RLS ==========

alter table public.iiko_connections enable row level security;
alter table public.iiko_sync_logs enable row level security;

drop policy if exists "Users select own iiko_connections" on public.iiko_connections;
drop policy if exists "Users insert own iiko_connections" on public.iiko_connections;
drop policy if exists "Users update own iiko_connections" on public.iiko_connections;
drop policy if exists "Users delete own iiko_connections" on public.iiko_connections;

create policy "Users select own iiko_connections"
  on public.iiko_connections for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own iiko_connections"
  on public.iiko_connections for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own iiko_connections"
  on public.iiko_connections for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own iiko_connections"
  on public.iiko_connections for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users select own iiko_sync_logs" on public.iiko_sync_logs;
drop policy if exists "Users insert own iiko_sync_logs" on public.iiko_sync_logs;
drop policy if exists "Users update own iiko_sync_logs" on public.iiko_sync_logs;

create policy "Users select own iiko_sync_logs"
  on public.iiko_sync_logs for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own iiko_sync_logs"
  on public.iiko_sync_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.iiko_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own iiko_sync_logs"
  on public.iiko_sync_logs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
