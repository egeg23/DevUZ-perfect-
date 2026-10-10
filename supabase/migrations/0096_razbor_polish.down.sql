alter table public.razbors drop column if exists pl_note;
alter table public.razbors drop column if exists en_note;
drop index if exists public.razbors_slug_pl_key;
alter table public.razbors drop column if exists pl_tried_at;
alter table public.razbors drop column if exists article_pl;
alter table public.razbors drop column if exists slug_pl;
