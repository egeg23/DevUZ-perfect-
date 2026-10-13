drop table if exists public.bot_broadcast_sent;
alter table public.staff_broadcasts drop constraint if exists staff_broadcasts_audience_check;
alter table public.staff_broadcasts
  add constraint staff_broadcasts_audience_check check (audience in ('all', 'roles', 'pick'));
alter table public.staff_broadcasts drop column if exists chats, drop column if exists segment, drop column if exists kind;
drop table if exists public.bot_users;
