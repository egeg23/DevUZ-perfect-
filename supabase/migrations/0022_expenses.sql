-- Расходы студии и доли соучредителей.
--
-- Владелец: «5 % с команды он не получает, так как он соучредитель и
-- получает 30 % после вычета всех расходов (реклама и тд). Кстати надо
-- ввести учёт по рекламным затратам, так как иначе неверно будет рассчитан
-- его %. А реклама делится в равной пропорции как расход 30/70, где 70 %
-- доли прибыли и расходов мои, 30 у Александра.»
--
-- Отсюда две вещи. Первая — процент соучредителя на сотруднике: он же
-- отменяет для него ставку руководителя с команды. Вторая — таблица
-- расходов: без неё котёл, который делится, считается от валовой прибыли, и
-- доля соучредителя выходит завышенной.
--
-- Реклама при этом не требует отдельного правила: расход вычитается из
-- котла ДО деления, значит ложится на обоих ровно в их пропорции сам.

-- ─── Доля соучредителя ──────────────────────────────────────────────────
-- Проценты, а не доли: 70 и 30 читаются с первого взгляда, 0.7 и 0.3 —
-- нет. Пусто — человек не соучредитель, и на котёл не претендует.
alter table public.staff
  add column if not exists founder_percent smallint
    check (founder_percent is null or (founder_percent > 0 and founder_percent <= 100));

comment on column public.staff.founder_percent is
  'Доля в чистой прибыли студии, %. Заполнена — человек соучредитель: ставка руководителя с команды к нему не применяется.';

-- ─── Расходы студии ─────────────────────────────────────────────────────
-- Только общие: реклама, сервисы, подрядчики, офис. Себестоимость
-- конкретного проекта живёт в projects.dev_cost_usd и сюда не попадает —
-- иначе она вычлась бы дважды, из прибыли проекта и из котла.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Дата траты, а не записи: рекламу оплачивают в понедельник, а вносят в
  -- панель в пятницу, и период считается по первой.
  spent_on date not null,

  -- В долларах и целыми, как все деньги в проекте: центы на этих суммах
  -- ничего не решают, а дробные типы в расчётах дают расхождения на копейку
  -- там, где сходиться должно до цента.
  amount_usd integer not null check (amount_usd > 0),

  category text not null default 'other'
    check (category in ('ads', 'tools', 'contractors', 'office', 'other')),

  note text check (note is null or length(note) <= 500),

  -- Кто внёс. Вносит владелец — право проверяется в коде, но след нужен и
  -- здесь: расход уменьшает долю второго соучредителя, и «кто это добавил»
  -- однажды спросят.
  created_by uuid references public.staff(id) on delete set null
);

comment on table public.expenses is
  'Общие расходы студии: реклама, сервисы, подрядчики. Себестоимость проекта — в projects.dev_cost_usd.';

create index if not exists expenses_period_idx on public.expenses (spent_on desc);
create index if not exists expenses_category_idx on public.expenses (category, spent_on desc);

alter table public.expenses enable row level security;
