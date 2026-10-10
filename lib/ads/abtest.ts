import { gamma, rng } from "@/lib/ads/budget";
import { round } from "@/lib/ads/negatives";
import type { Ad, Draft } from "@/lib/ads/types";

/**
 * Тест объявлений: контроль против варианта, байесовская оценка.
 *
 * Как у Adalysis: сравнивать не «у кого CTR больше сегодня», а с какой
 * вероятностью один вариант лучше другого. Мера — заявки на тысячу показов,
 * когда заявок хватает (она одна учитывает и кликабельность, и то, что
 * клик дошёл до заявки), иначе — кликабельность. Каждая — Beta(1 + успехи,
 * 1 + неудачи), сравнение — пробами.
 *
 * Итог объявляется, только когда:
 * - у каждого объявления не меньше `MIN_IMPRESSIONS` показов,
 * - тест идёт не меньше `MIN_DAYS` (будни и выходные ведут себя по-разному),
 * - вероятность победы не меньше `WIN_CONFIDENCE`.
 * Прошло `MAX_DAYS`, а победителя нет — тест кончается ничьей: вариант на
 * паузу, контроль остаётся. Победитель остаётся, проигравший — на паузу;
 * удалять автопилот не умеет.
 */

export const MIN_IMPRESSIONS = 1000;
export const MIN_DAYS = 10;
export const MAX_DAYS = 45;
export const WIN_CONFIDENCE = 0.95;
/** Заявок в тесте меньше — меряем кликабельность. */
export const MIN_CONVERSIONS_FOR_CPI = 20;

export function beta(a: number, b: number, random: () => number): number {
  const x = gamma(a, 1, random);
  const y = gamma(b, 1, random);
  return x / (x + y);
}

export type TestVerdict =
  | { state: "running"; probVariant: number; metric: "cpi" | "ctr"; reason: string }
  | { state: "winner"; winner: "control" | "variant"; probVariant: number; metric: "cpi" | "ctr" }
  | { state: "draw"; probVariant: number; metric: "cpi" | "ctr" };

type Arm = Pick<Ad, "clicks" | "impressions" | "conversions">;

export function probVariantBetter(control: Arm, variant: Arm, metric: "cpi" | "ctr", seed = 7, samples = 4000): number {
  const random = rng(seed);
  const hits = (a: Arm) => (metric === "cpi" ? a.conversions : a.clicks);
  let wins = 0;
  for (let i = 0; i < samples; i++) {
    const c = beta(1 + hits(control), 1 + Math.max(0, control.impressions - hits(control)), random);
    const v = beta(1 + hits(variant), 1 + Math.max(0, variant.impressions - hits(variant)), random);
    if (v > c) wins++;
  }
  return wins / samples;
}

export function judge(control: Arm, variant: Arm, days: number): TestVerdict {
  const metric = control.conversions + variant.conversions >= MIN_CONVERSIONS_FOR_CPI ? "cpi" : "ctr";
  const p = probVariantBetter(control, variant, metric);
  const enough = control.impressions >= MIN_IMPRESSIONS && variant.impressions >= MIN_IMPRESSIONS;
  if (enough && days >= MIN_DAYS) {
    if (p >= WIN_CONFIDENCE) return { state: "winner", winner: "variant", probVariant: p, metric };
    if (1 - p >= WIN_CONFIDENCE) return { state: "winner", winner: "control", probVariant: p, metric };
  }
  if (days >= MAX_DAYS) return { state: "draw", probVariant: p, metric };
  const reason = !enough
    ? `мало показов: ${control.impressions} и ${variant.impressions}, нужно по ${MIN_IMPRESSIONS}`
    : days < MIN_DAYS
      ? `идёт ${days} дн., нужно не меньше ${MIN_DAYS}`
      : `разница пока не уверенная: ${Math.round(p * 100)}%`;
  return { state: "running", probVariant: p, metric, reason };
}

/** Предложение закончить тест: кого оставить, кого на паузу. */
export function winnerDraft(input: {
  testId: number;
  control: Ad;
  variant: Ad;
  verdict: Exclude<TestVerdict, { state: "running" }>;
}): Draft {
  const { control, variant, verdict } = input;
  const variantWins = verdict.state === "winner" && verdict.winner === "variant";
  const winner = variantWins ? variant : control;
  const loser = variantWins ? control : variant;
  const rate = (a: Ad) =>
    verdict.metric === "cpi"
      ? `${a.impressions ? round((a.conversions / a.impressions) * 1000) : 0} заявок на 1000 показов`
      : `кликабельность ${a.impressions ? round((a.clicks / a.impressions) * 100) : 0}%`;
  const p = variantWins ? verdict.probVariant : 1 - verdict.probVariant;
  return {
    kind: "ad_winner",
    dedupeKey: `winner:${input.testId}`,
    title:
      verdict.state === "draw"
        ? `Тест объявлений: ничья — новый вариант на паузу`
        : variantWins
          ? `Тест объявлений: новый вариант лучше — старое на паузу`
          : `Тест объявлений: старое лучше — новый вариант на паузу`,
    why:
      verdict.state === "draw"
        ? `За ${MAX_DAYS} дн. разница так и не стала уверенной (${Math.round(verdict.probVariant * 100)}%). Оставляем проверенное объявление.`
        : `Оставляем «${winner.copy.headlines[0]}»: ${rate(winner)} против ${rate(loser)}, ` +
          `вероятность, что оно лучше, ${Math.round(p * 100)}%.`,
    numbers: { probability: round(p), controlImpressions: control.impressions, variantImpressions: variant.impressions },
    payload: { kind: "ad_winner", testId: input.testId, loserAdId: loser.id, winnerAdId: winner.id },
  };
}
