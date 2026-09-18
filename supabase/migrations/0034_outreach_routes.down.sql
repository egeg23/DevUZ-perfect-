drop index if exists public.prospects_by_user;

-- Ручные касания возвращаются в 'failed': старое ограничение слова 'manual'
-- не знает, и без этого откат упадёт на первой же такой строке.
update public.prospects set status = 'failed', failure = coalesce(failure, 'писали руками')
  where status = 'manual';

alter table public.prospects drop constraint if exists prospects_status_check;
alter table public.prospects add constraint prospects_status_check
  check (status in ('new', 'contacting', 'sending', 'sent', 'failed', 'skipped'));

alter table public.prospects drop constraint if exists prospects_target_kind_check;
alter table public.prospects
  drop column if exists manual_note,
  drop column if exists target_user_id,
  drop column if exists target_kind;
