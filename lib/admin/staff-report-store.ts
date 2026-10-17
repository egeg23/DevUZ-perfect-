import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { wants } from "@/lib/admin/notify-prefs";
import { REPORT_HOUR, dayStartUtc, isWorkday, tallyPortion, tashkentHour, type PortionOutcome } from "@/lib/admin/portion";
import { dayRow } from "@/lib/admin/portion-store";
import { todayInTashkent } from "@/lib/admin/pulse";
import {
  PRESENCE_FROM,
  STAFF_REPORT_LATEST_HOUR,
  staffReportText,
  type PanelDay,
  type StaffDay,
} from "@/lib/admin/staff-report";
import { staleCounts } from "@/lib/admin/lead-tidy-store";
import { personSales, weekStartOf } from "@/lib/admin/sales-stages";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import { touchesOnDay } from "@/lib/admin/touch-store";
import { TRACKED } from "@/lib/admin/usage";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Вечерний отчёт по сотрудникам (lib/admin/staff-report.ts): собрать день
 * и разослать владельцу и руководителям.
 *
 * Идёт после того, как порция дня закрыта (reportPortions ставит
 * reported_at): итоги порции к этому времени окончательные. Отметка — в
 * team_news_sent, ключ «staff-report:ГГГГ-ММ-ДД», по человеку: два прохода
 * свипа не пришлют отчёт дважды, а не дошедший — пришлют снова, пока не
 * 23:00.
 */
export async function sendStaffReport(now: Date = new Date()): Promise<number> {
  const hour = tashkentHour(now);
  if (!isWorkday(now) || hour < REPORT_HOUR || hour >= STAFF_REPORT_LATEST_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  const mark = await dayRow(day);
  if (!mark?.reported_at) return 0;

  const key = `staff-report:${day}`;
  // Читают владелец и руководители — только они. Галочка «Отчёты» в
  // «Команде» выключает, как и прежний вечерний отчёт.
  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]),
    db.from("team_news_sent").select("staff_id").eq("news_id", key),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));
  const due = (readers ?? []).filter(
    (r) =>
      Number(r.telegram_user_id) &&
      !already.has(r.id as string) &&
      wants((r.notify_off as string[] | null) ?? [], "reports"),
  );
  if (!due.length) return 0;

  const people = await loadStaffDay(day);
  if (!people.length) return 0;
  const text = staffReportText(day, people);

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

/** День каждого сотрудника из очереди касаний: порция, касания, панель, действия. */
export async function loadStaffDay(day: string): Promise<StaffDay[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data: staff } = await db
    .from("staff")
    .select("id, display_name, role")
    .eq("is_active", true)
    .in("role", [...QUEUE_ROLES]);
  const team = (staff ?? []).map((s) => ({ id: s.id as string, name: s.display_name as string, role: s.role as string }));
  if (!team.length) return [];
  const ids = team.map((p) => p.id);
  const from = dayStartUtc(day);
  const to = new Date(from.getTime() + 24 * 3600_000);

  const [{ data: rows }, touches, { data: views }, { data: presence }, { data: audit }, { data: burned }, stale, deals] = await Promise.all([
    db.from("touch_portions").select("staff_id, outcome, replaces, source").eq("day", day),
    touchesOnDay(ids, day),
    db.from("panel_usage").select("staff_id, section, views, last_at").eq("day", day).in("staff_id", ids),
    db.from("panel_presence").select("staff_id, minutes, first_at, last_at").eq("day", day).in("staff_id", ids),
    db
      .from("audit_events")
      .select("actor_staff_id, action")
      .in("actor_staff_id", ids)
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .limit(20000),
    db
      .from("lead_offers")
      .select("staff_id")
      .eq("outcome", "expired")
      .in("staff_id", ids)
      .gte("closed_at", from.toISOString())
      .lt("closed_at", to.toISOString())
      .limit(5000),
    staleCounts(ids, new Date(Math.min(Date.now(), to.getTime()))).catch(() => new Map<string, number>()),
    loadDeals(new Date(Math.min(Date.now(), to.getTime())), 14).catch(() => null),
  ]);
  const weekFrom = weekStartOf(new Date(from.getTime() + 12 * 3600_000));
  const burnedBy = new Map<string, number>();
  for (const b of burned ?? []) burnedBy.set(b.staff_id as string, (burnedBy.get(b.staff_id as string) ?? 0) + 1);

  // Порция — по закрытым строкам: «expired» — не сделано.
  const portion = new Map<string, { replaces: string | null; outcome: PortionOutcome | null }[]>();
  const stream = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = row.staff_id as string;
    const outcome = row.outcome === "expired" ? null : ((row.outcome as PortionOutcome | null) ?? null);
    if (row.source === "stream") {
      if (outcome === "sent" || outcome === "self") stream.set(id, (stream.get(id) ?? 0) + 1);
    } else {
      portion.set(id, [...(portion.get(id) ?? []), { replaces: (row.replaces as string | null) ?? null, outcome }]);
    }
  }

  const labels = new Map(TRACKED.map((t) => [t.href, t.label.ru]));
  const actions = new Map<string, number>();
  const taken = new Map<string, number>();
  for (const event of audit ?? []) {
    const id = event.actor_staff_id as string;
    const action = event.action as string;
    // Вход — не работа: сессия живёт неделями, а вход по ссылке — не выбор.
    if (action.startsWith("login.")) continue;
    actions.set(id, (actions.get(id) ?? 0) + 1);
    if (action === "lead.taken") taken.set(id, (taken.get(id) ?? 0) + 1);
  }

  return team.map((person) => {
    const t = tallyPortion(portion.get(person.id) ?? []);
    const mine = (views ?? []).filter((v) => v.staff_id === person.id);
    const seen = (presence ?? []).find((p) => p.staff_id === person.id);
    const lastView = mine.map((v) => v.last_at as string).sort().at(-1) ?? null;
    const panel: PanelDay = {
      views: mine.reduce((s, v) => s + Number(v.views ?? 0), 0),
      top: [...mine]
        .sort((a, b) => Number(b.views) - Number(a.views))
        .slice(0, 2)
        .map((v) => labels.get(v.section as string) ?? (v.section as string)),
      minutes: seen ? Number(seen.minutes ?? 0) : day >= PRESENCE_FROM ? 0 : null,
      firstAt: (seen?.first_at as string | undefined) ?? null,
      lastAt: [seen?.last_at as string | undefined, lastView].filter((x): x is string => Boolean(x)).sort().at(-1) ?? null,
    };
    return {
      name: esc(person.name),
      role: person.role,
      report: {
        name: person.name,
        target: t.target,
        done: t.done,
        skipped: t.skipped,
        short: t.short,
        stream: stream.get(person.id) ?? 0,
        touches: touches.get(person.id) ?? 0,
      },
      panel,
      actions: actions.get(person.id) ?? 0,
      leadsTaken: taken.get(person.id) ?? 0,
      offersBurned: burnedBy.get(person.id) ?? 0,
      staleLeads: stale.get(person.id) ?? 0,
      sales: deals
        ? {
            day: personSales(deals, person.id, from.getTime(), to.getTime()),
            week: personSales(deals, person.id, weekFrom, to.getTime()),
          }
        : undefined,
    };
  });
}
