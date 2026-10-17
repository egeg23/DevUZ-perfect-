import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import {
  XP_KEY,
  noParts,
  orderUnits,
  panelUnits,
  snapshotStale,
  xpOf,
  type XpParts,
  type XpPerson,
  type XpSnapshot,
} from "@/lib/admin/levels";
import type { Deal, Stage } from "@/lib/admin/sales-stages";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import { serviceClient } from "@/lib/supabase";

/**
 * Уровни менеджеров (lib/admin/levels.ts) — снимок раз в час.
 *
 * Очки за всё время — это вся история касаний, панели и журнала; считать её
 * на каждый заход «Главной» незачем. Свип раз в час пересчитывает снимок
 * (stats_snapshots «staff-xp»), страница читает одну строку. Модели нет.
 */

const ROWS = 20_000;
/** Сколько дней истории: дольше панели пока нет. */
const HISTORY_DAYS = 400;
const WEEK_MS = 7 * 24 * 3600_000;
const ORDER_ACTIONS = ["lead.status_changed", "task.done", "lead.idle_snoozed"];

type Presence = { staff_id: string; day: string; minutes: number };
type Act = { actor_staff_id: string; created_at: string };

/** Штуки по каждому виду очков у человека с момента `from` (мс). */
export function partsFor(id: string, deals: readonly Deal[], presence: readonly Presence[], acts: readonly Act[], from = 0): XpParts {
  const parts = noParts();
  const after = (at: string | undefined) => Boolean(at) && Date.parse(at as string) >= from;
  const mine = (d: Deal, s: Stage) => d.own[s]?.by === id && after(d.own[s]?.at);
  for (const d of deals) {
    if (mine(d, "written")) parts.touch += 1;
    // Ответ — тому, кто писал касание: он и добыл этот ответ.
    if (d.own.written?.by === id && after(d.own.replied?.at)) parts.reply += 1;
    if (mine(d, "interest")) parts.interest += 1;
    if (mine(d, "mockup")) parts.mockup += 1;
    if (mine(d, "shown")) parts.shown += 1;
    if (mine(d, "priced")) parts.priced += 1;
    if (mine(d, "paid")) parts.paid += 1;
  }
  const fromDay = new Date(from + 5 * 3600_000).toISOString().slice(0, 10);
  parts.panel = panelUnits(presence.filter((p) => p.staff_id === id && (from === 0 || p.day >= fromDay)));
  parts.order = orderUnits(acts.filter((a) => a.actor_staff_id === id && after(a.created_at)).map((a) => a.created_at));
  return parts;
}

export async function computeXp(now: Date = new Date()): Promise<XpSnapshot | null> {
  const db = serviceClient();
  if (!db) return null;
  const from = new Date(now.getTime() - HISTORY_DAYS * 24 * 3600_000).toISOString();
  const [staffRes, deals, presenceRes, actsRes] = await Promise.all([
    db.from("staff").select("id, role").eq("is_active", true).in("role", [...QUEUE_ROLES]).limit(200),
    loadDeals(now, HISTORY_DAYS, ROWS),
    db.from("panel_presence").select("staff_id, day, minutes").gte("day", from.slice(0, 10)).limit(ROWS),
    db
      .from("audit_events")
      .select("actor_staff_id, created_at")
      .in("action", ORDER_ACTIONS)
      .not("actor_staff_id", "is", null)
      .gte("created_at", from)
      .limit(ROWS),
  ]);
  if (staffRes.error) return null;
  const presence = (presenceRes.data ?? []) as Presence[];
  const acts = (actsRes.data ?? []) as Act[];
  const weekFrom = now.getTime() - WEEK_MS;
  const people: Record<string, XpPerson> = {};
  for (const s of staffRes.data ?? []) {
    const id = String(s.id);
    const parts = partsFor(id, deals, presence, acts);
    people[id] = { parts, xp: xpOf(parts), week: xpOf(partsFor(id, deals, presence, acts, weekFrom)) };
  }
  return { computedAt: now.toISOString(), people };
}

/** Снимок, как он есть (null — ещё не считали или база молчит). */
export async function readXp(): Promise<XpSnapshot | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload, computed_at").eq("key", XP_KEY).maybeSingle();
  if (!data?.payload) return null;
  const payload = data.payload as Partial<XpSnapshot>;
  return { computedAt: String(payload.computedAt ?? data.computed_at), people: payload.people ?? {} };
}

/** Свип: пересчитать снимок, если ему час и больше. */
export async function refreshXp(now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const current = await readXp();
  if (!snapshotStale(current?.computedAt, now)) return false;
  const snap = await computeXp(now);
  if (!snap) return false;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: XP_KEY, payload: snap, computed_at: snap.computedAt }, { onConflict: "key" });
  return !error;
}
