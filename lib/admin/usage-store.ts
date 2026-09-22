import { todayInTashkent } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";
import {
  usageReport,
  type ActionRow,
  type Person,
  type UsagePeriod,
  type UsageReport,
  type ViewRow,
} from "@/lib/admin/usage";
import { serviceClient } from "@/lib/supabase";

/**
 * Один просмотр раздела. Никогда не бросает: учёт — не повод ронять
 * страницу, которую человек открыл работать.
 */
export async function bumpUsage(staffId: string, section: string, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.rpc("bump_panel_usage", {
    p_staff: staffId,
    p_section: section,
    p_day: todayInTashkent(now),
  });
  if (error) console.error("usage: не записал просмотр", error.message);
}

const DAY_MS = 24 * 3600_000;

/**
 * Отчёт за последние `days` дней и сравнение с предыдущими `days`.
 *
 * `since` — с какого дня вообще считаются просмотры: учёт появился не с
 * первого дня панели, и «0 просмотров» до его появления значит «не знаем», а
 * не «никто не открывал». Действия из журнала старше — он ведётся давно.
 */
export async function loadUsage(
  days: UsagePeriod,
  now: Date = new Date(),
): Promise<UsageReport & { since: string | null; offline: boolean }> {
  const empty = usageReport({ people: [], views: [], prevViews: [], actions: [], prevActions: [] });
  const db = serviceClient();
  if (!db) return { ...empty, since: null, offline: true };

  const from = new Date(now.getTime() - days * DAY_MS);
  const prevFrom = new Date(now.getTime() - 2 * days * DAY_MS);
  // Сутки считаются по Ташкенту, как и в счётчике: «последние 7 дней» — это
  // сегодня и шесть дней до него.
  const dayFrom = todayInTashkent(new Date(from.getTime() + DAY_MS));
  const prevDayFrom = todayInTashkent(new Date(prevFrom.getTime() + DAY_MS));

  const { data: staff, error } = await db
    .from("staff")
    .select("id, display_name, role")
    .eq("is_active", true)
    .neq("role", "admin");
  if (error) return { ...empty, since: null, offline: true };

  const people: Person[] = (staff ?? []).map((s) => ({
    id: s.id as string,
    name: s.display_name as string,
    role: s.role as Role,
  }));
  const ids = people.map((p) => p.id);
  if (!ids.length) return { ...empty, since: null, offline: false };

  const [views, audit, first] = await Promise.all([
    db
      .from("panel_usage")
      .select("day, staff_id, section, views, last_at")
      .in("staff_id", ids)
      .gte("day", prevDayFrom)
      .limit(20000),
    db
      .from("audit_events")
      .select("action, actor_staff_id, created_at, meta")
      .in("actor_staff_id", ids)
      .gte("created_at", prevFrom.toISOString())
      .order("created_at", { ascending: false })
      .limit(20000),
    db.from("panel_usage").select("day").order("day", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const viewRows: ViewRow[] = (views.data ?? []).map((r) => ({
    day: r.day as string,
    staff_id: r.staff_id as string,
    section: r.section as string,
    views: r.views as number,
    last_at: (r.last_at as string | null) ?? null,
  }));
  const actionRows: ActionRow[] = (audit.data ?? []).map((r) => ({
    action: r.action as string,
    actor: r.actor_staff_id as string,
    at: r.created_at as string,
    via: ((r.meta as { via?: string } | null)?.via as string | undefined) ?? null,
  }));

  const report = usageReport({
    people,
    views: viewRows.filter((v) => v.day >= dayFrom),
    prevViews: viewRows.filter((v) => v.day < dayFrom),
    // Числами, а не строками: база отдаёт «+00:00» с микросекундами, а
    // toISOString — «Z» с миллисекундами, и на границе строки врут.
    actions: actionRows.filter((a) => Date.parse(a.at) >= from.getTime()),
    prevActions: actionRows.filter((a) => Date.parse(a.at) < from.getTime()),
  });

  return {
    ...report,
    since: (first.data?.day as string | undefined) ?? null,
    offline: Boolean(views.error || audit.error),
  };
}
