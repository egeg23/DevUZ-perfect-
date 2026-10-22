import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { staleCounts } from "@/lib/admin/lead-tidy-store";
import { wants } from "@/lib/admin/notify-prefs";
import { personSales } from "@/lib/admin/sales-stages";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import {
  staffWeekText,
  weekRange,
  weekReportDue,
  weekReportKey,
  type StaffWeek,
  type WeekRange,
} from "@/lib/admin/staff-week";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Недельный отчёт по сотрудникам (lib/admin/staff-week.ts): собрать прошлую
 * неделю и отправить владельцу и руководителю.
 *
 * Отметка — в team_news_sent («staff-week:<понедельник прошлой недели>») до
 * сообщения, по человеку: два прохода свипа не пришлют дважды, не дошедший —
 * пришлют снова, пока понедельник не кончился. Галочка «Отчёты» в «Команде»
 * выключает, как вечерний отчёт.
 */
export async function sendStaffWeek(now: Date = new Date()): Promise<number> {
  if (!weekReportDue(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const range = weekRange(now);
  const key = weekReportKey(range);
  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]),
    db.from("team_news_sent").select("staff_id").eq("news_id", key),
  ]);
  const already = new Set((done ?? []).map((r) => String(r.staff_id)));
  const due = (readers ?? []).filter(
    (r) => Number(r.telegram_user_id) && !already.has(String(r.id)) && wants((r.notify_off as string[] | null) ?? [], "reports"),
  );
  if (!due.length) return 0;

  const people = await loadStaffWeek(range, now);
  if (!people.length) return 0;
  const text = staffWeekText(range, people);

  let sent = 0;
  for (const reader of due) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", reader.id);
  }
  return sent;
}

/**
 * Неделя каждого из очереди касаний. Касания и ответы — счётом базы (HEAD,
 * без строк): у человека бывает 400 касаний за день, а база отдаёт не больше
 * 1000 строк за запрос — строками неделя обрезалась бы молча. Остальное —
 * короткими выборками.
 */
export async function loadStaffWeek(range: WeekRange, now: Date = new Date()): Promise<StaffWeek[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data: staff } = await db
    .from("staff")
    .select("id, display_name, role")
    .eq("is_active", true)
    .in("role", [...QUEUE_ROLES]);
  const team = (staff ?? []).map((s) => ({ id: String(s.id), name: String(s.display_name ?? "без имени") }));
  if (!team.length) return [];
  const ids = team.map((p) => p.id);
  const iso = (ms: number) => new Date(ms).toISOString();

  const count = async (id: string, column: "touched_at" | "replied_at", from: number, to: number): Promise<number> => {
    let query = db
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("touched_by", id)
      .gte(column, iso(from))
      .lt(column, iso(to));
    if (column === "touched_at") query = query.neq("status", "failed");
    const { count: n } = await query;
    return n ?? 0;
  };

  const [counts, { data: presence }, { data: taken }, { data: burned }, stale, deals] = await Promise.all([
    Promise.all(
      ids.map(async (id) => ({
        id,
        touches: await count(id, "touched_at", range.from, range.to),
        touchesPrev: await count(id, "touched_at", range.prevFrom, range.from),
        replied: await count(id, "replied_at", range.from, range.to),
      })),
    ),
    db
      .from("panel_presence")
      .select("staff_id, minutes")
      .in("staff_id", ids)
      .gte("day", range.firstDay)
      .lte("day", range.lastDay)
      .limit(1000),
    db
      .from("audit_events")
      .select("actor_staff_id")
      .eq("action", "lead.taken")
      .in("actor_staff_id", ids)
      .gte("created_at", iso(range.from))
      .lt("created_at", iso(range.to))
      .limit(1000),
    db
      .from("lead_offers")
      .select("staff_id")
      .eq("outcome", "expired")
      .in("staff_id", ids)
      .gte("closed_at", iso(range.from))
      .lt("closed_at", iso(range.to))
      .limit(1000),
    staleCounts(ids, now).catch(() => new Map<string, number>()),
    loadDeals(now, 21).catch(() => []),
  ]);

  const tally = (rows: { [k: string]: unknown }[] | null, column: string) => {
    const out = new Map<string, number>();
    for (const r of rows ?? []) out.set(String(r[column]), (out.get(String(r[column])) ?? 0) + 1);
    return out;
  };
  const takenBy = tally(taken, "actor_staff_id");
  const burnedBy = tally(burned, "staff_id");
  const byId = new Map(counts.map((c) => [c.id, c]));

  return team.map((person) => {
    const c = byId.get(person.id);
    const days = (presence ?? []).filter((p) => p.staff_id === person.id && Number(p.minutes ?? 0) > 0);
    const sales = personSales(deals, person.id, range.from, range.to);
    return {
      id: person.id,
      name: esc(person.name),
      touches: c?.touches ?? 0,
      touchesPrev: c?.touchesPrev ?? 0,
      replied: c?.replied ?? 0,
      mockups: deals.filter((d) => d.ownerId === person.id && inRange(d.own.mockup?.at, range)).length,
      shown: sales.shown,
      priced: sales.priced,
      paid: sales.paid,
      panelDays: days.length,
      panelMinutes: days.reduce((s, p) => s + Number(p.minutes ?? 0), 0),
      leadsTaken: takenBy.get(person.id) ?? 0,
      offersBurned: burnedBy.get(person.id) ?? 0,
      stale: stale.get(person.id) ?? 0,
    };
  });
}

function inRange(at: string | undefined, range: WeekRange): boolean {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && t >= range.from && t < range.to;
}
