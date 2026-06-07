-- iiko integration: split credentials into API Login (name) + API Key (secret)
--
-- iiko Cloud API (iikoTransport) authorizes with a single secret string that is
-- sent to POST /api/1/access_token as the field `apiLogin`. In the iiko cabinet
-- that secret is the "API Key" (32-char string); "API Login" is just the human
-- readable name of the integration. We now store both:
--   api_login -> display name of the integration (e.g. "Open AI")
--   api_key   -> the secret used to authorize against iiko Cloud API
--
-- Existing rows stored the secret in `api_login`, so we backfill `api_key` from
-- it to keep already-connected accounts working.

alter table public.iiko_connections
  add column if not exists api_key text;

update public.iiko_connections
  set api_key = api_login
  where api_key is null;
