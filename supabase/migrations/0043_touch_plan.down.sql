alter table public.staff drop column if exists touch_plan;

drop index if exists prospects_touched;
alter table public.prospects
  drop column if exists touched_at,
  drop column if exists touched_by;

-- Возврат обязательности адреса требует, чтобы компаний без сайта в базе не
-- осталось: иначе ALTER упадёт, и это правильнее молчаливой потери строк.
delete from public.prospects where host is null or url is null;
drop index if exists prospects_host_once;
create unique index if not exists prospects_host_once on public.prospects (host);
alter table public.prospects
  alter column url set not null,
  alter column host set not null;
