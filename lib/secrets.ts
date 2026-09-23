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

/** Для тестов: забыть, что ответила база. */
export function forgetSecrets(): void {
  cache.clear();
}
