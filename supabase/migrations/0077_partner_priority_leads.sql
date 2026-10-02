-- Партнёрка: закреплённый клиент — сразу лидом, приоритетным.
--
-- Владелец, 02.10: «Сразу лидом, причём он идёт с уведомлением всем
-- менеджерам. Эти лиды идут всегда вверху списка лидов и выделены цветом +
-- в тг идёт постоянное уведомление, пока его кто-то не возьмёт, они
-- приоритет».
--
-- Лид из закрепления партнёра — source = 'partner' (lib/partners/priority-lead.ts).

-- Наверху списка, пока ничей: столбец считается сам, по нему список и
-- сортируется первым — PostgREST не умеет сортировать по выражению.
alter table public.leads
  add column if not exists partner_pin boolean
  generated always as (source = 'partner' and status = 'new' and assigned_staff_id is null) stored;
create index if not exists leads_partner_pin_idx on public.leads (created_at desc) where partner_pin;

-- Когда команде последний раз напомнили о ничьём лиде от партнёра: свип
-- напоминает каждые 15 минут, пока его не возьмут.
alter table public.leads add column if not exists partner_ping_at timestamptz;
