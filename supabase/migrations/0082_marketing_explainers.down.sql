alter table public.marketing_articles drop constraint if exists marketing_articles_kind_check;
alter table public.marketing_articles
  add constraint marketing_articles_kind_check check (kind in ('case', 'mistake', 'niche'));
