-- Рассылка в бот всей команде — с «Главной» (lib/admin/broadcast-store.ts).
--
-- Владелец, 13.10.2026: «запустить рассылку в бот с нашего сервиса для
-- всех (понадобится, чтобы руководитель оповещал через бот о созвонах)».
--
-- Состав получателей замораживается при отправке (recipients): в
-- предпросмотре человек видел число и имена — уходит ровно им. Кому уже
-- ушло — team_news_sent с ключом «broadcast:<id>», как у объявлений:
-- отметка до сообщения, первичный ключ не даст отправить дважды.
create table if not exists public.staff_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid references public.staff(id) on delete set null,
  text text not null check (char_length(text) between 1 and 2000),
  -- Кому: все, по ролям или выбранные люди — для истории («кому»).
  audience text not null check (audience in ('all', 'roles', 'pick')),
  roles text[] not null default '{}',
  recipients uuid[] not null default '{}',
  -- Когда уходит. Ночью (23:00–07:00 по Ташкенту) — только с night_ok.
  send_at timestamptz not null default now(),
  night_ok boolean not null default false,
  cancelled_at timestamptz,
  cancelled_by uuid references public.staff(id) on delete set null,
  -- Ушло всем, кому можно, или сдались через сутки.
  done_at timestamptz
);

comment on table public.staff_broadcasts is
  'Рассылки команде в бот с «Главной»: текст, кому, когда; доставка — team_news_sent «broadcast:<id>».';

create index if not exists staff_broadcasts_due
  on public.staff_broadcasts (send_at) where done_at is null and cancelled_at is null;
create index if not exists staff_broadcasts_created on public.staff_broadcasts (created_at desc);

alter table public.staff_broadcasts enable row level security;
