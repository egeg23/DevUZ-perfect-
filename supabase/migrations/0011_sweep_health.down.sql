alter table public.lead_reminders
  drop column if exists last_attempt_at,
  drop column if exists attempts;

drop table if exists public.stats_snapshots;
