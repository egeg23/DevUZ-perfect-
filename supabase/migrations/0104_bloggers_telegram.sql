-- ИИ-сотрудник «Блогеры»: «Здравствуйте» в Telegram с рабочих аккаунтов.
--
-- Блогеру с Telegram в шапке профиля первым уходит только приветствие —
-- по правилам касаний (lib/admin/hello-first.ts): предел в час на аккаунт,
-- окно отправки, ограничения аккаунта. Ответил — следом уходит текст о
-- партнёрской программе с того же аккаунта (docs/ai-staff/bloggers.md).

-- С какого рабочего аккаунта ушло «Здравствуйте» и кому: с него же идёт и переписка.
alter table public.bloggers add column if not exists tg_account text;
alter table public.bloggers add column if not exists tg_user_id text;
-- Что скауту отправить блогеру в Telegram следующим сообщением и с какого времени.
alter table public.bloggers add column if not exists tg_pending text;
alter table public.bloggers add column if not exists tg_pending_at timestamptz;

create index if not exists bloggers_tg_user on public.bloggers (tg_user_id) where tg_user_id is not null;
create index if not exists bloggers_tg_pending on public.bloggers (tg_account, tg_pending_at) where tg_pending is not null;
