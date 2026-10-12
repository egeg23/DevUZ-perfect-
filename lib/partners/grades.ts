/**
 * Грейды партнёров: уровни для агентств и блогеров.
 *
 * Задача Александра «Составить грейды для агентства и блогеров»; надбавки
 * и пороги утвердил владелец 12.10.2026 (+2 / +4 / +6 п.п.). Полный текст
 * с привилегиями — kp/partner-grades.html (PDF рядом).
 *
 * Грейд — надбавка в процентных пунктах к ставке из PARTNER_TIERS
 * (lib/partners/rules.ts), одинаковая для обеих моделей. Сами деньги пока
 * по грейдам не считаются: кабинет партнёра уровня не показывает, надбавку
 * на проект ставит владелец процентом по проекту. Встроить в кабинет —
 * только по слову владельца. Отсюда грейды берут презентация программы и
 * тест, чтобы цифры не разошлись с документом.
 */
import { PARTNER_TIERS } from "@/lib/partners/rules";

export type GradeKind = "agency" | "blogger";

export type Grade = {
  key: string;
  /** Оплаченных проектов (клиентов) за 12 месяцев. 0 — уровень с первого дня. */
  projects: number;
  /** Или оборот оплаченных проектов за 12 месяцев, $. null — только по проектам. */
  turnoverUsd: number | null;
  /** Надбавка к ставке таблицы, процентных пунктов. */
  bonus: number;
};

export const GRADES: Record<GradeKind, readonly Grade[]> = {
  agency: [
    { key: "start", projects: 0, turnoverUsd: null, bonus: 0 },
    { key: "proven", projects: 2, turnoverUsd: 10_000, bonus: 2 },
    { key: "key", projects: 5, turnoverUsd: 30_000, bonus: 4 },
    { key: "strategic", projects: 10, turnoverUsd: 75_000, bonus: 6 },
  ],
  blogger: [
    { key: "start", projects: 0, turnoverUsd: null, bonus: 0 },
    { key: "author", projects: 1, turnoverUsd: null, bonus: 2 },
    { key: "ambassador", projects: 3, turnoverUsd: 10_000, bonus: 4 },
    { key: "face", projects: 7, turnoverUsd: 30_000, bonus: 6 },
  ],
};

/** Потолок ставки с надбавкой: верхняя ступень таблицы плюс старшая надбавка. */
export function gradeCap(model: "profit" | "turnover"): number {
  const top = PARTNER_TIERS[PARTNER_TIERS.length - 1];
  const bonus = Math.max(...GRADES.agency.map((g) => g.bonus), ...GRADES.blogger.map((g) => g.bonus));
  return top[model] + bonus;
}

/** Уровень по итогам 12 месяцев: последний, условие которого выполнено. */
export function gradeOf(kind: GradeKind, paidProjects: number, turnoverUsd: number): Grade {
  const list = GRADES[kind];
  let reached = list[0];
  for (const g of list) {
    const byProjects = paidProjects >= g.projects;
    const byTurnover = g.turnoverUsd !== null && turnoverUsd >= g.turnoverUsd;
    if (byProjects || byTurnover) reached = g;
  }
  return reached;
}
