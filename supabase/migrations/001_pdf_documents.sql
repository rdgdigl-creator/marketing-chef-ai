-- PDF documents and RAG chunks for document chat

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
