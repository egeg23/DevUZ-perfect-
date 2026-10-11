import { openToken, sealToken } from "@/lib/ai-staff/crypto";
import { IG_API, echoIsOurs, igConfig, sendIg, sentByUs, type IgAccount, type IgEvent } from "@/lib/ai-staff/instagram";
import { fetchImage, MAX_IMAGES, type Image } from "@/lib/bloggers/audience";
import { HUMAN_HOLD_MS, handleBloggerMessage } from "@/lib/bloggers/converse";
import { normalizeHandle } from "@/lib/bloggers/rules";
import * as store from "@/lib/bloggers/store";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Direct Instagram-аккаунта студии — переписку с блогерами ведёт агент.
 *
 * Тот же официальный вход через Instagram, что у клиентов сервиса
 * (lib/ai-staff/instagram.ts): приложение Meta одно, вебхук один
 * (/api/ai-staff/instagram). Событие для аккаунта студии сюда, остальные —
 * клиентам сервиса. Писать первым API не даёт: агент отвечает только на
 * сообщение блогера и только в течение 24 часов после него — то есть сразу.
 *
 * Аккаунт подключает владелец или руководитель во вкладке «Блогеры»
 * («Подключить Instagram студии»); токен на 60 дней хранится зашифрованным
 * (AI_STAFF_KEY) в blogger_settings и продлевается свипом.
 */

/** Адрес возврата из Instagram — его нужно добавить в настройки приложения Meta. */
export const STUDIO_REDIRECT_PATH = "/admin/ai-staff/bloggers/instagram/callback";
/** «Клиент» в подписанном state — аккаунт студии, а не клиент сервиса. */
export const STUDIO_STATE = "00000000-0000-0000-0000-000000000000";

export type StudioIg = { igId: string; username: string; tokenEnc: string; expiresAt: string };

const KEY = "ig";

export async function studioIg(): Promise<StudioIg | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("blogger_settings").select("value").eq("key", KEY).maybeSingle();
  const v = data?.value as StudioIg | null;
  return v?.igId && v.tokenEnc ? v : null;
}

export async function saveStudioIg(account: IgAccount, key: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const value: StudioIg = { igId: account.igId, username: account.username, tokenEnc: sealToken(account.token, key), expiresAt: account.expiresAt.toISOString() };
  const { error } = await db.from("blogger_settings").upsert({ key: KEY, value, updated_at: new Date().toISOString() });
  return !error;
}

async function studioToken(ig: StudioIg): Promise<string | null> {
  const key = await appSecret("AI_STAFF_KEY");
  return key ? openToken(ig.tokenEnc, key) : null;
}

/** Событие вебхука — для аккаунта студии? Тогда его разбирает агент блогеров. */
export async function isStudioEvent(event: IgEvent): Promise<boolean> {
  const ig = await studioIg();
  return Boolean(ig && ig.igId === event.igId);
}

/** Ник собеседника по его id в Direct: официальный API отдаёт его тому, кто ему пишет. */
async function usernameOf(peerId: string, token: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const response = await fetchImpl(`${IG_API}/${encodeURIComponent(peerId)}?fields=username&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => null)) as { username?: string } | null;
    return body?.username ? normalizeHandle(body.username) : null;
  } catch {
    return null;
  }
}

async function bloggerByPeer(peerId: string): Promise<store.Blogger | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("bloggers").select("*").eq("ig_scoped_id", peerId).maybeSingle();
  return data ? ((await store.bloggerById(String(data.id))) ?? null) : null;
}

export async function handleStudioEvent(event: IgEvent): Promise<void> {
  const ig = await studioIg();
  if (!ig || ig.igId !== event.igId) return;
  const token = await studioToken(ig);
  if (!token) return;

  // Эхо: сообщение ушло с аккаунта студии. Наше — пропускаем; написал человек
  // с телефона — он ведёт разговор, агент молчит 12 часов.
  if (event.echo) {
    if (sentByUs(event.mid)) return;
    const blogger = await bloggerByPeer(event.peerId);
    if (!blogger) return;
    const lastAgent = blogger.messages.filter((m) => m.role === "agent").at(-1)?.text ?? null;
    if (echoIsOurs(event, lastAgent)) return;
    await store.updateBlogger(blogger.id, {
      human_until: new Date(Date.now() + HUMAN_HOLD_MS).toISOString(),
      messages: [...blogger.messages, { role: "staff", text: event.text.slice(0, 4000), at: new Date(event.at).toISOString(), via: "direct" }],
    });
    return;
  }

  let blogger = await bloggerByPeer(event.peerId);
  if (!blogger) {
    // Первый ответ блогера: id собеседника ещё не знаем — узнаём ник.
    const handle = await usernameOf(event.peerId, token);
    const found = handle ? await store.bloggerByHandle(handle) : null;
    // Пишет не блогер из нашего списка — это обычный Direct студии, не наше дело.
    if (!found) return;
    await store.updateBlogger(found.id, { ig_scoped_id: event.peerId });
    blogger = { ...found, ig_scoped_id: event.peerId };
  }
  if (blogger.status === "declined") return;

  const images: Image[] = [];
  for (const url of (event.images ?? []).slice(0, MAX_IMAGES)) {
    const img = await fetchImage(url);
    if (img) images.push(img);
  }
  const turn = await handleBloggerMessage({ blogger, text: event.text, images, via: "direct", now: new Date(event.at) });
  if (turn.reply) await sendIg(token, event.peerId, turn.reply);
}

/** Свип: продлить токен аккаунта студии за 15 дней до конца. */
export async function refreshStudioToken(now = new Date(), fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const ig = await studioIg();
  if (!ig || Date.parse(ig.expiresAt) - now.getTime() > 15 * 86_400_000) return false;
  const [token, key] = await Promise.all([studioToken(ig), appSecret("AI_STAFF_KEY")]);
  if (!token || !key || !(await igConfig())) return false;
  const data = await fetchImpl(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)
    .then((r) => r.json())
    .catch(() => null);
  if (!data?.access_token) return false;
  return saveStudioIg(
    { token: data.access_token, igId: ig.igId, username: ig.username, expiresAt: new Date(now.getTime() + Number(data.expires_in ?? 5_184_000) * 1000) },
    key,
  );
}
