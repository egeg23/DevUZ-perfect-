-- ИИ-сотрудники по подписке (docs/ai-staff/design.md).
--
-- Новый сервис студии: ИИ-менеджер продаж отвечает покупателям клиента в
-- Telegram Business, в его боте и в виджете на сайте. Всё своё — таблицы с
-- префиксом ai_, касания, лиды студии и чат сайта не задеты.
--
-- RLS включён без политик, как во всей базе: доступ только у сервера по
-- сервисному ключу. Изоляцию клиентов держит код (lib/ai-staff/store.ts):
-- каждый запрос фильтрует по tenant_id из сессии, канала или ключа виджета.

create table if not exists public.ai_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.ai_settings is 'ИИ-сотрудники: настройки сервиса (enabled — флаг включения).';

create table if not exists public.ai_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  niche text not null default '',
  site_url text,
  locale text not null default 'ru' check (locale in ('ru', 'uz')),
  plan text not null default 'trial' check (plan in ('trial', 'start', 'business', 'pro')),
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),
  trial_until timestamptz,
  paid_until timestamptz,
  -- Когда ИИ отвечает: всегда или только вне часов работы людей клиента.
  answer_mode text not null default 'always' check (answer_mode in ('always', 'off_hours')),
  -- Часы работы людей клиента по Ташкенту: {"from": "09:00", "to": "18:00", "days": [1,2,3,4,5,6]}.
  work_hours jsonb not null default '{"from":"09:00","to":"18:00","days":[1,2,3,4,5,6]}'::jsonb,
  -- Ключ приглашения менеджеров клиента через бота (/start join_<код>).
  invite_code text not null default replace(gen_random_uuid()::text, '-', ''),
  -- Сколько раз уже сказали людям клиента, что лимит исчерпан (раз в месяц).
  limit_noticed_at timestamptz,
  demo boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
comment on table public.ai_tenants is 'ИИ-сотрудники: клиенты сервиса (тариф, сроки, режим работы).';
create unique index if not exists ai_tenants_invite on public.ai_tenants (invite_code);

create table if not exists public.ai_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  telegram_user_id bigint not null,
  name text not null default '',
  username text,
  role text not null default 'manager' check (role in ('owner', 'manager')),
  -- Получать заявки в Telegram.
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, telegram_user_id)
);
comment on table public.ai_members is 'ИИ-сотрудники: люди клиента — владелец и менеджеры, кому идут заявки.';
create index if not exists ai_members_tg on public.ai_members (telegram_user_id);

create table if not exists public.ai_employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  -- Роль — сущность с заделом: в первой версии работает только sales.
  role text not null default 'sales' check (role in ('sales', 'smm', 'analyst')),
  name text not null default '',
  greeting text not null default '',
  tone text not null default 'friendly' check (tone in ('friendly', 'formal')),
  model_tier text not null default 'standard' check (model_tier in ('standard', 'premium')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, role)
);
comment on table public.ai_employees is 'ИИ-сотрудники: роль у клиента (sales; smm и analyst — задел).';

create table if not exists public.ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('about', 'price', 'service', 'faq', 'hours', 'address', 'delivery', 'payment', 'other')),
  title text not null default '',
  body text not null default '',
  source text not null default 'text' check (source in ('text', 'site')),
  source_url text,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);
comment on table public.ai_knowledge is 'ИИ-сотрудники: база знаний клиента — прайс, услуги, вопросы-ответы, часы, адрес.';
create index if not exists ai_knowledge_tenant on public.ai_knowledge (tenant_id, position);

create table if not exists public.ai_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  kind text not null check (kind in ('tg_business', 'tg_bot', 'widget')),
  status text not null default 'active' check (status in ('active', 'off', 'error')),
  -- tg_business: business_connection_id; tg_bot: id бота в Telegram.
  external_id text,
  -- tg_business: Telegram id владельца бизнес-аккаунта (его сообщения — перехват).
  owner_user_id bigint,
  -- tg_bot: @имя бота клиента; виджет: публичный ключ.
  title text not null default '',
  widget_key text,
  -- Секрет вебхука бота клиента.
  hook_secret text,
  -- Токен бота клиента, зашифрованный AES-256-GCM (ключ AI_STAFF_KEY).
  token_enc text,
  can_reply boolean not null default true,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.ai_channels is 'ИИ-сотрудники: каналы клиента — Telegram Business, свой бот, виджет.';
