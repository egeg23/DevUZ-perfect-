-- Оплаченная заявка Claudery — проект с платежом.
--
-- Владелец, 17.11.2026: «По этим лидам: менеджер получает 40% от суммы,
-- остальное получаем мы с Александром в нашей пропорции. Клиенты оплатившие
-- сразу должны учитываться в доходе и зарплате менеджера и в нашей
-- статистике». Деньги в панели живут при проекте (0017_finance.sql), поэтому
-- оплата в боте сама заводит проект и платёж; правило 40% — в коде
-- (lib/admin/finance.ts, CLAUDERY_MANAGER_PERCENT), здесь только метка.

alter table public.projects
  add column if not exists product text
    check (product is null or product in ('claudery'));

comment on column public.projects.product is
  'Продукт студии, у которого свои правила денег. claudery — помощь с ИИ из бота: менеджеру 40% с суммы, остальное соучредителям.';

-- Одна заявка — один проект: повторная проверка оплаты второго не заведёт.
create unique index if not exists projects_claudery_lead_uidx
  on public.projects (lead_id)
  where product = 'claudery' and lead_id is not null;

-- Клиент оплатил раньше, чем лид взяли: проект без ведущего. Кто возьмёт
-- лид (любым путём: «Взять», «Отдать», бот), тот и ведёт проект — и его 40%.
create or replace function public.claudery_project_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_staff_id is not null
     and new.assigned_staff_id is distinct from old.assigned_staff_id then
    update public.projects
       set owner_staff_id = new.assigned_staff_id
     where lead_id = new.id
       and product = 'claudery'
       and owner_staff_id is null;
  end if;
  return new;
end $$;

create or replace trigger claudery_project_owner
  after update of assigned_staff_id on public.leads
  for each row execute function public.claudery_project_owner();
