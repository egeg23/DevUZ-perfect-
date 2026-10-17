update public.outreach_messages set kind = 'text' where kind in ('intro', 'price', 'auto');
alter table public.outreach_messages drop constraint if exists outreach_messages_kind_check;
alter table public.outreach_messages
  add constraint outreach_messages_kind_check check (kind in ('text', 'circle'));

drop index if exists public.prospects_boss_promised_idx;
alter table public.prospects
  drop column if exists boss_asked_at,
  drop column if exists boss_promised_at,
  drop column if exists sales_arm;
