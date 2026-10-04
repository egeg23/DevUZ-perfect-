-- Статьи о маркетинге внизу страницы /{ru|uz}/marketing.
--
-- Владелец, 04.10.2026: «внизу этой страницы добавь самописные статьи,
-- которые бы толкали SEO для Google и Яндекса… короткие, с крутыми кейсами
-- маркетинга, частые ошибки… на автомате 1–2 статьи в день».
--
-- Пишет их свип (lib/marketing/articles-run.ts) недорогой моделью, по теме
-- из content/marketing-topics.ts, сразу на двух языках. Одна строка — одна
-- тема: topic_key уникален, вторую статью на ту же тему смена не напишет.
-- Публикуется сразу, без проверки человеком: тексты проходят проверку кодом
-- (длина, язык, ни одного числа, которого нет в фактах темы), а снять
-- статью можно, поставив status = 'hidden'.

create table if not exists public.marketing_articles (
  id bigint generated always as identity primary key,
  topic_key text not null unique,
  kind text not null check (kind in ('case', 'mistake', 'niche')),
  slug text not null unique,
  ru jsonb not null,
  uz jsonb not null,
  source_url text,
  model text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  published_at timestamptz not null default now()
);

comment on table public.marketing_articles is
  'Статьи о маркетинге: одна строка — одна тема на русском и узбекском. Пишет свип, публикуются сразу; hidden — снять с сайта.';
comment on column public.marketing_articles.ru is
  'Русская статья: {title, description, paragraphs[], tips[]}.';
comment on column public.marketing_articles.uz is
  'Узбекская статья (латиница): {title, description, paragraphs[], tips[]}.';

create index if not exists marketing_articles_published
  on public.marketing_articles (published_at desc) where status = 'published';

-- Читает и пишет только сервер ключом службы; снаружи таблицы не видно.
alter table public.marketing_articles enable row level security;
