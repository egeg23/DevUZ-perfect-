alter table public.projects drop column if exists partner_client_id;
alter table public.leads drop column if exists partner_client_id;
drop index if exists public.leads_client_inn_idx;
alter table public.leads drop constraint if exists leads_client_inn_check;
alter table public.leads drop column if exists client_inn;
drop table if exists public.partner_clients;
