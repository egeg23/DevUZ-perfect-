-- Сотрудники, сессии и журнал действий.
--
-- До этой миграции в проекте не было понятия «кто это сделал»: лид забирал
-- «@username» строкой, и связать её с человеком было нечем. Здесь появляется
-- сам человек, его вход и неизменяемый след того, что он делал.
--
-- Как и leads, все таблицы закрыты RLS без единой политики: читает и пишет
-- только сервер по service_role-ключу. Анонимный ключ, попав в браузер, не
-- даёт доступа ни к одной строке.

-- ---------------------------------------------------------------- staff
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Ключ входа. Telegram отдаёт числовой id при любом сообщении боту;
  -- username меняется, id — нет, поэтому опознаём по нему.
  telegram_user_id bigint not null unique,
  username text,
  display_name text not null,

  role text not null default 'manager' check (role in ('admin', 'manager')),

  -- Отключение вместо удаления: у ушедшего сотрудника остаются лиды,
  -- сообщения и строки аудита, и обнулять их ссылку нельзя.
  is_active boolean not null default true,
  disabled_at timestamptz
);

comment on table public.staff is
  'Сотрудники студии. Опознаются по числовому id Telegram — он не меняется, в отличие от username.';

-- ------------------------------------------------------- staff_sessions
create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- В куке лежат случайные байты, здесь — только их sha256. Утечка дампа
  -- базы не даёт войти ни под кем: восстановить токен из хеша нельзя.
  token_hash text not null unique,

  -- Два срока намеренно. Скользящий продлевается при каждом запросе, чтобы
  -- работающего человека не выкидывало посреди дня. Абсолютный не
  -- продлевается никогда — иначе одна украденная кука живёт вечно.
  expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,

  last_seen_at timestamptz not null default now(),
  ip inet,
  ua_hash text
);

create index if not exists staff_sessions_staff_idx
  on public.staff_sessions (staff_id);

-- Протухшие сессии чистятся по этому индексу; без него уборка превращается
-- в полный проход по таблице.
create index if not exists staff_sessions_expiry_idx
  on public.staff_sessions (absolute_expires_at);

comment on table public.staff_sessions is
  'Сессии панели. Хранится sha256 токена, не сам токен.';

-- --------------------------------------------------------- login_tokens
create table if not exists public.login_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now(),

  token_hash text not null unique,
  expires_at timestamptz not null,

  -- Одноразовость: ссылка, пересланная другому, уже не сработает.
  used_at timestamptz
);

create index if not exists login_tokens_expiry_idx
  on public.login_tokens (expires_at);

comment on table public.login_tokens is
  'Одноразовые ссылки входа, выдаваемые ботом по /login. Живут минуты.';

-- --------------------------------------------------------- audit_events
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),

  -- Актор может быть null: часть событий совершает не человек, а свип.
  actor_staff_id uuid references public.staff(id),
  action text not null,
  target_type text,
  target_id text,
  meta jsonb not null default '{}'::jsonb,
  ip inet
);

create index if not exists audit_events_created_idx
  on public.audit_events (created_at desc);

create index if not exists audit_events_actor_idx
  on public.audit_events (actor_staff_id, created_at desc);

comment on table public.audit_events is
  'Журнал действий сотрудников. Только добавление: правка и удаление запрещены триггером.';

-- Неизменяемость журнала.
--
-- Это единственная защита, которую не обходит даже сервер с service_role:
-- миграция применяется из SQL-редактора Supabase, поэтому таблица и триггер
-- принадлежат роли postgres, а service_role не может ни удалить триггер, ни
-- изменить таблицу. Журнал, который можно подчистить, ничего не доказывает —
-- а подчистка это ровно то, чем воспользовался бы человек, заметающий следы.
create or replace function public.audit_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events: только добавление (попытка %)', tg_op;
end;
$$;

drop trigger if exists audit_events_no_update on public.audit_events;
create trigger audit_events_no_update
  before update or delete on public.audit_events
  for each row execute function public.audit_events_append_only();

-- ------------------------------------------------------------------ RLS
alter table public.staff enable row level security;
alter table public.staff_sessions enable row level security;
alter table public.login_tokens enable row level security;
alter table public.audit_events enable row level security;
