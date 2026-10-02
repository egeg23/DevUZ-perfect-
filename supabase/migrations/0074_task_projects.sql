-- Задачи: проект, необязательный срок, отмена.
--
-- Владелец, 01.10: «Каждую задачу можно отнести к проекту (создаётся клиент
-- в разделе „Проекты“ и после этого можно поставить). Но можно и не
-- указывать ни крайний срок, ни проект».

-- Срок необязателен: задача «когда будет время» — тоже задача. У неё нет
-- напоминаний «за час» и «просрочено», только «ещё не взяли».
alter table public.staff_tasks alter column due_at drop not null;

-- Проект. set null: закрытый или удалённый проект не уносит историю задач.
alter table public.staff_tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;
create index if not exists staff_tasks_project_idx on public.staff_tasks (project_id) where project_id is not null;

-- Отмена: поставивший снимает задачу, поставленную по ошибке или уже ненужную.
alter table public.staff_tasks drop constraint if exists staff_tasks_status_check;
alter table public.staff_tasks
  add constraint staff_tasks_status_check check (status in ('new', 'in_work', 'done', 'failed', 'cancelled'));
alter table public.staff_tasks drop constraint if exists staff_tasks_last_event_check;
alter table public.staff_tasks
  add constraint staff_tasks_last_event_check
  check (last_event in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled'));
alter table public.staff_task_events drop constraint if exists staff_task_events_kind_check;
alter table public.staff_task_events
  add constraint staff_task_events_kind_check
  check (kind in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled'));

comment on column public.staff_tasks.project_id is 'Проект задачи (раздел «Проекты»). Пусто — без проекта.';
comment on column public.staff_tasks.due_at is 'Срок. Пусто — без срока: напоминаний о сроке нет.';
