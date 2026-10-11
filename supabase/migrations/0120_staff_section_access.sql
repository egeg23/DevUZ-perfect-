-- Доступ к разделам панели: галочки владельца поверх роли (lib/admin/roles.ts,
-- opens; страница «Команда», блок «Разделы»).
--
-- Владелец, 11.10.2026: «отдельные настройки доступа, чтобы я мог через
-- галочки выдавать права на просмотр каждого раздела сотрудникам». Хранится
-- только отличие от роли: {"/admin/partners": true} — открыт сверх роли,
-- {"/admin/finance": false} — закрыт. Пусто — всё как у роли.
alter table public.staff
  add column if not exists section_access jsonb not null default '{}'::jsonb;

comment on column public.staff.section_access is
  'Разделы панели сверх роли (true) или закрытые (false); правит только владелец';
