-- Источник «leadgen» — заявка со страницы /ru/leadgen (content/leadgen.ts).
-- Владелец, 23.11.2026: «Делаем внутри девуз отдельное направление -
-- лидогенерация».
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps', 'partner', 'manual', 'box', 'mockup', 'mockup-manual', 'claudery', 'leadgen'));
