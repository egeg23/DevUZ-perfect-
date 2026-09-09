import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Единственный клиент Supabase на сервисном ключе.
 *
 * Ключ сервисной роли обходит RLS — а RLS у нас включён на всех таблицах и
 * не имеет ни одной политики. То есть доступ к данным есть ровно у того, у
 * кого есть этот ключ, и больше ни у кого: анонимный ключ, утёкший в
 * браузер, не отдаст ни строки. Отсюда имя без префикса NEXT_PUBLIC_ и
 * обращение только из серверных модулей.
 *
 * Клиент один на процесс намеренно. Раньше своего клиента заводил каждый
 * модуль, и это ровно тот случай, когда копии со временем расходятся:
 * кто-то добавит ретрай или таймаут в одну из них, и поведение чтения
 * лидов перестанет совпадать с поведением записи.
 *
 * Возвращает null, если переменные не заданы. Вызывающий решает, что это
 * значит: для лида — уйти в Telegram без истории (потерять лид хуже, чем
 * потерять аналитику), для админки — честно сказать, что базы нет.
 */
export function serviceClient(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
