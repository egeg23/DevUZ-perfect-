-- Откат уносит таблицы. Сам бакет partner-promo и файлы в нём остаются:
-- их удаляют отдельно и осознанно, как и в 0021 и 0041.
drop table if exists public.partner_promo_downloads;
drop table if exists public.partner_promo;
