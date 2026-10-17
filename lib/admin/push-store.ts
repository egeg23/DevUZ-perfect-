import webpush from "web-push";

import { roadFetch } from "@/lib/egress.mjs";
import {
  PUSH_TIMEOUT_MS,
  PUSH_TTL_SECONDS,
  subscriptionGone,
  type BrowserSubscription,
  type PushPayload,
} from "@/lib/admin/push";
import { readAppSecret, saveAppSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Пуш-подписки сотрудников и отправка в службу пуша браузера.
 *
 * Ключи VAPID (ими сервер подписывает каждый пуш, а браузер проверяет, что
 * пуш от нас) живут в хранилище секретов, а не в репозитории: он открытый.
 * Первая отправка или подписка сама заводит пару и кладёт её туда
 * (saveAppSecret → app_secret_put, 0056) — переносить ключ руками никому не
 * нужно. Закрытый ключ не пишется ни в лог, ни в ответ.
 *
 * Сама отправка — fetch той же дорогой, что и всё наружу (roadFetch): от
 * web-push берём только шифрование и подпись запроса. Ждём не дольше пяти
 * секунд, ошибки — в лог и в строку подписки.
 */

const VAPID_SECRET = "PUSH_VAPID";

export type VapidKeys = { publicKey: string; privateKey: string };

function parseKeys(raw: string | null): VapidKeys | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<VapidKeys>;
    return typeof value.publicKey === "string" && typeof value.privateKey === "string"
      ? { publicKey: value.publicKey, privateKey: value.privateKey }
      : null;
  } catch {
    return null;
  }
}

let keysCache: VapidKeys | null = null;
let keysPending: Promise<VapidKeys | null> | null = null;

async function loadOrCreateKeys(): Promise<VapidKeys | null> {
  const stored = await readAppSecret(VAPID_SECRET);
  // Хранилище молчит — новую пару не заводим: старая, может быть, есть, и
  // новая разом убила бы все подписки.
  if (stored.offline) return null;
  const found = parseKeys(stored.value);
  if (found) return found;

  const fresh = webpush.generateVAPIDKeys();
  if (!(await saveAppSecret(VAPID_SECRET, JSON.stringify(fresh)))) return null;
  // Перечитываем: если пару в эту же секунду завёл кто-то ещё, в ходу его.
  return parseKeys((await readAppSecret(VAPID_SECRET)).value);
}

/** Пара ключей VAPID — из хранилища, при первом обращении заводится сама. */
export async function vapidKeys(): Promise<VapidKeys | null> {
  if (keysCache) return keysCache;
  keysPending ??= loadOrCreateKeys().finally(() => {
    keysPending = null;
  });
  const keys = await keysPending;
  if (keys) keysCache = keys;
  return keys;
}

/** Открытый ключ — его браузер получает при подписке. */
export async function vapidPublicKey(): Promise<string | null> {
  return (await vapidKeys())?.publicKey ?? null;
}

export type DeliverResult = { ok: boolean; gone: boolean; status: number | null; error: string | null };

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Один пуш на одно устройство. Не бросает: вызывающему нужен исход, а не
 * исключение посреди рассылки.
 */
