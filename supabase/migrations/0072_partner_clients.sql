-- Партнёрка: клиент, закреплённый партнёром вручную.
--
-- Владелец, 01.10: «Я хочу, чтобы в реферальном кабинете партнёра он мог
-- вручную завести клиента, указав ИНН компании, название, контакт для связи
-- и т. д. Кто-то будет приводить свои компании не через ссылку — надо
-- закрыть эту дыру».
--
-- По духу — как агентство (0065): без ссылки, узнаётся по ИНН, названию,
-- контакту и сайту. Отличия: действует сразу, без подтверждения, — потому
-- что при заявке проверяется, что студия этой компании ещё не знает; и
-- истекает через 90 дней, если от клиента не пришло ни одной заявки. Пришла
-- заявка — заказы клиента засчитываются партнёру 12 месяцев с неё. Сроки и
-- проверки — lib/partners/rules.ts, раздел «Клиенты партнёра».
create table if not exists public.partner_clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 120),
  -- ИНН (СТИР) — только цифры: 9 в Узбекистане, до 12 в соседних странах.
  inn text not null check (inn ~ '^[0-9]{9,12}$'),
  contact_name text check (contact_name is null or length(contact_name) <= 120),
  phone text check (phone is null or length(phone) <= 40),
  telegram text check (telegram is null or length(telegram) <= 80),
  website text check (website is null or length(website) <= 200),
  note text check (note is null or length(note) <= 500),
  -- active — действует (сроки считаются из дат), expired — срок вышел,
  -- cancelled — владелец отменил с причиной.
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  -- Когда пришла первая заявка от клиента: с неё — 12 месяцев.
  first_lead_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.staff(id) on delete set null,
  cancel_note text check (cancel_note is null or length(cancel_note) <= 300)
);

-- Одна компания — одному партнёру: первенство по времени заявки держит база,
-- а не проверка в коде — две заявки в одну секунду вторую не пропустят.
create unique index if not exists partner_clients_inn_active
  on public.partner_clients (inn) where status = 'active';
create index if not exists partner_clients_partner_idx on public.partner_clients (partner_id, created_at desc);

-- ИНН клиента у лида: его вписывает менеджер в карточке или он приходит
-- из закрепления. По нему лид узнаётся как клиент партнёра.
alter table public.leads add column if not exists client_inn text;
alter table public.leads drop constraint if exists leads_client_inn_check;
alter table public.leads
  add constraint leads_client_inn_check check (client_inn is null or client_inn ~ '^[0-9]{9,12}$');
create index if not exists leads_client_inn_idx on public.leads (client_inn) where client_inn is not null;

alter table public.leads
  add column if not exists partner_client_id uuid references public.partner_clients(id) on delete set null;
alter table public.projects
  add column if not exists partner_client_id uuid references public.partner_clients(id) on delete set null;

alter table public.partner_clients enable row level security;

comment on table public.partner_clients is
  'Клиенты, закреплённые партнёром вручную по ИНН. 90 дней ждут первой заявки, затем 12 месяцев заказы — партнёру.';
