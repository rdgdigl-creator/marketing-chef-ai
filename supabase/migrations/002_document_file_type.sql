-- Optional: store detected file type on upload
alter table public.pdf_documents
  add column if not exists file_type text;
