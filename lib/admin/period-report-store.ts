import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { PERIOD_DAYS, dayLabel, periodRange, periodText, type PeriodRow } from "@/lib/admin/period-report";
import { dayStartUtc, outcomeOf } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import { esc } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Отчёт по касаниям за две недели — из базы, на момент отправки.
 *
 * Касания — по тому же правилу, что недельный план и вечерний отчёт
 * (touch-store): компания, которой человек написал, «Отправить» или
 * «Написал сам», неушедшие не в счёт. Порция — по строкам раздачи: прошлые
 * дни закрыты вечерним отчётом, сегодняшний считается по самим касаниям.
 */
export async function periodReport(now: Date = new Date(), days: number = PERIOD_DAYS): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const today = todayInTashkent(now);
  const range = periodRange(today, days);
  const start = dayStartUtc(range.from);
  const split = dayStartUtc(range.secondFrom);
  const end = new Date(dayStartUtc(today).getTime() + 24 * 3600_000);

  const [{ data: staff }, { data: touched }, { data: portions }] = await Promise.all([
    db.from("staff").select("id, display_name, role, is_active, created_at").in("role", [...QUEUE_ROLES]),
    db
      .from("prospects")
      .select("touched_by, touched_at")
      .not("touched_by", "is", null)
      .gte("touched_at", start.toISOString())
      .lt("touched_at", end.toISOString())
      .neq("status", "failed")
      .limit(10000),
    db
      .from("touch_portions")
      .select("staff_id, prospect_id, day, outcome, replaces, source")
      .gte("day", range.from)
      .lte("day", today)
      .eq("source", "portion")
      .limit(10000),
  ]);

  const rows = new Map<string, PeriodRow>();
  for (const s of staff ?? []) {
    const joinedDay = todayInTashkent(new Date(s.created_at as string));
    rows.set(s.id as string, {
      name: esc(s.display_name as string),
      active: s.is_active === true,
      joined: joinedDay > range.from ? dayLabel(joinedDay) : null,
      first: 0,
      second: 0,
      portionDone: 0,
      portionTarget: 0,
    });
  }

  for (const t of touched ?? []) {
    const row = rows.get(t.touched_by as string);
    if (!row) continue;
    if (Date.parse(t.touched_at as string) < split.getTime()) row.first += 1;
    else row.second += 1;
  }

  // Сегодняшние строки порции ещё открыты — итог по самой компании.
  const open = (portions ?? []).filter((p) => p.outcome === null).map((p) => p.prospect_id as string);
  const { data: openProspects } = open.length
    ? await db.from("prospects").select("id, status, touched_by, touched_at").in("id", open)
    : { data: [] };
  const byId = new Map((openProspects ?? []).map((p) => [p.id as string, p]));

  for (const p of portions ?? []) {
    const row = rows.get(p.staff_id as string);
    if (!row) continue;
    if (!p.replaces) row.portionTarget += 1;
    const live = byId.get(p.prospect_id as string);
    const outcome =
      p.outcome ??
      (live
        ? outcomeOf(
            {
              status: live.status as string,
              touched_by: (live.touched_by as string | null) ?? null,
              touched_at: (live.touched_at as string | null) ?? null,
            },
            p.staff_id as string,
            p.day as string,
          )
        : null);
    if (outcome === "sent" || outcome === "self") row.portionDone += 1;
  }

  // Ушедшие — только если за период что-то было: иначе отчёт про тех, кого нет.
  const list = [...rows.values()].filter((r) => r.active || r.first + r.second + r.portionTarget > 0);
  if (!list.length) return null;
  return periodText(list, range);
}
