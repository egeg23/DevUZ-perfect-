import { serviceClient } from "@/lib/supabase";

/**
 * Секрет приложения: сначала .env, потом хранилище Supabase (Vault).
 *
 * Хранилище — на случай, когда ключ нужно подключить без доступа к серверу:
 * 23 сентября владелец прислал ключ Google Places со словами «сделай сам», а
 * выкатка секреты в .env не пишет намеренно. В Vault ключ зашифрован, и
 * прочитать его может только сервер приложения (функция app_secret, 0055).
 *
 * .env важнее: поменять ключ на сервере по-прежнему можно, не трогая базу.
 * Ответ базы помнится десять минут — свип спрашивает ключ каждые пять, и
 * ходить за ним в базу каждый раз незачем.
 */

const TTL_MS = 10 * 60_000;
const cache = new Map<string, { value: string | null; at: number }>();

export async function appSecret(name: string, now = Date.now()): Promise<string | null> {
  const fromEnv = process.env[name]?.trim();
  if (fromEnv) return fromEnv;

  const hit = cache.get(name);
  if (hit && now - hit.at < TTL_MS) return hit.value;

  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.rpc("app_secret", { p_name: `app.${name}` });
  if (error) console.error(`секрет ${name}: хранилище не ответило —`, error.message);
  const value = !error && typeof data === "string" && data.trim() ? data.trim() : null;
  cache.set(name, { value, at: now });
  return value;
}

/**
 * Записать секрет в хранилище (функция app_secret_put, 0056). Пустое
 * значение удаляет его. Пишет только сервер — сюда попадает то, что панель
 * получила сама: вход владельца через Google, номер ресурса Analytics.
 * Переменную из .env это не перекрывает: она по-прежнему важнее.
 */
export async function saveAppSecret(name: string, value: string | null): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.rpc("app_secret_put", { p_name: `app.${name}`, p_value: value?.trim() || null });
  if (error) {
    console.error(`секрет ${name}: не записан —`, error.message);
    return false;
  }
  cache.delete(name);
  return true;
}

/** Для тестов: забыть, что ответила база. */
export function forgetSecrets(): void {
  cache.clear();
}
