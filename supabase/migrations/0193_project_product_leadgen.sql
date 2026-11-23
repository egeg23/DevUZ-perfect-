-- Проект лидогенерации (владелец, 23.11.2026): свой продукт в projects.product,
-- ведущему 25% от прибыли (lib/admin/finance.ts, LEADGEN_MANAGER_PERCENT).
-- Проект из лида с источником leadgen получает его сам (lib/admin/projects.ts).
alter table public.projects drop constraint if exists projects_product_check;
alter table public.projects
  add constraint projects_product_check
  check (product is null or product in ('claudery', 'leadgen'));
