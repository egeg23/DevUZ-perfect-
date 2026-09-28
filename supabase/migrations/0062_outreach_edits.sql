-- Правка уже отправленного касания.
--
-- 28 сентября четыре мебельные компании получили с рабочего аккаунта письма,
-- где примером «из вашей ниши» стоял USTA — маркетплейс мастеров. Владелец:
-- «отредактируй сообщения, которые мы отправили, и вставь по их нише
-- корректную ссылку». Telegram позволяет править своё сообщение 48 часов,
-- но править его может только тот, кто отправил, — рабочий аккаунт, то есть
-- процесс скаута. Отсюда очередь: строка здесь — «замени текст письма этого
-- касания на этот», скаут забирает и правит.
--
-- Прежний текст хранится в строке: письмо уже прочитано, и через месяц
-- вопрос «что человек видел сначала» иначе не с чем сопоставить.
create table if not exists public.outreach_edits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  body text not null,
  previous text,
  reason text,
  done_at timestamptz,
  failure text
);

create index if not exists outreach_edits_pending
  on public.outreach_edits (created_at)
  where done_at is null and failure is null;

alter table public.outreach_edits enable row level security;

comment on table public.outreach_edits is
  'Правки отправленных касаний: скаут меняет текст письма в Telegram (48 часов после отправки), prospects.message и ленту переписки.';
