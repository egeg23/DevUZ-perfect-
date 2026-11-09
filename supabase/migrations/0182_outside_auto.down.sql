drop index if exists public.outside_posts_sent_idx;
delete from public.outside_posts where platform in ('telegraph', 'vk', 'telegram');
update public.outside_posts set status = 'ready' where status = 'sent';
alter table public.outside_posts drop column if exists publish_error;
alter table public.outside_posts drop column if exists sent_at;
alter table public.outside_posts drop column if exists external_id;
alter table public.outside_posts drop column if exists via;
alter table public.outside_posts drop constraint if exists outside_posts_status_check;
alter table public.outside_posts
  add constraint outside_posts_status_check check (status in ('ready', 'published', 'skipped'));
alter table public.outside_posts drop constraint if exists outside_posts_platform_check;
alter table public.outside_posts
  add constraint outside_posts_platform_check check (platform in ('vcru', 'dzen', 'tenchat'));
