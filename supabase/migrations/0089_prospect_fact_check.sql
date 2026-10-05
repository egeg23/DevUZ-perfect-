-- Проверка сайта по факту перед письмом (lib/audit/verify.ts).
--
-- Правило владельца, 05.10.2026: письмо о сайте пишется только после того,
-- как сайт перепроверен по факту. Когда перепроверили и что не повторилось —
-- в карточку «Касаний»: без свежей проверки письмо не отправляется.
alter table public.prospects
  add column if not exists checked_at timestamptz,
  add column if not exists check_dropped jsonb not null default '[]'::jsonb;

comment on column public.prospects.checked_at is
  'Когда сайт перепроверили по факту перед письмом. Пусто — письмо писалось до правила.';
comment on column public.prospects.check_dropped is
  'Находки, которые на повторной загрузке не подтвердились и в письмо не пошли: [{code, title, why}].';
