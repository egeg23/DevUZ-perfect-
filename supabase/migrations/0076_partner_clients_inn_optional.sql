-- Партнёрка: ИНН закреплённого клиента — необязательный.
--
-- Владелец, 02.10: «Мы проверяем по названию компании, если партнёру ИНН не
-- известен. Если название повторяется — проверка по ИНН». Партнёр часто
-- знает название и контакт, но не ИНН. Правило сверки — lib/partners/rules.ts,
-- companyMatch. Уникальность действующего закрепления по ИНН остаётся: в
-- частичном индексе пустые ИНН не мешают друг другу.
alter table public.partner_clients alter column inn drop not null;
alter table public.partner_clients drop constraint if exists partner_clients_inn_check;
alter table public.partner_clients
  add constraint partner_clients_inn_check check (inn is null or inn ~ '^[0-9]{9,12}$');
