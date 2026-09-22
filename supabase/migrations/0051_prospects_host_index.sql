-- Уникальность домена у касаний — снова без условия.
--
-- 0043 сделала индекс частичным (where host is not null), чтобы у компаний
-- без сайта host мог быть пустым. Но Postgres не подбирает частичный индекс
-- под ON CONFLICT (host) без того же условия — а сохранение прогона
-- касаний (saveProspects) пишет именно так. С 0043 каждый прогон падал бы с
-- «no unique or exclusion constraint matching the ON CONFLICT
-- specification», и проверенные сайты молча не сохранялись. Поймано до
-- первого такого прогона.
--
-- Условие и не нужно: обычный уникальный индекс пропускает сколько угодно
-- NULL (NULLS DISTINCT — поведение по умолчанию), то есть компании без
-- сайта уживаются в нём так же, как с частичным.
drop index if exists public.prospects_host_once;
create unique index if not exists prospects_host_once on public.prospects (host);
