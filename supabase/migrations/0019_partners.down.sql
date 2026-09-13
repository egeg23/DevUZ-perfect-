-- Откат уносит партнёров, их ссылки и заявки на выплату — историю денег
-- перед откатом стоит выгрузить.
drop index if exists public.projects_partner_idx;
alter table public.projects drop column if exists partner_void_reason;
alter table public.projects drop column if exists partner_percent;
alter table public.projects drop column if exists partner_id;

drop index if exists public.leads_partner_idx;
alter table public.leads drop column if exists partner_void_reason;
alter table public.leads drop column if exists partner_code;
alter table public.leads drop column if exists partner_link_id;
alter table public.leads drop column if exists partner_id;

drop table if exists public.partner_payouts;
drop table if exists public.partner_touches;
drop table if exists public.partner_links;
drop table if exists public.partners;
