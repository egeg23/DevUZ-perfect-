-- Колокольчик в шапке панели (lib/admin/bell.ts, bell-store.ts).
--
-- Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
-- «Погнали по порядку». Каждое сообщение бота сотруднику (то же место, что
-- пуш, lib/admin/push-mirror.ts) — строкой у него в колокольчике; «✓ Сделано»
-- ставит done_at. Показ — 14 дней, хранение — 30 (чистит свип).
--
-- Строки читает и пишет только сервер ключом service_role: RLS включён,
-- политик нет.

create table if not exists public.staff_bell (
  id bigserial primary key,
  staff_id uuid not null references public.staff (id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '/admin/hq',
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create index if not exists staff_bell_staff_at on public.staff_bell (staff_id, created_at desc);
create index if not exists staff_bell_open on public.staff_bell (staff_id, created_at desc) where done_at is null;
create index if not exists staff_bell_created on public.staff_bell (created_at);

alter table public.staff_bell enable row level security;
revoke all on public.staff_bell from anon, authenticated;
