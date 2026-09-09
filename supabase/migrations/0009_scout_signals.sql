-- Сигналы холодного поиска.
--
-- Скаут читает публичные чаты и складывает сюда только то, что похоже на
-- запрос на разработку. Отвечает оператор руками и в самом чате — сервис
-- никуда ничего не пишет.
--
-- Про объём хранимого. Здесь лежат данные людей, которые нам ничего не
-- отправляли: они писали в свой чат, а не нам. Поэтому храним минимум,
-- которого хватает оператору ответить, — ссылку на сообщение, короткую
-- выдержку и публичный @username. Ни профилей, ни истории переписки, ни
-- телефонов: всё это нам не нужно, чтобы написать человеку в том же чате,
-- а хранить чужое без нужды — отдельный риск, не связанный с пользой.
--
-- Срок хранения короткий и живёт прямо в строке. Неотвеченный сигнал через
-- три месяца бесполезен, а данные всё ещё чужие. Как только человек
-- ответил нам сам, он становится обычным лидом с обычным сроком, и связь с
-- сигналом остаётся ссылкой.

create table if not exists public.scout_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Откуда. chat_id и message_id вместе дают ссылку на сообщение.
  chat_id bigint not null,
  chat_title text,
  message_id bigint not null,
  message_link text,

  -- Кто написал. Числовой id нужен для перелива: когда человек позже
  -- напишет нашему боту, узнать его можно только по нему — username он к
  -- тому времени может сменить.
  author_telegram_id bigint,
  author_username text,

  -- Короткая выдержка, а не сообщение целиком.
  excerpt text not null check (length(excerpt) <= 600),

  topics text[] not null default '{}',

  -- Оценка модели: насколько это похоже на настоящий запрос.
  score smallint check (score between 0 and 100),
  category text,
  rationale text,

  status text not null default 'new' check (status in (
    'new', 'answered', 'ignored', 'converted'
  )),

  answered_by uuid references public.staff(id) on delete set null,
  answered_at timestamptz,

  -- Перелив состоялся: человек пришёл к нам сам.
  lead_id uuid references public.leads(id) on delete set null,

  -- Срок хранения в самой строке, а не в голове у того, кто писал уборку.
  expires_at timestamptz not null default now() + interval '90 days'
);

-- Один и тот же человек пишет в чат не раз. Пара «чат + сообщение»
-- уникальна, иначе перезапуск скаута задваивает ленту оператора.
create unique index if not exists scout_signals_message_idx
  on public.scout_signals (chat_id, message_id);

create index if not exists scout_signals_status_idx
  on public.scout_signals (status, created_at desc);

-- По этому индексу идёт перелив: ищем по автору, когда он пишет боту.
create index if not exists scout_signals_author_idx
  on public.scout_signals (author_telegram_id, created_at desc)
  where author_telegram_id is not null;

-- Уборка просроченного. Частичный индекс: то, что уже стало лидом, не
-- удаляется по сроку — у лида свой.
create index if not exists scout_signals_expiry_idx
  on public.scout_signals (expires_at)
  where lead_id is null;

comment on table public.scout_signals is
  'Сигналы холодного поиска в публичных чатах. Хранение 90 дней, минимум полей.';

alter table public.scout_signals enable row level security;
