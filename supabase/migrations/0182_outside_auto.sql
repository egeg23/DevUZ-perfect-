-- Статьи на площадках сами: Telegraph напрямую, ВКонтакте и Telegram-канал
-- через Postiz (lib/outside/).
--
-- Владелец, 09.11.2026: «Я хочу минимизировать ручной труд на статьях… Я
-- прям правда не смогу на 25 ресурсов каждый день что-то выкладывать», на
-- план «где есть официальный способ публиковать — публикует код» —
-- «Делаем, Postiz тоже подключи».
--
-- Новые площадки — в той же таблице, тем же черновиком и той же проверкой.
-- Черновик площадки, которая публикуется сама, уходит сразу:
--   Telegraph — ссылка приходит в ответе, строка сразу 'published';
--   Postiz — пост ставится в его очередь ('sent', external_id — номер поста
--   в Postiz), ссылку свип забирает потом.
-- Не вышло — строка остаётся 'ready' с publish_error: её публикует человек,
-- как vc.ru.

alter table public.outside_posts drop constraint if exists outside_posts_platform_check;
alter table public.outside_posts
  add constraint outside_posts_platform_check check (platform in ('vcru', 'dzen', 'tenchat', 'telegraph', 'vk', 'telegram'));

alter table public.outside_posts drop constraint if exists outside_posts_status_check;
alter table public.outside_posts
  add constraint outside_posts_status_check check (status in ('ready', 'sent', 'published', 'skipped'));

-- Как ушла: 'telegraph', 'postiz'; пусто — руками.
alter table public.outside_posts add column if not exists via text;
alter table public.outside_posts add column if not exists external_id text;
alter table public.outside_posts add column if not exists sent_at timestamptz;
alter table public.outside_posts add column if not exists publish_error text;

create index if not exists outside_posts_sent_idx on public.outside_posts (sent_at) where status = 'sent';
