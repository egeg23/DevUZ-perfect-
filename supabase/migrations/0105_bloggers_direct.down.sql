drop index if exists public.bloggers_agent_due;
alter table public.bloggers drop column if exists inbox_images;
alter table public.bloggers drop column if exists agent_due_at;
alter table public.bloggers drop column if exists human_until;
