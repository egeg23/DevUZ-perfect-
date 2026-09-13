-- Партнёрская программа (рефералка).
--
-- Перенесена с seller ai — там она полная: личные ссылки с метками и
-- счётчиками, процент с каждой оплаты приведённого клиента, ставка выше за
-- результат, бонус новому клиенту по ссылке, заявки на выплату, антифрод.
-- Здесь то же самое в терминах студии: партнёр — человек в боте, клиент —
-- лид, оплата — платёж по проекту, начисление — процент от чистой прибыли
-- проекта, как у сотрудников.
--
-- Начисления не хранятся, а считаются из проектов и платежей (см.
-- lib/partners/rules.ts). В базе — факты: кто партнёр, чей лид, чей проект,
-- что выплачено.

-- ── Партнёры ────────────────────────────────────────────────────────────

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Личность партнёра — Telegram. Пусто у заведённых владельцем руками,
  -- пока человек не написал боту.
  telegram_user_id bigint unique,
  username text,
  name text not null check (length(btrim(name)) between 1 and 120),

  -- Основной код; ссылки могут иметь свои.
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,24}$'),

  -- Куда платить: кошелёк USDT TRC-20 или реквизиты словами.
  requisites text,

  status text not null default 'active' check (status in ('active', 'blocked')),

  -- Персональная ставка вместо ступенчатой (20 / 25), в процентах.
  percent_override smallint check (percent_override is null or percent_override between 0 and 100),

  -- Заметка владельца: условия для блогера, откуда человек.
  note text
);

comment on table public.partners is
  'Партнёры реферальной программы. Ставка — процент от чистой прибыли проектов приведённых клиентов.';

create index if not exists partners_telegram_idx
  on public.partners (telegram_user_id)
  where telegram_user_id is not null;

-- ── Ссылки ──────────────────────────────────────────────────────────────
--
-- Отдельная ссылка под каждый канал: видно, откуда приходят люди. К ссылке
-- можно прикрепить бонус новому клиенту — оффер партнёра его аудитории;
-- процент партнёра идёт сверху.

create table if not exists public.partner_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  partner_id uuid not null references public.partners(id) on delete cascade,

  code text not null unique check (code ~ '^[A-Z0-9_-]{3,24}$'),
  label text check (label is null or length(label) <= 80),
  perk text not null default 'none' check (perk in ('none', 'disc_5', 'disc_10', 'disc_15')),

  clicks integer not null default 0,
  leads integer not null default 0,
  is_default boolean not null default false
);

create index if not exists partner_links_partner_idx
  on public.partner_links (partner_id);

-- ── Касания в боте ──────────────────────────────────────────────────────
--
-- Клиент пришёл в бота по ссылке партнёра (/start ref_КОД) — лида ещё нет,
-- а код уже есть. Лежит здесь до первой заявки из этого чата.

create table if not exists public.partner_touches (
  chat_id bigint primary key,
  code text not null,
  seen_at timestamptz not null default now()
);

-- ── Лиды и проекты: чей ────────────────────────────────────────────────

alter table public.leads
  add column if not exists partner_id uuid references public.partners(id) on delete set null;
alter table public.leads
  add column if not exists partner_link_id uuid references public.partner_links(id) on delete set null;
alter table public.leads
  add column if not exists partner_code text;
-- Почему привязка не засчитана: сам себя привёл, клиент уже был.
alter table public.leads
  add column if not exists partner_void_reason text;

create index if not exists leads_partner_idx
  on public.leads (partner_id)
  where partner_id is not null;

alter table public.projects
  add column if not exists partner_id uuid references public.partners(id) on delete set null;
-- Процент партнёру по этому проекту, если владелец задал вручную.
alter table public.projects
  add column if not exists partner_percent smallint
    check (partner_percent is null or partner_percent between 0 and 100);
alter table public.projects
  add column if not exists partner_void_reason text;

create index if not exists projects_partner_idx
  on public.projects (partner_id)
  where partner_id is not null;

-- ── Выплаты партнёрам ───────────────────────────────────────────────────
--
-- Заявку подаёт партнёр в боте, решает владелец. Отклонённая возвращает
-- сумму в доступное.

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  partner_id uuid not null references public.partners(id),

  amount_usd integer not null check (amount_usd > 0),
  requisites text not null,
  status text not null default 'requested' check (status in ('requested', 'paid', 'rejected')),
  note text,

  paid_at timestamptz,
  decided_by uuid references public.staff(id) on delete set null
);

create index if not exists partner_payouts_partner_idx
  on public.partner_payouts (partner_id);
create index if not exists partner_payouts_requested_idx
  on public.partner_payouts (created_at)
  where status = 'requested';

alter table public.partners enable row level security;
alter table public.partner_links enable row level security;
alter table public.partner_touches enable row level security;
alter table public.partner_payouts enable row level security;
