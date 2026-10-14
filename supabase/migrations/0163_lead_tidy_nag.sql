-- Порядок в лидах, 14.10.2026 (lib/admin/lead-tidy.ts): бот спрашивает по
-- всем лидам без движения в 10:00 и 16:00, пока человек не ответит.
-- tidy_first_asked_at — первый вопрос без ответа (с него «два рабочих дня»
-- до строки руководителю и три дня до «проиграли»); tidy_wait_streak —
-- сколько раз подряд «ещё в работе» без смены статуса (третий — последний).
alter table public.leads
  add column if not exists tidy_first_asked_at timestamptz,
  add column if not exists tidy_wait_streak smallint not null default 0;

comment on column public.leads.tidy_first_asked_at is 'Первый вопрос бота без ответа; снимается ответом.';
comment on column public.leads.tidy_wait_streak is '«Ещё в работе» подряд без смены статуса; на третьем — только «выиграли»/«проиграли».';

-- Прежний вопрос (13.10) без ответа считается первым.
update public.leads set tidy_first_asked_at = tidy_asked_at
 where status = 'taken' and tidy_asked_at is not null and tidy_first_asked_at is null;
