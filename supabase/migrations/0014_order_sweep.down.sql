-- Откат 0014. Заявки останутся, напоминания начнут повторяться.

drop index if exists public.orders_sweep_idx;

alter table public.orders
  drop column if exists last_nudged_stage,
  drop column if exists last_nudged_at;
