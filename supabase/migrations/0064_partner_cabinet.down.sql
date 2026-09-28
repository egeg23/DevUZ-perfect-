drop table if exists public.partner_sessions;
drop table if exists public.partner_login_tokens;
drop table if exists public.partner_clicks;
alter table public.partner_links drop constraint if exists partner_links_target_check;
alter table public.partner_links drop constraint if exists partner_links_slug_check;
drop index if exists public.partner_links_slug_idx;
alter table public.partner_links drop column if exists target, drop column if exists slug;
alter table public.leads drop column if exists partner_ref_at;
