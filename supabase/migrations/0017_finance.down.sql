-- Откат уносит платежи и выплаты вместе с таблицами — это история денег,
-- перед откатом её стоит выгрузить.
drop table if exists public.payouts;
drop table if exists public.project_payments;

alter table public.projects drop column if exists dev_cost_usd;
alter table public.projects drop column if exists tax_percent;
alter table public.projects drop column if exists kind;

alter table public.staff drop column if exists rate_percent;
alter table public.staff drop column if exists grade;
