alter table public.partners drop constraint if exists partners_kind_check;
alter table public.partners add constraint partners_kind_check check (kind in ('person', 'agency'));
