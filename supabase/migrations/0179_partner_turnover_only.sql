-- Партнёры: одна модель — с оборота, без копилки.
--
-- Владелец, 05.11.2026, на разбор «как упростить партнёрку»: «Одну ссылку
-- нет, но остальное да, делаем». В кабинете остаётся только «с оборота»
-- (процент с суммы договора), копилка выключена (`PROFIT_MODEL`, `POOL` в
-- lib/partners/rules.ts).
--
-- Деньги по уже идущим проектам не меняются: модель проекта закрепляется в
-- день заявки, и у проекта без неё ставится «от прибыли» — так он и считался
-- (DEFAULT_MODEL). Смена модели — в журнал partner_model_changes, как смена
-- руками.

-- 1. Проекты партнёров без модели — как считались: «от прибыли».
update public.projects
   set partner_model = 'profit'
 where partner_id is not null
   and partner_model is null;

-- 2. Журнал: кто был «от прибыли».
insert into public.partner_model_changes (partner_id, from_model, to_model)
select id, payout_model, 'turnover'
  from public.partners
 where payout_model = 'profit';

-- 3. Все партнёры — с оборота, копилка выключена.
update public.partners set payout_model = 'turnover' where payout_model = 'profit';
update public.partners set accumulate = false where accumulate;

-- 4. Новый партнёр — с оборота.
alter table public.partners alter column payout_model set default 'turnover';
