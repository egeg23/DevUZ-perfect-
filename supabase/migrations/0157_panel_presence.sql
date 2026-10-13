-- Сколько времени сотрудник провёл в панели за день.
--
-- Владелец, 13.10.2026: в вечернем отчёте — «кто заходил в панель и сколько
-- времени провёл». Просмотры разделов (panel_usage) говорят, что открывали,
-- но не сколько сидели. Маячок панели раз в минуту, пока вкладка открыта и
-- человек в ней что-то делает, отмечает минуту здесь.
--
-- Одна строка на день и человека: минуты, первый и последний заход. Две
-- вкладки не считают минуту дважды: следующая минута засчитывается не
-- раньше, чем через 50 секунд после прошлой. Владелец не пишется.
create table if not exists public.panel_presence (
  day date not null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  minutes integer not null default 0 check (minutes >= 0),
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (day, staff_id)
);

comment on table public.panel_presence is
  'Активные минуты в панели: день по Ташкенту, сотрудник, минуты, первый и последний заход. Владелец не считается.';

alter table public.panel_presence enable row level security;

create or replace function public.tick_panel_presence(p_staff uuid, p_day date)
returns void
language sql
set search_path = public
as $$
  insert into public.panel_presence (day, staff_id, minutes, first_at, last_at)
  values (p_day, p_staff, 1, now(), now())
  on conflict (day, staff_id)
  do update set minutes = panel_presence.minutes + 1, last_at = now()
  where panel_presence.last_at < now() - interval '50 seconds';
$$;

revoke all on function public.tick_panel_presence(uuid, date) from public, anon, authenticated;
grant execute on function public.tick_panel_presence(uuid, date) to service_role;
