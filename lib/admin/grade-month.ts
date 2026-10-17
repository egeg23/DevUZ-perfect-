/**
 * Грейд менеджера по сделкам месяца (CLAUDE.md, «Грейд и уровни менеджеров»).
 *
 * Владелец, 17.10.2026: «Грейд менеджерам: 3 сделки за месяц = 15% вместо
 * 10% на следующий календарный месяц + после 3 сделок премия 200$ помимо %».
 * Уточнения владельца в тот же день: «15% сохранить до ноября» — до
 * 01.11.2026 ставки прежние (грейд из «Команды»), с ноября база 10%, а 15%
 * получает тот, кто закрыл 3 сделки в прошлом календарном месяце; сделка —
 * «первая оплата по проекту»; премия — «за каждые 3 сделки».
 *
 * - **Сделка** — проект менеджера (ведущий — `owner_staff_id`), не
 *   отменённый, засчитывается в месяц своей первой оплаты (по Ташкенту, дата
 *   платежа). Оплату не накрутить: её подтверждает тот, кто ведёт деньги.
 * - **Ставка со сделки нового клиента** в месяце М (с GRADE_FROM): в
 *   прошлом месяце 3+ сделки — 15%, иначе 10%; персональная ставка из
 *   «Команды» — база вместо 10%, и 15% её не понижает. Допродажи, грейд
 *   руководителя и проценты, выставленные владельцем по сделке руками, —
 *   по-прежнему.
 * - **Премия** — 200 $ за каждые 3 сделки месяца (3 → 200, 6 → 400),
 *   считается по сделкам с GRADE_FROM; заработана — как только пришла оплата
 *   третьей сделки, и идёт в «Заработано» вместе с процентами.
 *
 * Чистые функции, без запросов и без модели; держит tests/grade-levels.test.ts.
 */

import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import type { DealKind, Earner, PaymentMoney, ProjectMoney } from "@/lib/admin/finance";

/** С какого месяца действует новое правило. До него — ставка по грейду, премий нет. */
export const GRADE_FROM = "2026-11";
export const BASE_PERCENT = 10;
export const BOOST_PERCENT = 15;
export const DEALS_FOR_BOOST = 3;
export const BONUS_USD = 200;
export const BONUS_EVERY = 3;

export type Month = string; // «ГГГГ-ММ»

/** Месяц по Ташкенту для момента. */
export function monthOf(now: Date): Month {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 7);
}

export function prevMonth(m: Month): Month {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

export function nextMonth(m: Month): Month {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}

type DealProject = Pick<ProjectMoney, "id" | "owner_staff_id" | "stage">;
type DealPayment = PaymentMoney & { paid_on: string };

export type GradeBook = {
  /** Проект → месяц первой оплаты. Нет оплаты — проекта здесь нет. */
  dealMonth: ReadonlyMap<string, Month>;
  /** Ведущий → месяц → сколько сделок. */
  counts: ReadonlyMap<string, ReadonlyMap<Month, number>>;
  /** Сегодняшний месяц: им считается ставка проекта, по которому ещё нет оплаты. */
  now: Month;
};

export function gradeBook(projects: readonly DealProject[], payments: readonly DealPayment[], now: Date): GradeBook {
  const first = new Map<string, string>();
  for (const p of payments) {
    if (!(Number(p.amount_usd) > 0) || !p.paid_on) continue;
    const cur = first.get(p.project_id);
    if (!cur || p.paid_on < cur) first.set(p.project_id, p.paid_on);
  }
  const dealMonth = new Map<string, Month>();
  const counts = new Map<string, Map<Month, number>>();
  for (const project of projects) {
    const day = first.get(project.id);
    if (!day || project.stage === "cancelled" || !project.owner_staff_id) continue;
    const month = day.slice(0, 7);
    dealMonth.set(project.id, month);
    const byMonth = counts.get(project.owner_staff_id) ?? new Map<Month, number>();
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    counts.set(project.owner_staff_id, byMonth);
  }
  return { dealMonth, counts, now: monthOf(now) };
}

export function dealsIn(book: GradeBook, staffId: string, month: Month): number {
  return book.counts.get(staffId)?.get(month) ?? 0;
}

/** В этом месяце у человека 15%: в прошлом было 3+ сделки. */
export function boosted(book: GradeBook, staffId: string, month: Month): boolean {
  return dealsIn(book, staffId, prevMonth(month)) >= DEALS_FOR_BOOST;
}

/**
 * Ставка ведущего по сделке нового клиента по новому правилу; null — правило
 * не действует (до GRADE_FROM, допродажа, грейд руководителя), считать по
 * грейду, как раньше.
 */
export function gradeRate(
  earner: Pick<Earner, "id" | "grade" | "rate_percent">,
  kind: DealKind,
  month: Month,
  book: GradeBook,
): number | null {
  if (month < GRADE_FROM || kind !== "new" || earner.grade === "head") return null;
  const base = earner.rate_percent ?? BASE_PERCENT;
  return boosted(book, earner.id, month) ? Math.max(base, BOOST_PERCENT) : base;
}

export type Bonus = { staff_id: string; month: Month; deals: number; amount_usd: number };

/** Премии: 200 $ за каждые 3 сделки месяца, с GRADE_FROM. */
export function bonusesOf(book: GradeBook): Bonus[] {
  const out: Bonus[] = [];
  for (const [staffId, byMonth] of book.counts) {
    for (const [month, deals] of byMonth) {
      if (month < GRADE_FROM) continue;
      const amount = Math.floor(deals / BONUS_EVERY) * BONUS_USD;
      if (amount > 0) out.push({ staff_id: staffId, month, deals, amount_usd: amount });
    }
  }
  return out.sort((a, b) => a.month.localeCompare(b.month));
}

/* ── Карточка грейда на «Главной» ────────────────────────────────────── */

export type GradeStatus = {
  month: Month;
  /** Сделок в этом месяце. */
  deals: number;
  target: number;
  /** Ставка с нового клиента в этом месяце; null — правило ещё не действует (ставка по грейду). */
  rateNow: number | null;
  /** Какой будет ставка в следующем месяце при нынешнем счёте. */
  rateNext: number;
  /** Премия за этот месяц уже заработана, $. */
  bonusNow: number;
  /** Сколько сделок до следующих 200 $. */
  toNextBonus: number;
  /** Правило уже действует (с GRADE_FROM). */
  active: boolean;
};

export function gradeStatus(
  earner: Pick<Earner, "id" | "grade" | "rate_percent">,
  book: GradeBook,
): GradeStatus {
  const month = book.now;
  const deals = dealsIn(book, earner.id, month);
  const base = earner.rate_percent ?? BASE_PERCENT;
  const active = month >= GRADE_FROM;
  return {
    month,
    deals,
    target: DEALS_FOR_BOOST,
    rateNow: gradeRate(earner, "new", month, book),
    rateNext: deals >= DEALS_FOR_BOOST ? Math.max(base, BOOST_PERCENT) : base,
    bonusNow: active ? Math.floor(deals / BONUS_EVERY) * BONUS_USD : 0,
    toNextBonus: BONUS_EVERY - (deals % BONUS_EVERY),
    active,
  };
}
