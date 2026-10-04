-- Видео к инструкциям панели.
--
-- Владелец, 04.10.2026: команда записывает видеоинструкции, и кнопка «Как
-- пользоваться разделом» должна вести к видео раздела, а под ним — к
-- подробному тексту. Загружают владелец и руководитель прямо на странице
-- «Инструкции», без разработчика.
--
-- section — адрес раздела из меню панели (/admin, /admin/prospect, …) или
-- intro — вводный ролик наверху страницы. На раздел и язык — одно видео:
-- новое заменяет старое. Языка, на котором видео нет, нет и в выдаче —
-- страница показывает видео на другом языке.
--
-- Сами файлы — на диске сервера, в той же папке, что и промо-материалы
-- партнёров (lib/partners/promo-files.ts); здесь только строка о них.

create table if not exists public.help_videos (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section = 'intro' or section ~ '^/admin(/[a-z-]+)?$'),
  locale text not null check (locale in ('ru', 'uz', 'pl')),
  storage_path text not null unique check (length(storage_path) between 3 and 300),
  mime text not null check (mime in ('video/mp4', 'video/quicktime', 'video/webm')),
  bytes bigint check (bytes is null or bytes >= 0),
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  duration_s numeric(6, 1) check (duration_s is null or duration_s between 0 and 3600),
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id) on delete set null,
  unique (section, locale)
);

comment on table public.help_videos is
  'Видео к инструкциям панели: раздел (адрес из меню или intro) × язык. Файл — на диске сервера, путь как у промо-материалов.';

alter table public.help_videos enable row level security;
