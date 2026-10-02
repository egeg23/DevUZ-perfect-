drop function if exists public.proto_seen(uuid);

alter table public.protos drop column if exists auto;

alter table public.prospects
  drop column if exists proto_url,
  drop column if exists proto_tried_at,
  drop column if exists proto_note;
