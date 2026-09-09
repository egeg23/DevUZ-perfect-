-- Откат 0005. Пишется вместе с миграцией.
--
-- Колонки в leads снимаются последними: на них ссылается индекс, а на
-- assigned_staff_id — ещё и внешний ключ на staff.
drop table if exists public.lead_reminders;

drop index if exists public.leads_unassigned_idx;
drop index if exists public.leads_assigned_idx;

alter table public.leads
  drop column if exists auto_reminder,
  drop column if exists contact_revealed_by,
  drop column if exists contact_revealed_at,
  drop column if exists assigned_staff_id;
