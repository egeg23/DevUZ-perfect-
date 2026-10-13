-- Пользователи бота студии и рассылка им с «Главной» (lib/admin/bot-users.ts).
--
-- Владелец, 13.10.2026: «это именно рассылка своего текста через бот
-- сотрудникам или пользователям, раздели их». До этого бот помнил
-- собеседников только в памяти процесса: chat id оставался у партнёров,
-- переходов по партнёрской ссылке и покупателей магазина. Теперь каждый,
-- кто сам написал боту в личку, — строка здесь (вебхук, noteBotUser).

create table if not exists public.bot_users (
  chat_id bigint primary key,
  username text,
  first_name text,
  last_name text,
  language_code text,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  -- Ответ Telegram 403 на рассылку: заблокировал бота. Больше не шлём,
  -- пока сам не напишет снова (вебхук снимает отметку).
  blocked_at timestamptz
);

comment on table public.bot_users is
  'Кто сам писал боту студии в личку: chat id, имя, язык, когда; blocked_at — заблокировал бота (403).';

create index if not exists bot_users_last on public.bot_users (last_at desc);

alter table public.bot_users enable row level security;

-- Уже известные собеседники бота: они начинали разговор сами (/start).
insert into public.bot_users (chat_id, first_at, last_at)
select telegram_user_id, created_at, created_at from public.partners where telegram_user_id is not null
on conflict (chat_id) do nothing;
insert into public.bot_users (chat_id, first_at, last_at)
select chat_id, seen_at, seen_at from public.partner_touches
on conflict (chat_id) do nothing;
insert into public.bot_users (chat_id, first_at, last_at)
select distinct on (buyer_chat_id) buyer_chat_id, created_at, created_at from public.orders where buyer_chat_id is not null
order by buyer_chat_id, created_at
on conflict (chat_id) do nothing;
insert into public.bot_users (chat_id, first_at, last_at)
select chat_id, claimed_at, claimed_at from public.discount_claims
on conflict (chat_id) do nothing;

-- Рассылка: кому — сотрудникам или пользователям бота.
alter table public.staff_broadcasts
  add column if not exists kind text not null default 'staff' check (kind in ('staff', 'users')),
  -- Сегмент пользователей: all, partners, buyers, clients.
  add column if not exists segment text,
  -- Пользователи — по chat id, замороженные при отправке.
  add column if not exists chats bigint[] not null default '{}';

alter table public.staff_broadcasts drop constraint if exists staff_broadcasts_audience_check;
alter table public.staff_broadcasts
  add constraint staff_broadcasts_audience_check check (audience in ('all', 'roles', 'pick', 'users'));

-- Доставка пользователям: строка до сообщения (claim), потом исход.
create table if not exists public.bot_broadcast_sent (
  broadcast_id uuid not null references public.staff_broadcasts(id) on delete cascade,
  chat_id bigint not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'blocked')),
  attempts integer not null default 1,
  at timestamptz not null default now(),
  primary key (broadcast_id, chat_id)
);

alter table public.bot_broadcast_sent enable row level security;
