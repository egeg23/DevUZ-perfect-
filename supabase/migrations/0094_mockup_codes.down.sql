-- Engelberg на витрине не откатывается: он был закрыт до этой миграции, и
-- откат открыл бы его всем.
drop table if exists public.proto_codes;
alter table public.protos drop column if exists closed_at;
