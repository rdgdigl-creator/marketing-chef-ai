-- Run once in Supabase Dashboard → SQL Editor (project: upghirncitrlgyrihfxo)
-- Applies migrations 001 → 005 in order. Safe to re-run (IF NOT EXISTS / IF NOT EXISTS columns).

-- ========== 001_pdf_documents.sql ==========

create table if not exists public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  document_text text not null default '',
  analysis jsonb not null,
  consultant_mode text not null default 'marketing' check (consultant_mode in ('marketing', 'business')),
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pdf_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table if not exists public.document_chat_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pdf_documents(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pdf_documents_created_at on public.pdf_documents (created_at desc);
create index if not exists idx_document_chunks_document_id on public.document_chunks (document_id);
create index if not exists idx_document_chat_messages_document_id on public.document_chat_messages (document_id, created_at);

alter table public.pdf_documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_chat_messages enable row level security;

drop policy if exists "Allow anon read pdf_documents" on public.pdf_documents;
drop policy if exists "Allow anon insert pdf_documents" on public.pdf_documents;
drop policy if exists "Allow anon read document_chunks" on public.document_chunks;
drop policy if exists "Allow anon insert document_chunks" on public.document_chunks;
drop policy if exists "Allow anon read document_chat_messages" on public.document_chat_messages;
drop policy if exists "Allow anon insert document_chat_messages" on public.document_chat_messages;

create policy "Allow anon read pdf_documents"
  on public.pdf_documents for select to anon using (true);

create policy "Allow anon insert pdf_documents"
  on public.pdf_documents for insert to anon with check (true);

create policy "Allow anon read document_chunks"
  on public.document_chunks for select to anon using (true);

create policy "Allow anon insert document_chunks"
  on public.document_chunks for insert to anon with check (true);

create policy "Allow anon read document_chat_messages"
  on public.document_chat_messages for select to anon using (true);

create policy "Allow anon insert document_chat_messages"
  on public.document_chat_messages for insert to anon with check (true);

-- ========== 002_document_file_type.sql ==========

alter table public.pdf_documents
  add column if not exists file_type text;

-- ========== 003_marketing_creatives.sql ==========

create table if not exists public.marketing_projects (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  image_url text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_projects_created_at
  on public.marketing_projects (created_at desc);

alter table public.marketing_projects enable row level security;

drop policy if exists "Allow anon read marketing_projects" on public.marketing_projects;
drop policy if exists "Allow anon insert marketing_projects" on public.marketing_projects;

create policy "Allow anon read marketing_projects"
  on public.marketing_projects for select to anon using (true);

create policy "Allow anon insert marketing_projects"
  on public.marketing_projects for insert to anon with check (true);

create table if not exists public.marketing_packages (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('dish', 'document')),
  marketing_project_id uuid references public.marketing_projects(id) on delete cascade,
  document_id uuid references public.pdf_documents(id) on delete cascade,
  source_title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_creatives (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.marketing_packages(id) on delete cascade,
  creative_type text not null check (
    creative_type in ('banner', 'story', 'instagram_post', 'promo_poster', 'enhance_photo')
  ),
  image_url text not null,
  prompt text not null default '',
  created_at timestamptz not null default now(),
  unique (package_id, creative_type)
);

create index if not exists idx_marketing_packages_project
  on public.marketing_packages (marketing_project_id, created_at desc);

create index if not exists idx_marketing_packages_document
  on public.marketing_packages (document_id, created_at desc);

create index if not exists idx_marketing_creatives_package
  on public.marketing_creatives (package_id);

alter table public.marketing_packages enable row level security;
alter table public.marketing_creatives enable row level security;

drop policy if exists "Allow anon read marketing_packages" on public.marketing_packages;
drop policy if exists "Allow anon insert marketing_packages" on public.marketing_packages;
drop policy if exists "Allow anon read marketing_creatives" on public.marketing_creatives;
drop policy if exists "Allow anon insert marketing_creatives" on public.marketing_creatives;

create policy "Allow anon read marketing_packages"
  on public.marketing_packages for select to anon using (true);

create policy "Allow anon insert marketing_packages"
  on public.marketing_packages for insert to anon with check (true);

create policy "Allow anon read marketing_creatives"
  on public.marketing_creatives for select to anon using (true);

create policy "Allow anon insert marketing_creatives"
  on public.marketing_creatives for insert to anon with check (true);

-- ========== 004_feature_modules.sql ==========

create table if not exists public.ai_marketer_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default '',
  module_type text not null default 'chat' check (
    module_type in ('chat', 'strategy', 'promotions', 'content_ideas', 'business_analysis')
  ),
  title text not null default 'Новая сессия',
  messages jsonb not null default '[]'::jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reels_generations (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  image_url text not null,
  dish_description text not null default '',
  ideas jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_plans (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  duration_days integer not null check (duration_days in (7, 14, 30)),
  platforms jsonb not null default '["instagram","tiktok","telegram"]'::jsonb,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.competitor_analyses (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  competitor_handle text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_growth_analyses (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  menu_description text not null default '',
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_marketer_sessions_created_at
  on public.ai_marketer_sessions (created_at desc);

create index if not exists idx_reels_generations_created_at
  on public.reels_generations (created_at desc);

create index if not exists idx_content_plans_created_at
  on public.content_plans (created_at desc);

create index if not exists idx_competitor_analyses_created_at
  on public.competitor_analyses (created_at desc);

create index if not exists idx_sales_growth_analyses_created_at
  on public.sales_growth_analyses (created_at desc);

alter table public.ai_marketer_sessions enable row level security;
alter table public.reels_generations enable row level security;
alter table public.content_plans enable row level security;
alter table public.competitor_analyses enable row level security;
alter table public.sales_growth_analyses enable row level security;

drop policy if exists "Allow anon read ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Allow anon insert ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Allow anon update ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Allow anon read reels_generations" on public.reels_generations;
drop policy if exists "Allow anon insert reels_generations" on public.reels_generations;
drop policy if exists "Allow anon read content_plans" on public.content_plans;
drop policy if exists "Allow anon insert content_plans" on public.content_plans;
drop policy if exists "Allow anon read competitor_analyses" on public.competitor_analyses;
drop policy if exists "Allow anon insert competitor_analyses" on public.competitor_analyses;
drop policy if exists "Allow anon read sales_growth_analyses" on public.sales_growth_analyses;
drop policy if exists "Allow anon insert sales_growth_analyses" on public.sales_growth_analyses;

create policy "Allow anon read ai_marketer_sessions"
  on public.ai_marketer_sessions for select to anon using (true);

create policy "Allow anon insert ai_marketer_sessions"
  on public.ai_marketer_sessions for insert to anon with check (true);

create policy "Allow anon update ai_marketer_sessions"
  on public.ai_marketer_sessions for update to anon using (true) with check (true);

create policy "Allow anon read reels_generations"
  on public.reels_generations for select to anon using (true);

create policy "Allow anon insert reels_generations"
  on public.reels_generations for insert to anon with check (true);

create policy "Allow anon read content_plans"
  on public.content_plans for select to anon using (true);

create policy "Allow anon insert content_plans"
  on public.content_plans for insert to anon with check (true);

create policy "Allow anon read competitor_analyses"
  on public.competitor_analyses for select to anon using (true);

create policy "Allow anon insert competitor_analyses"
  on public.competitor_analyses for insert to anon with check (true);

create policy "Allow anon read sales_growth_analyses"
  on public.sales_growth_analyses for select to anon using (true);

create policy "Allow anon insert sales_growth_analyses"
  on public.sales_growth_analyses for insert to anon with check (true);

-- ========== 005_brand_kits.sql ==========

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

-- ========== 006_auth.sql ==========

-- Auth: user profiles, user_id on data tables, RLS for authenticated users

-- ========== User profiles ==========

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  restaurant_name text not null default '',
  logo_url text,
  phone text not null default '',
  tariff text not null default 'free' check (tariff in ('free', 'pro', 'business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
drop policy if exists "Users update own profile" on public.user_profiles;
drop policy if exists "Users insert own profile" on public.user_profiles;

create policy "Users read own profile"
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

create policy "Users update own profile"
  on public.user_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users insert own profile"
  on public.user_profiles for insert to authenticated
  with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, restaurant_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'restaurant_name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_updated_at on public.user_profiles;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ========== user_id columns ==========

alter table public.marketing_projects
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.pdf_documents
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.content_plans
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.reels_generations
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.competitor_analyses
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.sales_growth_analyses
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.brand_kits
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.ai_marketer_sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.marketing_packages
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_marketing_projects_user_id
  on public.marketing_projects (user_id, created_at desc);

create index if not exists idx_pdf_documents_user_id
  on public.pdf_documents (user_id, created_at desc);

create index if not exists idx_content_plans_user_id
  on public.content_plans (user_id, created_at desc);

create index if not exists idx_reels_generations_user_id
  on public.reels_generations (user_id, created_at desc);

create index if not exists idx_competitor_analyses_user_id
  on public.competitor_analyses (user_id, created_at desc);

create index if not exists idx_sales_growth_analyses_user_id
  on public.sales_growth_analyses (user_id, created_at desc);

create index if not exists idx_brand_kits_user_id
  on public.brand_kits (user_id, created_at desc);

create index if not exists idx_ai_marketer_sessions_user_id
  on public.ai_marketer_sessions (user_id, created_at desc);

create index if not exists idx_marketing_packages_user_id
  on public.marketing_packages (user_id, created_at desc);

alter table public.marketing_projects alter column user_id set default auth.uid();
alter table public.pdf_documents alter column user_id set default auth.uid();
alter table public.content_plans alter column user_id set default auth.uid();
alter table public.reels_generations alter column user_id set default auth.uid();
alter table public.competitor_analyses alter column user_id set default auth.uid();
alter table public.sales_growth_analyses alter column user_id set default auth.uid();
alter table public.brand_kits alter column user_id set default auth.uid();
alter table public.ai_marketer_sessions alter column user_id set default auth.uid();
alter table public.marketing_packages alter column user_id set default auth.uid();

-- ========== Drop permissive anon policies ==========

drop policy if exists "Allow anon read marketing_projects" on public.marketing_projects;
drop policy if exists "Allow anon insert marketing_projects" on public.marketing_projects;

drop policy if exists "Allow anon read pdf_documents" on public.pdf_documents;
drop policy if exists "Allow anon insert pdf_documents" on public.pdf_documents;

drop policy if exists "Allow anon read document_chunks" on public.document_chunks;
drop policy if exists "Allow anon insert document_chunks" on public.document_chunks;

drop policy if exists "Allow anon read document_chat_messages" on public.document_chat_messages;
drop policy if exists "Allow anon insert document_chat_messages" on public.document_chat_messages;

drop policy if exists "Allow anon read marketing_packages" on public.marketing_packages;
drop policy if exists "Allow anon insert marketing_packages" on public.marketing_packages;

drop policy if exists "Allow anon read marketing_creatives" on public.marketing_creatives;
drop policy if exists "Allow anon insert marketing_creatives" on public.marketing_creatives;

drop policy if exists "Allow anon read ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Allow anon insert ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Allow anon update ai_marketer_sessions" on public.ai_marketer_sessions;

drop policy if exists "Allow anon read reels_generations" on public.reels_generations;
drop policy if exists "Allow anon insert reels_generations" on public.reels_generations;

drop policy if exists "Allow anon read content_plans" on public.content_plans;
drop policy if exists "Allow anon insert content_plans" on public.content_plans;

drop policy if exists "Allow anon read competitor_analyses" on public.competitor_analyses;
drop policy if exists "Allow anon insert competitor_analyses" on public.competitor_analyses;

drop policy if exists "Allow anon read sales_growth_analyses" on public.sales_growth_analyses;
drop policy if exists "Allow anon insert sales_growth_analyses" on public.sales_growth_analyses;

drop policy if exists "Allow anon read brand_kits" on public.brand_kits;
drop policy if exists "Allow anon insert brand_kits" on public.brand_kits;
drop policy if exists "Allow anon update brand_kits" on public.brand_kits;

-- ========== Authenticated RLS: owner tables ==========

drop policy if exists "Users select own marketing_projects" on public.marketing_projects;
drop policy if exists "Users insert own marketing_projects" on public.marketing_projects;

drop policy if exists "Users select own pdf_documents" on public.pdf_documents;
drop policy if exists "Users insert own pdf_documents" on public.pdf_documents;

drop policy if exists "Users select own content_plans" on public.content_plans;
drop policy if exists "Users insert own content_plans" on public.content_plans;

drop policy if exists "Users select own reels_generations" on public.reels_generations;
drop policy if exists "Users insert own reels_generations" on public.reels_generations;

drop policy if exists "Users select own competitor_analyses" on public.competitor_analyses;
drop policy if exists "Users insert own competitor_analyses" on public.competitor_analyses;

drop policy if exists "Users select own sales_growth_analyses" on public.sales_growth_analyses;
drop policy if exists "Users insert own sales_growth_analyses" on public.sales_growth_analyses;

drop policy if exists "Users select own brand_kits" on public.brand_kits;
drop policy if exists "Users insert own brand_kits" on public.brand_kits;
drop policy if exists "Users update own brand_kits" on public.brand_kits;

drop policy if exists "Users select own ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Users insert own ai_marketer_sessions" on public.ai_marketer_sessions;
drop policy if exists "Users update own ai_marketer_sessions" on public.ai_marketer_sessions;

drop policy if exists "Users select own marketing_packages" on public.marketing_packages;
drop policy if exists "Users insert own marketing_packages" on public.marketing_packages;

drop policy if exists "Users select own document_chunks" on public.document_chunks;
drop policy if exists "Users insert own document_chunks" on public.document_chunks;

drop policy if exists "Users select own document_chat_messages" on public.document_chat_messages;
drop policy if exists "Users insert own document_chat_messages" on public.document_chat_messages;

drop policy if exists "Users select own marketing_creatives" on public.marketing_creatives;
drop policy if exists "Users insert own marketing_creatives" on public.marketing_creatives;

create policy "Users select own marketing_projects"
  on public.marketing_projects for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own marketing_projects"
  on public.marketing_projects for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own pdf_documents"
  on public.pdf_documents for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own pdf_documents"
  on public.pdf_documents for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own content_plans"
  on public.content_plans for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own content_plans"
  on public.content_plans for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own reels_generations"
  on public.reels_generations for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own reels_generations"
  on public.reels_generations for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own competitor_analyses"
  on public.competitor_analyses for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own competitor_analyses"
  on public.competitor_analyses for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own sales_growth_analyses"
  on public.sales_growth_analyses for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own sales_growth_analyses"
  on public.sales_growth_analyses for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users select own brand_kits"
  on public.brand_kits for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own brand_kits"
  on public.brand_kits for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own brand_kits"
  on public.brand_kits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users select own ai_marketer_sessions"
  on public.ai_marketer_sessions for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own ai_marketer_sessions"
  on public.ai_marketer_sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own ai_marketer_sessions"
  on public.ai_marketer_sessions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users select own marketing_packages"
  on public.marketing_packages for select to authenticated
  using (user_id = auth.uid());

create policy "Users insert own marketing_packages"
  on public.marketing_packages for insert to authenticated
  with check (user_id = auth.uid());

-- ========== Child tables via parent ownership ==========

create policy "Users select own document_chunks"
  on public.document_chunks for select to authenticated
  using (
    exists (
      select 1 from public.pdf_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users insert own document_chunks"
  on public.document_chunks for insert to authenticated
  with check (
    exists (
      select 1 from public.pdf_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users select own document_chat_messages"
  on public.document_chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.pdf_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users insert own document_chat_messages"
  on public.document_chat_messages for insert to authenticated
  with check (
    exists (
      select 1 from public.pdf_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users select own marketing_creatives"
  on public.marketing_creatives for select to authenticated
  using (
    exists (
      select 1 from public.marketing_packages p
      where p.id = package_id and p.user_id = auth.uid()
    )
  );

create policy "Users insert own marketing_creatives"
  on public.marketing_creatives for insert to authenticated
  with check (
    exists (
      select 1 from public.marketing_packages p
      where p.id = package_id and p.user_id = auth.uid()
    )
  );
