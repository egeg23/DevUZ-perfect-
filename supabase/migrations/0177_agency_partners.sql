-- Агентства — партнёры студии: им 15% с суммы каждого их проекта, а тому из
-- команды, кто привёл и завёл агентство, — 5% с суммы его проектов 12 месяцев.
--
-- Владелец, 05.11.2026: «Надо зафиксировать условия для агентств: 15% с
-- оборота проекта фиксировано. Для наших менеджеров: те кто привел агентство
-- и завел его у нас — они на 12 месяцев получают 5% с оборота этого
-- агентства». Ставки — константами в коде (lib/partners/rules.ts,
-- AGENCY_PERCENT; lib/admin/finance.ts, AGENCY_FINDER_PERCENT и
-- AGENCY_FINDER_MONTHS), здесь только факты: что это агентство, как оно нам
-- пишет, кто его привёл и когда.

alter table public.partners
  add column if not exists kind text not null default 'person',
  -- Как агентство пишет нам: @telegram, телефон или почта. По нему узнаются
  -- его заявки с сайта и из бота.
  add column if not exists contact text,
  add column if not exists website text,
  -- Кто из команды привёл и завёл агентство, и когда: от этого дня 12
  -- месяцев ему 5% с суммы проектов агентства.
  add column if not exists brought_by uuid references public.staff (id) on delete set null,
  add column if not exists brought_at timestamptz;

alter table public.partners drop constraint if exists partners_kind_check;
alter table public.partners add constraint partners_kind_check check (kind in ('person', 'agency'));
alter table public.partners drop constraint if exists partners_contact_check;
alter table public.partners
  add constraint partners_contact_check check (contact is null or length(contact) <= 120);
alter table public.partners drop constraint if exists partners_website_check;
alter table public.partners
  add constraint partners_website_check check (website is null or length(website) <= 200);

create index if not exists partners_agency_brought_by_idx
  on public.partners (brought_by) where kind = 'agency';

comment on column public.partners.kind is
  'person — человек по ссылке (ставка по ступеням), agency — агентство: 15% с суммы проекта всегда.';
comment on column public.partners.brought_by is
  'Кто из команды привёл агентство: ему 5% с суммы проектов агентства 12 месяцев с brought_at.';
