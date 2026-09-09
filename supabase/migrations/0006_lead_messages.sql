-- Внутреннее обсуждение лида.
--
-- Это тот пункт, ради которого панель просили в первую очередь: пока
-- менеджеры договариваются о клиенте в личных телеграмах, никто не знает,
-- что именно было сказано и кому лид ушёл на самом деле. Здесь разговор о
-- лиде живёт рядом с лидом и виден всей команде.
--
-- Видно всем сотрудникам намеренно, а не только владельцу. Обсуждение,
-- закрытое от остальных, ничем не отличается от личной переписки — а
-- отличаться оно должно именно этим.

create table if not exists public.lead_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  lead_id uuid not null references public.leads(id) on delete cascade,

  -- Автор не удаляется вместе с уходом из студии: сообщение без автора
  -- превращает обсуждение в анонимку. Сотрудник отключается флагом.
  author_staff_id uuid not null references public.staff(id),

  body text not null check (length(btrim(body)) between 1 and 4000),

  -- Правки видны: изменённое задним числом обсуждение доказывает не больше,
  -- чем подчищенный журнал.
  edited_at timestamptz
);

create index if not exists lead_messages_lead_idx
  on public.lead_messages (lead_id, created_at);

create index if not exists lead_messages_author_idx
  on public.lead_messages (author_staff_id, created_at desc);

comment on table public.lead_messages is
  'Внутреннее обсуждение лида. Видно всем сотрудникам — в этом и смысл.';

alter table public.lead_messages enable row level security;
