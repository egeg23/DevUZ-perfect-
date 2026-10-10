-- Разборы на английском.
--
-- Владелец, 10.10.2026: «На английском давай тоже делать, там 404».
--
-- Русская и узбекская статьи остаются тем, чем были: их пишет ночная смена
-- под разные запросы, и человек проверяет их в панели. Английская — третья
-- версия той же строки: сервер пишет её сам из уже опубликованной русской
-- под английский запрос («website for a hotel in Tashkent») и проверяет
-- числа по тому же аудиту (lib/razbor/english.ts).
--
-- en_tried_at — когда сервер последний раз брался за перевод. Им же
-- держится очередь: строку берёт один свип, и неудачная попытка не
-- повторяется каждые пять минут.

alter table public.razbors add column if not exists slug_en text;
alter table public.razbors add column if not exists article_en jsonb;
alter table public.razbors add column if not exists en_tried_at timestamptz;

create unique index if not exists razbors_slug_en_key on public.razbors (slug_en) where slug_en is not null;
