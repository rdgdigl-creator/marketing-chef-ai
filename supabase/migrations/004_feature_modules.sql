-- Feature modules: AI Marketer, Reels, Content Plan, Competitor Analysis, Sales Growth

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
