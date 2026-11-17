drop trigger if exists claudery_project_owner on public.leads;
drop function if exists public.claudery_project_owner();
drop index if exists public.projects_claudery_lead_uidx;
alter table public.projects drop column if exists product;
