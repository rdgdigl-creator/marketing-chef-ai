-- pdf_documents + RAG tables (from 001) — required for document save/chat and marketing packages
create table if not exists public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  document_text text not null default '',
  analysis jsonb not null,
  consultant_mode text not null default 'marketing' check (consultant_mode in ('marketing', 'business')),
  created_at timestamptz not null default now()
);

alter table public.pdf_documents
  add column if not exists file_type text;

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

-- Marketing projects (dish analysis) — create if missing
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

create policy "Allow anon read marketing_projects"
  on public.marketing_projects for select to anon using (true);

create policy "Allow anon insert marketing_projects"
  on public.marketing_projects for insert to anon with check (true);

-- Marketing creative packages (4-image bundles)
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

create policy "Allow anon read marketing_packages"
  on public.marketing_packages for select to anon using (true);

create policy "Allow anon insert marketing_packages"
  on public.marketing_packages for insert to anon with check (true);

create policy "Allow anon read marketing_creatives"
  on public.marketing_creatives for select to anon using (true);

create policy "Allow anon insert marketing_creatives"
  on public.marketing_creatives for insert to anon with check (true);
