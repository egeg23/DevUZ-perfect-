-- Откат уносит привязку снимков к находкам. Сами файлы в бакете остаются:
-- их удаляют отдельно и осознанно, как и в 0021.
alter table public.razbors drop column if exists shot_findings;
