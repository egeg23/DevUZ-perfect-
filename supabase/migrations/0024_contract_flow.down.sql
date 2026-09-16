alter table public.contracts drop constraint if exists contracts_signed_complete;
alter table public.contracts drop constraint if exists contracts_sent_complete;
alter table public.contracts drop column if exists signed_by, drop column if exists signed_at, drop column if exists signed_path,
  drop column if exists notified_at, drop column if exists sent_by, drop column if exists sent_at,
  drop column if exists deadline_text, drop column if exists estimate_items,
  drop column if exists estimate_name, drop column if exists estimate_path;
alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('draft', 'approved', 'void'));
