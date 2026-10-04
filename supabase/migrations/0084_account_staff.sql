-- Рабочие аккаунты: руководитель, менеджеры на аккаунте и предел 3 в час.
--
-- Владелец, 04.10.2026: «Дай доступ к разделу „Аккаунты“ Александру, чтобы он
-- мог добавлять аккаунты сам. Там же сделай возможность добавлять, какие
-- менеджеры работают на этом аккаунте. Один и тот же менеджер может работать
-- более чем на одном аккаунте». И: «3 сообщения новым пользователям в час».
--
-- tg_account_staff — кто работает на аккаунте. account_key — id строки
-- tg_accounts или 'main' (главный аккаунт из SCOUT_SESSION, строки у него
-- нет). Письма сотрудника берут только его аккаунты; не привязан ни к
-- одному — любой, как раньше.

alter table public.tg_accounts drop constraint if exists tg_accounts_hourly_cap_check;
alter table public.tg_accounts
  add constraint tg_accounts_hourly_cap_check check (hourly_cap between 1 and 3);
alter table public.tg_accounts alter column hourly_cap set default 3;

create table if not exists public.tg_account_staff (
  account_key text not null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id) on delete set null,
  primary key (account_key, staff_id)
);

comment on table public.tg_account_staff is
  'Кто работает на рабочем аккаунте Telegram: account_key — id из tg_accounts или main. Письма сотрудника уходят только с его аккаунтов.';

create index if not exists tg_account_staff_staff on public.tg_account_staff (staff_id);

alter table public.tg_account_staff enable row level security;
