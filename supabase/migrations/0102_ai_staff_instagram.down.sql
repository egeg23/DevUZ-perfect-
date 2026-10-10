delete from public.ai_conversations where kind = 'instagram';
delete from public.ai_channels where kind = 'instagram';
alter table public.ai_channels drop column if exists token_expires_at;
alter table public.ai_conversations drop constraint if exists ai_conversations_kind_check;
alter table public.ai_conversations add constraint ai_conversations_kind_check
  check (kind in ('tg_business', 'tg_bot', 'widget', 'test'));
alter table public.ai_channels drop constraint if exists ai_channels_kind_check;
alter table public.ai_channels add constraint ai_channels_kind_check
  check (kind in ('tg_business', 'tg_bot', 'widget'));
