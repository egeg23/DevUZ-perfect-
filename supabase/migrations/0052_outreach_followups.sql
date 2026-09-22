-- Дожим касаний: второе сообщение через три дня молчания, третье — через
-- семь, и больше не пишем.
--
-- Из десяти отправленных касаний ответили пятеро — и ни одного второго
-- сообщения тем, кто промолчал, не ушло. Большинство ответов в холодной
-- переписке приходит на второе-третье сообщение, а не на первое.
alter table public.prospects add column if not exists followups smallint not null default 0;
alter table public.prospects add column if not exists last_followup_at timestamptz;

comment on column public.prospects.followups is
  'Сколько дожимающих сообщений ушло после первого касания без ответа: 0–2.';
