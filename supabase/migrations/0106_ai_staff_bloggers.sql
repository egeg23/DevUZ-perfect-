-- ИИ-сотрудники по подписке: роль «ИИ-менеджер по блогерам» (bloggers).
--
-- Владелец, 11.10.2026: агент по блогерам — «не только внешний сервис, но
-- и наш внутренний». Внутренний — вкладка «Блогеры» в панели студии
-- (миграции 0103–0105). Здесь — та же роль для клиентов сервиса: клиент
-- ищет и оценивает блогеров для своего бренда в кабинете, агент готовит
-- первое сообщение, отправляет его человек клиента в Direct
-- (docs/ai-staff/bloggers.md, раздел «Сервис»).

alter table public.ai_employees drop constraint if exists ai_employees_role_check;
alter table public.ai_employees add constraint ai_employees_role_check
  check (role in ('sales', 'smm', 'analyst', 'bloggers'));

-- Что роль знает о клиенте: у «блогеров» — бренд, аудитория и что
-- предлагаем блогерам (lib/ai-staff/bloggers.ts → Brief).
alter table public.ai_employees add column if not exists brief jsonb not null default '{}'::jsonb;

create table if not exists public.ai_bloggers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  handle text not null check (handle ~ '^[a-z0-9._]{1,30}$'),
  name text not null default '',
  bio text not null default '',
  followers integer,
  following integer,
  engagement numeric,
  posts_per_week numeric,
  last_post_at timestamptz,
  topics text[] not null default '{}',
  lang text,
  city text,
  fit integer check (fit between 0 and 10),
  why text,
  telegram text,
  email text,
  source text not null default 'manual' check (source in ('manual', 'search')),
  score integer check (score between 0 and 100),
  score_notes text,
  status text not null default 'new'
    check (status in ('new', 'ready', 'skipped', 'contacted', 'replied', 'deal', 'declined')),
  pitch text,
  contacted_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, handle)
);
comment on table public.ai_bloggers is 'ИИ-сотрудники: блогеры, которых нашёл и оценил ИИ-менеджер по блогерам клиента.';
create index if not exists ai_bloggers_tenant on public.ai_bloggers (tenant_id, status, score desc nulls last);

alter table public.ai_bloggers enable row level security;
