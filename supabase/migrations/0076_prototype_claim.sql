-- Прототип по касанию: «кто первый взял, того и лид».
--
-- Владелец, 02.10.2026: «Прототипы собираем мы в ручном режиме. После
-- подтверждения, что надо прототип, — сразу уведомление всем в телеграм, и
-- кто успеет взять — того и лид».
--
-- Клиент ответил на касание «да, соберите прототип» — бот рассылает это
-- всей команде с кнопкой «🛠 Беру прототип». Взять может только один:
-- условие `proto_taken_by is null` стоит в самом update, и проигравший
-- получает честное «уже взяли», а не молчаливую перезапись.

alter table public.prospects
  add column if not exists proto_requested_at timestamptz,
  add column if not exists proto_taken_by uuid references public.staff(id) on delete set null,
  add column if not exists proto_taken_at timestamptz,
  add column if not exists proto_notices jsonb not null default '[]'::jsonb;

comment on column public.prospects.proto_requested_at is
  'Когда клиент попросил прототип и команда получила рассылку. Повторная просьба вторую рассылку не запускает.';
comment on column public.prospects.proto_taken_by is
  'Кто первым нажал «Беру прототип» — за ним лид и разговор.';
comment on column public.prospects.proto_taken_at is
  'Когда взяли прототип. Обещали клиенту — за 12 часов.';
comment on column public.prospects.proto_notices is
  'Копии рассылки «хотят прототип»: [{chatId, messageId}] — чтобы погасить кнопку у всех, когда взяли.';
