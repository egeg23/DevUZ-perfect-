-- Касания: «Клиент отказался» / «Игнорирует», поток «Получать лиды» и
-- разовые объявления команде.
--
-- Владелец, 29.09: «если лид отказался к примеру, который был в касаниях —
-- сделать кнопку в тг и на сайте — клиент отказался / игнорирует. Чтобы он
-- вылетал из очереди. Сделать кнопку — получать лиды (в тг). Туда будут
-- прилетать компании без ограничений, пока не нажмут кнопку — не получать
-- лиды».

-- 1. Касание закрыто человеком.
--
-- Отдельными полями, а не новым статусом: `status` отвечает на «ушло ли
-- первое сообщение» (0029_outreach_talk) — по нему считаются «два в час»,
-- недельный план и порция, и отказ клиента не делает письмо неотправленным.
alter table public.prospects
  add column if not exists closed_reason text check (closed_reason in ('refused', 'ignored')),
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.staff(id) on delete set null;

comment on column public.prospects.closed_reason is
  'Касание закрыто человеком: refused — клиент отказался, ignored — не отвечает. Дожима и ответов модели больше нет.';

-- 2. Поток: строки в той же таблице, что и порция.
--
-- Одна таблица — одна уникальность (day, prospect_id): компания не попадёт
-- одновременно в чью-то порцию и в чей-то поток, а вечерний возврат в пул
-- и кнопки бота работают для обеих одинаково. Цель дня считается только по
-- порции (lib/admin/portion → tallyPortion).
alter table public.touch_portions
  add column if not exists source text not null default 'portion' check (source in ('portion', 'stream'));

comment on column public.touch_portions.source is
  'portion — порция дня и её замены; stream — поток «Получать лиды», сверх порции.';

-- Кто сейчас получает поток. Строка есть — включён.
create table if not exists public.lead_streams (
  staff_id uuid primary key references public.staff(id) on delete cascade,
  started_at timestamptz not null default now(),
  -- Замок подачи: кнопка в боте и свип не наливают поток одновременно.
  feeding_at timestamptz,
  -- Когда сказали «в пуле пусто» — чтобы не повторять это каждые пять минут.
  empty_told_at timestamptz
);

alter table public.lead_streams enable row level security;

-- 3. Разовые объявления команде (lib/admin/team-news.ts): кому какое ушло.
-- Первичный ключ — это и есть «одно объявление — один раз»: два прохода
-- свипа не отправят его человеку дважды.
create table if not exists public.team_news_sent (
  news_id text not null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (news_id, staff_id)
);

alter table public.team_news_sent enable row level security;
