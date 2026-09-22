-- Честная очередь на тёплые лиды.
--
-- Владелец: «есть ушлый менеджер, который всех лидов берёт на себя, а в
-- холодную не работает вообще». Карточка нового лида уходила всей команде
-- разом, и брал её тот, кто быстрее нажал. Быстрее всех нажимает тот, кто
-- ничем другим не занят.
--
-- Теперь новый лид сначала предлагается одному человеку — тому, у кого за
-- месяц меньше всех, — и только он может взять его в ближайшие 30 минут.
-- Не взял — лид уходит следующему, и так по кругу. Когда круг пройден,
-- лид открывается всем.
--
-- Отдельная таблица, а не поля у лида: у одного лида предложений несколько,
-- по одному на каждого в очереди, и история нужна целиком — по пропущенным
-- предложениям считается, кому давать следующий лид.
create table if not exists public.lead_offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- null — предложение действует; дальше одно из трёх:
  --   taken     — взял тот, кому предложили;
  --   expired   — 30 минут вышли, лид ушёл следующему;
  --   cancelled — лида забрал владелец вне очереди.
  outcome text check (outcome in ('taken', 'expired', 'cancelled')),
  closed_at timestamptz
);

-- Действующее предложение у лида одно. Индекс — не удобство, а гарантия:
-- два одновременных прохода свипа не выдадут один лид двоим.
create unique index if not exists lead_offers_one_open
  on public.lead_offers (lead_id)
  where outcome is null;

-- То, что ищет свип каждые пять минут: истёкшие и ещё не закрытые.
create index if not exists lead_offers_due
  on public.lead_offers (expires_at)
  where outcome is null;

-- Пропущенные за месяц — ими наравне со взятыми решается, кому следующий.
create index if not exists lead_offers_by_staff
  on public.lead_offers (staff_id, closed_at)
  where outcome = 'expired';

alter table public.lead_offers enable row level security;

comment on table public.lead_offers is
  'Очередь на тёплые лиды: кому и до какого времени предложен лид, чем кончилось.';

-- Когда лид открыт всем.
--
-- Пока очередь идёт, взять лид может только тот, кому он сейчас предложен.
-- Без отдельной отметки «круг пройден» нельзя отличить лид в очереди от
-- лида, который просто никому не предлагался, — и в промежутке между
-- закрытием одного предложения и открытием следующего любой мог бы
-- забрать лид вне очереди.
alter table public.leads
  add column if not exists queue_opened_at timestamptz;

comment on column public.leads.queue_opened_at is
  'Очередь по лиду пройдена или снята — с этой минуты взять его может любой.';
