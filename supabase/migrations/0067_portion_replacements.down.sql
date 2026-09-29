drop index if exists public.touch_portions_replaces_key;
alter table public.touch_portions drop column if exists replaces;
