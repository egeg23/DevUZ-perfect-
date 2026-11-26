-- DevUz CallHelper: колл-центры, их ключи API, сценарии и звонки (владелец,
-- 26.11.2026: «надо для виртуальных станций подготовить базу апи под
-- интеграции, чтобы и они могли к нам цепляться и мы к ним, и клиенты чтобы
-- видели прям расширением»).
--
-- Ключ колл-центра хранится только отпечатком (sha256): сам ключ показывается
-- один раз при выдаче. Расшифровки разговоров не хранятся: у звонка остаётся
-- только итог (этапы, возражения, запрещённые слова), звук не хранится вовсе.

create table if not exists public.callhelper_orgs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(name) between 1 and 160),
  contact text check (length(contact) <= 200),
  key_hash text not null unique check (length(key_hash) = 64),
  key_hint text not null check (length(key_hint) <= 8),
  plan text not null default 'trial' check (plan in ('trial', 'start', 'work')),
  operators integer not null default 1 check (operators between 1 and 5000),
  -- Пробный отсчитывается с первого звонка, а не с выдачи ключа.
  trial_started_at timestamptz,
  paid_until timestamptz,
  active boolean not null default true,
  created_by uuid references public.staff(id) on delete set null
);

create table if not exists public.callhelper_scripts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.callhelper_orgs(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  script jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists callhelper_scripts_org_idx on public.callhelper_scripts (org_id, updated_at desc);

create table if not exists public.callhelper_calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.callhelper_orgs(id) on delete cascade,
  script_id uuid references public.callhelper_scripts(id) on delete set null,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  ended_at timestamptz,
  operator text check (length(operator) <= 120),
  -- Номер звонка в системе колл-центра и откуда звонок (extension, api, skorozvon…).
  external_id text check (length(external_id) <= 160),
  source text not null default 'api' check (length(source) <= 40),
  seconds integer not null default 0 check (seconds >= 0),
  summary jsonb
);
create index if not exists callhelper_calls_org_idx on public.callhelper_calls (org_id, started_at desc);
create index if not exists callhelper_calls_ext_idx on public.callhelper_calls (org_id, external_id) where external_id is not null;

-- Секунды разговора по месяцам: счёт минут пакета и пробного.
create table if not exists public.callhelper_usage (
  org_id uuid not null references public.callhelper_orgs(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  seconds integer not null default 0 check (seconds >= 0),
  primary key (org_id, month)
);

create or replace function public.callhelper_add_usage(p_org uuid, p_month text, p_seconds integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.callhelper_usage (org_id, month, seconds)
  values (p_org, p_month, greatest(p_seconds, 0))
  on conflict (org_id, month) do update set seconds = public.callhelper_usage.seconds + greatest(excluded.seconds, 0);
$$;
revoke all on function public.callhelper_add_usage(uuid, text, integer) from public, anon, authenticated;

alter table public.callhelper_orgs enable row level security;
alter table public.callhelper_scripts enable row level security;
alter table public.callhelper_calls enable row level security;
alter table public.callhelper_usage enable row level security;
