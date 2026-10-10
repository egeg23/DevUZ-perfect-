drop index if exists public.prospects_letter_wanted;
alter table public.prospects drop column if exists letter_wanted_at;
alter table public.prospects drop column if exists letter_wanted;
