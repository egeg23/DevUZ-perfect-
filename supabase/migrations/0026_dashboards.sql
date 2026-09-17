-- Дашборды: план/факт и рекомендации.
--
-- plans — цель на неделю или месяц по одному показателю для одного
-- сотрудника. Факт не хранится: он считается из лидов, платежей и журнала
-- на момент просмотра, иначе разошёлся бы с ними при первой правке.
--
-- reviews — рекомендации, собранные моделью: раз в неделю по понедельникам
-- каждому сотруднику, раз в день владельцу и руководителю. Снимок чисел
-- кладётся рядом с текстом: через месяц должно быть видно, на что именно
-- опиралась рекомендация, а не только что она сказала.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  period text not null check (period in ('week', 'month')),
  period_start date not null,
  metric text not null check (metric in ('revenue_usd', 'won', 'contacts')),
  target numeric not null check (target >= 0),
  set_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, period, period_start, metric)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  kind text not null check (kind in ('weekly', 'daily')),
  period_start date not null,
  body jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (staff_id, kind, period_start)
);

alter table public.plans enable row level security;
alter table public.reviews enable row level security;
