-- ИИ-сотрудники: канал Instagram Direct.
--
-- Instagram API с входом через Instagram: владелец профессионального
-- аккаунта нажимает «Подключить Instagram» в кабинете, Meta отдаёт токен
-- на 60 дней, который свип продлевает заранее. Покупатель пишет в Direct —
-- вебхук /api/ai-staff/instagram, ИИ отвечает в течение 24 часов после
-- сообщения покупателя, как и в Telegram Business: первым не пишет никому.

alter table public.ai_channels drop constraint if exists ai_channels_kind_check;
alter table public.ai_channels add constraint ai_channels_kind_check
  check (kind in ('tg_business', 'tg_bot', 'widget', 'instagram'));

alter table public.ai_conversations drop constraint if exists ai_conversations_kind_check;
alter table public.ai_conversations add constraint ai_conversations_kind_check
  check (kind in ('tg_business', 'tg_bot', 'widget', 'test', 'instagram'));

-- Когда истекает токен канала (Instagram — 60 дней, продлевается свипом).
alter table public.ai_channels add column if not exists token_expires_at timestamptz;
