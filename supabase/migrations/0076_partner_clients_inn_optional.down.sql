-- Закрепления без ИНН не переживут возврат обязательности: их нужно отменить или дописать ИНН до отката.
alter table public.partner_clients drop constraint if exists partner_clients_inn_check;
alter table public.partner_clients
  add constraint partner_clients_inn_check check (inn ~ '^[0-9]{9,12}$');
alter table public.partner_clients alter column inn set not null;
