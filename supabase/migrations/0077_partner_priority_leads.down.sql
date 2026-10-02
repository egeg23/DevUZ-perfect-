alter table public.leads drop column if exists partner_ping_at;
drop index if exists public.leads_partner_pin_idx;
alter table public.leads drop column if exists partner_pin;
