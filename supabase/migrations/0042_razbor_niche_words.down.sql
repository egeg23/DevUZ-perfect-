-- Откат уносит формы слов у ниш вне каталога. Разборы остаются: их тексты
-- и адреса уже записаны, и от этой колонки не зависят.
drop index if exists public.razbors_category_words_idx;
alter table public.razbors drop column if exists niche_words;
