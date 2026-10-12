drop index if exists public.outreach_edits_prospect;
alter table public.outreach_edits drop column if exists staff_id;
alter table public.outreach_edits drop column if exists message_id;
alter table public.outreach_messages drop column if exists tg_message_id;
