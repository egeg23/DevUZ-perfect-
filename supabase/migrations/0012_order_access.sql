-- Страница заказа для покупателя и то, из чего складывается счёт.
--
-- До этой миграции заявка была видна только менеджеру. Покупатель, нажав
-- «купить», получал номер — и дальше тишину: узнать, выставлен ли счёт,
-- принята ли оплата, где забирать файлы, он мог только спросив человека.
-- Здесь появляется адрес, по которому он видит это сам.
--
-- Ссылка защищена токеном, а не паролем. Пароль к одной покупке никто не
-- заводит и не помнит; неугадываемая ссылка — обычная практика для
-- одноразового доступа и единственная, которая не добавляет покупателю
-- работы. Отсюда требования к ней: 32 случайных байта, в базе только
-- sha256, перевыпуск по одной кнопке.

alter table public.orders
  -- sha256 токена в hex. Самого токена в базе нет: дамп базы не должен
  -- открывать чужие страницы заказов, а восстановить токен из хеша нельзя.
  add column if not exists access_token_hash text,
  add column if not exists access_issued_at timestamptz,

  -- Телеграм покупателя. Привязывается диплинком со страницы заказа;
  -- дальше каждая смена статуса уходит ему сообщением.
  add column if not exists buyer_chat_id bigint,

  -- Одноразовый код привязки для диплинка t.me/…?start=order_<код>.
  --
  -- Отдельный код, а не токен страницы заказа, и это не лишняя сущность.
  -- Payload диплинка проходит через серверы Telegram, оседает в апдейтах
  -- бота и остаётся в истории того чата, откуда по ссылке нажали. Будь там
  -- токен страницы — каждая такая копия открывала бы заказ целиком. Здесь
  -- утечка кода даёт ровно одно: чужие уведомления о статусе. Код гасится
  -- сразу после привязки, поэтому и это — один раз.
  add column if not exists bind_code text,

  -- Номер счёта отдельно от номера заявки. Заявка — наш внутренний след,
  -- счёт — документ с собственной нумерацией, которую бухгалтерия ведёт
  -- сквозной по году.
  add column if not exists invoice_no text,
  add column if not exists invoice_issued_at timestamptz,

  -- Оплату подтверждает человек, глядя в выписку. paid_ref — то, чем эта
  -- строка выписки опознаётся: без неё «оплачено» это чьё-то утверждение,
  -- а не запись.
  add column if not exists paid_at timestamptz,
  add column if not exists paid_ref text,
  add column if not exists paid_by uuid references public.staff(id) on delete set null,

  add column if not exists delivered_at timestamptz,

  -- Отзыв доступа к файлам — инкремент этого числа. Токен выдачи
  -- подписывает в том числе его, поэтому все ранее выданные ссылки
  -- перестают действовать одним UPDATE, без похода в хранилище.
  add column if not exists entitlement_version integer not null default 1;

-- Уникальность, а не просто индекс: два заказа с одним хешем означали бы,
-- что одна ссылка открывает два чужих заказа.
create unique index if not exists orders_access_token_idx
  on public.orders (access_token_hash)
  where access_token_hash is not null;

create unique index if not exists orders_invoice_no_idx
  on public.orders (invoice_no)
  where invoice_no is not null;

-- Привязка телеграма покупателя ищется по chat_id при каждом его сообщении.
create index if not exists orders_buyer_chat_idx
  on public.orders (buyer_chat_id)
  where buyer_chat_id is not null;

create unique index if not exists orders_bind_code_idx
  on public.orders (bind_code)
  where bind_code is not null;

-- Сквозная нумерация счетов.
--
-- Последовательность, а не max(invoice_no)+1: второй вариант при двух
-- менеджерах, нажавших «выставить счёт» одновременно, выдаёт один номер
-- дважды, и это обнаруживается уже в бухгалтерии. Последовательность не
-- откатывается при сбое транзакции — в нумерации появятся дыры, и это
-- правильный компромисс: пропущенный номер объясним, повторившийся — нет.
create sequence if not exists public.invoice_no_seq as bigint start 1;

comment on column public.orders.access_token_hash is
  'sha256 токена страницы заказа. Сам токен покупатель получает один раз; перевыпуск затирает старый.';
comment on column public.orders.bind_code is
  'Одноразовый код диплинка Telegram. Гасится при привязке; утечка даёт только чужие уведомления, не доступ к заказу.';
comment on column public.orders.entitlement_version is
  'Версия права на скачивание. Инкремент отзывает все выданные ссылки.';
comment on column public.orders.paid_ref is
  'Чем строка банковской выписки опознаётся. Без неё «оплачено» — утверждение, а не запись.';

-- Выдача следующего номера счёта.
--
-- Функция, а не nextval из кода: клиент Supabase умеет звать rpc, но не
-- умеет дёргать последовательность напрямую, и заводить ради этого вьюху
-- было бы обходным путём там, где нужен один запрос.
--
-- Счётчик сквозной и не сбрасывается в январе: номера остаются
-- уникальными и возрастающими, а это единственное, что обязано
-- выполняться. Если бухгалтерия попросит нумерацию с начала года — это
-- одна команда `alter sequence public.invoice_no_seq restart` первого
-- января, а не переделка кода.
create or replace function public.next_invoice_no()
returns text
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select 'СЧ-'
      || extract(year from now() at time zone 'Asia/Tashkent')::int::text
      || '-'
      || lpad(nextval('public.invoice_no_seq')::text, 4, '0');
$$;

-- Функция вызывается только сервисной ролью, как и всё остальное здесь.
revoke execute on function public.next_invoice_no() from public;
revoke execute on function public.next_invoice_no() from anon, authenticated;
