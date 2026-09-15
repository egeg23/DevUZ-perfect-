-- Откат уносит историю расходов целиком. Доли соучредителей тоже: после
-- него котёл снова считается от валовой прибыли.
drop table if exists public.expenses;
alter table public.staff drop column if exists founder_percent;
