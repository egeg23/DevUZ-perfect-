alter table public.projects drop column if exists partner_bonus_percent;
drop index if exists public.projects_partner_payout_idx;
alter table public.projects drop column if exists partner_payout_id;
alter table public.partners drop column if exists accumulate;
