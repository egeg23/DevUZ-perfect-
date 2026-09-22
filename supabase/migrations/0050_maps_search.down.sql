drop function if exists public.bump_maps_usage(date);
drop index if exists public.prospects_place_id_key;
alter table public.prospects drop column if exists place_id;
drop table if exists public.maps_usage;
drop table if exists public.maps_places;
drop table if exists public.maps_campaigns;
