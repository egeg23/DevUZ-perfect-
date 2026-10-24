drop index if exists public.staff_tasks_mockup_open_idx;
drop index if exists public.staff_tasks_mockup_ref_idx;
alter table public.staff_tasks
  drop column if exists mockup_ref,
  drop column if exists mockup_site,
  drop column if exists mockup_prospect_id,
  drop column if exists mockup_lead_id,
  drop column if exists mockup;
