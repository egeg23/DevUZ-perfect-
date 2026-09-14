-- Передача лида другому сотруднику.
--
-- Владелец: «менеджерам не надо видеть чужих лидов после взятия в работу.
-- Сотрудник может передать его другому сотруднику с подтверждением
-- руководителя или мной.»
--
-- Отсюда два следствия. Первое — видимость: менеджер видит свободных и
-- своих, чужие взятые ему не показываются; это правило в коде, отдельной
-- таблицы не требует. Второе — здесь: просьба передать, которую решает
-- руководитель или владелец.
--
-- Просьба не меняет владельца сама. Лид остаётся у прежнего менеджера,
-- пока решение не принято: иначе отказ пришлось бы откатывать, а лид в это
-- время висел бы между двумя людьми.

create table if not exists public.lead_transfers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  lead_id uuid not null references public.leads(id) on delete cascade,

  -- У кого лид на момент просьбы. Пусто, если лид был ничей.
  from_staff_id uuid references public.staff(id) on delete set null,
  -- Кому передать. Ссылка строгая: сотрудника не удаляют, а отключают.
  to_staff_id uuid not null references public.staff(id),
  requested_by uuid not null references public.staff(id),

  note text check (note is null or length(note) <= 500),

  status text not null default 'requested'
    check (status in ('requested', 'approved', 'declined')),

  decided_by uuid references public.staff(id) on delete set null,
  decided_at timestamptz
);

comment on table public.lead_transfers is
  'Просьбы передать лид другому сотруднику. Решает руководитель или владелец.';

-- Одна открытая просьба на лид: вторая поверх первой означала бы, что
-- руководитель решает за лид, которого уже нет у просившего.
create unique index if not exists lead_transfers_open_idx
  on public.lead_transfers (lead_id)
  where status = 'requested';

create index if not exists lead_transfers_lead_idx
  on public.lead_transfers (lead_id);

-- Очередь на решение: её читают на странице лидов у руководителя и владельца.
create index if not exists lead_transfers_pending_idx
  on public.lead_transfers (created_at)
  where status = 'requested';

alter table public.lead_transfers enable row level security;
