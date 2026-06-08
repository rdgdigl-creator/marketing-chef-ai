-- Meta Ads integration: OAuth connections, ad accounts, structure cache, insights, audits
-- Follows the auth model from 006_auth.sql: authenticated role + user_id = auth.uid()

-- ========== meta_connections ==========

create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meta_user_id text not null,
  meta_user_name text,
  access_token text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  selected_ad_account_id text,
  sync_status text not null default 'pending' check (
    sync_status in ('pending', 'connected', 'syncing', 'error')
  ),
  error_message text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ========== meta_ad_accounts ==========

create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  meta_account_id text not null,
  name text not null,
  currency text not null default 'RUB',
  account_status text,
  timezone text,
  is_selected boolean not null default false,
  synced_at timestamptz not null default now(),
  unique (connection_id, meta_account_id)
);

-- ========== meta_campaigns ==========

create table if not exists public.meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_account_id text not null,
  meta_campaign_id text not null,
  name text not null,
  status text not null,
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  synced_at timestamptz not null default now(),
  unique (connection_id, meta_campaign_id)
);

-- ========== meta_ad_sets ==========

create table if not exists public.meta_ad_sets (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_account_id text not null,
  meta_campaign_id text not null,
  meta_ad_set_id text not null,
  name text not null,
  status text not null,
  optimization_goal text,
  targeting_summary jsonb not null default '{}'::jsonb,
  is_retargeting boolean not null default false,
  synced_at timestamptz not null default now(),
  unique (connection_id, meta_ad_set_id)
);

-- ========== meta_ads ==========

create table if not exists public.meta_ads (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_account_id text not null,
  meta_ad_set_id text not null,
  meta_ad_id text not null,
  name text not null,
  status text not null,
  creative_id text,
  synced_at timestamptz not null default now(),
  unique (connection_id, meta_ad_id)
);

-- ========== meta_insights_snapshots ==========

create table if not exists public.meta_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_account_id text not null,
  entity_type text not null check (
    entity_type in ('account', 'campaign', 'adset', 'ad')
  ),
  entity_id text not null,
  period text not null check (
    period in ('last_7d', 'last_30d', 'last_90d')
  ),
  date_start date not null,
  date_stop date not null,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  spend numeric not null default 0,
  ctr numeric,
  cpm numeric,
  cpc numeric,
  frequency numeric,
  conversions numeric not null default 0,
  cost_per_result numeric,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (connection_id, entity_type, entity_id, period)
);

-- ========== meta_sync_logs ==========

