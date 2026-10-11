drop index if exists public.bloggers_tg_pending;
drop index if exists public.bloggers_tg_user;
alter table public.bloggers drop column if exists tg_pending_at;
alter table public.bloggers drop column if exists tg_pending;
alter table public.bloggers drop column if exists tg_user_id;
alter table public.bloggers drop column if exists tg_account;
