import { BELL_DAYS, BELL_KEEP_DAYS, BELL_LIST, bellRow, skipsBell } from "@/lib/admin/bell";
import { privateChatId, type PushButton } from "@/lib/admin/push";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Колокольчик — строки в базе (lib/admin/bell.ts, таблица staff_bell,
 * миграция 0174). Пишет зеркало сообщений бота, читает шапка панели.
 *
 * Таблицы ещё нет (миграция не применена) — колокольчик молчит: запись
 * пропускается без шума в логе, список пустой.
 */

export type BellItem = { id: number; title: string; body: string; href: string; at: string; done: boolean };

const STAFF_TTL_MS = 5 * 60_000;
let staffChats: { at: number; map: Map<number, string> } | null = null;
/** Таблицы нет — не стучимся десять минут. */
let missingUntil = 0;

function missing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || /staff_bell/.test(error.message ?? "")) {
    missingUntil = Date.now() + 10 * 60_000;
    return true;
  }
  return false;
}

/** Чат Telegram → сотрудник: колокольчик только у активных сотрудников. */
async function staffByChat(now = Date.now()): Promise<Map<number, string>> {
  if (staffChats && now - staffChats.at < STAFF_TTL_MS) return staffChats.map;
  const db = serviceClient();
  const map = new Map<number, string>();
  if (!db) return map;
  const { data, error } = await db.from("staff").select("id, telegram_user_id").eq("is_active", true).not("telegram_user_id", "is", null);
  if (error) {
    console.error("колокольчик: сотрудники не прочитались —", error.message);
    return staffChats?.map ?? map;
  }
  for (const row of data ?? []) map.set(Number(row.telegram_user_id), String(row.id));
  staffChats = { at: now, map };
  return map;
}

/**
 * Положить сообщение бота в колокольчик сотрудника. Зовёт зеркало пуша
 * (lib/admin/push-mirror.ts) в фоне: Telegram это не ждёт. Чат не
 * сотрудника (клиент, группа) — ничего.
 */
export async function noteBell(
  chatId: number | string,
  html: string,
  rows: readonly (readonly PushButton[])[] = [],
): Promise<void> {
  const chat = privateChatId(chatId);
  if (chat === null || skipsBell(html) || Date.now() < missingUntil) return;
  const staffId = (await staffByChat()).get(chat);
  if (!staffId) return;
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("staff_bell").insert({ staff_id: staffId, ...bellRow(html, rows, siteUrl) });
  if (error && !missing(error)) console.error("колокольчик: не записал —", error.message);
}

const since = (now: number) => new Date(now - BELL_DAYS * 86_400_000).toISOString();

/** Сколько у человека не отмечено «сделано» за BELL_DAYS. Счёт базы, без строк. */
export async function bellCount(staffId: string, now = Date.now()): Promise<number> {
  const db = serviceClient();
  if (!db || now < missingUntil) return 0;
  const { count, error } = await db
    .from("staff_bell")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId)
    .is("done_at", null)
    .gte("created_at", since(now));
  if (error) {
    if (!missing(error)) console.error("колокольчик: не посчитал —", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Последние строки человека — новые сверху, сделанные тоже (бледно). */
export async function bellList(staffId: string, now = Date.now()): Promise<BellItem[]> {
  const db = serviceClient();
  if (!db || now < missingUntil) return [];
  const { data, error } = await db
    .from("staff_bell")
    .select("id, title, body, href, created_at, done_at")
    .eq("staff_id", staffId)
    .gte("created_at", since(now))
    .order("created_at", { ascending: false })
    .limit(BELL_LIST);
  if (error) {
    if (!missing(error)) console.error("колокольчик: не прочитал —", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    href: String(row.href ?? "/admin/hq"),
    at: String(row.created_at),
    done: row.done_at !== null,
  }));
}

/**
 * «Сделано» — одной строке или всем. Только своим: сотрудник берётся из
 * сессии, строка чужого не найдётся по staff_id.
 */
export async function markBellDone(staffId: string, id: number | "all", now = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  let query = db.from("staff_bell").update({ done_at: now.toISOString() }).eq("staff_id", staffId).is("done_at", null);
  if (id !== "all") query = query.eq("id", id);
  const { error } = await query;
  if (error) {
    if (!missing(error)) console.error("колокольчик: не отметил —", error.message);
    return false;
  }
  return true;
}

let prunedAt = 0;
const PRUNE_EVERY_MS = 60 * 60_000;

/** Старше BELL_KEEP_DAYS — из базы. Свип зовёт каждый проход, чистится не чаще раза в час. */
export async function pruneBell(now = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db || now.getTime() < missingUntil || now.getTime() - prunedAt < PRUNE_EVERY_MS) return;
  prunedAt = now.getTime();
  const { error } = await db
    .from("staff_bell")
    .delete()
    .lt("created_at", new Date(now.getTime() - BELL_KEEP_DAYS * 86_400_000).toISOString());
  if (error && !missing(error)) console.error("колокольчик: не почистил —", error.message);
}
