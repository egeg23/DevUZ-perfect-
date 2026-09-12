-- Откат 0013. Журнал выдач уходит вместе с таблицей: это записи о том,
-- кто и когда скачивал купленное, и держать их без самой функции незачем.

drop table if exists public.store_downloads;
drop table if exists public.store_releases;
