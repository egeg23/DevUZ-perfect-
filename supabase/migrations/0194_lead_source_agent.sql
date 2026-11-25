-- Источник «agent» — заявка, которую за клиента прислал ИИ-агент
-- (app/api/agent/lead, lib/agent/lead.ts). Владелец, 24.11.2026:
-- «Разрешаем агенту отправлять нам заявки».
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps', 'partner', 'manual', 'box', 'mockup', 'mockup-manual', 'claudery', 'leadgen', 'agent'));
