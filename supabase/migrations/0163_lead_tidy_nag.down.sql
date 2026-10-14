alter table public.leads
  drop column if exists tidy_first_asked_at,
  drop column if exists tidy_wait_streak;
