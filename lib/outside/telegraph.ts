import { roadFetch } from "@/lib/egress.mjs";
import type { TelegraphNode } from "@/lib/outside/posts";
import { appSecret, saveAppSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

/**
 * Telegraph (telegra.ph) — страницы-статьи Telegram с открытым API.
 *
 * Регистрации нет: аккаунт — это ключ, который выдаёт сам API
 * (createAccount). Ключ заводится при первой статье и лежит в хранилище
 * секретов (`app.TELEGRAPH_TOKEN`): в коде, журнале и на экране его нет.
 * Адрес фиксированный (api.telegra.ph), поэтому не через lib/audit/fetch.ts —
 * тот для чужих адресов со страниц и из заявок.
 */

export const TELEGRAPH_KEY = "TELEGRAPH_TOKEN";
const API = "https://api.telegra.ph";
export const TELEGRAPH_AUTHOR = { short_name: "DevUz", author_name: "DevUz Studio", author_url: `${siteUrl}/ru` } as const;

type Answer<T> = { ok: boolean; result?: T; error?: string };

async function call<T>(method: string, body: Record<string, unknown>): Promise<T | string> {
  try {
    const response = await roadFetch(`${API}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json().catch(() => null)) as Answer<T> | null;
    if (!data) return `Telegraph ответил ${response.status}`;
    if (!data.ok || !data.result) return `Telegraph: ${String(data.error ?? response.status).slice(0, 120)}`;
    return data.result;
  } catch (error) {
    return `Telegraph недоступен: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/** Ключ аккаунта студии: из хранилища, нет — заводим и кладём туда. */
export async function telegraphToken(): Promise<string | { error: string }> {
  const saved = await appSecret(TELEGRAPH_KEY);
  if (saved) return saved;
  const made = await call<{ access_token?: string }>("createAccount", { ...TELEGRAPH_AUTHOR });
  if (typeof made === "string") return { error: made };
  if (!made.access_token) return { error: "Telegraph не выдал ключ" };
  if (!(await saveAppSecret(TELEGRAPH_KEY, made.access_token))) return { error: "ключ Telegraph не записался в хранилище" };
  return made.access_token;
}

/** Опубликовать страницу: адрес статьи или почему не вышло. */
export async function telegraphPublish(title: string, content: TelegraphNode[]): Promise<{ url: string } | { error: string }> {
  const token = await telegraphToken();
  if (typeof token !== "string") return token;
  const page = await call<{ url?: string }>("createPage", {
    access_token: token,
    title: title.slice(0, 256),
    author_name: TELEGRAPH_AUTHOR.author_name,
    author_url: TELEGRAPH_AUTHOR.author_url,
    content,
    return_content: false,
  });
  if (typeof page === "string") return { error: page };
  return page.url ? { url: page.url } : { error: "Telegraph не вернул адрес страницы" };
}
