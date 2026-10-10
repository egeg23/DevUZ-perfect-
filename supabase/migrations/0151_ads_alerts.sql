-- Автопилот рекламы: тревоги — то, что надо знать сразу, а не через неделю.
--
-- Кампания встала, расход вырос вдвое без заявок, площадка отклонила
-- объявление, минус-слово режет ключ. Пишет lib/ads/run.ts после забора
-- отчётов; каждая тревога уходит в Telegram один раз (открытая с тем же
-- ключом не заводится второй раз) и снимается сама, когда причины больше нет.
create table if not exists public.ads_alerts (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.ads_accounts (id) on delete cascade,
  kind text not null check (kind in ('stall', 'spike', 'no_leads', 'rejected', 'conflict')),
  key text not null,
  -- Цифры и названия: текст собирается на языке читающего (lib/ads/alerts.ts).
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index if not exists ads_alerts_open on public.ads_alerts (account_id, key) where resolved_at is null;
create index if not exists ads_alerts_account on public.ads_alerts (account_id, created_at desc);
alter table public.ads_alerts enable row level security;
