alter table public.firecrawl_usage drop constraint if exists firecrawl_usage_kind_check;
delete from public.firecrawl_usage where kind = 'bloggers';
alter table public.firecrawl_usage add constraint firecrawl_usage_kind_check check (kind in ('search', 'contacts'));
drop table if exists public.blogger_settings;
drop table if exists public.bloggers;
