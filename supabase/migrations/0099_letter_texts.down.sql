drop index if exists public.prospects_letter_variant;
alter table public.prospects drop column if exists letter_variant;
drop table if exists public.letter_texts;
