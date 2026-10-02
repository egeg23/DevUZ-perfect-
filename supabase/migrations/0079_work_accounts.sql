-- Рабочие аккаунты Telegram: несколько отправителей касаний вместо одного.
--
-- Владелец, 02.10.2026: «У нас дополнительно будет 2 аккаунта, которые я бы
-- хотел подвязать для связи с клиентами». Первое касание с аккаунта — не
-- больше двух в час; три аккаунта — втрое больше писем без риска для
-- каждого из них.
--
-- Главный аккаунт (SCOUT_SESSION в .env) здесь не записан: он и читает чаты,
-- и пишет, и живёт как раньше. Строки этой таблицы — дополнительные, только
-- для писем и переписки. Подключаются из панели: номер → код из Telegram →
-- пароль, если включён. Сама сессия — ключ от аккаунта — в эту таблицу не
-- попадает: она лежит в хранилище Supabase (Vault, app.TG_SESSION_<id>), и
-- читает её только сервер.

create table if not exists public.tg_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id) on delete set null,
  label text not null,
  phone text not null,
  status text not null default 'code_requested'
    check (status in (
      'code_requested', 'awaiting_code', 'code_submitted',
      'awaiting_password', 'password_submitted',
      'active', 'paused', 'failed', 'removed'
    )),
  phone_code_hash text,
  login_code text,
  login_error text,
  tg_user_id bigint,
  tg_username text,
  tg_name text,
  hourly_cap smallint not null default 1 check (hourly_cap between 1 and 2),
  flood_until timestamptz,
  flood_note text,
  activated_at timestamptz,
  seen_at timestamptz
);

comment on table public.tg_accounts is
  'Дополнительные рабочие аккаунты Telegram для касаний и переписки. Сессия — в Vault (app.TG_SESSION_<id>), не здесь.';
comment on column public.tg_accounts.login_code is
  'Код входа из Telegram — живёт минуту: скаут стирает его, как только попробовал.';
comment on column public.tg_accounts.hourly_cap is
  'Первых касаний в час с этого аккаунта. Новый аккаунт — 1: свежий номер Telegram ограничивает быстрее.';
comment on column public.tg_accounts.flood_until is
  'Telegram ответил PEER_FLOOD или FLOOD_WAIT — до этого часа аккаунт первых писем не шлёт.';
comment on column public.tg_accounts.seen_at is
  'Когда скаут последний раз был на связи этим аккаунтом.';

alter table public.tg_accounts enable row level security;

alter table public.prospects
  add column if not exists sent_via text,
  add column if not exists dispatch_by text,
  add column if not exists dispatch_at timestamptz;

comment on column public.prospects.sent_via is
  'С какого рабочего аккаунта ушло касание: main — главный (SCOUT_SESSION), иначе id из tg_accounts. Ответы и правки идут с него же.';
comment on column public.prospects.dispatch_by is
  'Какой аккаунт взял письмо из очереди прямо сейчас — чтобы два аккаунта не написали одному человеку.';
