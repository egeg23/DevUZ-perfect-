drop table if exists public.outreach_messages;
alter table public.prospects drop column if exists ai_handling;
alter table public.prospects drop column if exists handover_reason;
alter table public.prospects drop column if exists replied_at;
alter table public.prospects drop column if exists request_no;
