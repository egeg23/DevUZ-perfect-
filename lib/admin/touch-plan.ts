import { touchPlanDict } from "@/content/admin-panel/home";
import type { PanelLocale } from "@/lib/admin/i18n";
import { periodStart, windowOf, type Window } from "@/lib/admin/pulse";

/**
 * Недельный план касаний: сколько человек должен написать и сколько осталось.
 *
 * Чистая арифметика: «сейчас» приходит аргументом, строки — из базы отдельно.
 * Неделя считается по Ташкенту и начинается в понедельник — те же границы,
 * что у пульса, чтобы «за эту неделю» в двух разделах не означало разное.
 *
 * Потолок — тот же, что в проверке базы. Держать его здесь и там разными
 * значило бы отдать пользователю форму, которая молча не сохраняется.
 */
export const TOUCH_PLAN_MAX = 500;

export type TouchProgress = {
  /** Сколько касаний в неделю ожидается. null — план не ставили. */
  plan: number | null;
  /** Сколько уже сделано с понедельника. */
  done: number;
  /**
   * Сколько осталось до плана.
   *
   * null — плана нет, и требовать нечего. Ноль и «не задан» — разные вещи:
   * «осталось 0 из 0» тому, кому план не ставили, это неправда, а не пустая
   * строка.
   */
  left: number | null;
};

export function touchProgress(plan: number | null, done: number): TouchProgress {
  const clean = Math.max(0, Math.trunc(done));
  if (plan === null) return { plan: null, done: clean, left: null };
  return { plan, done: clean, left: Math.max(0, plan - clean) };
}

/** Окно текущей недели по Ташкенту. */
export function weekWindow(now: Date): Window {
  return windowOf("week", periodStart("week", now));
}

/**
 * Разбор поля плана из формы.
 *
 * Пустая строка — это «плана нет», а не ноль: руководителю нужен способ снять
 * план, и стирание поля — единственный, который он попробует.
 *
 * Ошибка — кодом, а не фразой: её показывает страница «Команда» на языке
 * того, кто ставит план (teamDict.plan_nan / plan_big).
 */
export type TouchPlanError = "plan_nan" | "plan_big";

export function parseTouchPlan(raw: string): { ok: true; plan: number | null } | { ok: false; why: TouchPlanError } {
  const text = raw.trim();
  if (!text) return { ok: true, plan: null };
  if (!/^\d{1,3}$/.test(text)) return { ok: false, why: "plan_nan" };
  const plan = Number(text);
  if (plan > TOUCH_PLAN_MAX) return { ok: false, why: "plan_big" };
  return { ok: true, plan };
}

/**
 * Строка, которую видит менеджер.
 *
 * Собрана здесь, а не в разметке: показывается она в двух местах — на главной
 * и в касаниях, — и две копии разошлись бы на первой же правке слов.
 */
export function planLine(p: TouchProgress, locale: PanelLocale = "ru"): string | null {
  if (p.plan === null) return null;
  const t = touchPlanDict;
  if (p.plan === 0) return t.none[locale];
  if (p.left === 0) {
    return p.done > p.plan ? t.closedOver[locale](p.done, p.plan) : t.closed[locale](p.done, p.plan);
  }
  return t.left[locale](p.left ?? 0, p.done, p.plan);
}
