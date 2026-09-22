-- Чем команда пользуется в панели: тихий кастдев для владельца.
--
-- Владелец: «хочу видеть, чем менеджеры и руководители пользуются чаще
-- всего — какие функции реально нужны, а какие шум».
--
-- Журнал действий отвечает на половину вопроса: он знает нажатия, но не
-- знает, что человек открыл «Статистику» и ушёл. Отсюда отдельная таблица
-- просмотров разделов — счётчик на день, человека и раздел, а не строка на
-- каждый переход: вопрос «сколько раз», а не «в какую секунду».
--
-- Владелец в счёт не входит: он смотрит на команду, а не на себя.
create table if not exists public.panel_usage (
  day date not null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  section text not null check (section ~ '^/admin(/[a-z-]+)?$'),
  views integer not null default 0 check (views >= 0),
  last_at timestamptz not null default now(),
  primary key (day, staff_id, section)
);

comment on table public.panel_usage is
  'Просмотры разделов панели: день по Ташкенту, сотрудник, раздел, сколько раз. Владелец не считается.';

alter table public.panel_usage enable row level security;

-- Прибавить один просмотр. Функцией, а не upsert с клиента: «прочитать,
-- прибавить, записать» из двух вкладок сразу теряло бы просмотры.
create or replace function public.bump_panel_usage(p_staff uuid, p_section text, p_day date)
returns void
language sql
set search_path = public
as $$
  insert into public.panel_usage (day, staff_id, section, views, last_at)
  values (p_day, p_staff, p_section, 1, now())
  on conflict (day, staff_id, section)
  do update set views = panel_usage.views + 1, last_at = now();
$$;

revoke all on function public.bump_panel_usage(uuid, text, date) from public, anon, authenticated;
grant execute on function public.bump_panel_usage(uuid, text, date) to service_role;
