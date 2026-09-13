-- Финансы: грейды, себестоимость, платежи, выплаты.
--
-- Фиксированных зарплат в студии нет: все получают процент от чистой
-- прибыли по сделке, а сделка — это проект с подписанным договором.
-- Словами владельца: «себестоимость вписываю в проект я после подписания
-- договора, оттуда уже считается по менеджерам». Поэтому деньги живут при
-- проекте, а не в отдельной сущности: сумма уже была, добавляются вид
-- (новый клиент / допродажа), налог и себестоимость.
--
-- Начисления не хранятся, а считаются в коде: ставка × (сумма − налог −
-- себестоимость). Хранить их значило бы получить два источника правды,
-- которые разойдутся после первой же правки себестоимости. В базе — только
-- факты: что клиент заплатил и что сотруднику выплатили.

-- ── Сотрудник: грейд и персональная ставка ──────────────────────────────

alter table public.staff
  add column if not exists grade text not null default 'manager'
    check (grade in ('junior', 'manager', 'head'));

alter table public.staff
  add column if not exists rate_percent smallint
    check (rate_percent is null or rate_percent between 0 and 100);

comment on column public.staff.grade is
  'Грейд для ставки: младший (10 %), менеджер (15 %, допродажа 5 %), руководитель (30 % на своём клиенте). Ставки — в коде.';
comment on column public.staff.rate_percent is
  'Персональная ставка вместо грейдовой на новых клиентах, в процентах. Пусто — по грейду.';

-- ── Проект: вид, налог, себестоимость ───────────────────────────────────

alter table public.projects
  add column if not exists kind text not null default 'new'
    check (kind in ('new', 'upsell'));

alter table public.projects
  add column if not exists tax_percent smallint not null default 4
    check (tax_percent between 0 and 100);

-- Целые доллары, как amount_usd: копейки в проекте на десятки тысяч не
-- значат ничего, а тип с плавающей точкой в деньгах значит ошибку.
alter table public.projects
  add column if not exists dev_cost_usd integer
    check (dev_cost_usd is null or dev_cost_usd >= 0);

comment on column public.projects.kind is
  'Новый клиент или допродажа существующему — от этого зависит ставка менеджера.';
comment on column public.projects.tax_percent is
  'Налог с суммы от клиента, в процентах. Вписывает владелец.';
comment on column public.projects.dev_cost_usd is
  'Себестоимость разработки в долларах. Вписывает владелец после подписания договора; до этого начисления не считаются как окончательные.';

-- ── Платежи клиента ─────────────────────────────────────────────────────
--
-- Клиент платит частями: аванс → работа → остаток. Начисление сотруднику
-- лежит в заморозке, пока сумма платежей не достигнет суммы проекта.
-- Подтверждает платёж только владелец.

create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  project_id uuid not null references public.projects(id) on delete cascade,

  amount_usd integer not null check (amount_usd > 0),
  paid_on date not null default current_date,
  purpose text not null default 'advance' check (purpose in ('advance', 'rest', 'other')),
  note text,

  confirmed_by uuid references public.staff(id) on delete set null
);

comment on table public.project_payments is
  'Платежи клиента по проекту. Только факты: сумма, дата, назначение, кто подтвердил.';

create index if not exists project_payments_project_idx
  on public.project_payments (project_id);

-- ── Выплаты сотрудникам ─────────────────────────────────────────────────
--
-- Без них «заработал» и «получил» не сойдутся никогда. Сотрудника не
-- удаляют, а отключают, поэтому ссылка строгая: история выплат должна
-- пережить любую чистку.

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  staff_id uuid not null references public.staff(id),

  amount_usd integer not null check (amount_usd > 0),
  paid_on date not null default current_date,
  note text,

  created_by uuid references public.staff(id) on delete set null
);

comment on table public.payouts is
  'Выплаты сотрудникам. Баланс = заработано (по оплаченным проектам) − выплачено.';

create index if not exists payouts_staff_idx
  on public.payouts (staff_id);

-- Как и остальные таблицы: RLS включён, политик нет — ходим только
-- сервисным ключом с сервера.
alter table public.project_payments enable row level security;
alter table public.payouts enable row level security;
