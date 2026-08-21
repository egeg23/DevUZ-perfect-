-- Лиды из чата с AI-менеджером и из формы обратной связи.
--
-- Таблица закрыта Row Level Security и намеренно не имеет ни одной политики:
-- писать и читать её должен только сервер по service_role-ключу, который RLS
-- обходит. Анонимный ключ, попав в браузер, не даст доступа ни к одной строке.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  source text not null check (source in ('chat', 'form')),
  locale text not null check (locale in ('ru', 'en', 'uz', 'zh')),

  -- Контакты
  contact_name text,
  company text,
  contact_handle text,

  -- ICP
  niche text,
  niche_tier smallint check (niche_tier between 1 and 3),
  expertise text check (expertise in ('high', 'medium', 'low')),
  services text[] not null default '{}',

  -- BANT
  budget text check (budget in ('B1', 'B2', 'B3')),
  authority text check (authority in ('A1', 'A2', 'A3')),
  need text check (need in ('N1', 'N2', 'N3')),
  timing text check (timing in ('T1', 'T2', 'T3')),

  -- Итог квалификации
  intent text not null,
  score smallint not null check (score between 0 and 100),
  grade text not null check (grade in ('A', 'B', 'C', 'D')),
  priority text not null check (priority in ('hot', 'warm', 'nurture', 'archive')),
  breakdown jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  notes text,
  transcript jsonb not null default '[]'::jsonb,

  -- Работа менеджера
  status text not null default 'new' check (status in ('new', 'taken', 'dropped', 'won', 'lost')),
  assigned_to text,
  assigned_at timestamptz
);

alter table public.leads enable row level security;

-- Основной рабочий запрос отдела продаж — «свежие горячие сверху», поэтому
-- индекс покрывает именно его, а не абстрактное created_at.
create index if not exists leads_priority_created_idx
  on public.leads (priority, created_at desc);

create index if not exists leads_status_idx
  on public.leads (status)
  where status = 'new';

comment on table public.leads is
  'Лиды первой линии: ICP-грейд ниши, экспертность студии, BANT, скоринг 0–100 и расшифровка диалога.';
