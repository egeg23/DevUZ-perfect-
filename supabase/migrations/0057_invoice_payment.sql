-- Оплата счёта по договору — это платёж по проекту.
--
-- До сих пор отметка «Оплачен» у счёта жила сама по себе: платёж в проекте
-- владелец записывал ещё раз, руками, в карточке проекта, и пока он этого
-- не сделал, начисления команде стояли замороженными, а в «Деньгах» денег
-- не было. Теперь счёт помнит, чей это платёж (payment_id), и кто отметил
-- оплату (paid_by): отметку ставит тот, кто увидел деньги в банке, а платёж,
-- который размораживает начисления, по-прежнему подтверждает владелец.
--
-- Удалили платёж в проекте — счёт снова «оплачен, ждёт подтверждения», а не
-- висит со ссылкой в пустоту: on delete set null.
alter table public.contract_invoices
  add column if not exists paid_by uuid references public.staff(id) on delete set null,
  add column if not exists payment_id uuid references public.project_payments(id) on delete set null;

-- Один платёж — один счёт: два счёта на одну запись удвоили бы «оплачено».
create unique index if not exists contract_invoices_payment_key
  on public.contract_invoices (payment_id)
  where payment_id is not null;

comment on column public.contract_invoices.payment_id is
  'Платёж в проекте, которым подтверждена оплата счёта. Пусто при paid_at — оплата отмечена, но владелец её ещё не подтвердил.';
