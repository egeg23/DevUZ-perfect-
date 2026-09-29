-- Язык панели — настройка сотрудника.
--
-- Владелец: «Админ панель на узбекском тоже должна быть», позже — «также
-- добавь польский». Язык выбирает сам сотрудник переключателем RU / UZ / PL
-- в шапке панели; по умолчанию русский, как было.
--
-- Колонка в staff, а не кука браузера: язык один на человека, а не на
-- ноутбук, и по нему же потом будет писать бот (lib/admin/locale.ts).
alter table public.staff
  add column if not exists panel_locale text not null default 'ru'
    check (panel_locale in ('ru', 'uz', 'pl'));

comment on column public.staff.panel_locale is
  'Язык панели сотрудника: ru, uz (латиница) или pl. Меняет сам сотрудник в шапке панели.';
