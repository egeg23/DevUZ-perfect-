drop index if exists public.partners_agency_brought_by_idx;
alter table public.partners drop constraint if exists partners_website_check;
alter table public.partners drop constraint if exists partners_contact_check;
alter table public.partners drop constraint if exists partners_kind_check;
alter table public.partners
  drop column if exists brought_at,
  drop column if exists brought_by,
  drop column if exists website,
  drop column if exists contact,
  drop column if exists kind;
