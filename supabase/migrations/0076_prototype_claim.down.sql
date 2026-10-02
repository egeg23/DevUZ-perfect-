alter table public.prospects
  drop column if exists proto_notices,
  drop column if exists proto_taken_at,
  drop column if exists proto_taken_by,
  drop column if exists proto_requested_at;
