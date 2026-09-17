-- Касания: проспект живёт в базе, а не в браузере менеджера.
--
-- До этого прогон аудитора складывался в состояние страницы: обновил
-- вкладку — и результаты исчезли. Подтвердить, написать и закрепить лид за
-- отправившим по такой памяти нельзя.
--
-- Очередь отправки отдельной таблицей, а не полем: писать будет не сайт, а
-- процесс скаута — у него пользовательская сессия Telegram. Сайт кладёт
-- задание, скаут забирает; ни один из них не ждёт другого.
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null,
  host text not null,
  label text,
  score smallint,
  findings jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '{}'::jsonb,
  /** Черновик из аудитора — тот, что собирается без модели. */
  draft text,
  /** Что менеджер отправит: подготовлено моделью и правлено им. */
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacting', 'sending', 'sent', 'failed', 'skipped')),
  /** Куда пишем: @username или телефон, выбранный из contacts. */
  target text,
  claimed_by uuid references public.staff(id) on delete set null,
  claimed_at timestamptz,
  sent_at timestamptz,
  /** Почему не ушло: текст ошибки Telegram или причина отказа. */
  failure text,
  lead_id uuid references public.leads(id) on delete set null,
  skip_reason text
);

-- Один сайт разбираем и пишем один раз: повторное касание того же домена
-- через неделю — это уже рассылка, а не касание.
create unique index if not exists prospects_host_once on public.prospects (host);

create index if not exists prospects_queue on public.prospects (claimed_at)
  where status = 'sending';

alter table public.prospects enable row level security;
