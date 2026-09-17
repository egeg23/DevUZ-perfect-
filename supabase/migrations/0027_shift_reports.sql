-- Отчёты плановых смен — разборов и эксперимента.
--
-- У плановой сессии нет токена бота, и «напиши владельцу в Telegram» ей
-- было не выполнить: правило стояло, канала не было. Теперь смена кладёт
-- строку сюда через Supabase, а свип на сервере, у которого токен есть,
-- доносит её владельцу и отмечает отправленной. Пустая смена, написавшая
-- «не нашлось годных сайтов», честнее молчаливого «успеха».
create table if not exists public.shift_reports (
  id uuid primary key default gen_random_uuid(),
  shift text not null,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create index if not exists shift_reports_unsent on public.shift_reports (created_at) where notified_at is null;

alter table public.shift_reports enable row level security;
