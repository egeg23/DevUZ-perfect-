-- Активные проекты и их стадии.
--
-- Выигранный лид перестаёт быть лидом и становится работой, у которой есть
-- срок, ответственный и стадия. Пока этого нет, «что у нас в работе»
-- отвечается по памяти — и отвечается по-разному в зависимости от того,
-- кого спросили.
--
-- Стадию двигает админ, как и просили. Менеджер видит, но не переставляет:
-- стадия — это обещание клиенту, а не отметка о самочувствии исполнителя.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  title text not null check (length(btrim(title)) between 1 and 200),
  client text,

  -- Откуда пришёл. Ссылка не обязательна: проект может прийти и мимо
  -- воронки — по рекомендации, от старого клиента.
  --
  -- set null, а не cascade: удалённый лид не должен уносить с собой
  -- проект, по которому идёт работа и, возможно, платят деньги.
  lead_id uuid references public.leads(id) on delete set null,

  -- Ответственный. Тоже set null: ушедший сотрудник не удаляет проект.
  owner_staff_id uuid references public.staff(id) on delete set null,

  stage text not null default 'brief' check (stage in (
    'brief', 'contract', 'design', 'build', 'review', 'launch',
    'support', 'paused', 'done', 'cancelled'
  )),

  -- Когда стадия стала текущей. Без этого «в разработке» ничего не
  -- говорит: важно не то, что проект в разработке, а то, что он в ней
  -- третий месяц.
  stage_since timestamptz not null default now(),

  started_at date,
  deadline date,

  -- Сумма в долларах, как в каталоге. Целые доллары: копейки в проекте на
  -- десятки тысяч не значат ничего, а тип с плавающей точкой в деньгах
  -- значит ошибку.
  amount_usd integer check (amount_usd is null or amount_usd >= 0),

  notes text
);

create index if not exists projects_stage_idx
  on public.projects (stage, created_at desc);

-- Активные — то, что открывают чаще всего.
create index if not exists projects_active_idx
  on public.projects (created_at desc)
  where stage not in ('done', 'cancelled');

create index if not exists projects_owner_idx
  on public.projects (owner_staff_id, created_at desc);

comment on table public.projects is
  'Активные проекты. Стадию двигает админ; история переходов — в audit_events.';

alter table public.projects enable row level security;
