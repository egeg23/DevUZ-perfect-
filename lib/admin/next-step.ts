/**
 * «Следующий шаг» у лида — ближайшее открытое напоминание по нему.
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Pipedrive»: «Погнали по
 * порядку». В Pipedrive у каждой сделки есть следующее действие с датой, и
 * сделка без него сразу видна. У нас то же самое уже было — напоминание в
 * карточке лида (lead_reminders) — но его не было видно ни в списке, ни
 * боту «Порядок в лидах», и тот спрашивал «чем кончилось» про лиды, у
 * которых шаг давно назначен.
 *
 * Здесь — без базы: какой шаг ближайший и в каком он виде. Строки —
 * lib/admin/next-step-store.ts; бот — lib/admin/lead-tidy-store.ts (шаг
 * впереди — до него не спрашивает, как после «⏳»).
 */

export type NextStep = { due_at: string; note: string | null };

/** Ближайшее открытое напоминание; закрытые — уже не шаг. */
export function nextStepOf(reminders: readonly (NextStep & { done_at: string | null })[]): NextStep | null {
  let best: NextStep | null = null;
  for (const r of reminders) {
    if (r.done_at) continue;
    if (!best || Date.parse(r.due_at) < Date.parse(best.due_at)) best = { due_at: r.due_at, note: r.note };
  }
  return best;
}

/**
 * Как показать шаг в списке. «none» — лид в работе, за кем-то, а шага нет:
 * его и надо заметить. У нового и закрытого лида шаг не обязателен.
 */
export type StepState = "planned" | "late" | "none" | "na";

export function stepState(step: NextStep | null | undefined, lead: { status: string; assigned_staff_id: string | null }, now: number): StepState {
  if (step) return Date.parse(step.due_at) < now ? "late" : "planned";
  return lead.status === "taken" && lead.assigned_staff_id ? "none" : "na";
}
