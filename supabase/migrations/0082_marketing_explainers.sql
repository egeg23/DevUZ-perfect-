-- Статьи о маркетинге: новый вид темы — «объяснение» под поисковый запрос
-- («что такое SMM», «SMM nima», «реклама в Ташкенте»…). Владелец, 04.10.2026:
-- статьи должны быть под то, что в Узбекистане ищут, и приводить клиентов.

alter table public.marketing_articles drop constraint if exists marketing_articles_kind_check;
alter table public.marketing_articles
  add constraint marketing_articles_kind_check check (kind in ('explainer', 'case', 'mistake', 'niche'));
