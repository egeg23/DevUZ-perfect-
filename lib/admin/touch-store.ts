import { serviceClient } from "@/lib/supabase";
import { dayStartUtc } from "@/lib/admin/portion";
import { touchProgress, weekWindow, type TouchProgress } from "@/lib/admin/touch-plan";

/**
 * Лиды, добавленные вручную, — тоже касания (владелец, 19.11.2026, со слов
 * Эльдара: «Доработать добавление лида непосредственно, чтобы как касание
 * считалось… а у меня 1 касание»). Менеджер пишет агентствам и клиентам сам
 * — с личного номера, в почту, на звонке — и заводит лид в «Добавить лид
 * вручную»: строки в «Холодных касаниях» у такого разговора нет. Считаем по
 * журналу «lead.added»: одна запись на лид и тому, кто добавил, — тот и писал.
 * Отметки ступеней («Назвал цену») касанием не считаются: это шаг уже
 * засчитанного разговора, иначе один клиент давал бы два касания.
 */
export async function manualLeadStamps(
  staffIds: readonly string[],
  from: Date,
  to: Date,
): Promise<{ actor: string; at: string }[]> {
  if (!staffIds.length) return [];
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("audit_events")
    .select("actor_staff_id, created_at")
    .eq("action", MANUAL_LEAD_ACTION)
    .in("actor_staff_id", [...staffIds])
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .limit(5000);
  return (data ?? [])
    .filter((r) => r.actor_staff_id && r.created_at)
    .map((r) => ({ actor: String(r.actor_staff_id), at: String(r.created_at) }));
}

/** Действие журнала «добавил лид вручную» (lib/admin/lead-add.ts). */
export const MANUAL_LEAD_ACTION = "lead.added";

function addManual(counts: Map<string, number>, stamps: readonly { actor: string }[]): Map<string, number> {
  for (const s of stamps) counts.set(s.actor, (counts.get(s.actor) ?? 0) + 1);
  return counts;
}

/**
 * Касания за неделю — по тому, кто написал, а не по тому, кто взял.
 *
 * Считаем строки касаний, а не события журнала: журнал пишет и подготовку, и
 * отметки, и по нему «сколько написал» превращается в «сколько нажал». Одна
 * компания — одно касание, и сосчитать его можно ровно один раз.
 *
 * Неудавшиеся отправки не в счёте. Касание засчитывается в момент нажатия,
 * до того как сработает очередь, — и если скаут не донёс, работа менеджера
 * не состоялась, сколько бы кнопок он ни нажал.
 */
export async function touchesThisWeek(
  staffIds: readonly string[],
  now: Date = new Date(),
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!staffIds.length) return counts;

  const db = serviceClient();
  if (!db) return counts;

  const week = weekWindow(now);
  const { data } = await db
    .from("prospects")
    .select("touched_by")
    .in("touched_by", [...staffIds])
    .gte("touched_at", week.from.toISOString())
    .lt("touched_at", week.to.toISOString())
    .neq("status", "failed")
    .limit(5000);

  for (const row of data ?? []) {
    const id = row.touched_by as string | null;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return addManual(counts, await manualLeadStamps(staffIds, week.from, week.to));
}

/**
 * Касания за день по Ташкенту — по тому же правилу, что и за неделю: одна
 * компания — одно касание, неудавшиеся отправки не в счёте. Порция, поток
 * и всё, что написано из панели сверх них, — вместе: для вечернего отчёта.
 */
export async function touchesOnDay(staffIds: readonly string[], day: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!staffIds.length) return counts;

  const db = serviceClient();
  if (!db) return counts;

  const from = dayStartUtc(day);
  const to = new Date(from.getTime() + 24 * 3600_000);
  const { data } = await db
    .from("prospects")
    .select("touched_by")
    .in("touched_by", [...staffIds])
    .gte("touched_at", from.toISOString())
    .lt("touched_at", to.toISOString())
    .neq("status", "failed")
    .limit(5000);

  for (const row of data ?? []) {
    const id = row.touched_by as string | null;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return addManual(counts, await manualLeadStamps(staffIds, from, to));
}

/**
 * План и выполнение одного человека.
 *
 * Отдельным запросом за планом, а не полем сессии: план меняет руководитель,
 * и сессия менеджера про эту правку не узнает до перелогина — то есть панель
 * показывала бы вчерашнее число ровно тому, кому его поставили сегодня.
 */
export async function touchProgressOf(
  staffId: string,
  now: Date = new Date(),
): Promise<TouchProgress> {
  return (await touchProgressFor([staffId], now)).get(staffId) ?? touchProgress(null, 0);
}

/**
 * План и выполнение сразу нескольких — для таблицы команды у руководителя и
 * владельца. Два запроса на всех, а не два на каждого.
 */
export async function touchProgressFor(
  staffIds: readonly string[],
  now: Date = new Date(),
): Promise<Map<string, TouchProgress>> {
  const out = new Map<string, TouchProgress>();
  if (!staffIds.length) return out;

  const db = serviceClient();
  if (!db) return out;

  const [{ data: people }, counts] = await Promise.all([
    db.from("staff").select("id, touch_plan").in("id", [...staffIds]),
    touchesThisWeek(staffIds, now),
  ]);

  for (const row of people ?? []) {
    const id = row.id as string;
    out.set(id, touchProgress((row.touch_plan as number | null) ?? null, counts.get(id) ?? 0));
  }
  return out;
}
