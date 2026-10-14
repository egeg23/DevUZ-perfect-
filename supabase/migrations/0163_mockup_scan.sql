-- Скан макетов дважды в день (lib/admin/mockup-scan.ts).
--
-- Владелец, 14.10.2026: «Идентифицируй макеты по нашей ссылке, мы же
-- отправляем их вида devuz.studio/proto/*********, пусть бот сканирует 2 раза
-- в день и вносит туда эти данные».
--
-- source = 'scan' — строку внёс скан, а не запись в момент отправки.
-- quiet — найдено давно (больше 3 часов назад, но в окне 48 часов): акция
-- идёт, но клиенту бот не пишет ни условий, ни напоминаний.
-- scan_noted_at — найденное попало в итог скана владельцу.
alter table public.mockup_offers
  add column if not exists source text not null default 'live',
  add column if not exists quiet boolean not null default false,
  add column if not exists scan_noted_at timestamptz;

alter table public.mockup_offers drop constraint if exists mockup_offers_source_check;
alter table public.mockup_offers add constraint mockup_offers_source_check check (source in ('live', 'scan'));

comment on column public.mockup_offers.source is 'live — записано при отправке; scan — найдено сканом дважды в день.';
comment on column public.mockup_offers.quiet is 'Найдено сканом давно: клиенту бот не пишет ни условий, ни напоминаний.';

-- Слот скана: один раз на аккаунт (или «db» — база) и слот «2026-10-14@9».
create table if not exists public.mockup_scans (
  account text not null,
  slot text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  seen integer not null default 0,
  found integer not null default 0,
  error text,
  primary key (account, slot)
);

comment on table public.mockup_scans is
  'Скан макетов: какой аккаунт (или db — база) в каком слоте (09:00, 15:00 по Ташкенту) просмотрел сколько и нашёл сколько.';

alter table public.mockup_scans enable row level security;
