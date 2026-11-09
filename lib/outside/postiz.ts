import { roadFetch } from "@/lib/egress.mjs";
import { PLATFORM, postizRequest, type Platform } from "@/lib/outside/posts";
import { appSecret } from "@/lib/secrets";

/**
 * Postiz — планировщик публикаций с открытым API (docs.postiz.com/public-api).
 *
 * Владелец, 09.11.2026: «Делаем, Postiz тоже подключи». Площадки (ВКонтакте,
 * Telegram-канал) подключает человек один раз в самом Postiz — входом в свой
 * аккаунт площадки, по их правилам. Мы ходим только в API Postiz по ключу
 * (`app.POSTIZ_API_KEY`, кладут владелец и руководитель в «Статьях на
 * площадках»): видим подключённые каналы, ставим пост «сейчас», потом
 * забираем ссылку на вышедший пост. Логинов площадок у нас нет.
 *
 * Ключ — в заголовке Authorization без «Bearer». Предел Postiz — 100
 * созданий поста в час на облаке; у нас их два-три в неделю. Адрес API
 * фиксированный (или свой Postiz — POSTIZ_API_URL), поэтому не через
 * lib/audit/fetch.ts.
 */

export const POSTIZ_KEY = "POSTIZ_API_KEY";
export const POSTIZ_API = (process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1").replace(/\/+$/, "");

export type PostizChannel = { id: string; name: string; identifier: string; disabled: boolean };

/** Каналы из ответа GET /integrations. */
export function parseChannels(data: unknown): PostizChannel[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => row as Record<string, unknown>)
    .filter((row) => typeof row.id === "string" && typeof row.identifier === "string")
    .map((row) => ({
      id: String(row.id),
      name: String(row.name ?? row.identifier).slice(0, 80),
      identifier: String(row.identifier),
      disabled: Boolean(row.disabled),
    }));
}

/** Канал площадки: первый включённый с её `identifier` в Postiz. */
export function channelFor(channels: readonly PostizChannel[], platform: Platform): PostizChannel | null {
  const type = PLATFORM[platform].postiz;
  return type ? (channels.find((c) => c.identifier === type && !c.disabled) ?? null) : null;
}

export type Release = { state: "published" | "error" | "waiting"; url: string | null; error: string | null };

/** Что стало с постом: GET /posts отдаёт `state`, `releaseURL` и `error`. */
export function releaseOf(data: unknown, id: string): Release | null {
  const posts = (data as { posts?: unknown } | null)?.posts;
  if (!Array.isArray(posts)) return null;
  const row = posts.map((p) => p as Record<string, unknown>).find((p) => p.id === id);
  if (!row) return null;
  const state = String(row.state ?? "").toUpperCase();
  const url = typeof row.releaseURL === "string" && row.releaseURL ? row.releaseURL : null;
  if (state === "ERROR") return { state: "error", url: null, error: typeof row.error === "string" ? row.error.slice(0, 200) : "Postiz: ошибка публикации" };
  if (state === "PUBLISHED" && url) return { state: "published", url, error: null };
  return { state: "waiting", url, error: null };
}

/** Ошибка Postiz словами: что делать. */
export function postizReason(status: number, text: string): string {
  if (status === 401 || status === 403) return "Postiz не принял ключ: проверьте его в «Статьях на площадках»";
  if (status === 429) return "Postiz: превышен предел запросов, повторим позже";
  return `Postiz ответил ${status}${text ? `: ${text.slice(0, 120)}` : ""}`;
}

async function call(path: string, init: RequestInit, key?: string): Promise<{ data: unknown } | { error: string }> {
  const secret = key ?? (await appSecret(POSTIZ_KEY));
  if (!secret) return { error: "ключ Postiz не задан" };
  try {
    const response = await roadFetch(`${POSTIZ_API}${path}`, {
      ...init,
      headers: { authorization: secret, "content-type": "application/json", ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await response.text();
    if (!response.ok) return { error: postizReason(response.status, text.replace(/\s+/g, " ")) };
    try {
      return { data: JSON.parse(text) };
    } catch {
      return { error: "Postiz ответил не JSON" };
    }
  } catch (error) {
    return { error: `Postiz недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Подключённые в Postiz каналы. `key` — проверить новый ключ до записи. */
export async function postizChannels(key?: string): Promise<PostizChannel[] | { error: string }> {
  const res = await call("/integrations", { method: "GET" }, key);
  return "error" in res ? res : parseChannels(res.data);
}

/** Поставить пост «сейчас»: номер поста в Postiz или почему нет. */
export async function postizPublish(platform: Platform, channelId: string, content: string, now = new Date()): Promise<{ id: string } | { error: string }> {
  const res = await call("/posts", { method: "POST", body: JSON.stringify(postizRequest(platform, channelId, content, now)) });
  if ("error" in res) return res;
  const first = Array.isArray(res.data) ? (res.data[0] as { postId?: unknown } | undefined) : undefined;
  return typeof first?.postId === "string" ? { id: first.postId } : { error: "Postiz не вернул номер поста" };
}

/** Посты за окно — одним запросом на все отданные. */
export async function postizPosts(from: Date, to: Date): Promise<{ data: unknown } | { error: string }> {
  const query = new URLSearchParams({ startDate: from.toISOString(), endDate: to.toISOString() });
  return call(`/posts?${query}`, { method: "GET" });
}
