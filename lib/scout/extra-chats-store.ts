import { record } from "@/lib/admin/audit";
import {
  CHAT_STATUSES,
  JOIN_DAILY_CAP,
  parseChatInput,
  tashkentDayStart,
  type ChatStatus,
  type JoinState,
  type ScoutChat,
} from "@/lib/scout/extra-chats";
import { serviceClient } from "@/lib/supabase";

/**
 * Группы для скаута в базе — scout_chats (lib/scout/extra-chats.ts).
 * База не ответила — пустой список: скаут читает SCOUT_CHATS, как раньше, и
 * не падает; панель показывает «не получилось».
 */

const COLUMNS =
  "id, handle, invite, title, chat_id, status, error, note, added_by, added_at, tried_at, joined_at, joined_via";

function asChat(row: Record<string, unknown>): ScoutChat {
  const status = CHAT_STATUSES.includes(row.status as ChatStatus) ? (row.status as ChatStatus) : "pending";
  return {
    id: String(row.id),
    handle: (row.handle as string | null) ?? null,
    invite: (row.invite as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    chat_id: (row.chat_id as string | null) ?? null,
    status,
    error: (row.error as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    added_by: (row.added_by as string | null) ?? null,
    added_at: String(row.added_at ?? ""),
    tried_at: (row.tried_at as string | null) ?? null,
    joined_at: (row.joined_at as string | null) ?? null,
    joined_via: (row.joined_via as "scout" | "manual" | null) ?? null,
  };
}

/** Все действующие группы, по порядку добавления; null — база не ответила (панель скажет). */
export async function listScoutChats(): Promise<ScoutChat[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("scout_chats")
    .select(COLUMNS)
    .is("removed_at", null)
    .order("added_at")
    .limit(1000);
  if (error) return null;
  return (data ?? []).map((row) => asChat(row as Record<string, unknown>));
}

/** То же для скаута: база не ответила — пустой список, читаем SCOUT_CHATS. */
export async function loadScoutChats(): Promise<ScoutChat[]> {
  return (await listScoutChats()) ?? [];
}

/** Правка строки скаутом: номер, итог вступления, время попытки. */
export async function updateScoutChat(
  id: string,
  patch: Partial<Pick<ScoutChat, "chat_id" | "status" | "error" | "title" | "tried_at" | "joined_at" | "joined_via">>,
): Promise<boolean> {
  if (!Object.keys(patch).length) return true;
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("scout_chats").update(patch).eq("id", id);
  return !error;
}

/** Пауза, которую попросил Telegram: переживает перезапуск скаута (каждая выкатка). */
export const JOIN_PAUSE_KEY = "scout-join-pause";

export async function loadJoinPause(): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.from("stats_snapshots").select("payload").eq("key", JOIN_PAUSE_KEY).maybeSingle();
  if (error || !data) return null;
  const until = Number((data.payload as { until?: unknown } | null)?.until);
  return Number.isFinite(until) && until > Date.now() ? until : null;
}

export async function saveJoinPause(until: number, reason: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: JOIN_PAUSE_KEY, payload: { until, reason: reason.slice(0, 200) }, computed_at: new Date().toISOString() });
  return !error;
}

/** Сколько попыток вступить скаут сделал сегодня по Ташкенту и когда — последняя. */
export async function joinState(now: Date, pausedUntil: number | null): Promise<JoinState> {
  const db = serviceClient();
  const blocked: JoinState = { triedToday: JOIN_DAILY_CAP, last: null, pausedUntil };
  if (!db) return blocked;
  const since = new Date(tashkentDayStart(now)).toISOString();
  const [today, last] = await Promise.all([
    db.from("scout_chats").select("id", { count: "exact", head: true }).gte("tried_at", since),
    db
      .from("scout_chats")
      .select("id, tried_at")
      .not("tried_at", "is", null)
      .order("tried_at", { ascending: false })
      .limit(1),
  ]);
  // Не посчитали — считаем, что предел выбран: лишнее вступление хуже пропуска.
  if (today.error || last.error) return blocked;
  const row = last.data?.[0] as { id: string; tried_at: string } | undefined;
  return { triedToday: today.count ?? 0, last: row ? { id: row.id, at: row.tried_at } : null, pausedUntil };
}

export type AddResult = "ok" | "bad" | "exists" | "failed";

/** «Добавить группу» в «Сигналах скаута» — любой из команды. */
export async function addScoutChat(
  staff: { id: string },
  raw: string,
  note: string,
  ip: string | null,
): Promise<AddResult> {
  const target = parseChatInput(raw);
  if (!target) return "bad";
  const db = serviceClient();
  if (!db) return "failed";
  const cleanNote = note.trim().slice(0, 200) || null;
  const row = "handle" in target ? { handle: target.handle } : { invite: target.invite };
  const { data, error } = await db
    .from("scout_chats")
    .insert({ ...row, note: cleanNote, added_by: staff.id })
    .select("id")
    .maybeSingle();
  if (error) return error.code === "23505" ? "exists" : "failed";
  await record("scout.chat_added", {
    actorStaffId: staff.id,
    targetType: "scout_chat",
    targetId: (data as { id: string } | null)?.id ?? null,
    meta: { ...row, note: cleanNote },
    ip,
  });
  return "ok";
}

/** Кто может убрать группу: тот, кто добавил, руководитель или владелец. */
export function mayRemoveChat(staff: { id: string; role: string }, chat: { added_by?: string | null }): boolean {
  return chat.added_by === staff.id || staff.role === "admin" || staff.role === "head";
}

/** Убрать группу. Скаут больше не вступает в неё и перестаёт читать после перезапуска. */
export async function removeScoutChat(
  staff: { id: string; role: string },
  id: string,
  ip: string | null,
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data: row } = await db.from("scout_chats").select("id, handle, invite, added_by").eq("id", id).maybeSingle();
  if (!row) return false;
  if (!mayRemoveChat(staff, row as { added_by: string | null })) return false;
  const { error } = await db
    .from("scout_chats")
    .update({ removed_at: new Date().toISOString(), removed_by: staff.id })
    .eq("id", id)
    .is("removed_at", null);
  if (error) return false;
  await record("scout.chat_removed", {
    actorStaffId: staff.id,
    targetType: "scout_chat",
    targetId: id,
    meta: { handle: (row as { handle: string | null }).handle, invite: (row as { invite: string | null }).invite },
    ip,
  });
  return true;
}

/** Кто добавил — именами, для списка на странице. */
export async function staffNames(ids: readonly string[]): Promise<Map<string, string>> {
  const db = serviceClient();
  const out = new Map<string, string>();
  if (!db || !ids.length) return out;
  const { data } = await db.from("staff").select("id, display_name").in("id", [...new Set(ids)]);
  for (const row of data ?? []) out.set(String(row.id), String(row.display_name ?? ""));
  return out;
}
