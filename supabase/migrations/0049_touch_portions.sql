-- Порция дня: утром каждому менеджеру и руководителю — поровну компаний из
-- пула касаний, с готовым текстом и кнопками в Telegram.
--
-- Владелец: «нужно решение, которое поможет менеджерам работать
-- эффективно». Проверенных компаний с контактами лежало сорок, отправлено
-- было десять — и все десять одним человеком. Искать сайт и думать, с чего
-- начать, менеджеру больше не нужно: утром это уже лежит у него в личке.
--
-- Отдельной таблицей, а не полем у касания: по ней вечером видно, кто свою
-- порцию сделал, а кто нет, — и через месяц тоже.
create table if not exists public.touch_portions (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Письмо готовится в фоне; отметка не даёт двум проходам свипа взяться
  -- за одну компанию.
  preparing_at timestamptz,
  delivered_at timestamptz,
  outcome text check (outcome in ('sent', 'self', 'skipped', 'expired')),
  closed_at timestamptz,
  unique (day, prospect_id)
);

create index if not exists touch_portions_day_staff_idx on public.touch_portions (day, staff_id);

comment on table public.touch_portions is
  'Порция дня касаний: какая компания кому выдана на какой день и чем кончилось.';

-- Раздача и вечерний отчёт — раз в день. Отметка здесь, а не в памяти
-- процесса: сайт перезапускается при каждой выкатке.
create table if not exists public.touch_portion_days (
  day date primary key,
  assigned_at timestamptz,
  reported_at timestamptz
);

alter table public.touch_portions enable row level security;
alter table public.touch_portion_days enable row level security;
