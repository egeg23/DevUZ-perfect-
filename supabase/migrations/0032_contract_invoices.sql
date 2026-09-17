-- Счёт на оплату выходит вместе с подписанным договором.
--
-- Владелец: «выставление счёта должно идти вместе с подписанным договором от
-- меня и появляться у менеджера и клиента».
--
-- Счёт привязан к этапу, а не к договору целиком. По договору каждый этап
-- оплачивается авансом в 100% его стоимости; счёт на всю сумму противоречил
-- бы тексту, под которым стоит подпись, и первый же бухгалтер заказчика это
-- заметит.
create table if not exists public.contract_invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contract_id uuid not null references public.contracts(id) on delete cascade,

  /** Какой этап оплачивается: 0 — первый. */
  stage_index smallint not null check (stage_index >= 0),
  number text not null,
  amount_usd numeric(12, 2) not null check (amount_usd > 0),

  issued_at date not null default current_date,
  /** До какой даты ждём оплату. Считается от срока из реквизитов студии. */
  due_at date not null,
  paid_at timestamptz,

  /** Кто выставил. Первый счёт выставляет подтверждение договора. */
  issued_by uuid references public.staff(id) on delete set null
);

-- Два счёта на один этап — это два платежа за одну работу. Один из них
-- окажется лишним, и выяснится это при сверке, а не при выставлении.
create unique index if not exists contract_invoices_stage_once
  on public.contract_invoices (contract_id, stage_index);

create unique index if not exists contract_invoices_number
  on public.contract_invoices (number);

create index if not exists contract_invoices_unpaid
  on public.contract_invoices (due_at) where paid_at is null;

alter table public.contract_invoices enable row level security;

-- Ссылка для заказчика: одна на договор, а не на каждый счёт.
--
-- Хранится хеш, а не сам токен: дамп базы не должен открывать чужие
-- договоры. Показать ссылку второй раз поэтому нельзя — только выпустить
-- новую, и старая тут же перестаёт работать.
alter table public.contracts add column if not exists access_hash text;
create unique index if not exists contracts_access_hash on public.contracts (access_hash)
  where access_hash is not null;
