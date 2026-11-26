-- DevUz CallHelper: кто уже брал пробный период (владелец, 25.11.2026: «нужно
-- убрать схемы абуза (новые аккаунты создают и не платят…)»; 26.11.2026:
-- «Делай пока все остальное» — регистрация колл-центра без владельца).
--
-- Пробный даётся компании один раз: по ИНН, телефону и Telegram навсегда, по
-- браузеру и адресу — раз в 30 дней (lib/callhelper/trial.ts). Строка живёт
-- и после удаления колл-центра: иначе удалённый получил бы пробный заново.
-- Адрес хранится отпечатком, не открытым видом.

create table if not exists public.callhelper_trials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid references public.callhelper_orgs(id) on delete set null,
  company text not null check (length(company) between 1 and 160),
  inn text not null check (inn ~ '^[0-9]{10}([0-9]{2})?$'),
  phone text not null check (phone ~ '^[0-9]{11,15}$'),
  tg_id bigint,
  ip_hash text not null default '' check (length(ip_hash) <= 64),
  device text not null default '' check (length(device) <= 64)
);
create index if not exists callhelper_trials_inn_idx on public.callhelper_trials (inn);
create index if not exists callhelper_trials_phone_idx on public.callhelper_trials (phone);
create index if not exists callhelper_trials_at_idx on public.callhelper_trials (created_at desc);

alter table public.callhelper_trials enable row level security;
