-- Голосовое → текст: владелец или руководитель пересылает боту голосовое,
-- расшифровывает его задача GitHub Actions, текст бот присылает в тот же чат
-- (lib/admin/voice-notes.ts).
--
-- Владелец, 14.10.2026: «Я не могу скачать его. Только переслать. Давай я
-- боту перешлю, а ты сам закинешь и через гит расшифруем».
--
-- Сервер голос не слушает: модель расшифровки тяжёлая, а на боевом сервере
-- живут ещё полтора десятка сайтов (CLAUDE.md, «Сервер не собирает сайт»).
-- Здесь только очередь: что прислали, кому вернуть текст и чем кончилось.
create table if not exists public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff (id) on delete set null,
  chat_id bigint not null,
  message_id bigint not null,
  file_id text not null,
  mime text,
  duration integer,
  bytes integer,
  status text not null default 'queued' check (status in ('queued', 'working', 'done', 'failed')),
  tries integer not null default 0,
  text text,
  language text,
  error text,
  created_at timestamptz not null default now(),
  taken_at timestamptz,
  done_at timestamptz,
  unique (chat_id, message_id)
);

create index if not exists voice_notes_open_idx on public.voice_notes (created_at) where status in ('queued', 'working');

alter table public.voice_notes enable row level security;

comment on table public.voice_notes is
  'Голосовые, присланные боту владельцем или руководителем: очередь на расшифровку в GitHub Actions и готовый текст.';
comment on column public.voice_notes.tries is
  'Сколько раз задача расшифровки забирала голос. После третьей неудачи — failed и строка в чат.';
