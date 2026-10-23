drop table if exists public.bot_inbox_notices;
alter table public.bot_users
  drop column if exists human_at,
  drop column if exists human_by,
  drop column if exists last_text,
  drop column if exists last_text_at;
