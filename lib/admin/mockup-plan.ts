import plans from "@/content/mockup-plans.json" with { type: "json" };
import type { EstimateItem } from "@/lib/admin/estimate";
import { estimateTotal } from "@/lib/admin/estimate";

/**
 * «Состав из макета»: смета договора из конструктора цены макета.
 *
 * Владелец, 29.10.2026: «У нас сложный раздел проектов, очень много всего
 * заполнять надо. Давай проще сделаем как-то, чтобы сразу выбрали какие допы
 * взяли из макета, сделай это скриптом, а не нейронкой».
 *
 * Состав макетов — content/mockup-plans.json, его пишет
 * scripts/mockup-plans.mjs из scripts/protos/*\/plan.mjs. Здесь только
 * арифметика и текст договора: позиции сметы, сумма, предмет, срок. Модели
 * нет. Текст — русский: договор пишется по-русски (content/contract.ts).
 */

export type PlanAddon = { id: string; title: string; text: string; price: number; star: boolean };
export type MockupPlan = {
  id: string;
  base: { title: string; text: string; price: number; weeks: number[] | null };
  addons: PlanAddon[];
};

export const MOCKUP_PLANS: readonly MockupPlan[] = plans as MockupPlan[];

/** Своих строк «название + цена» — не больше трёх. */
export const EXTRA_ROWS = 3;

export type Extra = { title: string; price: number };

export type Composition = {
  items: EstimateItem[];
  amountUsd: number;
  subject: string;
  /** Срок из плана; null — в плане его нет, человек пишет сам. */
  deadline: string | null;
};

export function planById(id: string): MockupPlan | null {
  return MOCKUP_PLANS.find((p) => p.id === id) ?? null;
}

const row = (title: string, price: number): EstimateItem => ({ title, unit: "", qty: 1, price, total: price });

/** «Сцена на первом экране: Капсула раскрывается…» — описание уточняет, что входит. */
const named = (title: string, text: string) => (text ? `${title}: ${text}` : title);

/**
 * Свои строки из формы: пустое название — строки нет, цена 0 — подарок,
 * а не ошибка. Отрицательная и нечисловая цена — строки нет.
 */
export function extrasFrom(titles: readonly string[], prices: readonly string[]): Extra[] {
  const out: Extra[] = [];
  for (let i = 0; i < Math.min(titles.length, EXTRA_ROWS); i++) {
    const title = (titles[i] ?? "").trim().slice(0, 200);
    if (!title) continue;
    const raw = (prices[i] ?? "").replace(/\s/g, "").replace(",", ".");
    const price = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(price) || price < 0) continue;
    out.push({ title, price: Math.round(price * 100) / 100 });
  }
  return out;
}

/**
 * Срок из недель плана: [3, 5] → «до 5 недель с даты аванса». В договор
 * идёт верхняя граница: срок — обязательство, а не надежда.
 */
export function deadlineOf(weeks: readonly number[] | null): string | null {
  if (!weeks || weeks.length === 0) return null;
  const max = Math.max(...weeks);
  const word = max % 10 === 1 && max % 100 !== 11 ? "недели" : "недель";
  return `до ${max} ${word} с даты аванса`;
}

/**
 * Состав → позиции сметы, сумма, предмет, срок.
 *
 * Допы, которых нет в плане, пропускаются: id приходит из формы, и
 * подставленный руками id не должен стать строкой без цены.
 */
export function compose(plan: MockupPlan, addonIds: readonly string[], extras: readonly Extra[]): Composition {
  const picked = plan.addons.filter((a) => addonIds.includes(a.id));
  const items = [
    row(named(plan.base.title, plan.base.text), plan.base.price),
    ...picked.map((a) => row(named(a.title, a.text), a.price)),
    ...extras.map((e) => row(e.price === 0 ? `${e.title} (в подарок)` : e.title, e.price)),
  ];
  const parts = [...picked.map((a) => a.title), ...extras.map((e) => e.title)];
  const subject = parts.length
    ? `${plan.base.title} с дополнительными функциями: ${parts.join("; ")}`
    : named(plan.base.title, plan.base.text);
  return {
    items,
    amountUsd: estimateTotal(items),
    subject: subject.slice(0, 2000),
    deadline: deadlineOf(plan.base.weeks),
  };
}

/** Допы, включённые сразу: `star` в плане — то, ради чего макет. */
export function starredIds(plan: MockupPlan): string[] {
  return plan.addons.filter((a) => a.star).map((a) => a.id);
}

/**
 * Для выбора в форме — без описаний: в браузер уходит только то, что
 * нужно для галочек и суммы (components/admin/contract-compose.tsx).
 */
export function planChoices() {
  return MOCKUP_PLANS.map((p) => ({
    id: p.id,
    title: p.base.title,
    price: p.base.price,
    weeks: p.base.weeks ? Math.max(...p.base.weeks) : null,
    addons: p.addons.map(({ id, title, price, star }) => ({ id, title, price, star })),
  }));
}