create unique index if not exists ai_channels_external on public.ai_channels (kind, external_id) where external_id is not null;
create unique index if not exists ai_channels_widget on public.ai_channels (widget_key) where widget_key is not null;
create index if not exists ai_channels_tenant on public.ai_channels (tenant_id);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  channel_id uuid references public.ai_channels (id) on delete set null,
  kind text not null check (kind in ('tg_business', 'tg_bot', 'widget', 'test')),
  -- Чат: id чата Telegram или id посетителя виджета.
  chat_key text not null,
  customer_name text not null default '',
  customer_handle text,
  lang text not null default 'ru',
  mode text not null default 'ai' check (mode in ('ai', 'human')),
  -- До какого времени разговор ведёт человек (перехват владельцем в Business).
  human_until timestamptz,
  messages jsonb not null default '[]'::jsonb,
  ai_replies integer not null default 0,
  -- Месяц, в котором этот разговор уже посчитан диалогом (YYYY-MM).
  counted_month text,
  lead_id uuid,
  -- Ответ ИИ не прошёл проверку и ушла безопасная фраза — вопрос без ответа в базе.
  unanswered integer not null default 0,
  first_reply_ms integer,
  off_hours boolean not null default false,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  unique (tenant_id, kind, chat_key)
);
comment on table public.ai_conversations is 'ИИ-сотрудники: разговоры с покупателями клиента.';
create index if not exists ai_conversations_tenant on public.ai_conversations (tenant_id, last_at desc);

create table if not exists public.ai_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  request_no text not null,
  name text not null default '',
  contact text not null default '',
  need text not null default '',
  budget text not null default '',
  urgency text not null default '',
  summary text not null default '',
  reason text not null default '',
  channel text not null default '',
  status text not null default 'new' check (status in ('new', 'taken', 'won', 'lost')),
  taken_by text,
  taken_at timestamptz,
  delivered boolean not null default false,
  test boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.ai_leads is 'ИИ-сотрудники: заявки, которые ИИ передал людям клиента.';
create index if not exists ai_leads_tenant on public.ai_leads (tenant_id, created_at desc);
create unique index if not exists ai_leads_no on public.ai_leads (request_no);

create table if not exists public.ai_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  plan text not null,
  months integer not null check (months between 1 and 24),
  amount_uzs bigint not null default 0 check (amount_uzs >= 0),
  method text not null default 'invoice' check (method in ('invoice', 'cash', 'card', 'click', 'payme')),
  paid_until timestamptz not null,
  staff_id uuid,
  created_at timestamptz not null default now()
);
comment on table public.ai_payments is 'ИИ-сотрудники: оплаты, отмеченные владельцем студии руками.';
create index if not exists ai_payments_tenant on public.ai_payments (tenant_id, created_at desc);

create table if not exists public.ai_login_tokens (
  token_hash text primary key,
  telegram_user_id bigint not null,
  name text not null default '',
  username text,
  expires_at timestamptz not null,
  used_at timestamptz
);
comment on table public.ai_login_tokens is 'ИИ-сотрудники: одноразовые ссылки входа в кабинет из бота (только хеш).';

create table if not exists public.ai_sessions (
  token_hash text primary key,
  telegram_user_id bigint not null,
  tenant_id uuid references public.ai_tenants (id) on delete cascade,
  -- Сотрудник студии зашёл в кабинет клиента из панели (поддержка).
  staff_id uuid,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
comment on table public.ai_sessions is 'ИИ-сотрудники: сессии кабинета клиента (только хеш).';

alter table public.ai_settings enable row level security;
alter table public.ai_tenants enable row level security;
alter table public.ai_members enable row level security;
alter table public.ai_employees enable row level security;
alter table public.ai_knowledge enable row level security;
alter table public.ai_channels enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_leads enable row level security;
alter table public.ai_payments enable row level security;
alter table public.ai_login_tokens enable row level security;
alter table public.ai_sessions enable row level security;
