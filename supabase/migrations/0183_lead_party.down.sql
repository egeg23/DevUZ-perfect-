alter table public.leads drop constraint if exists leads_party_check;
alter table public.leads drop column if exists party;
