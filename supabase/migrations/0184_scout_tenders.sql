-- Тендеры — ещё одна функция скаута (владелец, 10.11.2026: «Делаем Парсинг
-- тендеров. Это еще одна функция скаута»).
--
-- Свип раз в полчаса читает открытые списки лотов площадок (xarid.uzex.uz,
-- etender.uzex.uz, Hayot Birja / XT-Xarid, Tender.asia) и кладёт сюда только
-- наши: разработка сайта, приложения, бота, информационной системы,
-- сопровождение ПО (lib/scout/tender-match.ts). Остальное не хранится.
--
-- Это открытые данные государственных и корпоративных закупок: название
-- лота, заказчик, цена, срок. Контактов людей нет.

create table if not exists public.scout_tenders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Откуда и какой лот. Пара уникальна: повторный проход не задваивает ленту.
  source text not null check (source in ('xarid', 'etender', 'hayot', 'tenderasia')),
  external_id text not null check (length(external_id) between 1 and 120),
  url text not null check (url ~ '^https://'),

  title text not null check (length(title) between 1 and 1000),
  customer text check (length(customer) <= 400),
  region text check (length(region) <= 200),
  kind text check (length(kind) <= 120),
  price numeric,
  currency text check (length(currency) <= 10),
  published_at timestamptz,
  deadline timestamptz,
  topics text[] not null default '{}',

  -- Работа с лотом: новый → взяли (кто) → подали / не наше.
  status text not null default 'new' check (status in ('new', 'taken', 'applied', 'skipped')),
  taken_by uuid references public.staff(id) on delete set null,
  taken_at timestamptz,

  -- Ушло ли в канал скаута.
  notified_at timestamptz
);

create unique index if not exists scout_tenders_lot_idx on public.scout_tenders (source, external_id);
create index if not exists scout_tenders_feed_idx on public.scout_tenders (status, created_at desc);
create index if not exists scout_tenders_deadline_idx on public.scout_tenders (deadline);

alter table public.scout_tenders enable row level security;
