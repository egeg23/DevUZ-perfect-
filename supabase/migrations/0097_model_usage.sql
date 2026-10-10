-- Расход модели: каждый вызов Claude с меткой места, откуда звали.
--
-- До 10.10.2026 расход нигде не записывался, и разведка «что из ИИ можно
-- перевести в код» опиралась на оценки по коду. Пишет lib/model-road.ts
-- (anthropic(site)) в фоне, по копии ответа — и обычные ответы, и поток чата.
--
-- site  — узел: outreach-letter, razbor-article, qualify-chat, scout-classify…
-- model — модель, которая ответила (с fallbacks может отличаться от заказанной);
-- road  — дорога: proxy или proxyapi (через ProxyAPI списывается в рублях).
create table if not exists public.model_usage (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  site text not null,
  model text not null default '',
  road text not null default 'proxy',
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cache_write_tokens integer not null default 0 check (cache_write_tokens >= 0),
  cache_read_tokens integer not null default 0 check (cache_read_tokens >= 0)
);

comment on table public.model_usage is
  'Расход модели по местам вызова: токены входа, выхода и кэша, модель, дорога. Пишет lib/model-road.ts.';

create index if not exists model_usage_at on public.model_usage (at);
create index if not exists model_usage_site_at on public.model_usage (site, at);

alter table public.model_usage enable row level security;
