-- Касание, у которого есть автор и время, и недельный план на человека.
--
-- Менеджеры пишут со своих аккаунтов, а не с рабочего: подключить всех к
-- одной сессии Telegram физически нельзя. Значит, отправку за них делает не
-- скаут, и «сколько касаний сделал человек» по очереди отправки не считается
-- вовсе — там видно только то, что ушло от студии.
--
-- Отсюда две колонки. `claimed_by` для счёта не годится: она ставится ещё на
-- подготовке письма и остаётся, даже если письмо так и не ушло, — то есть
-- отвечает на «кто взял», а не на «кто написал». Считать по `sent_at` с
-- `claimed_by` значит записать касание тому, кто подготовил, и той минутой,
-- когда сработала очередь.
alter table public.prospects
  add column if not exists touched_by uuid references public.staff(id) on delete set null,
  add column if not exists touched_at timestamptz;

comment on column public.prospects.touched_by is
  'Кто на самом деле написал: нажавший «Отправить» или «Связался сам».';
comment on column public.prospects.touched_at is
  'Когда написали. По этой паре считается недельный план касаний.';

-- Прошлые касания не теряем: до этой миграции автором касания был тот, за
-- кем карточка закреплена, а временем — минута отправки. Для уже ушедших
-- писем это верно, и обнулять историю планов ради чистоты колонки незачем.
update public.prospects
   set touched_by = claimed_by,
       touched_at = sent_at
 where touched_at is null
   and sent_at is not null
   and claimed_by is not null;

create index if not exists prospects_touched
  on public.prospects (touched_by, touched_at)
  where touched_at is not null;

-- Компания без сайта — тоже касание.
--
-- Половина малого бизнеса в Ташкенте живёт в инстаграме, и именно им наш
-- разговор нужнее всего. Адреса у них нет, разбирать нечего, но написать
-- есть о чём — от ниши. Поэтому адрес и хост перестают быть обязательными.
alter table public.prospects
  alter column url drop not null,
  alter column host drop not null;

-- Уникальность хоста остаётся, но только там, где хост есть: иначе вторая
-- компания без сайта не завелась бы вовсе — два null в обычном уникальном
-- индексе Postgres пропускает, а вот две пустые строки нет, и соблазн
-- положить пустую строку вместо null появился бы на первой же правке.
drop index if exists prospects_host_once;
create unique index if not exists prospects_host_once
  on public.prospects (host)
  where host is not null;

comment on column public.prospects.niche is
  'Ниша компании. Для компаний без сайта — единственное, от чего пишется письмо.';

-- Недельный план касаний на человека.
--
-- Ставит руководитель или владелец в «Сотрудниках». Пусто — плана нет, и
-- панель ничего не требует: ноль и «не задан» это разные вещи, и рисовать
-- «осталось 0 из 0» тому, кому план не ставили, значит сказать неправду.
alter table public.staff
  add column if not exists touch_plan smallint
    check (touch_plan is null or (touch_plan >= 0 and touch_plan <= 500));

comment on column public.staff.touch_plan is
  'Сколько касаний в неделю ожидается от сотрудника. NULL — план не задан.';
