-- Секреты приложения из хранилища Supabase (Vault).
--
-- 23 сентября владелец прислал ключ Google Places и попросил «сделай сам»,
-- а у сессии, которая ведёт код, нет доступа к серверу и его .env: выкатка
-- секреты туда не пишет намеренно. Зато есть база. Ключ кладётся в Vault —
-- там он зашифрован, — а приложение читает его этой функцией, если в .env
-- такой переменной нет. .env важнее: поменять ключ на сервере по-прежнему
-- можно, ничего не трогая здесь.
--
-- Только имена с префиксом «app.»: функция не отдаёт чужие секреты Vault,
-- даже если их туда когда-нибудь положат для другого. Вызывать может только
-- service_role — сервер приложения. По умолчанию функции в Postgres
-- доступны PUBLIC, поэтому revoke обязателен, а не для порядка.
create or replace function public.app_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = p_name
    and p_name like 'app.%'
  limit 1
$$;

revoke all on function public.app_secret(text) from public, anon, authenticated;
grant execute on function public.app_secret(text) to service_role;
