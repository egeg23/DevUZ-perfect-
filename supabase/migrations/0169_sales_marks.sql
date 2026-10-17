-- Ступени продажи — отметки менеджера (lib/admin/sales-stages.ts).
--
-- Владелец, 17.10.2026: «Делаем все по твоим рекомендациям, они правдивые».
-- За 30 дней 886 «лидов» и ни одного «Выиграли»: лидом считалось почти
-- каждое касание, и не было видно, где застревает продажа. Ступени
-- (ответил → интерес → макет → показ → цена названа → оплата) считаются по
-- базе; две из них сама база не знает — показал ли менеджер макет (по видео
-- или вживую) и назвал ли цену в разговоре. Их отмечает человек, здесь.
--
-- Одна строка — одна отметка: кто, когда, по какому лиду или касанию.
-- Каждая отметка пишется ещё и в журнал (audit_events, lead.sales_marked).
create table if not exists public.sales_marks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('interest', 'shown', 'priced')),
  lead_id uuid references public.leads (id) on delete cascade,
  prospect_id uuid references public.prospects (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete set null,
  via text check (via in ('video', 'live')),
  amount_usd integer check (amount_usd > 0 and amount_usd <= 1000000),
  check (lead_id is not null or prospect_id is not null),
  check (kind = 'shown' or via is null),
  check (kind = 'priced' or amount_usd is null)
);

create index if not exists sales_marks_created_idx on public.sales_marks (created_at);
create index if not exists sales_marks_lead_idx on public.sales_marks (lead_id) where lead_id is not null;
create index if not exists sales_marks_prospect_idx on public.sales_marks (prospect_id) where prospect_id is not null;

alter table public.sales_marks enable row level security;

comment on table public.sales_marks is
  'Отметки ступеней продажи, которых база сама не знает: «Есть интерес», «Показал макет» (по видео или вживую), «Назвал цену» с суммой.';
comment on column public.sales_marks.via is
  'Как показан макет: video — по видео, live — вживую. Только у kind = shown.';
comment on column public.sales_marks.amount_usd is
  'Названная клиенту цена, $. Только у kind = priced.';
