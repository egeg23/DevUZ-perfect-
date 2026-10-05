-- Автопрогон касаний: ниша недели, 20 писем в день, ответы — команде.
--
-- Владелец, 05.10.2026: «Делай авто прогон сам по нишам — 1 неделя = 1
-- ниша. Лидов, которые ответят на сообщения от тебя на наших аккаунтах, —
-- закидывай сразу через тг бота к менеджерам, чтобы взяли в работу. В день
-- ты делаешь 20 касаний (написано в тг, не меньше), можешь с двух аккаунтов
-- это делать или с трёх».
--
-- Касание автопрогона — ничьё (claimed_by пусто), пока клиент не ответит:
-- тогда заводится лид и идёт в очередь на тёплые лиды, а переписка — за тем,
-- кто его взял (lib/admin/talk-follows-lead.ts).

alter table public.prospects
  add column if not exists autopilot_at timestamptz,
  add column if not exists autopilot_note text,
  add column if not exists autopilot_replied_at timestamptz;

comment on column public.prospects.autopilot_at is
  'Когда карточку взял автопрогон. Пусто — карточка его не касалась. Порция дня и поток такие карточки не выдают.';
comment on column public.prospects.autopilot_note is
  'Почему автопрогон не написал: проверка по факту ничего не подтвердила, сайт не открылся, письмо не прошло проверку.';
comment on column public.prospects.autopilot_replied_at is
  'Первый ответ клиента на касание автопрогона: в этот момент лид ушёл команде. Один раз на касание.';

create index if not exists prospects_autopilot_at on public.prospects (autopilot_at) where autopilot_at is not null;

-- Ниша недели. Неделя — с понедельника по Ташкенту. Строка заводится в
-- первый проход свипа новой недели и дальше не меняется: история того, что
-- когда прогоняли, остаётся, даже если порядок ниш в коде поменяют.
create table if not exists public.autopilot_weeks (
  week date primary key,
  niche text not null,
  created_at timestamptz not null default now()
);

comment on table public.autopilot_weeks is
  'Автопрогон касаний: какая ниша на какой неделе (week — понедельник по Ташкенту, niche — ключ из lib/admin/autopilot.ts).';

alter table public.autopilot_weeks enable row level security;

-- Включён ли автопрогон и сколько писем в день. Одна строка.
create table if not exists public.autopilot_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  daily_target smallint not null default 20 check (daily_target between 0 and 60),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff(id) on delete set null
);

comment on table public.autopilot_settings is
  'Автопрогон касаний: включён ли и сколько писем в день должно уйти в Telegram. Одна строка (id = true).';

alter table public.autopilot_settings enable row level security;

insert into public.autopilot_settings (id) values (true) on conflict (id) do nothing;
