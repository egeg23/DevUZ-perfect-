-- ИИ-сотрудник «Блогеры»: агент ищет блогеров для партнёрской программы,
-- оценивает их аудиторию и готовит первое сообщение (docs/ai-staff/bloggers.md).
--
-- Владелец, 11.10.2026: «Нам нужен агент, который бы общался в инстаграм,
-- писал блоггерам по партнерской программе, сам бы их собирал, просил,
-- оценивал аудиторию».
--
-- Писать первым в Instagram официальный API не даёт, неофициальную
-- автоматизацию не делаем. Поэтому: есть Telegram — «Здравствуйте» уходит с
-- рабочего аккаунта по его правилам; есть почта или только Instagram —
-- агент готовит текст, менеджер отправляет его сам в одно касание.
--
-- RLS включён без политик, как во всей базе: читает и пишет только сервер.

create table if not exists public.bloggers (
  id uuid primary key default gen_random_uuid(),
  -- Ник в Instagram без @, строчными. По нему блогер один на всю базу.
  handle text not null unique check (handle ~ '^[a-z0-9._]{1,30}$'),
  name text not null default '',
  bio text not null default '',
  website text,
  followers integer,
  following integer,
  posts integer,
  -- Средние по последним постам и вовлечённость, % от подписчиков.
  avg_likes numeric,
  avg_comments numeric,
  engagement numeric,
  posts_per_week numeric,
  last_post_at timestamptz,
  -- Что о блогере сказала модель: темы, язык, город, подходит ли аудитория.
  topics text[] not null default '{}',
  lang text,
  city text,
  fit integer check (fit between 0 and 10),
  why text,
  -- Куда писать: найденные в шапке профиля, на его сайте или в выдаче поиска.
  telegram text,
  email text,
  -- Откуда пришёл: поиск Firecrawl, Business Discovery, руками из панели.
  source text not null default 'manual' check (source in ('firecrawl', 'ig', 'manual')),
  source_url text,
  found_query text,
  -- Откуда цифры: Business Discovery (точные) или выдача поиска (только подписчики).
  metrics_from text check (metrics_from in ('ig', 'search')),
  score integer check (score between 0 and 100),
  score_notes text,
  status text not null default 'found' check (status in (
    'found',       -- нашли, ещё не оценили
    'ready',       -- подходит, ждёт первого сообщения
    'skipped',     -- не подходит по оценке или его убрал человек
    'queued',      -- «Здравствуйте» в очереди рабочего аккаунта
    'contacted',   -- первое сообщение ушло
    'replied',     -- ответил
    'stats',       -- ждём скриншоты статистики
    'agreed',      -- согласен, ждёт заведения партнёром
    'partner',     -- заведён партнёром
    'declined',    -- отказался
    'unreachable'  -- написать некуда или адрес не существует
  )),
  channel text check (channel in ('telegram', 'email', 'direct')),
  pitch text,
  pitch_lang text check (pitch_lang in ('ru', 'uz')),
  contacted_at timestamptz,
  contacted_by uuid,
  replied_at timestamptz,
  -- Instagram-scoped id собеседника в Direct студии: появляется, когда блогер написал.
  ig_scoped_id text unique,
  messages jsonb not null default '[]'::jsonb,
  -- Аудитория по скриншотам статистики: города, возраст, охваты.
  audience jsonb,
  audience_score integer check (audience_score between 0 and 100),
  audience_notes text,
  partner_id uuid references public.partners (id) on delete set null,
  note text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.bloggers is
  'ИИ-сотрудник «Блогеры»: найденные блогеры, оценка аудитории, первое сообщение и переписка (docs/ai-staff/bloggers.md).';
create index if not exists bloggers_status on public.bloggers (status, score desc nulls last);
create index if not exists bloggers_created on public.bloggers (created_at desc);

create table if not exists public.blogger_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.blogger_settings is
  'ИИ-сотрудник «Блогеры»: включён ли, квоты на день, пороги оценки, запросы поиска.';

alter table public.bloggers enable row level security;
alter table public.blogger_settings enable row level security;

-- Расход Firecrawl на поиск блогеров идёт из того же дневного лимита.
alter table public.firecrawl_usage drop constraint if exists firecrawl_usage_kind_check;
alter table public.firecrawl_usage add constraint firecrawl_usage_kind_check
  check (kind in ('search', 'contacts', 'bloggers'));
