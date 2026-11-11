-- Источники «Макета в боте» и листа ожидания DevUz Box.
--
-- Та же дыра, что закрывала 0086: код пишет лиды с source = 'box' (лист
-- ожидания DevUz Box, lib/qualify/form-sources.ts) и 'mockup' («Макет в
-- боте», lib/proto/instant/bot-deps.ts), а проверка источника их не знала —
-- вставка падала на check, и лид в базу не попадал. 11.11.2026 в leads не
-- было ни одной строки с этими источниками.
--
-- 'mockup-manual' — макет вручную из бота: сферы без шаблона и дневной
-- потолок (владелец, 11.11.2026: «Если ниши нет для клиента — собираем в
-- ручную и предлагаем пока посмотреть наши кейсы»).
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps', 'partner', 'manual', 'box', 'mockup', 'mockup-manual'));
