drop table if exists public.team_news_sent;
drop table if exists public.lead_streams;
alter table public.touch_portions drop column if exists source;
alter table public.prospects
  drop column if exists closed_by,
  drop column if exists closed_at,
  drop column if exists closed_reason;
