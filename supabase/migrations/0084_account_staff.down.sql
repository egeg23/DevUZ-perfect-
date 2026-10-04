drop table if exists public.tg_account_staff;
alter table public.tg_accounts alter column hourly_cap set default 1;
update public.tg_accounts set hourly_cap = 2 where hourly_cap > 2;
alter table public.tg_accounts drop constraint if exists tg_accounts_hourly_cap_check;
alter table public.tg_accounts
  add constraint tg_accounts_hourly_cap_check check (hourly_cap between 1 and 2);
