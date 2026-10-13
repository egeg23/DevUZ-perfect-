-- Задачи: правка открытой задачи и что в ней поменяли.
--
-- Владелец, 13.10.2026: «Сделай возможность редактировать задачи + видеть
-- историю выполненных / отклонённых задач или переноса срока».
--
-- Правит тот, кто поставил: название, описание, проект, исполнитель. В
-- историю — новый шаг «edited» и что именно поменялось: было → стало.
-- Правила — lib/admin/tasks.ts (canEdit, taskChanges), база —
-- lib/admin/task-store.ts (editTask).
alter table public.staff_task_events add column if not exists changes jsonb;

alter table public.staff_task_events drop constraint if exists staff_task_events_kind_check;
alter table public.staff_task_events
  add constraint staff_task_events_kind_check
  check (kind in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled', 'edited'));

alter table public.staff_tasks drop constraint if exists staff_tasks_last_event_check;
alter table public.staff_tasks
  add constraint staff_tasks_last_event_check
  check (last_event in ('created', 'taken', 'done', 'failed', 'moved', 'cancelled', 'edited'));

-- История за период (страница «История задач»): шаги по времени.
create index if not exists staff_task_events_at_idx on public.staff_task_events (at desc);

comment on column public.staff_task_events.changes is
  'Правка задачи (kind = edited): {"title"|"body"|"project"|"assignee": {"from": …, "to": …}}.';
