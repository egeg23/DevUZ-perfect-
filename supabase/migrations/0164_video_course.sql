-- Видеокурс в «Обучении»: ролики лежат в help_videos с ключом course-01 … course-13.
--
-- Задача Александра, утверждена владельцем 13.10.2026: 13 видео-гайдов для
-- менеджеров (docs/training/video-guides). Загружают владелец и руководитель
-- на странице «Обучение» так же, как видео к инструкциям; файл — на диске
-- сервера, здесь только строка. Смотрит тот, кому открыто «Обучение»
-- (lib/admin/help-video-rules.ts, canWatchHelpVideo).

alter table public.help_videos drop constraint if exists help_videos_section_check;
alter table public.help_videos add constraint help_videos_section_check
  check (section = 'intro' or section ~ '^/admin(/[a-z-]+)?$' or section ~ '^course-[0-9]{2}$');
