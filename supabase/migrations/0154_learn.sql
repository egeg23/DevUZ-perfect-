-- Обучение: курсы по продажам и тест по панели (app/admin/learn, lib/learn).
--
-- Владелец, 12.10.2026: «Добавить курсы по продажам и тестирование по
-- знаниям дашборда»; «Тесты делаем интерактивные с возможностью пройти в
-- телеграм боте». Попытка — одна строка: чей тест, сколько верных из
-- скольких, сдан ли он по порогу на момент сдачи (lib/learn/rules.ts) и
-- ответы — номер выбранного варианта по каждому вопросу. Откуда сдан: панель
-- или бот. Ответы пересчитывает сервер, а не браузер.
--
-- Материалы — ссылки, которые владелец прикрепляет к курсу («Материалы»):
-- название и адрес. Видят все, кому открыт раздел.
--
-- Включено ли обучение для команды — строка `section-on:/admin/learn` в
-- stats_snapshots (lib/admin/section-switch.ts): отдельная таблица ради
-- одного да/нет не нужна.
create table if not exists public.learn_attempts (
  id bigint generated always as identity primary key,
  staff_id uuid not null references public.staff (id) on delete cascade,
  course text not null check (course ~ '^[a-z][a-z0-9-]{0,39}$'),
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  source text not null default 'panel' check (source in ('panel', 'bot')),
  created_at timestamptz not null default now()
);
create index if not exists learn_attempts_staff on public.learn_attempts (staff_id, course, created_at desc);
alter table public.learn_attempts enable row level security;

create table if not exists public.learn_materials (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[a-z][a-z0-9-]{0,39}$'),
  title text not null check (char_length(title) between 1 and 200),
  url text not null check (url ~ '^https?://' and char_length(url) <= 2000),
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists learn_materials_course on public.learn_materials (course, created_at);
alter table public.learn_materials enable row level security;
