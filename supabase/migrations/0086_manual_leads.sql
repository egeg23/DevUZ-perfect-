-- Лид, добавленный руками, — и лид от партнёра, которого проверка не знала.
--
-- Владелец, 05.10.2026: «В лидах сделай кнопку „добавить лид вручную“, чтобы
-- мы могли добавлять клиентов руками не в проект, а в лидах». Такой лид —
-- source = 'manual' (lib/admin/lead-add.ts).
--
-- И старая дыра: 0077 завёл лиды от партнёров (source = 'partner',
-- lib/partners/priority-lead.ts), а проверка источника осталась от 0048 и
-- 'partner' не знает. Вставка падала на check — клиент, которого партнёр
-- закрепил в кабинете, лидом в панели так и не становился.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps', 'partner', 'manual'));
