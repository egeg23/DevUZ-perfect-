drop index if exists public.razbors_slug_en_key;
alter table public.razbors drop column if exists en_tried_at;
alter table public.razbors drop column if exists article_en;
alter table public.razbors drop column if exists slug_en;
