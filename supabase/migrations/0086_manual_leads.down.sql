-- Откат 0086: проверка источника — как в 0048. Лиды 'partner' и 'manual'
-- откат не переживут: сначала их нужно убрать или перевести в другой источник.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps'));
