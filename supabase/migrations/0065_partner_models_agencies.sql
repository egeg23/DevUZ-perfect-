-- Партнёрка: две модели дохода и агентства на субподряде.
--
-- Владелец, 28.09: «Сделай вторую колонку с доходом с оборота: первая, где
-- 30 %, — от чистой прибыли. Суммы те же на оборотном, но другой % — 6, 10,
-- 14, 17, 20 — это с оборота. Выбор модели доступен к смене раз в неделю,
-- мы должны это учитывать». И: «если партнёр подключит маркетинговое
-- агентство к нам на лидов — мы должны считать все заказы, которые будут от
-- другого агентства, типа субподряд».

-- ── Модель дохода ────────────────────────────────────────────────────────
--
-- profit — процент от чистой прибыли проекта, turnover — с оборота (суммы
-- проекта). Ставки обеих — lib/partners/rules.ts, PARTNER_TIERS.
alter table public.partners
  add column if not exists payout_model text not null default 'profit',
  add column if not exists model_changed_at timestamptz;
alter table public.partners drop constraint if exists partners_payout_model_check;
alter table public.partners
  add constraint partners_payout_model_check check (payout_model in ('profit', 'turnover'));

-- Журнал смен — «мы должны это учитывать»: по нему видно, какая модель
-- действовала в день любой заявки, и что смена была не чаще раза в неделю.
create table if not exists public.partner_model_changes (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners(id) on delete cascade,
  from_model text not null check (from_model in ('profit', 'turnover')),
  to_model text not null check (to_model in ('profit', 'turnover')),
  changed_at timestamptz not null default now()
);
create index if not exists partner_model_changes_partner_idx
  on public.partner_model_changes (partner_id, changed_at desc);

-- Модель фиксируется на клиенте в момент заявки и едет в проект: смена
-- модели партнёром действует на новых клиентов, а не переписывает деньги
-- по уже идущим проектам задним числом. Пусто — «от прибыли», как было.
alter table public.leads add column if not exists partner_model text;
alter table public.projects add column if not exists partner_model text;
alter table public.leads drop constraint if exists leads_partner_model_check;
alter table public.leads
  add constraint leads_partner_model_check check (partner_model is null or partner_model in ('profit', 'turnover'));
alter table public.projects drop constraint if exists projects_partner_model_check;
alter table public.projects
  add constraint projects_partner_model_check check (partner_model is null or partner_model in ('profit', 'turnover'));

-- ── Агентства ────────────────────────────────────────────────────────────
--
-- Агентство, которое партнёр подключил к студии: оно передаёт нам заказы
-- своих клиентов на субподряд. Все его заказы — партнёру, без окна в 30
-- дней: агентство — постоянный источник, а не разовый переход по ссылке.
-- Засчитывается только после подтверждения владельцем: иначе партнёр мог бы
-- «подключить» агентство, которое работает с нами и так.
create table if not exists public.partner_agencies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 120),
  -- Как агентство пишет нам: @telegram, телефон или почта. По нему
  -- узнаются его заявки.
  contact text check (contact is null or length(contact) <= 120),
  website text check (website is null or length(website) <= 200),
  note text check (note is null or length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  decided_at timestamptz,
  decided_by uuid references public.staff(id) on delete set null,
  decision_note text check (decision_note is null or length(decision_note) <= 300)
);
create index if not exists partner_agencies_partner_idx on public.partner_agencies (partner_id);
create index if not exists partner_agencies_pending_idx
  on public.partner_agencies (created_at) where status = 'pending';

alter table public.leads
  add column if not exists partner_agency_id uuid references public.partner_agencies(id) on delete set null;
alter table public.projects
  add column if not exists partner_agency_id uuid references public.partner_agencies(id) on delete set null;

alter table public.partner_model_changes enable row level security;
alter table public.partner_agencies enable row level security;

comment on table public.partner_agencies is
  'Агентства на субподряде, подключённые партнёром. Активное — все его заказы засчитываются партнёру.';
comment on table public.partner_model_changes is
  'Смены модели дохода партнёра (прибыль / оборот). Не чаще раза в 7 дней.';
