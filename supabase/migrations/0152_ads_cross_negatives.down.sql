delete from public.ads_proposals where kind = 'cross_negatives';
alter table public.ads_proposals drop constraint if exists ads_proposals_kind_check;
alter table public.ads_proposals add constraint ads_proposals_kind_check
  check (kind in ('negatives', 'budget', 'ad_test', 'ad_winner'));
