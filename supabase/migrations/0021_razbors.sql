-- Разборы сайтов — публичный раздел и источник трафика из Google.
--
-- Владелец: «мы как студия выкатываем СЕО статьи с разборами ошибок сайтов
-- со скриншотами из разных категорий. Берём сайт, который выглядит не очень.
-- Скрин того что есть. Дальше — скрин того, как бы сделали мы.»
--
-- Разобранная компания не называется — решение владельца, и оно же снимает
-- юридический риск: чужой товарный знак в макете «как сделали бы мы» и
-- публичная критика по имени стоят дороже, чем приносят. Поэтому адрес
-- разобранного сайта в таблице есть (без него не перепроверить разбор и не
-- отличить дубль), но он служебный: публичная страница его не выбирает.
--
-- Один запрос — одна страница. Две наши страницы под один запрос означают,
-- что Google не может выбрать между ними и не показывает ни одну; отсюда
-- уникальные индексы по запросам, а не просто по адресам.

create table if not exists public.razbors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Пусто — черновик. Дата публикации отдельно от created_at: разбор
  -- готовится заранее, а выходит по расписанию, раз в день.
  published_at timestamptz,

  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'rejected')),

  -- ─── Что разбираем ──────────────────────────────────────────────────────
  -- Ниша и город: из них собирается запрос, и по ним же разборы связываются
  -- между собой перелинковкой.
  category text not null check (length(category) between 2 and 60),
  city text not null check (length(city) between 2 and 60),
  country text not null check (country in ('UZ', 'KZ', 'KG')),

  -- Служебное. Наружу не отдаётся никогда: ни в списке, ни в карточке.
  -- Нужно, чтобы перепроверить разбор через месяц и чтобы один и тот же
  -- сайт не разобрали дважды под разными запросами.
  source_url text not null,
  -- sha256 адреса: по нему ищем дубли, не читая сам адрес.
  source_hash text not null,

  -- Как компания названа в тексте: «интернет-магазин электроники в
  -- Ташкенте, около 400 товаров». Собирается из фактов аудита.
  label_ru text not null check (length(label_ru) between 5 and 200),
  label_uz text not null check (length(label_uz) between 5 and 200),

  -- ─── Под какой запрос ───────────────────────────────────────────────────
  -- Русская и узбекская версии — разные запросы, а не перевод: по-русски
  -- ищут «интернет-магазин под ключ Ташкент», по-узбекски «internet do'kon
  -- yaratish narxi». Перевод даёт текст, которого никто не ищет.
  query_ru text not null check (length(query_ru) between 5 and 120),
  query_uz text not null check (length(query_uz) between 5 and 120),

  slug_ru text not null check (slug_ru ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  slug_uz text not null check (slug_uz ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  -- ─── Содержание ─────────────────────────────────────────────────────────
  -- Отчёт аудита целиком: находки с их последствиями и сроками. Хранится
  -- как есть, чтобы через полгода было видно, на чём строился текст.
  report jsonb not null,

  title_ru text, description_ru text, body_ru text,
  title_uz text, description_uz text, body_uz text,

  -- Пути в приватном бакете. «До» — снимок живого сайта, «после» — наш
  -- макет. Один без другого бессмыслен, поэтому публикация требует обоих.
  shot_before text,
  shot_before_mobile text,
  shot_after text,
  shot_after_mobile text,
  -- Когда сделан снимок «до». Подписывается под картинкой: сайт могли
  -- починить, и разбор без даты выглядел бы враньём.
  shot_taken_at timestamptz,

  notes text check (notes is null or length(notes) <= 2000)
);

comment on table public.razbors is
  'Разборы сайтов для публичного раздела. Разобранная компания не называется; source_url служебный и наружу не отдаётся.';

-- Один запрос — одна страница. Ограничение на уровне базы, а не кода:
-- статью пишет ночная задача, и человека, который заметил бы дубль, рядом
-- нет.
create unique index if not exists razbors_query_ru_key on public.razbors (lower(query_ru));
create unique index if not exists razbors_query_uz_key on public.razbors (lower(query_uz));
create unique index if not exists razbors_slug_ru_key on public.razbors (slug_ru);
create unique index if not exists razbors_slug_uz_key on public.razbors (slug_uz);

-- Один сайт разбираем один раз. Без этого ночная задача, перебирая выдачу,
-- вернётся к тому же сайту через неделю и напишет второй разбор — и мы
-- получим две почти одинаковые страницы, то есть сами себе конкурента.
create unique index if not exists razbors_source_key on public.razbors (source_hash);

-- Лента раздела и перелинковка внутри категории.
create index if not exists razbors_published_idx
  on public.razbors (published_at desc) where status = 'published';
create index if not exists razbors_category_idx
  on public.razbors (category, country, published_at desc) where status = 'published';

-- Доступ — только через сервисный ключ, как у всех таблиц проекта.
alter table public.razbors enable row level security;
