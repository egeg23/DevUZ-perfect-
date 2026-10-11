-- ИИ-сотрудник «Блогеры»: переписка ведёт агент — в Direct студии и в Telegram.
--
-- Блогер ответил в Direct Instagram-аккаунту студии — разговор ведёт агент
-- через официальный API (окно 24 часа, lib/ai-staff/instagram.ts): отвечает
-- на вопросы о программе, просит скриншоты статистики и разбирает их моделью
-- с картинками. В Telegram — то же, сообщения отправляет скаут
-- (docs/ai-staff/bloggers.md).

-- До какого времени разговор ведёт человек: он сам написал блогеру
-- с аккаунта студии или нажал «Вести самому». Агент в это время молчит.
alter table public.bloggers add column if not exists human_until timestamptz;
-- Агенту пора ответить (сообщение пришло в Telegram, ответ напишет свип).
alter table public.bloggers add column if not exists agent_due_at timestamptz;
-- Скриншоты из Telegram до разбора: base64, не больше четырёх. После разбора
-- стираются — хранится только вывод (audience).
alter table public.bloggers add column if not exists inbox_images jsonb;

create index if not exists bloggers_agent_due on public.bloggers (agent_due_at) where agent_due_at is not null;
