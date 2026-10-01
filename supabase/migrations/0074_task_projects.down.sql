-- Отменённые задачи и задачи без срока в прежнюю схему не помещаются.
delete from public.staff_task_events where kind = 'cancelled';
delete from public.staff_tasks where status = 'cancelled' or due_at is null;
update public.staff_tasks set last_event = 'moved' where last_event = 'cancelled';
alter table public.staff_task_events drop constraint if exists staff_task_events_kind_check;
alter table public.staff_task_events
  add constraint staff_task_events_kind_check check (kind in ('created', 'taken', 'done', 'failed', 'moved'));
alter table public.staff_tasks drop constraint if exists staff_tasks_last_event_check;
alter table public.staff_tasks
  add constraint staff_tasks_last_event_check check (last_event in ('created', 'taken', 'done', 'failed', 'moved'));
alter table public.staff_tasks drop constraint if exists staff_tasks_status_check;
alter table public.staff_tasks
  add constraint staff_tasks_status_check check (status in ('new', 'in_work', 'done', 'failed'));
drop index if exists public.staff_tasks_project_idx;
alter table public.staff_tasks drop column if exists project_id;
alter table public.staff_tasks alter column due_at set not null;
