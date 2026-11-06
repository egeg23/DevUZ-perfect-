import { randomKey } from "@/lib/ai-staff/crypto";
import { FB_GRAPH, discoveryUrl } from "@/lib/bloggers/discovery";
import {
  ALL_KEYS,
  VERIFY_NAME,
  igAccountsFrom,
  keysCheckOf,
  ownAccount,
  graphFail,
  tokenInfo,
  type KeysCheck,
} from "@/lib/bloggers/keys";
import { appSecret, readAppSecret, saveAppSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Ключи «Блогеров» в хранилище секретов и проверка их у Meta
 * (lib/bloggers/keys.ts — правила, components/admin/blogger-keys.tsx — блок).
 * Значения ключей отсюда в панель не уходят: только «задано», «в .env» и
 * итог проверки.
 */

export type KeyState = { set: boolean; env: boolean };

/** Задан ли каждый ключ и не перекрыт ли он строкой в .env сервера (она главнее хранилища). */
export async function keysState(): Promise<Record<(typeof ALL_KEYS)[number], KeyState>> {
  const rows = await Promise.all(
    ALL_KEYS.map(async (name) => [name, { set: Boolean((await readAppSecret(name)).value), env: Boolean(process.env[name]?.trim()) }] as const),
  );
  return Object.fromEntries(rows) as Record<(typeof ALL_KEYS)[number], KeyState>;
}

/** Проверочный токен вебхука: его вставляют в Meta, поэтому показываем. */
export async function verifyToken(): Promise<string | null> {
  return appSecret(VERIFY_NAME);
}

/** Нет проверочного токена — заводим свой, случайный. */
export async function ensureVerifyToken(): Promise<boolean> {
  if (await appSecret(VERIFY_NAME)) return false;
  return saveAppSecret(VERIFY_NAME, randomKey(24));
}

const CHECK_KEY = "keys-check";

export async function loadKeysCheck(): Promise<KeysCheck | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("blogger_settings").select("value").eq("key", CHECK_KEY).maybeSingle();
  return keysCheckOf(data?.value);
}

export async function saveKeysCheck(check: KeysCheck): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("blogger_settings").upsert({ key: CHECK_KEY, value: check, updated_at: new Date().toISOString() });
  if (error) console.error("блогеры: итог проверки ключей не записан —", error.message);
}

/** Публичный профессиональный аккаунт, на котором проверяем цифры чужого профиля. */
export const PROBE_HANDLE = "instagram";

/**
 * Проверка у Meta, по шагам:
 * 1) жив ли токен, до какого числа и хватает ли прав (debug_token);
 * 2) номер Instagram-аккаунта студии — сохранённый или найденный по страницам токена (me/accounts);
 * 3) свой аккаунт отвечает (ник, подписчики);
 * 4) цифры чужого профиля приходят (Business Discovery на @instagram) — то, ради чего ключи.
 * В итог — только причина словом, не текст ошибки Meta.
 */
export async function checkKeys(fetchImpl: typeof fetch = fetch, now = new Date()): Promise<KeysCheck> {
  const at = now.toISOString();
  const token = await appSecret("BLOGGERS_FB_TOKEN");
  if (!token) return { ok: false, at, reason: "no_token" };
  const get = async (url: string): Promise<unknown> => {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
    return response.json().catch(() => null);
  };
  const t = encodeURIComponent(token);
  try {
    // 1. Токен. Свой токен разработчика приложения debug_token принимает и как ключ доступа.
    const info = tokenInfo(await get(`${FB_GRAPH}/debug_token?input_token=${t}&access_token=${t}`), now.getTime());
    if (!info.ok && info.reason === "token") return { ok: false, at, reason: "token" };
    if (info.ok && info.short) return { ok: false, at, reason: "short" };
    if (info.ok && info.missing.length) return { ok: false, at, reason: "scopes", missing: info.missing };

    // 2–3. Номер аккаунта и свой аккаунт. Номера нет или он не от этого
    // токена (сменили страницу) — ищем по страницам токена и запоминаем.
    const lookup = async (): Promise<string | null> => {
      const accounts = igAccountsFrom(await get(`${FB_GRAPH}/me/accounts?fields=name,instagram_business_account{id,username}&limit=50&access_token=${t}`));
      return accounts[0]?.id ?? null;
    };
    const ownOf = async (id: string) => ownAccount(await get(`${FB_GRAPH}/${encodeURIComponent(id)}?fields=username,followers_count&access_token=${t}`));
    let igUserId = await appSecret("BLOGGERS_IG_USER_ID");
    let found = false;
    let own = igUserId ? await ownOf(igUserId) : null;
    if (!igUserId || (own && !own.ok && own.reason === "id")) {
      const next = await lookup();
      if (!next) return { ok: false, at, reason: igUserId ? "id" : "no_ig" };
      if (next !== igUserId) {
        igUserId = next;
        found = await saveAppSecret("BLOGGERS_IG_USER_ID", igUserId);
        own = await ownOf(igUserId);
      }
    }
    if (!own || !own.ok) return { ok: false, at, reason: own ? own.reason : "id" };

    // 4. Чужой профиль.
    const probe = (await get(discoveryUrl({ igUserId, token }, PROBE_HANDLE))) as { business_discovery?: { username?: unknown } } | null;
    if (!probe?.business_discovery?.username) {
      const why = graphFail(probe);
      return { ok: false, at, reason: why === "token" || why === "scopes" ? why : "discovery" };
    }
    return {
      ok: true,
      at,
      username: own.username,
      followers: own.followers,
      expiresAt: info.ok && info.expiresAt ? new Date(info.expiresAt).toISOString() : null,
      found,
    };
  } catch (error) {
    console.error("блогеры: проверка ключей — нет ответа Meta:", error instanceof Error ? error.message : error);
    return { ok: false, at, reason: "network" };
  }
}
