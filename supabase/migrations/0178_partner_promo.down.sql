drop index if exists public.partners_promo_key;
alter table public.partners drop constraint if exists partners_promo_check;
alter table public.partners drop column if exists promo;
