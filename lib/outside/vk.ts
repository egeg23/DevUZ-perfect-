import { roadFetch } from "@/lib/egress.mjs";
import { vkWallParams, type Platform } from "@/lib/outside/posts";
import { appSecret } from "@/lib/secrets";

/**
 * Сообщество ВКонтакте студии — пост на стену ключом сообщества, без Postiz.
 *
 * Владелец, 22.11.2026: «нам до сих пор очень нужны статьи на внешних
 * источниках, которые бы ты писал сам». Сообщество и ключ заводит человек:
 * «Управление → Работа с API → Ключи доступа», право «Стена». Ключ — в
 * хранилище секретов (`app.VK_GROUP_TOKEN`): вставляют владелец и
 * руководитель, пишется только после проверки, обратно — «задано / пусто».
 *
 * API — api.vk.com, версия 5.199, ключ в теле POST (не в адресе: адрес
 * пишется в журналы прокси). Адрес фиксированный — roadFetch, не
 * lib/audit/fetch.ts.
 */

export const VK_KEY = "VK_GROUP_TOKEN";
export const VK_API = "https://api.vk.com/method";
export const VK_VERSION = "5.199";
/** Право ключа сообщества «Стена» в маске getTokenPermissions. */
export const VK_WALL_BIT = 8192;

/** Запрос к методу API: адрес без ключа, ключ и параметры — в теле. */
export function vkRequest(method: string, params: Record<string, string>, token: string): { url: string; init: RequestInit } {
  const body = new URLSearchParams({ ...params, access_token: token, v: VK_VERSION });
  return {
    url: `${VK_API}/${method}`,
    init: { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: body.toString() },
  };
}

/** Ошибка ВКонтакте словами: что делать. */
export function vkReason(code: number, message: string): string {
  if (code === 5) return "ВКонтакте не принял ключ: создайте новый ключ сообщества";
  if (code === 15 || code === 7 || code === 27) return "У ключа нет права «Стена»: создайте ключ с этим правом";
  if (code === 6 || code === 9) return "ВКонтакте: слишком часто, повторим позже";
  return `ВКонтакте: ${message.slice(0, 120) || `ошибка ${code}`}`;
}

type Answer = { response?: unknown; error?: { error_code?: number; error_msg?: string } };

async function call(method: string, params: Record<string, string>, token: string): Promise<{ data: unknown } | { error: string }> {
  const { url, init } = vkRequest(method, params, token);
  try {
    const response = await roadFetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
    const data = (await response.json().catch(() => null)) as Answer | null;
    if (!data) return { error: `ВКонтакте ответил ${response.status}` };
    if (data.error) return { error: vkReason(Number(data.error.error_code ?? 0), String(data.error.error_msg ?? "")) };
    return { data: data.response };
  } catch (error) {
    return { error: `ВКонтакте недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export type VkGroup = { id: number; screen: string; name: string };

/** Сообщество из ответа groups.getById: в 5.199 — `{ groups: […] }`, раньше — массив. */
export function groupOf(data: unknown): VkGroup | null {
  const list = Array.isArray(data) ? data : (data as { groups?: unknown } | null)?.groups;
  const row = Array.isArray(list) ? (list[0] as Record<string, unknown> | undefined) : undefined;
  const id = Number(row?.id);
  if (!row || !Number.isInteger(id) || id <= 0) return null;
  return { id, screen: String(row.screen_name ?? `club${id}`).slice(0, 80), name: String(row.name ?? "").slice(0, 120) };
}

/** Есть ли право «Стена»: по имени в списке или по маске. null — ВКонтакте не сказал. */
export function hasWall(data: unknown): boolean | null {
  const d = (data ?? null) as { mask?: unknown; permissions?: unknown } | null;
  if (!d) return null;
  if (Array.isArray(d.permissions) && d.permissions.some((p) => (p as { name?: unknown }).name === "wall")) return true;
  if (typeof d.mask === "number") return (d.mask & VK_WALL_BIT) !== 0;
  return Array.isArray(d.permissions) ? false : null;
}

/** Адрес поста на стене сообщества. */
export function wallUrl(groupId: number, postId: number): string {
  return `https://vk.com/wall-${groupId}_${postId}`;
}

export type VkCheck = { ok: true; group: VkGroup } | { ok: false; reason: string };

/** Проверка ключа: чьё это сообщество и есть ли право «Стена». */
export async function checkVk(token: string): Promise<VkCheck> {
  const groups = await call("groups.getById", {}, token);
  if ("error" in groups) return { ok: false, reason: groups.error };
  const group = groupOf(groups.data);
  if (!group) return { ok: false, reason: "Это не ключ сообщества: создайте ключ в «Управление → Работа с API»" };
  const perms = await call("groups.getTokenPermissions", {}, token);
  if (!("error" in perms) && hasWall(perms.data) === false) return { ok: false, reason: "У ключа нет права «Стена»: создайте ключ с этим правом" };
  return { ok: true, group };
}

/** Опубликовать пост на стене: адрес поста или почему не вышло. */
export async function vkPublish(title: string, body: string, platform: Platform, topicKey: string): Promise<{ url: string } | { error: string }> {
  const token = await appSecret(VK_KEY);
  if (!token) return { error: "ключ сообщества ВКонтакте не задан" };
  const check = await checkVk(token);
  if (!check.ok) return { error: check.reason };
  const post = await call("wall.post", vkWallParams(check.group.id, title, body, platform, topicKey), token);
  if ("error" in post) return post;
  const id = Number((post.data as { post_id?: unknown } | null)?.post_id);
  return Number.isInteger(id) && id > 0 ? { url: wallUrl(check.group.id, id) } : { error: "ВКонтакте не вернул номер поста" };
}
