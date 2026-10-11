drop table if exists public.ai_bloggers;
alter table public.ai_employees drop column if exists brief;
delete from public.ai_employees where role = 'bloggers';
alter table public.ai_employees drop constraint if exists ai_employees_role_check;
alter table public.ai_employees add constraint ai_employees_role_check check (role in ('sales', 'smm', 'analyst'));