export async function deliver(
  subscription: BrowserSubscription,
  payload: PushPayload,
  keys: VapidKeys,
  fetchImpl: FetchLike = roadFetch,
): Promise<DeliverResult> {
  try {
    const details = webpush.generateRequestDetails(subscription, JSON.stringify(payload), {
      vapidDetails: { subject: siteUrl, publicKey: keys.publicKey, privateKey: keys.privateKey },
      TTL: PUSH_TTL_SECONDS,
      urgency: payload.silent ? "normal" : "high",
    });
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(details.headers)) headers[name] = String(value);
    const response = await fetchImpl(details.endpoint, {
      method: details.method,
      headers,
      body: details.body ? new Uint8Array(details.body) : null,
      signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
    });
    if (response.ok) return { ok: true, gone: false, status: response.status, error: null };
    const text = (await response.text().catch(() => "")).slice(0, 200);
    return { ok: false, gone: subscriptionGone(response.status), status: response.status, error: `${response.status} ${text}`.trim() };
  } catch (error) {
    return { ok: false, gone: false, status: null, error: error instanceof Error ? error.message.slice(0, 200) : "ошибка" };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Подписки
// ───────────────────────────────────────────────────────────────────────────

export type StoredSubscription = BrowserSubscription & { id: string; staffId: string };

type Row = { id: string; staff_id: string; endpoint: string; p256dh: string; auth: string };

function fromRow(row: Row): StoredSubscription {
  return { id: row.id, staffId: row.staff_id, endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
}

/**
 * Кто из сотрудников подписан: номер Telegram → его устройства. Нужен
 * зеркалу на каждое сообщение бота, поэтому помнится минуту и сбрасывается
 * при подписке и отписке. Нет ни одной подписки — зеркало стоит ноль.
 */
const CHATS_TTL_MS = 60_000;
let chats: { at: number; map: Map<number, StoredSubscription[]> } | null = null;

export function forgetPushChats(): void {
  chats = null;
}

export async function subscribedChats(now = Date.now()): Promise<Map<number, StoredSubscription[]>> {
  if (chats && now - chats.at < CHATS_TTL_MS) return chats.map;
  const db = serviceClient();
  const map = new Map<number, StoredSubscription[]>();
  if (!db) return map;
  const { data: subs, error } = await db.from("push_subscriptions").select("id, staff_id, endpoint, p256dh, auth").limit(2000);
  if (error) {
    console.error("пуш: подписки не прочитались —", error.message);
    return map;
  }
  const rows = (subs ?? []) as Row[];
  if (rows.length) {
    const ids = [...new Set(rows.map((r) => r.staff_id))];
    const { data: people, error: peopleError } = await db
      .from("staff")
      .select("id, telegram_user_id")
      .in("id", ids)
      .eq("is_active", true);
    if (peopleError) {
      console.error("пуш: сотрудники не прочитались —", peopleError.message);
      return map;
    }
    const tgOf = new Map((people ?? []).map((p) => [p.id as string, Number(p.telegram_user_id)]));
    for (const row of rows) {
      const tg = tgOf.get(row.staff_id);
      if (!tg) continue;
      map.set(tg, [...(map.get(tg) ?? []), fromRow(row)]);
    }
  }
  chats = { at: now, map };
  return map;
}

/** Подписать устройство. Тот же адрес у другого сотрудника — переезжает к этому. */
export async function saveSubscription(staffId: string, sub: BrowserSubscription, device: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("push_subscriptions").upsert(
    {
      staff_id: staffId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      device: device.slice(0, 80),
      last_error: null,
      last_error_at: null,
    },
    { onConflict: "endpoint" },
  );
  if (error) console.error("пуш: подписка не сохранилась —", error.message);
  forgetPushChats();
  return !error;
}

/** Отписать устройство — только своё. */
export async function removeSubscription(staffId: string, endpoint: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("push_subscriptions").delete().eq("staff_id", staffId).eq("endpoint", endpoint);
  forgetPushChats();
  return !error;
}

/** Есть ли это устройство у этого сотрудника — для «Это устройство: …». */
export async function hasSubscription(staffId: string, endpoint: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("push_subscriptions")
    .select("id")
    .eq("staff_id", staffId)
    .eq("endpoint", endpoint)
    .maybeSingle();
  return Boolean(data);
}

export type PushDevices = { count: number; devices: string[] };

/** Сколько устройств у каждого — для «Команды». */
export async function pushDevicesByStaff(): Promise<Map<string, PushDevices>> {
  const db = serviceClient();
  const map = new Map<string, PushDevices>();
  if (!db) return map;
  const { data, error } = await db.from("push_subscriptions").select("staff_id, device").limit(2000);
  if (error) return map;
  for (const row of data ?? []) {
    const id = row.staff_id as string;
    const had = map.get(id) ?? { count: 0, devices: [] };
    map.set(id, { count: had.count + 1, devices: [...had.devices, String(row.device ?? "—")] });
  }
  return map;
}

async function staffSubscriptions(staffId: string): Promise<StoredSubscription[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("push_subscriptions").select("id, staff_id, endpoint, p256dh, auth").eq("staff_id", staffId);
  return ((data ?? []) as Row[]).map(fromRow);
}

export type FanoutResult = { sent: number; gone: number; failed: number };

/**
 * Разослать пуш по устройствам и записать исход: удачный — время, мёртвый
 * (404/410) — удалить строку, прочий сбой — текст ошибки в строку.
 */
export async function deliverAll(
  subs: readonly StoredSubscription[],
  payload: PushPayload,
  deps: { keys?: VapidKeys | null; fetchImpl?: FetchLike; remove?: (id: string) => Promise<void>; note?: (id: string, r: DeliverResult) => Promise<void> } = {},
): Promise<FanoutResult> {
  const result: FanoutResult = { sent: 0, gone: 0, failed: 0 };
  if (!subs.length) return result;
  const keys = deps.keys === undefined ? await vapidKeys() : deps.keys;
  if (!keys) return { ...result, failed: subs.length };
  const remove = deps.remove ?? removeById;
  const note = deps.note ?? noteResult;
  await Promise.all(
    subs.map(async (sub) => {
      const r = await deliver(sub, payload, keys, deps.fetchImpl);
      if (r.ok) result.sent += 1;
      else if (r.gone) result.gone += 1;
      else result.failed += 1;
      if (r.gone) await remove(sub.id);
      else await note(sub.id, r);
    }),
  );
  return result;
}

async function removeById(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("push_subscriptions").delete().eq("id", id);
  forgetPushChats();
}

async function noteResult(id: string, r: DeliverResult): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const now = new Date().toISOString();
  await db
    .from("push_subscriptions")
    .update(r.ok ? { last_ok_at: now, last_error: null, last_error_at: null } : { last_error: r.error, last_error_at: now })
    .eq("id", id);
}

/** Пуш всем устройствам сотрудника — «Проверить» в панели. */
export async function pushToStaff(staffId: string, payload: PushPayload): Promise<FanoutResult> {
  return deliverAll(await staffSubscriptions(staffId), payload);
}
