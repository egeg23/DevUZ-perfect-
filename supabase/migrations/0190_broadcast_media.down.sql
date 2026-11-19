alter table public.staff_broadcasts
  drop column if exists media_kind,
  drop column if exists media_file_id,
  drop column if exists media_name;
