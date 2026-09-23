-- Запись секретов приложения в хранилище Supabase (Vault) из самой панели.
--
-- 23 сентября Google не дал владельцу выпустить ключ сервисного аккаунта
-- (политика организации iam.disableServiceAccountKeyCreation), и Google
-- Analytics подключается входом через Google: владелец нажимает кнопку во
-- вкладке «Трафик», Google возвращает постоянный доступ только на чтение
-- статистики. Этот доступ — такой же секрет, как ключ, и лежать ему место в
-- Vault рядом с остальными (0055). Кладёт его сервер приложения, поэтому
-- нужна функция записи — читать и писать Vault напрямую service_role не
-- может.
--
-- Те же ограничения, что у чтения: только имена с «app.» и только
-- service_role. Пустое значение удаляет секрет — чтобы «войти заново» с
-- другим аккаунтом не оставляло за собой чужой номер ресурса.
create or replace function public.app_secret_put(p_name text, p_value text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_name is null or left(p_name, 4) <> 'app.' or length(p_name) < 5 then
    raise exception 'app_secret_put: имя секрета должно начинаться с app.';
  end if;

  select s.id into v_id from vault.secrets s where s.name = p_name limit 1;

  if p_value is null or btrim(p_value) = '' then
    if v_id is not null then
      delete from vault.secrets where id = v_id;
    end if;
    return;
  end if;

  if v_id is null then
    perform vault.create_secret(p_value, p_name, 'devuz: записано из панели');
  else
    perform vault.update_secret(v_id, p_value);
  end if;
end;
$$;

revoke all on function public.app_secret_put(text, text) from public, anon, authenticated;
grant execute on function public.app_secret_put(text, text) to service_role;
