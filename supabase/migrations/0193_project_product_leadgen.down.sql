update public.projects set product = null where product = 'leadgen';
alter table public.projects drop constraint if exists projects_product_check;
alter table public.projects
  add constraint projects_product_check
  check (product is null or product in ('claudery'));
