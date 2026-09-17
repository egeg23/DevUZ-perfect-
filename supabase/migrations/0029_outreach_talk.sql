-- Первичку по холодному касанию ведёт модель, лид остаётся за человеком.
--
-- Владелец: «пусть ИИ подхватывает первичку, если она найдена через поиск,
-- и ведёт переписку по лиду. Но лид фиксируется за тем, кто нажал кнопку с
-- отправкой сообщения».
--
-- Отсюда две вещи, которые нельзя перепутать. Переписку ведёт модель — и
-- пишет она с того же рабочего аккаунта, с которого ушло первое сообщение,
-- потому что для адресата это один и тот же собеседник. Лид при этом не
-- переназначается никогда: `assigned_staff_id` ставится один раз, в момент
-- нажатия «Отправить», и ни один путь в коде его не меняет.

-- Переписка с проспектом — обе стороны в одной таблице.
--
-- Разделять входящие и исходящие по двум таблицам было бы аккуратнее по
-- полям, но переписка — это одна лента, и собирать её джойном двух таблиц
-- ради чистоты значит каждый раз рисковать порядком реплик. Порядок здесь
-- и есть содержание: модель получает историю такой, какой её видит человек.
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  /** 'in' — написал проспект, 'out' — написали мы (человек или модель). */
  direction text not null check (direction in ('in', 'out')),
  /** Кто автор исходящего: 'staff' — человек, 'ai' — модель. */
  author text not null default 'ai' check (author in ('staff', 'ai')),
  body text not null check (length(body) between 1 and 4000),

  -- Жизнь исходящего: его ещё надо доставить, и доставляет не сайт.
  status text not null default 'done'
    check (status in ('queued', 'sent', 'failed', 'done')),
  sent_at timestamptz,
  failure text,

  -- Жизнь входящего: на него ещё надо ответить.
  answered_at timestamptz
);

-- Очередь исходящих: скаут забирает старшее из ожидающих.
create index if not exists outreach_messages_queue on public.outreach_messages (created_at)
  where direction = 'out' and status = 'queued';

-- Входящие без ответа: их разбирает свип.
create index if not exists outreach_messages_unanswered on public.outreach_messages (created_at)
  where direction = 'in' and answered_at is null;

create index if not exists outreach_messages_thread on public.outreach_messages (prospect_id, created_at);

alter table public.outreach_messages enable row level security;

-- Состояние разговора живёт на проспекте, а не в статусе первого касания:
-- `status` отвечает на вопрос «ушло ли первое сообщение» и после отправки
-- меняться не должен, иначе очередь отправки перестанет его узнавать.
alter table public.prospects add column if not exists ai_handling boolean not null default true;
alter table public.prospects add column if not exists handover_reason text;
alter table public.prospects add column if not exists replied_at timestamptz;

-- Номер заявки на лиде касания: по нему квалификация допишется в этот лид,
-- а не заведёт второй. Без него модель, закончив первичку, создала бы
-- дубль — уже ни за кем не закреплённый.
alter table public.prospects add column if not exists request_no text;
