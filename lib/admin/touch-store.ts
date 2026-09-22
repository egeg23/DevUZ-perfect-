import { serviceClient } from "@/lib/supabase";
import { touchProgress, weekWindow, type TouchProgress } from "@/lib/admin/touch-plan";

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
  return counts;
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
