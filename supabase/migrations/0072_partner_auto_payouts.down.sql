drop index if exists public.partner_payouts_project_unique;
alter table public.partner_payouts drop column if exists project_id;
