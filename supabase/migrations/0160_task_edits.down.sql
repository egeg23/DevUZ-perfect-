drop index if exists public.staff_task_events_at_idx;
delete from public.staff_task_events where kind = 'edited';
update public.staff_tasks set last_event = 'created' where last_event = 'edited';
alter table public.staff_task_events drop constraint if exists staff_task_events_kind_check;
alter table public.staff_task_events
  add constraint staff_task_events_kind_check
  check (kind in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled'));
alter table public.staff_tasks drop constraint if exists staff_tasks_last_event_check;
alter table public.staff_tasks
  add constraint staff_tasks_last_event_check
  check (last_event in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled'));
alter table public.staff_task_events drop column if exists changes;
