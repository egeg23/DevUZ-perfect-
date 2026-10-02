-- Прототип: первые 30 минут — автору касания, потом всей команде.
--
-- Владелец, 02.10.2026: «Оставь зазор 30 минут, чтобы лид, который попросил
-- прототип, сначала падал тому, кто его нажал. Не успел за полчаса — падает
-- в общую очередь с пометкой: нужен прототип, бери срочно».

alter table public.prospects
  add column if not exists proto_broadcast_at timestamptz,
  add column if not exists proto_words text;

comment on column public.prospects.proto_broadcast_at is
  'Когда «нужен прототип» ушло всей команде: через 30 минут после просьбы клиента, если автор касания не взял. Пусто — пока только у автора.';
comment on column public.prospects.proto_words is
  'Слова клиента, которыми он попросил прототип, — для рассылки команде через 30 минут.';
