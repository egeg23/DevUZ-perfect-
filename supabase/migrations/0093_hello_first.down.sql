alter table public.outreach_messages
  drop column if exists send_after,
  drop column if exists kind;

alter table public.prospects
  drop column if exists pitch_at,
  drop column if exists hello_at;
