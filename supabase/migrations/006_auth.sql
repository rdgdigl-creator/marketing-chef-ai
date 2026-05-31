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
