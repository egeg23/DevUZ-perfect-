-- Заявки на покупку готовых продуктов.
--
-- Это не оплата и не должна ею притворяться. Покупатель — юридическое
-- лицо, платит безналом по счёту, и между «нажал купить» и «деньги
-- пришли» всегда стоит человек: выставить счёт, подписать договор,
-- передать код. Здесь фиксируется только начало этого пути.
--
-- Ни номеров карт, ни платёжных токенов эта таблица не хранит и хранить не
-- будет: их у нас нет и не появится, пока оплата идёт по счёту.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Номер, который покупатель называет в письме и в чате.
  request_no text unique,

  -- Что покупают. Slug, а не ссылка на таблицу: каталог живёт в коде, и
  -- заводить под него таблицу ради внешнего ключа значит держать две
  -- копии одного списка.
  product_slug text not null,

  -- Цена на момент заявки. Отдельной колонкой намеренно: каталог
  -- переписывается, а заявка должна помнить, о какой сумме договаривались.
  price_usd integer check (price_usd is null or price_usd >= 0),

  locale text not null default 'ru' check (locale in ('ru', 'en', 'uz', 'zh')),

  -- Реквизиты покупателя. Минимум, которого хватает выставить счёт.
  company text not null,
  tax_id text,
  country text,
  contact_name text not null,
  contact text not null,

  -- bank — безналичный расчёт по счёту, manager — «свяжитесь со мной,
  -- обсудим другой способ». Третьего нет: криптовалюту как средство
  -- платежа запрещает ПП-3832, наличный расчёт свыше лимита — УП-246.
  payment text not null default 'bank' check (payment in ('bank', 'manager')),

  comment text,

  status text not null default 'new' check (status in (
    'new', 'invoiced', 'paid', 'delivered', 'cancelled'
  )),

  assigned_staff_id uuid references public.staff(id) on delete set null,
  ip inet
);

create index if not exists orders_created_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status, created_at desc)
  where status <> 'cancelled';

create index if not exists orders_product_idx
  on public.orders (product_slug, created_at desc);

comment on table public.orders is
  'Заявки на покупку готовых продуктов. Оплата по счёту, платёжных данных здесь нет.';

alter table public.orders enable row level security;
