alter table public.orders
  drop column if exists offer_accepted_at,
  drop column if exists offer_version;
