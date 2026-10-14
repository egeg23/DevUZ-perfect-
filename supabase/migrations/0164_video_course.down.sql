delete from public.help_videos where section ~ '^course-[0-9]{2}$';
alter table public.help_videos drop constraint if exists help_videos_section_check;
alter table public.help_videos add constraint help_videos_section_check
  check (section = 'intro' or section ~ '^/admin(/[a-z-]+)?$');
