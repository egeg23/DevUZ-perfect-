-- Обращения в бота — владельцу и руководителю сразу, ответ прямо в Telegram
-- (lib/qualify/bot-inbox-store.ts).
--
-- Владелец, 23.10.2026, после лида FloraEdu Global, который нашёлся только
-- потому, что он сам начал копать: «как нам сделать так, чтобы и я и
-- руководитель могли видеть и отвечать на такие заявки, которые приходят в
-- бота?… С личного писать аккаунта мы не будем».
--
-- bot_inbox_notices: какое уведомление в чате сотрудника про какого клиента.
-- Ответ в Telegram знает только номер сообщения, на которое отвечают, — по
-- нему бот и понимает, кому переслать ответ.
--
-- bot_users.human_at / human_by: разговор ведёт человек — модель клиенту не
-- отвечает. last_text / last_text_at: последнее, что клиент написал, — для
-- утренней сводки тех, кто писал ночью.
--
-- Строки читает и пишет только сервер ключом service_role: RLS включён,
-- политик нет.

create table if not exists public.bot_inbox_notices (
  staff_chat bigint not null,
  message_id bigint not null,
  client_chat bigint not null,
  created_at timestamptz not null default now(),
  primary key (staff_chat, message_id)
);

create index if not exists bot_inbox_notices_client on public.bot_inbox_notices (client_chat, created_at desc);

alter table public.bot_inbox_notices enable row level security;
revoke all on public.bot_inbox_notices from anon, authenticated;

alter table public.bot_users
  add column if not exists human_at timestamptz,
  add column if not exists human_by uuid references public.staff (id) on delete set null,
  add column if not exists last_text text,
  add column if not exists last_text_at timestamptz;
