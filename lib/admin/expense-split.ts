import type { Expense } from "@/lib/admin/finance";

/**
 * Как расход делится между соучредителями.
 *
 * Владелец: «Так как мы делим доходы 70/30, то и расходы идут
 * пропорционально — 70/30. Реклама в 100$ к примеру идет — 30 Александр,
 * 70 я».
 *
 * Та же пропорция, что у прибыли, и берётся она из того же поля
 * `founder_percent`, а не задаётся здесь вторым числом. Два места, где
 * записана одна пропорция, однажды разойдутся — и разойдутся молча.
 */

export type Founder = {
  id: string;
  display_name: string;
  founder_percent: number;
};

export type Share = {
  founderId: string;
  name: string;
  percent: number;
  amount: number;
};

/**
 * Доли одного расхода.
 *
 * Последняя доля считается вычитанием, а не процентом, — по той же причине,
 * что и в дележе прибыли: 70% и 30% от 101 доллара, округлённые каждая
 * вверх, дают 102, и лишний доллар потом ищут в расходах.
 */
export function splitExpense(amount: number, founders: readonly Founder[]): Share[] {
  const real = founders.filter((f) => f.founder_percent > 0);
  if (real.length === 0) return [];

  const out: Share[] = [];
  let given = 0;

  real.forEach((founder, index) => {
    const last = index === real.length - 1;
    const value = last
      ? Math.round((amount - given) * 100) / 100
      : Math.round(amount * (founder.founder_percent / 100) * 100) / 100;
    given += value;
    out.push({
      founderId: founder.id,
      name: founder.display_name,
      percent: founder.founder_percent,
      amount: value,
    });
  });

  return out;
}

/** Сколько всего пришлось на каждого соучредителя за период. */
export function splitTotals(
  expenses: readonly Pick<Expense, "amount_usd">[],
  founders: readonly Founder[],
): Share[] {
  const byFounder = new Map<string, Share>();

  for (const expense of expenses) {
    for (const share of splitExpense(expense.amount_usd, founders)) {
      const current = byFounder.get(share.founderId);
      if (current) current.amount = Math.round((current.amount + share.amount) * 100) / 100;
      else byFounder.set(share.founderId, { ...share });
    }
  }

  // Порядок как у списка соучредителей, а не как попадётся: таблица,
  // меняющая порядок колонок от периода к периоду, читается как ошибка.
  return founders.filter((f) => f.founder_percent > 0).map(
    (f) => byFounder.get(f.id) ?? { founderId: f.id, name: f.display_name, percent: f.founder_percent, amount: 0 },
  );
}

/** Сумма расходов по категориям — чтобы видеть, куда уходит больше всего. */
export function byCategory(
  expenses: readonly Pick<Expense, "amount_usd" | "category">[],
): { category: string; amount: number }[] {
  const sums = new Map<string, number>();
  for (const e of expenses) {
    sums.set(e.category, Math.round(((sums.get(e.category) ?? 0) + e.amount_usd) * 100) / 100);
  }
  return [...sums.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
