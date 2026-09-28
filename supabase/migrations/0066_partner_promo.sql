-- Промо-материалы для партнёров.
--
-- Владелец, 28.09: «давай сделаем раздел „промо материалы“ для реферальных
-- партнёров, чтобы они могли брать оттуда видео, например, для залива в
-- соцсети. Сделаем что-то вроде хранилища внутри, пусть распространяют».
--
-- Владелец загружает ролики и картинки в панели (/admin/partners/promo),
-- партнёр в кабинете смотрит, скачивает и копирует подпись к посту, в
-- которую уже вставлена его короткая ссылка.

create table if not exists public.partner_promo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id) on delete set null,
  title text not null check (length(btrim(title)) between 2 and 120),
  -- Язык слов в ролике или на картинке. all — слов нет или они понятны всем.
  locale text not null default 'all' check (locale in ('all', 'ru', 'uz', 'en', 'zh')),
  -- Подпись к посту. {link} заменяется короткой ссылкой партнёра; нет
  -- {link} — ссылка встаёт последней строкой. Пусто — подпись по умолчанию.
  caption text check (caption is null or length(caption) <= 1000),
  -- Путь в приватном бакете partner-promo: «2026/09/<uuid>.mp4».
  storage_path text not null unique check (length(storage_path) between 3 and 300),
  mime text not null check (mime in (
    'video/mp4', 'video/quicktime', 'video/webm',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif'
  )),
  bytes bigint check (bytes is null or bytes >= 0),
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  duration_s numeric(6, 1) check (duration_s is null or duration_s between 0 and 3600),
  -- Скрытый не виден партнёрам, но и не удалён: вернуть — одной кнопкой.
  hidden boolean not null default false
);
create index if not exists partner_promo_created_idx on public.partner_promo (created_at desc);

-- Кто и что скачал. По этому владелец видит, какие материалы партнёрам
-- нужны, а какие лежат зря.
create table if not exists public.partner_promo_downloads (
  id bigint generated always as identity primary key,
  promo_id uuid not null references public.partner_promo(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists partner_promo_downloads_promo_idx on public.partner_promo_downloads (promo_id);

alter table public.partner_promo enable row level security;
alter table public.partner_promo_downloads enable row level security;

comment on table public.partner_promo is
  'Промо-материалы для партнёров: ролики и картинки, которые они публикуют со своей ссылкой.';
comment on table public.partner_promo_downloads is
  'Скачивания промо-материалов партнёрами: что и кто взял.';

-- Бакет приватный: превью и скачивание — по подписанным ссылкам на время.
-- Материал, который владелец скрыл или удалил, перестаёт открываться, а не
-- живёт вечно по однажды скопированному адресу. 50 МБ — предел загрузки
-- одним запросом в Supabase; ролик на минуту в 1080p в него укладывается.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-promo', 'partner-promo', false, 52428800,
  array['video/mp4', 'video/quicktime', 'video/webm', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
