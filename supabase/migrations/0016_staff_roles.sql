-- Третья роль и «кто чей».
--
-- Ролей было две: администратор и менеджер. Владелец попросил третью —
-- руководитель отдела продаж: работа с лидами всех менеджеров, контроль
-- менеджеров, холодные касания. И правило: администратор — только он сам,
-- через панель эту роль не назначают никому.
--
-- «Руководитель видит своих менеджеров» не определено, пока у сотрудника
-- нет руководителя. Отсюда head_staff_id. Назначает администратор.

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff
  add constraint staff_role_check check (role in ('admin', 'head', 'manager'));

alter table public.staff
  add column if not exists head_staff_id uuid references public.staff(id) on delete set null;

comment on column public.staff.head_staff_id is
  'Руководитель сотрудника. Определяет, чью статистику и финансы видит руководитель.';

create index if not exists staff_head_idx
  on public.staff (head_staff_id)
  where head_staff_id is not null;
