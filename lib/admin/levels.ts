/**
 * Уровни менеджеров, как в RPG (CLAUDE.md, «Грейд и уровни менеджеров»).
 *
 * Владелец, 17.10.2026: «сделай им уровни, как в играх рпг. Касания и
 * ведение дашборда дает очки. Чем выше уровень — тем лучше мы понимаем, что
 * они делают для компании».
 *
 * Очки (XP) — правилами по тому, что есть в базе, без модели. Чем ближе
 * действие к деньгам, тем больше за него дают: касание — попытка, оплата —
 * результат. Панель и порядок в лидах дают очки с потолком в день, чтобы
 * уровень нельзя было «насидеть», не работая с клиентами.
 *
 * Уровень — от накопленных очков за всё время; уровень L начинается с
 * 25·L·(L−1) очков: 2-й — с 50, 3-й — со 150, 5-й — с 500, 10-й — с 2 250.
 * Каждый следующий дороже: первые уровни берутся касаниями, дальние —
 * только сделками.
 *
 * Чистые функции; строки собирает lib/admin/levels-store.ts раз в час
 * (снимок stats_snapshots «staff-xp»). Держит tests/grade-levels.test.ts.
 */

import type { GradeStatus } from "@/lib/admin/grade-month";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/** Сколько очков за что. */
export const XP = {
  touch: 1,
  reply: 2,
  interest: 5,
  mockup: 10,
  shown: 15,
  priced: 20,
  paid: 100,
  /** Каждые PANEL_MINUTES активных минут в панели. */
  panel: 1,
  /** Смена статуса лида, сделанная задача, ответ боту «Порядка в лидах». */
  order: 2,
} as const;

export type XpKind = keyof typeof XP;
export const XP_KINDS = Object.keys(XP) as XpKind[];

export const PANEL_MINUTES = 15;
/** Потолок очков за панель в день: 2 часа работы в ней. */
export const PANEL_DAY_CAP = 8;
/** Потолок очков за порядок в лидах в день. */
export const ORDER_DAY_CAP = 20;

export type XpParts = Record<XpKind, number>;

export const noParts = (): XpParts => Object.fromEntries(XP_KINDS.map((k) => [k, 0])) as XpParts;

/** Очки из штук: { touch: 12, shown: 1 } → 12 + 15. */
export function xpOf(parts: Partial<XpParts>): number {
  return XP_KINDS.reduce((s, k) => s + (parts[k] ?? 0) * XP[k], 0);
}

const dayOf = (iso: string) => new Date(Date.parse(iso) + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);

/** Очки за панель: минуты по дням → по 1 очку за 15 минут, не больше 8 в день. Отдаёт число «штук» panel. */
export function panelUnits(days: readonly { day: string; minutes: number }[]): number {
  const byDay = new Map<string, number>();
  for (const d of days) byDay.set(d.day, (byDay.get(d.day) ?? 0) + (Number(d.minutes) || 0));
  let units = 0;
  for (const minutes of byDay.values()) units += Math.min(PANEL_DAY_CAP, Math.floor(minutes / PANEL_MINUTES));
  return units;
}

/** Порядок в лидах: действия по дням, по 2 очка, не больше 20 очков в день. Отдаёт число «штук» order. */
export function orderUnits(stamps: readonly string[]): number {
  const byDay = new Map<string, number>();
  for (const at of stamps) byDay.set(dayOf(at), (byDay.get(dayOf(at)) ?? 0) + 1);
  const capUnits = Math.floor(ORDER_DAY_CAP / XP.order);
  let units = 0;
  for (const n of byDay.values()) units += Math.min(capUnits, n);
  return units;
}

/* ── Уровни ──────────────────────────────────────────────────────────── */

/** С какого числа очков начинается уровень L. */
export function levelStart(level: number): number {
  return 25 * level * (level - 1);
}

export type Level = {
  level: number;
  xp: number;
  /** Очков от начала уровня. */
  into: number;
  /** Сколько очков в уровне всего (до следующего). */
  span: number;
  /** Сколько осталось до следующего уровня. */
  toNext: number;
};

export function levelOf(xp: number): Level {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (levelStart(level + 1) <= safe) level += 1;
  const start = levelStart(level);
  const span = levelStart(level + 1) - start;
  return { level, xp: safe, into: safe - start, span, toNext: start + span - safe };
}

/** Звание по уровню — ключ словаря (content/admin-panel/levels.ts). Выше 10-го — «Легенда». */
export const TITLES = ["novice", "scout", "tracker", "hunter", "negotiator", "closer", "dealmaster", "veteran", "champion", "legend"] as const;
export type Title = (typeof TITLES)[number];

export function titleOf(level: number): Title {
  return TITLES[Math.min(TITLES.length, Math.max(1, level)) - 1];
}

/* ── Снимок ──────────────────────────────────────────────────────────── */

export type XpPerson = { parts: XpParts; xp: number; week: number };
export type XpSnapshot = { computedAt: string; people: Record<string, XpPerson> };

export const XP_KEY = "staff-xp";
/** Снимок пересчитывается не чаще раза в час. */
export const XP_EVERY_MS = 3600_000;

export function snapshotStale(computedAt: string | null | undefined, now: Date): boolean {
  if (!computedAt) return true;
  return now.getTime() - Date.parse(computedAt) >= XP_EVERY_MS;
}

/* ── Рост человека на «Главной»: уровень и грейд ─────────────────────── */

export type Growth = {
  level: Level;
  title: Title;
  /** Очков за последние 7 дней. */
  week: number;
  parts: XpParts;
  /** Уровни ещё не считали (свип не прошёл) — показываем «считаем». */
  pending: boolean;
  grade: GradeStatus | null;
};

export function growthOf(
  id: string,
  snap: XpSnapshot | null,
  grade: GradeStatus | null,
): Growth {
  const person = snap?.people[id];
  const parts = person?.parts ?? noParts();
  const level = levelOf(person?.xp ?? 0);
  return { level, title: titleOf(level.level), week: person?.week ?? 0, parts, pending: !person, grade };
}
