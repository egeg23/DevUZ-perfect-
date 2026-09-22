drop index if exists public.prospects_host_once;
create unique index if not exists prospects_host_once on public.prospects (host) where host is not null;
