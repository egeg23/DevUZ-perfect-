-- Банковские реквизиты обеих сторон в договоре.
--
-- Владелец: «в договоре в реквизитах нет расчётного счёта, банка и его кода.
-- Обычно это пишется и с одной, и с другой стороны».
--
-- До этого реквизиты заказчика жили одной строкой `client_details` — адрес,
-- идентификатор и контакт вперемешку. Для адреса это годится, для счёта нет:
-- номер счёта, набранный внутри предложения, невозможно ни проверить на
-- длину, ни перенести в платёжное поручение, не перечитывая фразу целиком.
-- А ошибка в одной цифре счёта — это деньги, ушедшие не туда.
--
-- Реквизиты студии остаются в переменных окружения (lib/store/requisites.ts):
-- расчётный счёт не лежит в git, даже когда он не секрет.
alter table public.contracts add column if not exists client_tax_id text;
alter table public.contracts add column if not exists client_bank_name text;
alter table public.contracts add column if not exists client_account text;
alter table public.contracts add column if not exists client_mfo text;
