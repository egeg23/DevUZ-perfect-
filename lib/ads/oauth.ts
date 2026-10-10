import { createHmac, timingSafeEqual } from "node:crypto";

import { appSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

/**
 * Подключение рекламного кабинета через OAuth: Яндекс и Google.
 *
 * Клиент нажимает «Подключить», уходит на страницу Яндекса или Google,
 * разрешает доступ и возвращается на наш callback с кодом. Код меняется на
 * токен, токен шифруется (lib/ads/crypto.ts) и ложится к кабинету.
 *
 * `state` — подпись id кабинета и времени ключом ADS_TOKEN_KEY: callback
 * примет код только для того кабинета, для которого его просили, и только
 * в течение получаса. Иначе чужой код можно было бы привязать к нашему
 * кабинету, а свой — к чужому.
 *
 * Ключи приложений: YANDEX_DIRECT_CLIENT_ID / _SECRET, GOOGLE_ADS_CLIENT_ID /
 * _SECRET, GOOGLE_ADS_DEVELOPER_TOKEN — в .env или хранилище, не в коде.
 */

export const STATE_TTL_MS = 30 * 60_000;

export function callbackUrl(platform: "yandex" | "google"): string {
  return `${siteUrl}/api/ads/oauth/${platform}/callback`;
}

export function signState(accountId: string, at: number, key: Buffer): string {
  const body = `${accountId}.${at}`;
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyState(state: string, key: Buffer, now = Date.now()): string | null {
  const [accountId, at, mac] = state.split(".");
  if (!accountId || !at || !mac) return null;
  const expected = createHmac("sha256", key).update(`${accountId}.${at}`).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (now - Number(at) > STATE_TTL_MS || Number(at) > now + 60_000) return null;
  return accountId;
}

export async function authorizeUrl(platform: "yandex" | "google", state: string): Promise<string | null> {
  if (platform === "yandex") {
    const clientId = await appSecret("YANDEX_DIRECT_CLIENT_ID");
    if (!clientId) return null;
    const url = new URL("https://oauth.yandex.ru/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", callbackUrl("yandex"));
    url.searchParams.set("state", state);
    // Каждый раз спрашивать, какой аккаунт: у агентства их несколько.
    url.searchParams.set("force_confirm", "yes");
    return url.toString();
  }
  const clientId = await appSecret("GOOGLE_ADS_CLIENT_ID");
  if (!clientId) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl("google"));
  url.searchParams.set("scope", "https://www.googleapis.com/auth/adwords");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export type TokenSet = { access_token: string; refresh_token?: string; expires_in?: number };

export async function exchangeCode(platform: "yandex" | "google", code: string): Promise<TokenSet> {
  const [id, secret] =
    platform === "yandex"
      ? await Promise.all([appSecret("YANDEX_DIRECT_CLIENT_ID"), appSecret("YANDEX_DIRECT_CLIENT_SECRET")])
      : await Promise.all([appSecret("GOOGLE_ADS_CLIENT_ID"), appSecret("GOOGLE_ADS_CLIENT_SECRET")]);
  if (!id || !secret) throw new Error("Ключи приложения не заданы");
  const body = new URLSearchParams({ grant_type: "authorization_code", code, client_id: id, client_secret: secret });
  if (platform === "google") body.set("redirect_uri", callbackUrl("google"));
  const res = await fetch(platform === "yandex" ? "https://oauth.yandex.ru/token" : "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => null)) as (TokenSet & { error_description?: string }) | null;
  if (!res.ok || !json?.access_token) throw new Error(json?.error_description ?? `OAuth: ответ ${res.status}`);
  return json;
}

/** Google: короткий access token по долгому refresh token. */
export async function refreshGoogle(refreshToken: string): Promise<TokenSet> {
  const [id, secret] = await Promise.all([appSecret("GOOGLE_ADS_CLIENT_ID"), appSecret("GOOGLE_ADS_CLIENT_SECRET")]);
  if (!id || !secret) throw new Error("Ключи приложения Google не заданы");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: id, client_secret: secret }),
  });
  const json = (await res.json().catch(() => null)) as TokenSet | null;
  if (!res.ok || !json?.access_token) throw new Error(`Google: токен не обновился (${res.status})`);
  return json;
}
