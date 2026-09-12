-- Выдача купленного кода.
--
-- Покупателю не даётся ссылка Supabase напрямую, и у этого решения теперь
-- есть подтверждение в документации, а не догадка. Подписанная ссылка
-- Supabase:
--
--   * не отзывается ничем, кроме обращения в поддержку — она подписана
--     отдельным внутренним ключом и переживает ротацию любых ключей проекта;
--   * может пережить собственный срок годности: ответ по ней оседает в CDN,
--     и кэш не сбрасывается вместе с истечением токена.
--
-- Значит выданная один раз ссылка — это выданный навсегда доступ, и строить
-- на ней выдачу нельзя. Строим иначе: покупатель держит наш токен, каждый
-- клик проверяется заново, и только после проверки выпускается подписанная
-- ссылка на минуту. Отзыв — инкремент orders.entitlement_version: наш токен
-- умирает мгновенно, а уже выпущенные ссылки Supabase живут минуту и
-- достанутся только тому, кто их и получил.

create table if not exists public.store_releases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Каталог живёт в коде (content/products.ts), поэтому здесь slug, а не
  -- внешний ключ: таблица под каталог означала бы две копии одного списка.
  product_slug text not null,

  -- Версия так, как её называет владелец: «1.4.0», «2026-09-12».
  -- Свободная строка намеренно — навязывать semver коду, который продаётся
  -- целиком и редко, значит выдумать правило ради правила.
  version text not null,

  storage_bucket text not null,
  storage_path text not null,

  -- Проверяются при регистрации релиза обращением к хранилищу. Размер
  -- показывается покупателю до нажатия: двести мегабайт на мобильном
  -- интернете — это решение, которое он должен принимать осознанно.
  bytes bigint check (bytes is null or bytes >= 0),

  -- Контрольная сумма архива. Не проверяется автоматически (файл заливает
  -- человек со своего ноутбука), но печатается рядом со ссылкой: это
  -- единственный способ для покупателя убедиться, что он скачал то же
  -- самое, что мы отдали.
  sha256 text,

  notes text,
  created_by uuid references public.staff(id) on delete set null,
  released_at timestamptz not null default now(),
  is_current boolean not null default true
);

-- Актуальный релиз у продукта ровно один: «какой файл сейчас отдаём» не
-- должно быть вопросом с двумя ответами.
create unique index if not exists store_releases_current_idx
  on public.store_releases (product_slug)
  where is_current;

create index if not exists store_releases_product_idx
  on public.store_releases (product_slug, released_at desc);

comment on table public.store_releases is
  'Файлы продуктов в приватном бакете. Заливает владелец напрямую, панель хранит путь и проверяет объект.';

-- Журнал выдач.
--
-- Пишется и на отказ тоже, с причиной. Журнал, в котором есть только
-- удачные скачивания, не отвечает на единственный вопрос, ради которого
-- в него полезут: почему у покупателя не скачалось.
create table if not exists public.store_downloads (
  id bigserial primary key,
  at timestamptz not null default now(),
  order_id uuid not null references public.orders(id) on delete cascade,
  release_id uuid references public.store_releases(id) on delete set null,
  ok boolean not null,
  reason text,

  -- Считается ли эта выдача в лимитах.
  --
  -- Повторные клики по тому же файлу в течение десяти минут — одна выдача.
  -- Без этого оборванная закачка двухсот мегабайт на мобильном интернете
  -- съедала бы дневной лимит у человека, который уже заплатил, и он
  -- оставался бы без купленного до завтра.
  counted boolean not null default true,

  ip inet,
  ua_hash text
);

-- Лимиты считаются по этому индексу: «сколько выдач у заказа за сутки» и
-- «сколько всего».
create index if not exists store_downloads_order_idx
  on public.store_downloads (order_id, at desc);

comment on column public.store_downloads.counted is
  'Считается ли выдача в лимитах. Повторный клик по тому же файлу в течение 10 минут — не считается.';

comment on table public.store_downloads is
  'Каждая попытка скачать, включая отказы с причиной. По ней же считаются лимиты.';

alter table public.store_releases enable row level security;
alter table public.store_downloads enable row level security;
