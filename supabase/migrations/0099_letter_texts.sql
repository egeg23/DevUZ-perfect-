-- Тексты писем касания и A/B между ними (lib/admin/letter-texts.ts).
--
-- Владелец, 10.10.2026: менеджеры жаловались, что письмо модели длинное и в
-- цифрах, и прогоняли его через нейросеть. Теперь текст письма — свой у
-- менеджера (owner_id), общий у команды (owner_id is null) или заход
-- автопрогона из кода; факты о сайте подставляются тезисами.
--
-- Два текста на владельца: слоты a и b — это и есть A/B. Правка не меняет
-- строку, а убирает старую в архив (archived_at) и заводит новую: статистика
-- считается по тексту, который на самом деле уходил.
create table if not exists public.letter_texts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.staff (id) on delete cascade,
  slot text not null check (slot in ('a', 'b')),
  body text not null check (char_length(body) between 20 and 1500),
  body_uz text check (body_uz is null or char_length(body_uz) between 20 and 1500),
  created_at timestamptz not null default now(),
  created_by uuid references public.staff (id) on delete set null,
  archived_at timestamptz
);

comment on table public.letter_texts is
  'Тексты писем касания: свои у менеджера (owner_id), общие у команды (owner_id is null), слоты a/b для A/B. Пишет lib/admin/letter-texts-store.ts.';

create unique index if not exists letter_texts_live
  on public.letter_texts (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), slot)
  where archived_at is null;

alter table public.letter_texts enable row level security;

-- Каким текстом ушло письмо: text:<uuid> — из letter_texts, auto:<ключ> —
-- заход автопрогона (AUTO_ARMS), null — письмо модели или до 10.10.2026.
alter table public.prospects add column if not exists letter_variant text;

create index if not exists prospects_letter_variant on public.prospects (letter_variant)
  where letter_variant is not null;
