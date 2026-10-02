alter table public.prospects
  drop column if exists sent_via,
  drop column if exists dispatch_by,
  drop column if exists dispatch_at;

drop table if exists public.tg_accounts;
