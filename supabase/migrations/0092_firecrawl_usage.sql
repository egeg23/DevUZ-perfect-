-- Расход Firecrawl: поиск лидов для автопрогона касаний.
--
-- Владелец, 06.10.2026: «1000 запросов по firecrawl бесплатно… Растяни на 30
-- дней равномерно». Дневной лимит считает сервер (lib/firecrawl.ts →
-- dailyAllowance): остаток на счёте Firecrawl делится на дни до конца
-- периода. Здесь — сколько потрачено и на что: от этой суммы за сегодня
-- считается, сколько ещё можно, и по ней же отчёт в 18:00 говорит, что
-- поиск дал.
--
-- kind = 'search'   — поиск новых компаний; target — запрос («стоматология
--                     Самарканд»), found — сколько новых сайтов ушло в
--                     очередь проверки (maps_places, place_id «fc:<домен>»).
-- kind = 'contacts' — страница компании из пула, у которой не было пути в
--                     Telegram; target — домен, found = 1, если после неё
--                     нашёлся @адрес или мобильный номер. Один домен — одна
--                     попытка: повторно его не открываем.

create table if not exists public.firecrawl_usage (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('search', 'contacts')),
  credits integer not null default 0 check (credits >= 0),
  target text not null,
  found integer not null default 0 check (found >= 0),
  note text
);

comment on table public.firecrawl_usage is
  'Расход Firecrawl на поиск лидов автопрогона: что искали или чью страницу открыли, сколько кредитов ушло и что нашлось. Дневной лимит — lib/firecrawl.ts.';

create index if not exists firecrawl_usage_at on public.firecrawl_usage (at);
create index if not exists firecrawl_usage_target on public.firecrawl_usage (kind, target);

alter table public.firecrawl_usage enable row level security;