create table if not exists public.meta_sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sync_type text not null check (
    sync_type in ('accounts', 'structure', 'insights', 'full')
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

-- ========== media_buyer_audits ==========

create table if not exists public.media_buyer_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null references public.meta_connections (id) on delete cascade,
  ad_account_id text not null,
  score integer not null check (score between 0 and 100),
  grade text not null,
  kpis jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ========== Indexes ==========

create index if not exists idx_meta_connections_user_id
  on public.meta_connections (user_id);

create index if not exists idx_meta_ad_accounts_connection_id
  on public.meta_ad_accounts (connection_id, is_selected);

create index if not exists idx_meta_campaigns_connection_account
  on public.meta_campaigns (connection_id, ad_account_id);

create index if not exists idx_meta_ad_sets_connection_account
  on public.meta_ad_sets (connection_id, ad_account_id);

create index if not exists idx_meta_ads_connection_account
  on public.meta_ads (connection_id, ad_account_id);

create index if not exists idx_meta_insights_connection_entity
  on public.meta_insights_snapshots (connection_id, entity_type, entity_id, period);

create index if not exists idx_meta_sync_logs_connection_id
  on public.meta_sync_logs (connection_id, created_at desc);

create index if not exists idx_media_buyer_audits_user_account
  on public.media_buyer_audits (user_id, ad_account_id, created_at desc);

-- ========== updated_at trigger ==========

drop trigger if exists meta_connections_updated_at on public.meta_connections;

create trigger meta_connections_updated_at
  before update on public.meta_connections
  for each row execute function public.set_updated_at();

-- ========== RLS ==========

alter table public.meta_connections enable row level security;
alter table public.meta_ad_accounts enable row level security;
alter table public.meta_campaigns enable row level security;
alter table public.meta_ad_sets enable row level security;
alter table public.meta_ads enable row level security;
alter table public.meta_insights_snapshots enable row level security;
alter table public.meta_sync_logs enable row level security;
alter table public.media_buyer_audits enable row level security;

-- meta_connections

drop policy if exists "Users select own meta_connections" on public.meta_connections;
drop policy if exists "Users insert own meta_connections" on public.meta_connections;
drop policy if exists "Users update own meta_connections" on public.meta_connections;
drop policy if exists "Users delete own meta_connections" on public.meta_connections;

create policy "Users select own meta_connections"
  on public.meta_connections for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_connections"
  on public.meta_connections for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own meta_connections"
  on public.meta_connections for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_connections"
  on public.meta_connections for delete to authenticated
  using (user_id = auth.uid());

-- meta_ad_accounts

drop policy if exists "Users select own meta_ad_accounts" on public.meta_ad_accounts;
drop policy if exists "Users insert own meta_ad_accounts" on public.meta_ad_accounts;
drop policy if exists "Users update own meta_ad_accounts" on public.meta_ad_accounts;
drop policy if exists "Users delete own meta_ad_accounts" on public.meta_ad_accounts;

create policy "Users select own meta_ad_accounts"
  on public.meta_ad_accounts for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_ad_accounts"
  on public.meta_ad_accounts for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_ad_accounts"
  on public.meta_ad_accounts for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_ad_accounts"
  on public.meta_ad_accounts for delete to authenticated
  using (user_id = auth.uid());

-- meta_campaigns

drop policy if exists "Users select own meta_campaigns" on public.meta_campaigns;
drop policy if exists "Users insert own meta_campaigns" on public.meta_campaigns;
drop policy if exists "Users update own meta_campaigns" on public.meta_campaigns;
drop policy if exists "Users delete own meta_campaigns" on public.meta_campaigns;

create policy "Users select own meta_campaigns"
  on public.meta_campaigns for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_campaigns"
  on public.meta_campaigns for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_campaigns"
  on public.meta_campaigns for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_campaigns"
  on public.meta_campaigns for delete to authenticated
  using (user_id = auth.uid());

-- meta_ad_sets

drop policy if exists "Users select own meta_ad_sets" on public.meta_ad_sets;
drop policy if exists "Users insert own meta_ad_sets" on public.meta_ad_sets;
drop policy if exists "Users update own meta_ad_sets" on public.meta_ad_sets;
drop policy if exists "Users delete own meta_ad_sets" on public.meta_ad_sets;

create policy "Users select own meta_ad_sets"
  on public.meta_ad_sets for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_ad_sets"
  on public.meta_ad_sets for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_ad_sets"
  on public.meta_ad_sets for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_ad_sets"
  on public.meta_ad_sets for delete to authenticated
  using (user_id = auth.uid());

-- meta_ads

drop policy if exists "Users select own meta_ads" on public.meta_ads;
drop policy if exists "Users insert own meta_ads" on public.meta_ads;
drop policy if exists "Users update own meta_ads" on public.meta_ads;
drop policy if exists "Users delete own meta_ads" on public.meta_ads;

create policy "Users select own meta_ads"
  on public.meta_ads for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_ads"
  on public.meta_ads for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_ads"
  on public.meta_ads for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_ads"
  on public.meta_ads for delete to authenticated
  using (user_id = auth.uid());

-- meta_insights_snapshots

drop policy if exists "Users select own meta_insights" on public.meta_insights_snapshots;
drop policy if exists "Users insert own meta_insights" on public.meta_insights_snapshots;
drop policy if exists "Users update own meta_insights" on public.meta_insights_snapshots;
drop policy if exists "Users delete own meta_insights" on public.meta_insights_snapshots;

create policy "Users select own meta_insights"
  on public.meta_insights_snapshots for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_insights"
  on public.meta_insights_snapshots for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_insights"
  on public.meta_insights_snapshots for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own meta_insights"
  on public.meta_insights_snapshots for delete to authenticated
  using (user_id = auth.uid());

-- meta_sync_logs

drop policy if exists "Users select own meta_sync_logs" on public.meta_sync_logs;
drop policy if exists "Users insert own meta_sync_logs" on public.meta_sync_logs;
drop policy if exists "Users update own meta_sync_logs" on public.meta_sync_logs;

create policy "Users select own meta_sync_logs"
  on public.meta_sync_logs for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own meta_sync_logs"
  on public.meta_sync_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

create policy "Users update own meta_sync_logs"
  on public.meta_sync_logs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- media_buyer_audits

drop policy if exists "Users select own media_buyer_audits" on public.media_buyer_audits;
drop policy if exists "Users insert own media_buyer_audits" on public.media_buyer_audits;

create policy "Users select own media_buyer_audits"
  on public.media_buyer_audits for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own media_buyer_audits"
  on public.media_buyer_audits for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meta_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );
