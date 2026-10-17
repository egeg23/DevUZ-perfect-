-- Неверные пароли к макету — в базе, а не в памяти процесса.
--
-- Проверка безопасности 17.10.2026: предел попыток на макет жил в памяти
-- (lib/qualify/limiter) и обнулялся с каждой выкаткой, а постоянный PIN
-- владельца (facts.lock) не истекает. Как у витрины (showcase_code_failures,
-- миграция 0091): каждая неверная попытка — строка, предел считается по ним
-- за час и за сутки (lib/proto/code-store, protoPinBlocked).
--
-- Строки читает и пишет только сервер ключом service_role: RLS включён,
-- политик нет — ключ anon таблицы не видит.

create table if not exists public.proto_pin_failures (
  id bigserial primary key,
  proto_id uuid not null,
  at timestamptz not null default now()
);

create index if not exists proto_pin_failures_proto_at on public.proto_pin_failures (proto_id, at desc);

alter table public.proto_pin_failures enable row level security;
revoke all on public.proto_pin_failures from anon, authenticated;
