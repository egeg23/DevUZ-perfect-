-- Задачи команды: кто кому что поручил и к какому сроку.
--
-- Владелец, 01.10: «Давай сделаем внутреннюю CRM. На главной странице
-- показываются задачи, которые поставили, срок выполнения… Все могут ставить
-- задачи на всех. Тот, на кого поставили, должен взять её в работу (можно
-- через бота в тг сразу принять задачу и там же нажать — сделано / не
-- сделано / перенос срока)».
--
-- Правила — lib/admin/tasks.ts, база — lib/admin/task-store.ts.
create table if not exists public.staff_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 2000),
  creator_id uuid not null references public.staff(id) on delete cascade,
  assignee_id uuid not null references public.staff(id) on delete cascade,
  -- Срок — момент времени; в панели и боте показывается по Ташкенту.
  due_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'in_work', 'done', 'failed')),
  created_at timestamptz not null default now(),
  taken_at timestamptz,
  closed_at timestamptz,

  -- Последнее изменение и кто его сделал: по ним открытая панель узнаёт,
  -- что у задачи нового, — звук и уведомление в браузере.
  updated_at timestamptz not null default now(),
  last_event text not null default 'created'
    check (last_event in ('created', 'taken', 'done', 'failed', 'moved')),
  last_actor_id uuid references public.staff(id) on delete set null,

  -- Сообщение исполнителю в Telegram: где лежит (чтобы менять под ним
  -- кнопки) и когда ушло. Пусто — ещё не ушло: поставили ночью, и бот
  -- напишет утром.
  tg_chat bigint,
  tg_message_id bigint,
  notified_at timestamptz,

  -- Напоминания свипа — каждое один раз. Перенос срока снимает «скоро» и
  -- «просрочено»: к новому сроку они придут заново.
  take_nudged_at timestamptz,
  soon_nudged_at timestamptz,
  overdue_sent_at timestamptz,

  -- «Своя дата» в боте: исполнитель нажал и бот ждёт текст «05.10 15:00».
  awaiting_date_at timestamptz
);

create index if not exists staff_tasks_assignee_idx on public.staff_tasks (assignee_id, status);
create index if not exists staff_tasks_creator_idx on public.staff_tasks (creator_id, status);
create index if not exists staff_tasks_open_due_idx on public.staff_tasks (due_at) where status in ('new', 'in_work');

comment on table public.staff_tasks is
  'Задачи команды: что, кто поставил, на кого, срок и чем кончилось. Правила — lib/admin/tasks.ts.';

-- История задачи: кто взял, закрыл, на какой срок перенёс. Заодно —
-- очередь сообщений постановщику: ночью бот не пишет, и сообщение уходит
-- утром (notified_at пусто — ещё не ушло).
create table if not exists public.staff_task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.staff_tasks(id) on delete cascade,
  actor_id uuid references public.staff(id) on delete set null,
  kind text not null check (kind in ('created', 'taken', 'done', 'failed', 'moved')),
  old_due timestamptz,
  new_due timestamptz,
  at timestamptz not null default now(),
  notify_staff_id uuid references public.staff(id) on delete cascade,
  notified_at timestamptz
);

create index if not exists staff_task_events_task_idx on public.staff_task_events (task_id, at);
create index if not exists staff_task_events_outbox_idx on public.staff_task_events (at)
  where notify_staff_id is not null and notified_at is null;

comment on table public.staff_task_events is
  'История задач: взял, сделано, не сделано, перенос срока (старый и новый срок, кто). notify_* — сообщение постановщику.';

alter table public.staff_tasks enable row level security;
alter table public.staff_task_events enable row level security;
