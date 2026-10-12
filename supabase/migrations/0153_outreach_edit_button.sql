-- Кнопка «Исправить» у отправленного письма касания (владелец, 12.10.2026:
-- «Оптимизация скрипта, чтобы манагеры редачили касания»).
--
-- Очередь правок (0062_outreach_edits) знала только номер первого сообщения
-- касания — prospects.sent_message_id. С 07.10.2026 первым уходит
-- «Здравствуйте», а письмо и ответы — отдельными сообщениями после ответа
-- клиента (outreach_messages), и их номеров в Telegram мы не хранили: править
-- было нечего, кроме приветствия, а его править нельзя.
--
-- tg_message_id — номер сообщения в переписке, его пишет скаут при отправке
-- (markReplySent). message_id у правки — какую реплику ленты править.
-- staff_id — кто нажал «Исправить»: ответ скаута показывается ему же.
alter table public.outreach_messages
  add column if not exists tg_message_id bigint;

alter table public.outreach_edits
  add column if not exists message_id uuid references public.outreach_messages (id) on delete cascade,
  add column if not exists staff_id uuid references public.staff (id) on delete set null;

-- Последняя правка каждой карточки и реплики — то, что видно под кнопкой.
create index if not exists outreach_edits_prospect
  on public.outreach_edits (prospect_id, created_at desc);

alter table public.outreach_edits enable row level security;

comment on column public.outreach_messages.tg_message_id is
  'Номер отправленного сообщения в переписке Telegram: по нему «Исправить» правит именно его (outreach_edits.message_id).';
