-- Процент по конкретной сделке.
--
-- Владелец: «лучше, чтобы у админа была возможность выставлять каждому %
-- от конкретной сделки — только по закреплённым за человеком». Ставка по
-- грейду остаётся умолчанием; здесь — исключения по одному проекту, и
-- только для тех, кто к нему привязан: кто ведёт проект и его руководитель.
-- Нет строки — считается по грейду.

create table if not exists public.project_shares (
  project_id uuid not null references public.projects(id) on delete cascade,
  staff_id uuid not null references public.staff(id),

  percent smallint not null check (percent between 0 and 100),

  set_by uuid references public.staff(id) on delete set null,
  updated_at timestamptz not null default now(),

  primary key (project_id, staff_id)
);

comment on table public.project_shares is
  'Процент от прибыли по конкретному проекту, заданный владельцем вручную. Нет строки — по грейду.';

alter table public.project_shares enable row level security;
