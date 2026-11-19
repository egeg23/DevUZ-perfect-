-- Вложение к рассылке в бот (фото, GIF, видео, файл). Владелец, 19.11.2026:
-- «Нужно добавить возможность добавлять фото / гиф / видео / файлы к
-- рассылкам через бота». Файл загружается в Telegram один раз (автору в
-- личку — так он видит, как придёт), дальше рассылка шлёт его по file_id:
-- сам файл в базе не лежит. lib/admin/broadcast.ts, broadcast-store.ts.
alter table public.staff_broadcasts
  add column if not exists media_kind text check (media_kind in ('photo', 'animation', 'video', 'document')),
  add column if not exists media_file_id text,
  add column if not exists media_name text;
