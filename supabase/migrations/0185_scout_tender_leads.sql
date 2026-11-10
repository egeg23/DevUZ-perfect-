-- Тендер — лид менеджеру (владелец, 10.11.2026: «Информация должна приходить
-- по заявкам в бота нашего где менеджеры могут взять тот или иной тендер,
-- вытащи номер телефона / юзернейм или все что возможно. Берутся как обычные
-- лиды менеджерами»).
--
-- Контакт — то, что площадка сама печатает в карточке лота любому посетителю:
-- телефон и почта заказчика, ответственный за закупку, ИНН организации.
-- lead_at — забор лота в лиды условным обновлением: два прохода свипа не
-- заведут из одного тендера два лида.

alter table public.scout_tenders
  add column if not exists phone text check (length(phone) <= 40),
  add column if not exists email text check (length(email) <= 200),
  add column if not exists contact_person text check (length(contact_person) <= 200),
  add column if not exists customer_inn text check (length(customer_inn) <= 20),
  add column if not exists lead_at timestamptz,
  add column if not exists lead_id uuid references public.leads(id) on delete set null;

create index if not exists scout_tenders_lead_idx on public.scout_tenders (created_at desc) where lead_at is null;
