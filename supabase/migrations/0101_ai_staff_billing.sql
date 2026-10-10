-- ИИ-сотрудники: оплата картой (Payme, Click) и ежедневный отчёт клиенту.
--
-- Счёт (ai_invoices) — что клиент выбрал в кабинете: тариф, месяцы, сумма.
-- Транзакция (ai_pay_tx) — что о счёте сказала платёжная система: Payme
-- присылает свой id и время в миллисекундах, Click — click_trans_id. Один
-- счёт может пережить несколько отменённых попыток, оплачивается один раз.
-- Оплаченный счёт продлевает тариф той же записью в ai_payments, что и
-- отметка владельца студии руками.

create table if not exists public.ai_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.ai_tenants (id) on delete cascade,
  plan text not null check (plan in ('start', 'business', 'pro')),
  months integer not null check (months between 1 and 12),
  amount_uzs bigint not null check (amount_uzs > 0),
  provider text check (provider in ('payme', 'click')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.ai_invoices is 'ИИ-сотрудники: счета на оплату тарифа картой (Payme, Click).';
create index if not exists ai_invoices_tenant on public.ai_invoices (tenant_id, created_at desc);

create table if not exists public.ai_pay_tx (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('payme', 'click')),
  ext_id text not null,
  invoice_id uuid not null references public.ai_invoices (id) on delete cascade,
  amount_tiyin bigint not null,
  -- Состояние по Payme: 1 создана, 2 проведена, -1 отменена до проведения, -2 после.
  state integer not null default 1,
  create_time bigint not null,
  perform_time bigint not null default 0,
  cancel_time bigint not null default 0,
  reason integer,
  -- Время транзакции у самой платёжной системы (Payme присылает его в CreateTransaction).
  provider_time bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (provider, ext_id)
);
comment on table public.ai_pay_tx is 'ИИ-сотрудники: транзакции Payme и Click по счетам.';
create index if not exists ai_pay_tx_invoice on public.ai_pay_tx (invoice_id);

-- Ежедневный отчёт клиенту в Telegram: дата последнего, чтобы не слать дважды.
alter table public.ai_tenants add column if not exists report_sent_on date;

alter table public.ai_invoices enable row level security;
alter table public.ai_pay_tx enable row level security;
