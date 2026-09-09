-- Закрепление лида за менеджером, напоминания и раскрытие контакта.
--
-- Это тот самый этап, ради которого панель и затевалась. Пока лид не
-- закреплён, контакт клиента виден всем — и любой менеджер выгружает себе
-- базу за вечер. Здесь у лида появляется владелец, а у контакта — момент,
-- когда его открыли, и человек, который это сделал.
--
-- Прежняя колонка assigned_to (текстовая, «@username») остаётся: в ней
-- лежит история из Telegram-брифов, и обнулять её значит потерять то, что
-- уже записано. Новая ссылается на реального сотрудника.

alter table public.leads
  add column if not exists assigned_staff_id uuid references public.staff(id),
  add column if not exists contact_revealed_at timestamptz,
  add column if not exists contact_revealed_by uuid references public.staff(id),

  -- Тумблер автонапоминаний у самого лида, а не в настройках человека.
  -- Лиды разные: по одному звонить надо завтра, по другому — через месяц,
  -- и общая настройка «напоминать раз в сутки» одинаково мешает обоим.
  add column if not exists auto_reminder boolean not null default true;

create index if not exists leads_assigned_idx
  on public.leads (assigned_staff_id, created_at desc);

-- Очередь свободных лидов — то, что менеджер видит чаще всего.
create index if not exists leads_unassigned_idx
  on public.leads (created_at desc)
  where assigned_staff_id is null;

-- ------------------------------------------------------- lead_reminders
create table if not exists public.lead_reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  lead_id uuid not null references public.leads(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,

  due_at timestamptz not null,
  note text,

  -- auto ставится системой при взятии лида, manual — человеком руками.
  -- Разделение нужно, чтобы выключение тумблера убирало только первые:
  -- напоминание, которое менеджер поставил сам, система отменять не вправе.
  kind text not null default 'manual' check (kind in ('manual', 'auto')),

  -- Три разных «закончилось»: сделано человеком, отправлено ботом,
  -- отменено. Одного флага мало — по нему не отличить «менеджер закрыл
  -- задачу» от «бот отправил и забыл».
  done_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz
);

-- Индекс под единственный горячий запрос: что пора отправить прямо сейчас.
-- Без частичного условия свип каждую минуту читал бы всю таблицу, включая
-- всё, что уже отработало.
create index if not exists lead_reminders_due_idx
  on public.lead_reminders (due_at)
  where sent_at is null and done_at is null and cancelled_at is null;

create index if not exists lead_reminders_lead_idx
  on public.lead_reminders (lead_id, due_at);

create index if not exists lead_reminders_staff_idx
  on public.lead_reminders (staff_id, due_at)
  where done_at is null and cancelled_at is null;

comment on table public.lead_reminders is
  'Напоминания по лидам. auto ставится при взятии лида, manual — руками.';

alter table public.lead_reminders enable row level security;
