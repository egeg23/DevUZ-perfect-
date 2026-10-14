drop table if exists public.mockup_scans;
alter table public.mockup_offers drop constraint if exists mockup_offers_source_check;
alter table public.mockup_offers
  drop column if exists scan_noted_at,
  drop column if exists quiet,
  drop column if exists source;
