-- Касание в два шага (владелец, 07.10.2026): «Сначала мы пишем просто —
-- „Здравствуйте“. Если ответ есть — тут уже пишем сообщение. Короткое. Либо
-- кружок отправляем, который ранее записали… Потому что отлетают по спаму
-- аккаунты». Решение: после ответа — кружок и короткое письмо; без ответа —
-- ничего.
--
-- hello_at — когда рабочий аккаунт написал «Здравствуйте» (скаут, markSent).
-- pitch_at — когда после ответа клиента в очередь легли кружок и письмо.
-- Ждёт письма то касание, у которого hello_at есть, а pitch_at — нет. Старые
-- касания (письмо ушло сразу) hello_at не имеют и второй раз письма не
-- получат.
alter table public.prospects
  add column if not exists hello_at timestamptz,
  add column if not exists pitch_at timestamptz;

-- kind — что отправить: текст или кружок из «Избранного» аккаунта.
-- send_after — не раньше этого времени: мгновенный ответ выглядит как робот.
alter table public.outreach_messages
  add column if not exists kind text not null default 'text' check (kind in ('text', 'circle')),
  add column if not exists send_after timestamptz;
