-- Статьи на чужих площадках — vc.ru, Дзен, Tenchat (lib/outside/).
--
-- Владелец, 07.11.2026: «Хочу автоматизировать статьи на тех площадках, где
-- ты написал», на план — «Делаем по твоей рекомендации». Раз в неделю модель
-- пишет по черновику на площадку (status = 'ready'), человек копирует его в
-- редактор площадки, публикует и вставляет ссылку ('published'); ненужный
-- черновик — 'skipped'. Код раз в неделю открывает опубликованную статью и
-- пишет, стоит ли там ссылка на нас и передаёт ли она вес (link_state).

create table if not exists public.outside_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  topic_key text not null,
  query text not null,
  title text not null,
  -- Текст с разметкой: «## » подзаголовки, «• » пункты, «[текст](адрес)» ссылки.
  -- Ссылки без меток Метрики: метки ставятся при копировании.
  body text not null,
  -- Что ответили Вордстат и Trends по запросу (lib/seo/keywords.ts).
  research jsonb not null default '{}'::jsonb,
  model text,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  published_url text,
  published_at timestamptz,
  published_by uuid references public.staff(id) on delete set null,
  skipped_at timestamptz,
  skipped_by uuid references public.staff(id) on delete set null,
  link_checked_at timestamptz,
  link_state text,
  link_rel text,
  constraint outside_posts_platform_check check (platform in ('vcru', 'dzen', 'tenchat')),
  constraint outside_posts_status_check check (status in ('ready', 'published', 'skipped')),
  constraint outside_posts_link_state_check check (link_state is null or link_state in ('follow', 'nofollow', 'missing', 'unreachable')),
  constraint outside_posts_url_check check (published_url is null or published_url ~ '^https://'),
  -- Одна тема на площадку — один раз.
  constraint outside_posts_topic_key unique (platform, topic_key)
);

create index if not exists outside_posts_created_idx on public.outside_posts (created_at desc);
create index if not exists outside_posts_ready_idx on public.outside_posts (platform) where status = 'ready';

alter table public.outside_posts enable row level security;
