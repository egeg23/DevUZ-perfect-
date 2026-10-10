import { money, round } from "@/lib/ads/negatives";
import type { BudgetMove, Campaign, Draft } from "@/lib/ads/types";

/**
 * Перераспределение бюджета между кампаниями.
 *
 * Идея — у Optmyzr («Budget Allocation») и у K50/Alytics («оптимизатор по
 * цене заявки»): деньги переезжают туда, где следующая заявка дешевле. Но
 * при бюджетах Ташкента у кампании бывает три заявки за месяц, и «у этой
 * цена заявки 90 тысяч, у той 140» — ещё не знание, а случай. Поэтому не
 * средние, а байесовская оценка:
 *
 * - заявок на единицу денег у кампании — Gamma(α₀ + заявки, β₀ + расход);
 *   априори — средняя по кабинету с весом двух заявок: у кампании без
 *   данных оценка — «как у всех», а не ноль и не бесконечность;
 * - из этих распределений берутся тысячи проб (сэмплирование Томпсона) и
 *   считается, с какой вероятностью одна кампания лучше другой;
 * - деньги двигаются, только если вероятность не меньше `MIN_CONFIDENCE`.
 *
 * Ограничители — здесь же и ещё раз при применении (lib/ads/guard.ts):
 * общий бюджет не растёт никогда (сколько сняли, столько добавили); сдвиг —
 * не больше `maxShiftPct` бюджета каждой из двух кампаний; кампании, которые
 * учатся, с бюджетом в стратегии, остановленные и без недели данных — не
 * трогаем. Деньги получает только кампания, которая упирается в свой бюджет:
 * дать больше той, что и так не тратит всё, — ничего не изменить.
 */

export const MIN_CONFIDENCE = 0.9;
export const MIN_DAYS = 7;
export const MIN_CLICKS = 30;
/** Тратит не меньше этой доли дневного бюджета — значит, упирается в него. */
export const LIMITED_SHARE = 0.85;
export const SAMPLES = 4000;

/** Детерминированный генератор: одна и та же статистика — одно и то же предложение. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random: () => number): number {
  let u = 0;
  while (u === 0) u = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** Gamma(shape, rate) — Марсалья–Цанг. */
export function gamma(shape: number, rate: number, random: () => number): number {
  if (shape < 1) return gamma(shape + 1, rate, random) * Math.pow(random(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(random);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = random();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return (d * v) / rate;
  }
}

export type Posterior = { id: string; samples: Float64Array; meanCpa: number };

/** Пробы «заявок на единицу денег» по каждой кампании. */
export function posteriors(campaigns: readonly Campaign[], seed = 1, samples = SAMPLES): Posterior[] {
  const cost = campaigns.reduce((s, c) => s + c.cost, 0);
  const conv = campaigns.reduce((s, c) => s + c.conversions, 0);
  const priorRate = conv > 0 && cost > 0 ? conv / cost : 1 / Math.max(cost, 1);
  const a0 = 2;
  const b0 = a0 / priorRate;
  const random = rng(seed);
  return campaigns.map((c) => {
    const a = a0 + c.conversions;
    const b = b0 + c.cost;
    const out = new Float64Array(samples);
    for (let i = 0; i < samples; i++) out[i] = gamma(a, b, random);
    return { id: c.id, samples: out, meanCpa: b / a };
  });
}

/** Вероятность, что у `a` заявка дешевле, чем у `b`. */
export function probBetter(a: Posterior, b: Posterior): number {
  let wins = 0;
  for (let i = 0; i < a.samples.length; i++) if (a.samples[i] > b.samples[i]) wins++;
  return wins / a.samples.length;
}

export function eligible(c: Campaign): boolean {
  return c.active && !c.learning && c.dailyBudget !== null && c.dailyBudget > 0 && c.activeDays >= MIN_DAYS && c.clicks >= MIN_CLICKS;
}

export function budgetLimited(c: Campaign): boolean {
  if (!c.dailyBudget || c.activeDays <= 0) return false;
  return c.cost / c.activeDays >= LIMITED_SHARE * c.dailyBudget;
}

/** Сумма сдвига: процент от бюджета каждой из двух кампаний, меньший из двух. */
export function shiftAmount(donor: Campaign, taker: Campaign, maxShiftPct: number): number {
  const pct = Math.max(0, Math.min(maxShiftPct, 30)) / 100;
  const raw = Math.min((donor.dailyBudget ?? 0) * pct, (taker.dailyBudget ?? 0) * pct);
  // Круглая сумма: бюджет «123 457,31» человек в кабинете не узнает.
  const step = raw >= 100_000 ? 1000 : raw >= 1000 ? 100 : 1;
  return Math.floor(raw / step) * step;
}

export function budgetDrafts(input: {
  campaigns: readonly Campaign[];
  maxShiftPct: number;
  currency: string;
  days: number;
  seed?: number;
}): Draft[] {
  const pool = input.campaigns.filter(eligible);
  if (pool.length < 2 || input.maxShiftPct <= 0) return [];
  const post = posteriors(pool, input.seed ?? 1);
  const byId = new Map(post.map((p) => [p.id, p]));

  const takers = pool.filter(budgetLimited).sort((a, b) => byId.get(a.id)!.meanCpa - byId.get(b.id)!.meanCpa);
  const donors = [...pool].sort((a, b) => byId.get(b.id)!.meanCpa - byId.get(a.id)!.meanCpa);

  const drafts: Draft[] = [];
  const used = new Set<string>();
  for (const taker of takers) {
    if (used.has(taker.id)) continue;
    const donor = donors.find(
      (d) => d.id !== taker.id && !used.has(d.id) && probBetter(byId.get(taker.id)!, byId.get(d.id)!) >= MIN_CONFIDENCE,
    );
    if (!donor) continue;
    const amount = shiftAmount(donor, taker, input.maxShiftPct);
    if (amount <= 0) continue;
    used.add(taker.id);
    used.add(donor.id);

    const p = probBetter(byId.get(taker.id)!, byId.get(donor.id)!);
    const moves: BudgetMove[] = [
      { campaignId: donor.id, campaignName: donor.name, from: donor.dailyBudget!, to: donor.dailyBudget! - amount },
      { campaignId: taker.id, campaignName: taker.name, from: taker.dailyBudget!, to: taker.dailyBudget! + amount },
    ];
    const cpa = (c: Campaign) => (c.conversions > 0 ? money(c.cost / c.conversions, input.currency) : "заявок нет");
    drafts.push({
      kind: "budget",
      dedupeKey: `budget:${donor.id}>${taker.id}`,
      title: `Бюджет: ${money(amount, input.currency)} в день из «${donor.name}» в «${taker.name}»`,
      why:
        `За ${input.days} дн. «${taker.name}»: ${taker.conversions} заявок, цена заявки ${cpa(taker)}, ` +
        `и она каждый день упирается в бюджет. «${donor.name}»: ${donor.conversions} заявок, цена ${cpa(donor)}. ` +
        `С вероятностью ${Math.round(p * 100)}% заявка в первой дешевле. Общий бюджет не меняется.`,
      numbers: { amount, confidence: round(p), donorCpa: round(byId.get(donor.id)!.meanCpa), takerCpa: round(byId.get(taker.id)!.meanCpa) },
      payload: { kind: "budget", moves },
    });
  }
  return drafts;
}
