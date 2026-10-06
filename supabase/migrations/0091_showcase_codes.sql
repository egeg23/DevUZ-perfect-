-- Коды на 24 часа к закрытым витринам globalex: MAVERA и Golden House.
--
-- Владелец, 06.10.2026: «Сделай пароль из 5 цифр на 24 часа к Golden House и
-- MAVERA. Через 24 часа пароль не подходит уже».
--
-- Пять цифр — сто тысяч вариантов. Отпечаток такого кода в публичном
-- репозитории витрины перебирается за секунды, поэтому коды живут здесь, в
-- базе студии: таблица закрыта (RLS без политик), а витрина спрашивает
-- функцию showcase_code_check — «есть ли живой код», и только.
--
-- Перебор через форму упирается в предел: после 30 неудачных попыток за час
-- по витрине функция отвечает «нет» на всё, пока час не пройдёт. За сутки
-- жизни кода это не больше ~720 попыток из 100 000.
--
-- Постоянные коды студии (длинные, для владельца и менеджеров) — в коде
-- витрины, lib/showcase/access.ts; эта таблица их не касается.

create table if not exists public.showcase_codes (
  id uuid primary key default gen_random_uuid(),
  showcase text not null check (showcase in ('mavera', 'gh')),
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  note text
);

comment on table public.showcase_codes is
  'Коды на время к закрытым витринам globalex (5 цифр). code_hash — sha256 от «витрина:код». Проверка — showcase_code_check.';

create index if not exists showcase_codes_live on public.showcase_codes (showcase, expires_at);

alter table public.showcase_codes enable row level security;

create table if not exists public.showcase_code_failures (
  id bigserial primary key,
  showcase text not null,
  at timestamptz not null default now()
);

comment on table public.showcase_code_failures is
  'Неудачные попытки ввести код витрины — для предела перебора в showcase_code_check. Не больше 30 в час на витрину: дальше функция отказывает без записи.';

create index if not exists showcase_code_failures_at on public.showcase_code_failures (showcase, at);

alter table public.showcase_code_failures enable row level security;

create or replace function public.showcase_code_hash(p_showcase text, p_code text)
returns text
language sql immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(p_showcase || ':' || p_code, 'sha256'), 'hex')
$$;

-- Живой код — когда он перестанет подходить; иначе null. Без подробностей:
-- «нет кода», «истёк» и «слишком много попыток» снаружи неразличимы.
create or replace function public.showcase_code_check(p_showcase text, p_code text)
returns timestamptz
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_expires timestamptz;
  v_fails int;
begin
  if p_showcase is null or p_showcase not in ('mavera', 'gh') then return null; end if;
  if p_code is null or p_code !~ '^[0-9]{5}$' then return null; end if;

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
