-- Источники лида: база пускала только «chat» и «form».
--
-- Код с тех пор завёл ещё три входа — бот в Telegram («telegram»), бриф с
-- витрины («showcase») и переписку по касанию («outreach») — а проверка в
-- базе осталась от первой миграции. Вставка с новым источником падала на
-- check, saveLead возвращал null, и лид уходил в Telegram карточкой без
-- ссылки: в панели его не было, в очередь он не попадал, в статистику тоже.
-- Из десяти отправленных касаний ни одно так и не стало лидом.
--
-- Плюс два новых входа: сильный сигнал скаута («scout») и компания,
-- найденная автопоиском по картам («maps»).
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('chat', 'form', 'telegram', 'showcase', 'outreach', 'scout', 'maps'));

-- Шум скаута: разобранные сообщения с нулевой оценкой лежали в ленте как
-- «новые» — 159 из 197 из одного чата про релокацию. Дальше такие
-- сохраняются сразу разобранными (lib/scout/store.ts), а накопленное
-- убирается здесь.
update public.scout_signals
   set status = 'ignored'
 where status = 'new'
   and score < 20
   and category = 'другое';
