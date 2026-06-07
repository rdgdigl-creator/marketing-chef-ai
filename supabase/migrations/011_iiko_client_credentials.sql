-- iiko integration: SaaS model — platform owns the app, clients own the API key.
--
-- The iiko developer-portal application credentials (appId / clientSecret) belong
-- to the Marketing Chef AI platform and live in the server environment
-- (IIKO_APP_ID / IIKO_CLIENT_SECRET). They must never be entered by users nor
-- stored per connection.
--
-- Each client (restaurant account) only provides their own iiko credentials:
--   api_login        -> client API login (human-readable integration name)
--   api_key          -> client API key (secret)
--   organization_id  -> selected restaurant organization (UUID)
--
-- This migration is self-contained and idempotent: it adds api_key if a previous
-- migration (009) was never applied, removes the per-row platform secrets, and
-- makes the client credentials required again — without touching existing data.

-- 1. Ensure the client-credential columns exist (safe if 009 was skipped).
alter table public.iiko_connections
  add column if not exists api_login text,
  add column if not exists api_key text;

-- 2. Drop platform secrets accidentally stored per connection (security).
alter table public.iiko_connections
  drop column if exists app_id,
  drop column if exists client_secret;

-- 3. Backfill any nulls left from the previous schema before tightening NOT NULL.
update public.iiko_connections
  set api_login = coalesce(nullif(trim(api_login), ''), 'iiko')
  where api_login is null or trim(api_login) = '';

update public.iiko_connections
  set api_key = coalesce(api_key, '')
  where api_key is null;

-- 4. Client credentials are the only stored secrets now — make them required.
alter table public.iiko_connections
  alter column api_login set default '',
  alter column api_login set not null,
  alter column api_key set default '',
  alter column api_key set not null;
