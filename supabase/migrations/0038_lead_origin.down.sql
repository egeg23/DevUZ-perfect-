alter table public.leads
  drop column if exists tg_username,
  drop column if exists entry_path,
  drop column if exists entry_ref;
