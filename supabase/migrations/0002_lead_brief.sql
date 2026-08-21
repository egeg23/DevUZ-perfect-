-- Поля брифа: то, что нужно менеджеру, чтобы продолжить разговор, а не
-- пересказывать его заново.
--
-- Хранятся отдельно от summary намеренно: summary отвечает на вопрос «что за
-- лид» и нужен руководителю для отчёта, а эти три поля отвечают на вопрос
-- «что сказать первым» и нужны продавцу в момент, когда он открывает чат.

alter table public.leads
  add column if not exists contact_kind text
    check (contact_kind in ('telegram', 'phone', 'email', 'none')),
  add column if not exists opening_line text,
  add column if not exists already_told jsonb not null default '[]'::jsonb,
  add column if not exists avoid_asking jsonb not null default '[]'::jsonb;

comment on column public.leads.opening_line is
  'Готовая первая фраза менеджера на языке клиента.';
comment on column public.leads.already_told is
  'Что ассистент уже озвучил клиенту — менеджер не должен этому противоречить.';
comment on column public.leads.avoid_asking is
  'Что клиент уже сообщил — переспрашивать нельзя.';
