-- Статьи о маркетинге: что ответили Google Trends и Вордстат перед статьёй.
--
-- Правило владельца, 04.10.2026: «При составлении статей и их выкатке всегда
-- используй Google Trends для понимания запроса и Яндекс Вордстат». Смена
-- спрашивает оба источника по запросу каждой версии и пишет ответ сюда:
-- {ru: {query, trends, wordstat, related}, uz: {…}} — видно, под какие живые
-- запросы писалась статья, и почему источник промолчал, если промолчал.

alter table public.marketing_articles add column if not exists research jsonb;

comment on column public.marketing_articles.research is
  'Google Trends и Вордстат (Узбекистан) по запросу каждой версии: {ru|uz: {query, trends, wordstat, related[]}}.';
