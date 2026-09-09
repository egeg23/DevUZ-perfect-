-- Откат 0004. Пишется вместе с миграцией, а не когда понадобится:
-- под давлением его пишут неправильно.
--
-- Порядок обратный созданию — сначала то, что ссылается, потом то, на что
-- ссылаются. Триггер снимается явно: без этого drop table на audit_events
-- отработает, но при повторном накате останется висеть старая функция.
drop trigger if exists audit_events_no_update on public.audit_events;
drop table if exists public.audit_events;
drop function if exists public.audit_events_append_only();
drop table if exists public.login_tokens;
drop table if exists public.staff_sessions;
drop table if exists public.staff;
