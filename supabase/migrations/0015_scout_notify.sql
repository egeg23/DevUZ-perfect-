-- Факт доставки сигнала оператору.
--
-- До этого сигнал, который Telegram не принял (429 при всплеске, обрыв
-- прокси), лежал в базе со статусом «новый» и в канал не приходил никогда:
-- отправка была событием без следа, и следующий проход про неё не знал.
-- Оператор видел такой сигнал только в панели — если открывал.
--
-- Теперь у строки есть отметка отправки и счётчик неудач. Свип раз в пять
-- минут досылает неотправленное — с окном в сутки и пределом попыток: сигнал,
-- который доставить нельзя в принципе (канал удалён, бота выгнали), не должен
-- занимать место в пачке вечно.

alter table public.scout_signals
  add column if not exists notified_at timestamptz,
  add column if not exists notify_attempts smallint not null default 0;

comment on column public.scout_signals.notified_at is
  'Когда сигнал дошёл до канала оператора. Пусто — не дошёл или ниже порога.';
comment on column public.scout_signals.notify_attempts is
  'Сколько раз отправка не удалась. Свип сдаётся после нескольких.';

-- Всё, что было до этой миграции, считается доставленным. Иначе первый
-- свип после выкатки дослал бы в канал сутки старых сигналов — второй раз.
update public.scout_signals
  set notified_at = created_at
  where notified_at is null;

-- Свип выбирает неотправленные новые. Частичный индекс: отправленные,
-- разобранные и ставшие лидами его не интересуют.
create index if not exists scout_signals_unnotified_idx
  on public.scout_signals (created_at)
  where notified_at is null and status = 'new';
