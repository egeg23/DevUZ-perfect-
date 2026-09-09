import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

export const SIGNAL_STATUSES = ["new", "answered", "ignored", "converted"] as const;

export type Signal = {
  id: string;
  created_at: string;
  chat_title: string | null;
  message_link: string | null;
  author_username: string | null;
  excerpt: string;
  topics: string[];
  score: number | null;
  category: string | null;
  rationale: string | null;
  status: string;
  lead_id: string | null;
  expires_at: string;
};

const COLUMNS =
  "id, created_at, chat_title, message_link, author_username, excerpt, topics, score, category, rationale, status, lead_id, expires_at";

export async function listSignals(status?: string): Promise<Signal[]> {
  const db = serviceClient();
  if (!db) return [];

  let query = db
    .from("scout_signals")
    .select(COLUMNS)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (status && (SIGNAL_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("admin: не прочитал сигналы", error.message);
    return [];
  }
  return (data ?? []) as unknown as Signal[];
}

/**
 * Ответ на единственный вопрос, ради которого скаут и оценивают: сколько
 * сделок он принёс.
 *
 * Доля считается от отвеченных, а не от всех сигналов. Сигнал, который
 * никто не открывал, ничего не говорит о качестве отбора — он говорит о
 * том, что до него не дошли руки, и мешать одно с другим значит списать
 * скаут за чужую загруженность.
 */
export async function scoutCounts(): Promise<{
  total: number;
  fresh: number;
  answered: number;
  converted: number;
  conversion: number | null;
  offline: boolean;
}> {
  const db = serviceClient();
  if (!db) {
    return { total: 0, fresh: 0, answered: 0, converted: 0, conversion: null, offline: true };
  }

  const head = { count: "exact" as const, head: true };
  const [all, fresh, answered, converted] = await Promise.all([
    db.from("scout_signals").select("id", head),
    db.from("scout_signals").select("id", head).eq("status", "new"),
    db.from("scout_signals").select("id", head).eq("status", "answered"),
    db.from("scout_signals").select("id", head).eq("status", "converted"),
  ]);

  const answeredCount = answered.count ?? 0;
  const convertedCount = converted.count ?? 0;
  const worked = answeredCount + convertedCount;

  return {
    total: all.count ?? 0,
    fresh: fresh.count ?? 0,
    answered: answeredCount,
    converted: convertedCount,
    conversion: worked ? Math.round((convertedCount / worked) * 100) : null,
    offline: Boolean(all.error),
  };
}

export async function setSignalStatus(
  signalId: string,
  status: string,
  staff: Staff,
  ip: string,
): Promise<boolean> {
  if (!(SIGNAL_STATUSES as readonly string[]).includes(status)) return false;

  const db = serviceClient();
  if (!db) return false;

  const patch: Record<string, unknown> = { status };
  if (status === "answered") {
    patch.answered_by = staff.id;
    patch.answered_at = new Date().toISOString();
  }

  const { error } = await db.from("scout_signals").update(patch).eq("id", signalId);
  if (error) return false;

  await record("signal.status_changed", {
    actorStaffId: staff.id,
    targetType: "signal",
    targetId: signalId,
    ip,
    meta: { to: status },
  });

  return true;
}
