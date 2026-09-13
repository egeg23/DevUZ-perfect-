drop index if exists public.staff_head_idx;
alter table public.staff drop column if exists head_staff_id;

-- Руководители становятся менеджерами: иначе прежнее ограничение не встанет.
update public.staff set role = 'manager' where role = 'head';
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff
  add constraint staff_role_check check (role in ('admin', 'manager'));
