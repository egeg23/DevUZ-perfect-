-- ФИО и телефон сотрудника.
--
-- Владелец, 05.10.2026: «Сделай возможность в разделе „Команда“ менять ФИО и
-- данные по сотрудникам. Менять может руководитель и я». Имя в панели
-- (display_name) короткое — им подписаны лиды и задачи; полное ФИО и телефон
-- нужны для договоров и чтобы дозвониться. Оба поля необязательные.
alter table public.staff
  add column if not exists full_name text
    check (full_name is null or char_length(full_name) between 1 and 120),
  add column if not exists phone text
    check (phone is null or phone ~ '^\+[0-9]{9,15}$');

comment on column public.staff.full_name is 'ФИО полностью — для договоров. Имя в панели — display_name.';
comment on column public.staff.phone is 'Телефон сотрудника: + и 9–15 цифр.';
