-- Письмо автопрогона — после ответа на «Здравствуйте» (lib/admin/letter-later.ts).
--
-- Разведка «ИИ → код», 10.10.2026: из 94 писем автопрогона за две недели 65
-- так и не понадобились. Теперь при подготовке — только проверка сайта, а
-- когда клиент ответил не по-русски или кружок не ушёл, скаут ставит здесь
-- язык ответа, и письмо пишет свип.
--
-- letter_wanted    — язык ответа (ru, uz, en): письмо нужно, его ещё нет;
-- letter_wanted_at — когда браться (с паузой после ответа; при сбое модели —
--                    следующая попытка).
alter table public.prospects add column if not exists letter_wanted text
  check (letter_wanted is null or letter_wanted in ('ru', 'uz', 'en'));
alter table public.prospects add column if not exists letter_wanted_at timestamptz;

create index if not exists prospects_letter_wanted on public.prospects (letter_wanted_at)
  where letter_wanted is not null;
