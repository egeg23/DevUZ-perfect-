-- Номер заявки и сработавшая гарантия.
--
-- Номер клиент слышит в чате и называет его, когда пишет снова: «я по заявке
-- DZ-0821-K4M7». До этой миграции найти по нему разговор можно было только
-- поиском по чату отдела продаж — то есть база, ради которой всё и заводится,
-- на главный вопрос менеджера не отвечала.
--
-- Скидка — не пометка в переписке, а факт про деньги: по ней считается, во
-- сколько обошлась гарантия двадцати секунд и окупается ли она вообще.

alter table public.leads
  add column if not exists request_no text,
  add column if not exists discount_granted boolean not null default false;

-- Уникальность частичная: у лидов, записанных до этой миграции, номера нет,
-- и десяток строк с null не должны конфликтовать друг с другом.
create unique index if not exists leads_request_no_key
  on public.leads (request_no)
  where request_no is not null;

comment on column public.leads.request_no is
  'Номер заявки, названный клиенту: DZ-MMDD-XXXX';
comment on column public.leads.discount_granted is
  'Сработала гарантия 20 секунд — клиенту подтверждена скидка 30%';
