-- Источник «claudery» — бот удалённой помощи с ИИ (lib/claudery/store.ts).
-- Владелец, 17.11.2026: «Бот делаем внутри Devuz, так как заявки будут падать
-- в общий пул лидов к нам, просто другой посыл у самого бота».
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps', 'partner', 'manual', 'box', 'mockup', 'mockup-manual', 'claudery'));
