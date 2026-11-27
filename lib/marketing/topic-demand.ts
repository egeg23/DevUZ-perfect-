import type { KeywordResearch, SourceResult } from "@/lib/seo/keywords";

/**
 * Есть ли у темы спрос — по ответу Вордстата, Trends и планировщика.
 *
 * Пятничный замер 27.11.2026, владелец: «Да». 2 — источник ответил по самой
 * фразе темы, 1 — только по более широкой (лесенка `broaderQueries`), 0 —
 * никто не ответил. Смена берёт первую тему с наибольшим счётом из
 * `DEMAND_CANDIDATES`; у всех ноль — первую по списку, как раньше, чтобы
 * статьи не вставали, когда источники лежат.
 */
export function demandScore(research: KeywordResearch | null | undefined): 0 | 1 | 2 {
  if (!research) return 0;
  const sources: Array<SourceResult | undefined> = [research.wordstat, research.trends, research.planner];
  let best: 0 | 1 | 2 = 0;
  for (const source of sources) {
    if (!source?.ok || !source.phrases.some((p) => p.value > 0)) continue;
    best = source.asked ? Math.max(best, 1) as 0 | 1 | 2 : 2;
  }
  return best;
}

/** Индекс выбранной темы: первая с наибольшим счётом, все ноль — 0. */
export function pickByDemand(scores: readonly number[]): number {
  let at = 0;
  for (let i = 1; i < scores.length; i += 1) if (scores[i] > scores[at]) at = i;
  return at;
}
