drop index if exists public.scout_signals_unnotified_idx;

alter table public.scout_signals
  drop column if exists notify_attempts,
  drop column if exists notified_at;
