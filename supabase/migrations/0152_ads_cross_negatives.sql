-- Автопилот рекламы: кросс-минусовка групп — новый вид предложения.
--
-- В кампании ключ «купить диван» в одной группе и «купить диван угловой» в
-- другой: в первую группу добавляется минус «угловой», чтобы запрос «купить
-- угловой диван» шёл в свою группу, к своему объявлению (lib/ads/crossminus.ts).
alter table public.ads_proposals drop constraint if exists ads_proposals_kind_check;
alter table public.ads_proposals add constraint ads_proposals_kind_check
  check (kind in ('negatives', 'budget', 'ad_test', 'ad_winner', 'cross_negatives'));
