-- Партнёрка: выплата с оборота — сама, как только проект оплачен целиком.
--
-- Владелец, 01.10: «Расчёт с оборота происходит автоматически, когда мы
-- получаем 100 % суммы». С оборота база известна сразу — сумма проекта, —
-- поэтому ни заявки партнёра, ни ожидания начала месяца не нужно: заявка на
-- выплату заводится сама при записи платежа, который закрыл проект.
--
-- project_id — за какой проект эта выплата. Пусто — обычная заявка
-- партнёра на всё доступное. Уникальный индекс — гарантия «строго одна
-- выплата на проект»: запись платежа и страховочный свип могут сработать
-- одновременно, и вторая вставка просто не пройдёт.
alter table public.partner_payouts
  add column if not exists project_id uuid references public.projects(id) on delete set null;
create unique index if not exists partner_payouts_project_unique
  on public.partner_payouts (project_id) where project_id is not null;

comment on column public.partner_payouts.project_id is
  'Автовыплата с оборота за этот проект. Пусто — заявка партнёра на всё доступное.';
