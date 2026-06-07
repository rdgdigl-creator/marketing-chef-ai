-- iiko integration: migrate to the new Cloud API authorization scheme.
--
-- Starting 2026-06-01 iiko Cloud API (iikoTransport) switched authorization to
-- a developer-portal application: you register an app and receive a pair of
-- credentials that are exchanged for an access token at
--   POST https://api-ru.iiko.services/api/v2/access_token
--   body: { "appId": "...", "clientSecret": "..." }
--
-- We replace the legacy single-secret model (api_login / api_key) with:
--   app_id        -> application identifier (appId) from the iiko dev portal
--   client_secret -> application secret (clientSecret) used to authorize
--
-- Legacy columns are kept (nullable) for history; old credentials no longer
-- work with the v2 endpoint, so connected accounts must reconnect with the new
-- appId / clientSecret pair.

alter table public.iiko_connections
  add column if not exists app_id text,
  add column if not exists client_secret text;

-- Best-effort backfill so existing rows don't lose their stored values.
-- These values won't authorize against /api/v2/access_token, but we avoid data
-- loss and let the UI show the account as needing a reconnect.
update public.iiko_connections
  set app_id = coalesce(app_id, api_login),
      client_secret = coalesce(client_secret, api_key, api_login)
  where app_id is null or client_secret is null;

-- The new flow no longer writes the legacy columns, so relax their constraint.
alter table public.iiko_connections
  alter column api_login drop not null;
