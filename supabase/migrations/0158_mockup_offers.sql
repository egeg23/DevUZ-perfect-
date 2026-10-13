-- Акция после макета: 48 часов на спецусловия (lib/admin/mockup-offer.ts).
--
-- Владелец, 13.10.2026: «когда мы отправили прототип, у клиента есть 48
-- часов чтобы использовать спец условия… бот отслеживал с рабочих аккаунтов
-- кому мы выслали макеты и каждый день в 13:00 по Ташкенту напоминал,
-- сколько времени осталось… Напоминание клиенту… дополнительно за 2 часа».
--
-- Строка — один макет у одного клиента: отсчёт с первой отправки ссылки,
-- повторная отправка срок не продлевает (уникальные индексы ниже).
create table if not exists public.mockup_offers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- «p:<id прототипа>» или «s:<проект витрины>» — как в разделе «Макеты».
  mockup_ref text not null check (mockup_ref ~ '^(p:[0-9a-f-]{36}|s:[a-z0-9-]{1,40})$'),
  mockup_name text not null default '',
  mockup_url text not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  -- Как звать клиента в списке: компания, сайт или адрес.
  client text not null default '',
  -- Кому ушло, если касания нет: id в Telegram или @адрес. Напоминаний таким нет.
  peer text,
  -- С какого рабочего аккаунта ушёл макет.
  account text,
  lang text not null default 'ru' check (lang in ('ru', 'uz')),
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'approved', 'declined')),
  announced_at timestamptz,
  daily_on date,
  final_at timestamptz,
  expired_noted_at timestamptz,
  password_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.staff(id) on delete set null,
  task_id uuid references public.staff_tasks(id) on delete set null
);

comment on table public.mockup_offers is
  'Акция 48 часов после отправки макета клиенту: срок, напоминания (13:00 и за 2 часа), утверждение макета.';

create unique index if not exists mockup_offers_prospect_ref
  on public.mockup_offers (prospect_id, mockup_ref) where prospect_id is not null;
create unique index if not exists mockup_offers_peer_ref
  on public.mockup_offers (peer, mockup_ref) where prospect_id is null and peer is not null;
create index if not exists mockup_offers_active
  on public.mockup_offers (expires_at) where status = 'active';

alter table public.mockup_offers enable row level security;
