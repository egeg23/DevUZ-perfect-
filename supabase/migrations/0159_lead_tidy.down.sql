alter table public.leads
  drop column if exists tidy_asked_at,
  drop column if exists tidy_snoozed_until,
  drop column if exists tidy_auto_lost_at;
