-- Автопоиск компаний по картам: ниша + город → компании из Google Maps →
-- проверка сайта → пул касаний.
--
-- Владелец: «автоматизировать новый блок и способ генерации лидов». До
-- этого сайты для касаний вбивали руками — и ровно на этом всё и стояло.
--
-- Три таблицы. Кампания — что ищем и докуда дошли (страница выдачи,
-- вариант запроса). Места — всё, что вернули карты, до проверки: поиск
-- быстрый, а проверка сайта — секунды на каждый, и делается она потом,
-- понемногу. Расход — сколько запросов к API ушло за день: у Google
-- бесплатная тысяча в месяц, и потолок держит нас внутри неё.
create table if not exists public.maps_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id) on delete set null,
  niche text not null check (length(niche) between 2 and 120),
  city text not null check (length(city) between 2 and 80),
  active boolean not null default true,
  -- Какой вариант запроса сейчас: 0 — «ниша город», дальше — по районам.
  variant integer not null default 0,
  page_token text,
  exhausted boolean not null default false,
  last_run_at timestamptz,
  found integer not null default 0,
  added integer not null default 0
);

create table if not exists public.maps_places (
  place_id text primary key,
  campaign_id uuid references public.maps_campaigns(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  website text,
  phone text,
  address text,
  maps_url text,
  status text not null default 'new' check (status in ('new', 'added', 'skipped')),
  note text,
  processed_at timestamptz
);

create index if not exists maps_places_new_idx on public.maps_places (created_at) where status = 'new';

create table if not exists public.maps_usage (
  day date primary key,
  requests integer not null default 0
);

-- Касание знает, что пришло с карт: по месту не заводится второе, а в
-- списке видно, откуда компания.
alter table public.prospects add column if not exists place_id text;
create unique index if not exists prospects_place_id_key on public.prospects (place_id) where place_id is not null;

alter table public.maps_campaigns enable row level security;
alter table public.maps_places enable row level security;
alter table public.maps_usage enable row level security;

-- Прибавить запрос к дневному счёту — атомарно, как счётчик просмотров.
create or replace function public.bump_maps_usage(p_day date)
returns integer
language sql
set search_path = public
as $$
  insert into public.maps_usage (day, requests) values (p_day, 1)
  on conflict (day) do update set requests = maps_usage.requests + 1
  returning requests;
$$;

revoke all on function public.bump_maps_usage(date) from public, anon, authenticated;
grant execute on function public.bump_maps_usage(date) to service_role;
