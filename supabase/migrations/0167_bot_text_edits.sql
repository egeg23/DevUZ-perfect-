-- «✏️ Изменить текст» под карточкой касания в боте (lib/admin/bot-text-edit.ts).
--
-- Владелец, 16.10.2026: «можем ли мы сделать как в панели, чтобы через бота
-- можно было редактировать текст?» Бот присылает текст и просит прислать
-- исправленный ответом на это сообщение. Ответ в Telegram знает только номер
-- сообщения, на которое отвечает, — здесь по нему и видно, какая это
-- карточка и кто начинал правку. Просьба живёт сутки; старые строки
-- удаляются при следующей просьбе.
create table if not exists public.bot_text_edits (
  chat_id bigint not null,
  prompt_message_id bigint not null,
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, prompt_message_id)
);

comment on table public.bot_text_edits is
  'Просьбы «пришлите исправленный текст» в боте: номер сообщения-просьбы → карточка касания и сотрудник. Живут сутки.';

create index if not exists bot_text_edits_created on public.bot_text_edits (created_at);

alter table public.bot_text_edits enable row level security;
