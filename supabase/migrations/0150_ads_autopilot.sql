-- Автопилот рекламы (Google Ads и Яндекс Директ) — отдельный сервис студии.
--
-- Всё своё: таблицы ads_*, ни одна существующая не меняется. Пишет и читает
-- только сервер (lib/ads/store.ts) на сервисном ключе; RLS включён без
-- политик, как везде.
--
-- ads_workspaces — кабинет: студия сама, агентство или бизнес.
-- ads_members    — кто входит в кабинет (по Telegram id) и кому бот пишет.
-- ads_login_tokens, ads_sessions — вход через бота, в базе только хеши.
-- ads_accounts   — подключённый рекламный кабинет: площадка, режим, лимиты,
--                  стоп-кран; ключи доступа — зашифрованными (credentials_enc).
-- ads_proposals  — предложения автопилота: минус-слова, бюджет, тест объявлений.
-- ads_actions    — журнал применённого: что было, что стало, почему, откат.
-- ads_tests      — тесты объявлений: контроль и вариант, итог.

create table if not exists public.ads_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  kind text not null default 'agency' check (kind in ('studio', 'agency', 'business')),
  locale text not null default 'ru' check (locale in ('ru', 'uz')),
  created_by uuid,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  -- Когда ушёл недельный отчёт в Telegram: раз в неделю, не чаще.
  last_report_at timestamptz
);

create table if not exists public.ads_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ads_workspaces (id) on delete cascade,
  telegram_user_id bigint not null,
  name text not null default '',
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, telegram_user_id)
);
create index if not exists ads_members_tg on public.ads_members (telegram_user_id);

create table if not exists public.ads_login_tokens (
  token_hash text primary key,
  member_id uuid not null references public.ads_members (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.ads_sessions (
  token_hash text primary key,
  member_id uuid not null references public.ads_members (id) on delete cascade,
  expires_at timestamptz not null,
  last_seen_at timestamptz
);

create table if not exists public.ads_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ads_workspaces (id) on delete cascade,
  platform text not null check (platform in ('yandex', 'google', 'stub')),
  -- Яндекс: логин клиента (Client-Login); Google: customer id без дефисов.
  external_id text not null default '',
  name text not null default '',
  currency text not null default 'UZS',
  sandbox boolean not null default false,
  -- AES-256-GCM ключом ADS_TOKEN_KEY (lib/ads/crypto.ts). Никогда не в коде.
  credentials_enc text,
  -- Состояние заглушки: кампании, запросы, объявления — для обкатки без API.
  stub_state jsonb,
  mode text not null default 'suggest' check (mode in ('suggest', 'auto')),
  stopped boolean not null default false,
  max_shift_pct integer not null default 20 check (max_shift_pct between 0 and 30),
  max_actions_day integer not null default 20 check (max_actions_day between 0 and 100),
  -- Пороги: деньги без заявки, клики, описание бизнеса для модели и т.п.
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'ok', 'error', 'disconnected')),
  last_error text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ads_accounts_ws on public.ads_accounts (workspace_id);

create table if not exists public.ads_proposals (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.ads_accounts (id) on delete cascade,
  kind text not null check (kind in ('negatives', 'budget', 'ad_test', 'ad_winner')),
  status text not null default 'new'
    check (status in ('new', 'rejected', 'applied', 'failed', 'expired', 'rolled_back')),
  -- Одинаковое предложение не заводится дважды, пока первое открыто.
  dedupe_key text not null,
  title text not null,
  why text not null,
  numbers jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  error text
);
create index if not exists ads_proposals_account on public.ads_proposals (account_id, status, created_at desc);
create unique index if not exists ads_proposals_open
  on public.ads_proposals (account_id, dedupe_key) where status = 'new';

create table if not exists public.ads_actions (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.ads_accounts (id) on delete cascade,
  proposal_id bigint references public.ads_proposals (id) on delete set null,
  kind text not null,
  actor text not null,
  auto boolean not null default false,
  why text not null,
  before jsonb not null,
  after jsonb not null,
  at timestamptz not null default now(),
  rolled_back_at timestamptz,
  rollback_of bigint references public.ads_actions (id) on delete set null
);
create index if not exists ads_actions_account on public.ads_actions (account_id, at desc);

create table if not exists public.ads_tests (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.ads_accounts (id) on delete cascade,
  campaign_id text not null,
  ad_group_id text not null,
  control_ad_id text not null,
  variant_ad_id text not null,
  status text not null default 'running' check (status in ('running', 'won', 'lost', 'stopped')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  result jsonb
);
create index if not exists ads_tests_account on public.ads_tests (account_id, status);

alter table public.ads_workspaces enable row level security;
alter table public.ads_members enable row level security;
alter table public.ads_login_tokens enable row level security;
alter table public.ads_sessions enable row level security;
alter table public.ads_accounts enable row level security;
alter table public.ads_proposals enable row level security;
alter table public.ads_actions enable row level security;
alter table public.ads_tests enable row level security;
