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
  const db = serviceClient();
  if (!db) return touchProgress(null, 0);

  const [{ data: person }, counts] = await Promise.all([
    db.from("staff").select("touch_plan").eq("id", staffId).maybeSingle(),
    touchesThisWeek([staffId], now),
  ]);

  const plan = (person?.touch_plan as number | null) ?? null;
  return touchProgress(plan, counts.get(staffId) ?? 0);
}
