import { TASHKENT_OFFSET_MS } from "@/lib/ai-staff/plans";

/**
 * Часы работы людей клиента и режим «ИИ отвечает только в нерабочее время».
 *
 * Механика Jivo: днём отвечают люди, ночью и в выходные — ИИ. Для малого
 * бизнеса Узбекистана это самое понятное обещание: заявка в 23:00 не
 * пропадает до утра. Время — по Ташкенту.
 */

export type WorkHours = { from: string; to: string; days: number[] };

export const DEFAULT_HOURS: WorkHours = { from: "09:00", to: "18:00", days: [1, 2, 3, 4, 5, 6] };

function minutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

/** Часы из базы или формы: что не разобралось — по умолчанию. */
export function parseHours(raw: unknown): WorkHours {
  if (!raw || typeof raw !== "object") return DEFAULT_HOURS;
  const r = raw as Record<string, unknown>;
  const from = typeof r.from === "string" && minutes(r.from) !== null ? r.from : DEFAULT_HOURS.from;
  const to = typeof r.to === "string" && minutes(r.to) !== null ? r.to : DEFAULT_HOURS.to;
  const days = Array.isArray(r.days)
    ? [...new Set(r.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : DEFAULT_HOURS.days;
  return { from, to, days };
}

/**
 * Рабочее ли сейчас время у людей клиента. Дни — как в JavaScript:
 * 0 — воскресенье, 6 — суббота. Конец раньше начала — смена через полночь.
 */
export function isWorkTime(hours: WorkHours, now: Date): boolean {
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const day = local.getUTCDay();
  const at = local.getUTCHours() * 60 + local.getUTCMinutes();
  const from = minutes(hours.from) ?? 0;
  const to = minutes(hours.to) ?? 0;
  if (from === to) return hours.days.includes(day);
  if (from < to) return hours.days.includes(day) && at >= from && at < to;
  // Через полночь: вечер — сегодняшний день, ночь — вчерашний.
  if (at >= from) return hours.days.includes(day);
  if (at < to) return hours.days.includes((day + 6) % 7);
  return false;
}
