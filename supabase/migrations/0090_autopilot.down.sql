drop table if exists public.autopilot_settings;
drop table if exists public.autopilot_weeks;
drop index if exists public.prospects_autopilot_at;
alter table public.prospects
  drop column if exists autopilot_replied_at,
  drop column if exists autopilot_note,
  drop column if exists autopilot_at;
