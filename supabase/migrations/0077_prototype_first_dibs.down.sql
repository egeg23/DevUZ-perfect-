alter table public.prospects
  drop column if exists proto_words,
  drop column if exists proto_broadcast_at;
