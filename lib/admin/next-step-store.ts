import { nextStepOf, type NextStep } from "@/lib/admin/next-step";
import { serviceClient } from "@/lib/supabase";

/**
 * Следующий шаг каждого лида страницы (lib/admin/next-step.ts) — одним
 * запросом: открытые напоминания по этим лидам. База не ответила — шагов
 * нет, список рисуется как раньше.
 */
export async function nextStepsFor(leadIds: readonly string[]): Promise<Record<string, NextStep>> {
  const db = serviceClient();
  if (!db || !leadIds.length) return {};
  const { data, error } = await db
    .from("lead_reminders")
    .select("lead_id, due_at, note, done_at")
    .in("lead_id", [...leadIds])
    .is("done_at", null)
    .limit(1000);
  if (error) {
    console.error("следующий шаг: не прочитал напоминания", error.message);
    return {};
  }
  const by = new Map<string, { due_at: string; note: string | null; done_at: string | null }[]>();
  for (const r of data ?? []) {
    const list = by.get(r.lead_id as string) ?? [];
    list.push({ due_at: r.due_at as string, note: (r.note as string | null) ?? null, done_at: null });
    by.set(r.lead_id as string, list);
  }
  const out: Record<string, NextStep> = {};
  for (const [id, list] of by) {
    const step = nextStepOf(list);
    if (step) out[id] = step;
  }
  return out;
}
