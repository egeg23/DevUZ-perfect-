-- Приглашения команде с кнопками «✅ Принять» / «✖ Отклонить».
--
-- Владелец, 12.10.2026: «Сделай всем большое уведомление с кнопкой принять
-- или отклонить, чтобы еще еще и общаться с блоггерами и подписывать их на
-- работу с нами». Первое такое приглашение — работа с блогерами
-- (lib/admin/blogger-invite.ts).
--
-- Строка — одно приглашение одному человеку: когда и каким сообщением ушло
-- (по номеру кнопки после ответа заменяются строкой статуса), что ответил и
-- когда. Ответ пишется один раз: обновление идёт только по строке, где
-- answer ещё пуст, — второе нажатие ничего не меняет.
create table if not exists public.team_invites (
  invite_id text not null,
  staff_id uuid not null references public.staff (id) on delete cascade,
  chat_id bigint,
  message_id bigint,
  sent_at timestamptz not null default now(),
  answer text check (answer in ('yes', 'no')),
  answered_at timestamptz,
  primary key (invite_id, staff_id)
);
alter table public.team_invites enable row level security;
