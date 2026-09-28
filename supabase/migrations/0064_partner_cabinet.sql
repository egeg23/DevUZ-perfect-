-- Кабинет партнёра на сайте: короткие ссылки, журнал переходов, вход через
-- Telegram.
--
-- Владелец, 28.09: «Сделай новым пунктом меню — зарабатывай с нами. Там
-- информация про нашу реферальную систему и отдельный вход для партнёров,
-- партнёрский кабинет. Авторизация через телеграм… Генерация уникальных
-- ссылок через сокращение, чтобы не попасть под спам. Обязательно трекинг
-- реферальных ссылок, чтобы в случае подписания договора он учитывался в
-- расчётах».

-- ── Короткая ссылка ──────────────────────────────────────────────────────
--
-- devuz.studio/r/<slug>. Slug — случайный, а не код партнёра: «?ref=» в
-- адресе и одинаковая ссылка в десяти чатах — ровно то, по чему антиспам
-- Telegram и Instagram режет посты. Своя короткая ссылка на каждый канал
-- выглядит как обычная ссылка на сайт.
--
-- target — куда ведёт: страница сайта («/services») или «bot» — в Telegram
-- с кодом партнёра. Партнёр пишет пост про кейсы — ведёт на кейсы, а не на
-- главную, откуда человек их не найдёт.
alter table public.partner_links
  add column if not exists slug text,
  add column if not exists target text not null default '/';

-- Существующим ссылкам — slug из того же алфавита, что генерирует код
-- (lib/partners/rules.ts, SLUG_ALPHABET), семь знаков.
update public.partner_links
set slug = (
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 7)
  where partner_links.id is not null
)
where slug is null;

-- Значение по умолчанию — чтобы вставка без slug (старый код во время
-- выкатки, ручная вставка) не падала. Код сайта ставит свой, из алфавита.
alter table public.partner_links
  alter column slug set default substr(md5(random()::text || clock_timestamp()::text), 1, 8);
alter table public.partner_links alter column slug set not null;
create unique index if not exists partner_links_slug_idx on public.partner_links (slug);
alter table public.partner_links drop constraint if exists partner_links_slug_check;
alter table public.partner_links
  add constraint partner_links_slug_check check (slug ~ '^[a-z0-9]{5,16}$');
alter table public.partner_links drop constraint if exists partner_links_target_check;
alter table public.partner_links
  add constraint partner_links_target_check check (target = 'bot' or target ~ '^/[a-z0-9/-]{0,60}$');

-- ── Переходы ─────────────────────────────────────────────────────────────
--
-- Раньше был только счётчик на ссылке: ни дня, ни откуда. По счётчику не
-- построить график и не отличить сто переходов за час от ста за месяц.
-- visitor — хеш «адрес + браузер + день»: сырого IP здесь нет, а повторные
-- открытия одним человеком за день считаются одним переходом.
create table if not exists public.partner_clicks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  link_id uuid references public.partner_links(id) on delete set null,
  -- short — короткая ссылка, site — ?ref= на сайте, bot — /start ref_ в боте.
  via text not null check (via in ('short', 'site', 'bot')),
  visitor text not null,
  referer_host text
);

create unique index if not exists partner_clicks_visitor_idx
  on public.partner_clicks (link_id, visitor);
create index if not exists partner_clicks_partner_idx
  on public.partner_clicks (partner_id, created_at desc);

-- ── Когда клиент пришёл по ссылке ────────────────────────────────────────
--
-- Владелец: «если клиент сделает заказ по ссылке партнёра в течение 30 дней
-- — мы учтём этого лида к нему». Кука хранит время перехода; при заявке оно
-- ложится сюда, и в карточке лида видно, за сколько дней до заявки человек
-- пришёл по ссылке.
alter table public.leads add column if not exists partner_ref_at timestamptz;

-- ── Вход в кабинет ───────────────────────────────────────────────────────
--
-- Одноразовая ссылка из бота → сессия на сайте. Хранятся хеши: утёкшая
-- таблица не даёт войти ни одной строкой.
create table if not exists public.partner_login_tokens (
  token_hash text primary key,
  partner_id uuid not null references public.partners(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.partner_sessions (
  token_hash text primary key,
  partner_id uuid not null references public.partners(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz
);

create index if not exists partner_sessions_partner_idx on public.partner_sessions (partner_id);

alter table public.partner_clicks enable row level security;
alter table public.partner_login_tokens enable row level security;
alter table public.partner_sessions enable row level security;

comment on table public.partner_clicks is
  'Переходы по ссылкам партнёров: день, канал (short/site/bot), хеш посетителя за день. Сырых IP нет.';
comment on table public.partner_sessions is
  'Сессии кабинета партнёра на сайте. Хеш токена из куки devuz_partner.';
