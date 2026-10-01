import { touchesText } from "@/lib/admin/portion";

/**
 * Отчёт по касаниям за две недели — арифметика и текст. База — в
 * period-report-store.
 *
 * Владелец, 01.10: «Отправь мне и Александру отчёт по сотрудникам за 2
 * недели работы, чтобы было видно, кто сколько касаний сделал».
 *
 * Две недели — это две половины по семь дней, неделя к неделе: так видно не
 * только сколько, но и куда идёт человек — разгоняется или стих.
 */

export const PERIOD_DAYS = 14;

export type PeriodRow = {
  name: string;
  /** Ещё в команде. Ушедшие показываются, только если что-то сделали. */
  active: boolean;
  /** Пришёл внутри периода — с какого дня (ДД.ММ): ноль за дни до прихода — не провал. */
  joined: string | null;
  /** Касания в первой и во второй половине периода. */
  first: number;
  second: number;
  /** Порция за дни, когда она была: сделано из выданного утром. */
  portionDone: number;
  portionTarget: number;
};

/** День по Ташкенту, сдвинутый на `shift` дней: «2026-10-01», -13 → «2026-09-18». */
export function shiftDay(day: string, shift: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + shift * 24 * 3600_000).toISOString().slice(0, 10);
}

/** «2026-09-18» → «18.09». */
export function dayLabel(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}.${month}`;
}

/** Границы периода, который кончается сегодня: первая половина, вторая, всё вместе. */
export function periodRange(today: string, days: number = PERIOD_DAYS) {
  const from = shiftDay(today, -(days - 1));
  const half = Math.floor(days / 2);
  return { from, secondFrom: shiftDay(from, half), to: today };
}

/**
 * «Александр — 42 касания: 30 → 12 · порция 4 из 15».
 *
 * Стрелка — первая неделя к второй. ⚠️ — человек в команде, а касаний за
 * весь период ноль.
 */
export function periodLine(r: PeriodRow): string {
  const total = r.first + r.second;
  const parts = [`${r.name} — ${touchesText(total)}${total ? `: ${r.first} → ${r.second}` : ""}`];
  if (r.portionTarget) parts.push(`порция ${r.portionDone} из ${r.portionTarget}`);
  const notes = [r.joined ? `в команде с ${r.joined}` : "", r.active ? "" : "уже не в команде"].filter(Boolean);
  const flag = r.active && total === 0 ? " ⚠️" : "";
  return `${parts.join(" · ")}${flag}${notes.length ? ` (${notes.join(", ")})` : ""}`;
}

/** Больше касаний — выше; поровну — по имени. */
export function byPeriodTouches(a: PeriodRow, b: PeriodRow): number {
  return b.first + b.second - (a.first + a.second) || a.name.localeCompare(b.name, "ru");
}

export function periodText(rows: readonly PeriodRow[], range: { from: string; secondFrom: string; to: string }): string {
  const first = rows.reduce((sum, r) => sum + r.first, 0);
  const second = rows.reduce((sum, r) => sum + r.second, 0);
  const done = rows.reduce((sum, r) => sum + r.portionDone, 0);
  const target = rows.reduce((sum, r) => sum + r.portionTarget, 0);
  const firstTo = shiftDay(range.secondFrom, -1);
  return [
    `<b>Касания за две недели · ${dayLabel(range.from)}–${dayLabel(range.to)}</b>`,
    `Неделя к неделе: ${dayLabel(range.from)}–${dayLabel(firstTo)} → ${dayLabel(range.secondFrom)}–${dayLabel(range.to)}.`,
    "",
    ...[...rows].sort(byPeriodTouches).map(periodLine),
    "",
    `Всего: ${touchesText(first + second)}: ${first} → ${second}${target ? ` · порции: ${done} из ${target}` : ""}`,
    "",
    "Касание — компания, которой человек написал: «Отправить» (ушло ботом) или «Написал сам». Неушедшие письма не в счёт. Порция — сколько из утренней раздачи сделано за дни, когда она была; сегодняшняя — на этот час.",
  ].join("\n");
}
