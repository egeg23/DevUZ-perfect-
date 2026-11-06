-- Группы для скаута — таблица вместо строки stats_snapshots «scout-chats».
--
-- Владелец, 06.11.2026: «В разделе находки скаута сделай возможность
-- добавлять группы для отслеживания всем. Чтобы и менеджеры и мы прямо там
-- могли добавлять группы и скаут их мониторил. В день самостоятельно не
-- более 10 подписок на группы с интервалом 1-2 часа».
--
-- Строку добавляет человек из панели, скаут (scout/runner.mjs) вступает сам:
-- не больше 10 в день, пауза 1–2 часа (lib/scout/extra-chats.ts), и пишет
-- обратно номер чата и итог. Таблица, а не одна строка JSON: панель и скаут
-- пишут одновременно, и целая строка затирала бы чужую правку.

create table if not exists public.scout_chats (
  id uuid primary key default gen_random_uuid(),
  -- Публичный адрес без @; у закрытой группы — пусто, вместо него invite.
  handle text,
  -- Ключ ссылки-приглашения t.me/+… или t.me/joinchat/….
  invite text,
  title text,
  -- Номер чата, который вернул Telegram (с -100).
  chat_id text,
  status text not null default 'pending',
  error text,
  note text,
  added_by uuid references public.staff(id) on delete set null,
  added_at timestamptz not null default now(),
  tried_at timestamptz,
  joined_at timestamptz,
  -- Кто вступил: 'scout' — сам, 'manual' — человек руками.
  joined_via text,
  removed_at timestamptz,
  removed_by uuid references public.staff(id) on delete set null,
  constraint scout_chats_target check (handle is not null or invite is not null),
  constraint scout_chats_handle_check check (handle is null or handle ~ '^[A-Za-z0-9_]{4,32}$'),
  constraint scout_chats_invite_check check (invite is null or invite ~ '^[A-Za-z0-9_-]{8,64}$'),
  constraint scout_chats_status_check check (status in ('pending', 'joined', 'request', 'error')),
  constraint scout_chats_via_check check (joined_via is null or joined_via in ('scout', 'manual'))
);

create unique index if not exists scout_chats_handle_key
  on public.scout_chats (lower(handle)) where handle is not null and removed_at is null;
create unique index if not exists scout_chats_invite_key
  on public.scout_chats (invite) where invite is not null and removed_at is null;
create index if not exists scout_chats_open_idx on public.scout_chats (added_at) where removed_at is null;

alter table public.scout_chats enable row level security;

-- Список, собранный 06.11.2026 (61 группа), — из строки stats_snapshots.
-- Номера, которые скаут уже узнал, и отметки «не откроется» — тоже.
insert into public.scout_chats (handle, note, chat_id, status, error, added_at)
select item->>'name', item->>'note',
       case when (item->>'id') ~ '^-?[0-9]+$' then item->>'id' end,
       case when coalesce(item->>'error', '') <> '' then 'error' else 'pending' end,
       nullif(item->>'error', ''),
       -- Порядок списка — порядок вступления.
       now() + n * interval '1 millisecond'
from public.stats_snapshots s, jsonb_array_elements(s.payload->'chats') with ordinality as t(item, n)
where s.key = 'scout-chats'
  and (item->>'name') ~ '^[A-Za-z0-9_]{4,32}$'
on conflict do nothing;

delete from public.stats_snapshots where key = 'scout-chats';
