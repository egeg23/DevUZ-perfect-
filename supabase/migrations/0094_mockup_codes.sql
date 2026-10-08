-- Раздел «Макеты»: пароль на 24 часа к любому прототипу devuz.studio/proto.
--
-- Владелец, 08.10.2026: «Надо сделать вкладку дополнительную у всех: макеты.
-- Туда сгрузи все макеты, которые мы делали в девуз. Там же генерируется
-- пароль на 24 часа для доступа клиента, после пароль протухает».
--
-- Пароль — пять цифр, в базе только sha256 от «proto:<id>:<пароль>»
-- (lib/proto/codes.ts). Паролей у макета может быть сколько угодно: каждый
-- клиент получает свой, и каждый живёт сутки. Доступ, который пароль дал,
-- кончается вместе с ним: кука в браузере клиента живёт до той же минуты,
-- а сервер на каждом открытии сверяет её с живой строкой здесь.
--
-- kind = 'team' — доступ команды: «Открыть» в панели. Такой строки клиент
-- не видит, пароль из неё никому не показывается, а открытия по ней не идут
-- в журнал показа: менеджер, проверивший макет, — не клиент.
--
-- protos.closed_at — с какой минуты макет открывается только по паролю.
-- Первый пароль закрывает открытый макет: иначе пароль ничего бы не значил.

alter table public.protos add column if not exists closed_at timestamptz;

comment on column public.protos.closed_at is
  'С какой минуты прототип открывается только по паролю (раздел «Макеты»). null — открыт по ссылке. Постоянный пароль владельца — facts.lock, отдельно.';

create table if not exists public.proto_codes (
  id uuid primary key default gen_random_uuid(),
  proto_id uuid not null references public.protos(id) on delete cascade,
  code_hash text not null,
  kind text not null default 'client' check (kind in ('client', 'team')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id)
);

comment on table public.proto_codes is
  'Пароли на время к прототипам (раздел «Макеты»). code_hash — sha256 от «proto:<id>:<пароль>». kind team — «Открыть» из панели, не в журнал показа.';

create index if not exists proto_codes_live on public.proto_codes (proto_id, expires_at);

alter table public.proto_codes enable row level security;

-- Витрина globalex: Engelberg закрыт тем же способом, что MAVERA и Golden
-- House, — так его закрыли 07.10.2026 прямо в базе. Здесь то же самое
-- записано в репозиторий, чтобы новая база получилась такой же. Повторный
-- запуск ничего не меняет.
alter table public.showcase_codes drop constraint if exists showcase_codes_showcase_check;
alter table public.showcase_codes
  add constraint showcase_codes_showcase_check check (showcase in ('mavera', 'gh', 'engelberg'));

create or replace function public.showcase_code_check(p_showcase text, p_code text)
returns timestamptz
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_expires timestamptz;
  v_fails int;
begin
  if p_showcase is null or p_showcase not in ('mavera', 'gh', 'engelberg') then return null; end if;
  if p_code is null or p_code !~ '^[0-9]{4,5}$' then return null; end if;

  select count(*) into v_fails
    from showcase_code_failures
   where showcase = p_showcase and at > now() - interval '1 hour';
  if v_fails >= 30 then return null; end if;

  select max(expires_at) into v_expires
    from showcase_codes
   where showcase = p_showcase
     and expires_at > now()
     and code_hash = showcase_code_hash(p_showcase, p_code);

  if v_expires is null then
    insert into showcase_code_failures (showcase) values (p_showcase);
  end if;
  return v_expires;
end
$$;

grant execute on function public.showcase_code_check(text, text) to anon, authenticated;
