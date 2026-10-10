import type { Draft, Keyword, SearchTerm, Thresholds } from "@/lib/ads/types";
import { blocks, normalize, stem, tokens } from "@/lib/ads/words";

/**
 * Минус-слова из поисковых запросов.
 *
 * Механика — та, что у Optmyzr и Adalysis («n-gram analysis»): запросы
 * режутся на слова и пары-тройки слов, деньги и заявки складываются по
 * каждому куску. Один запрос «курсы английского бесплатно» стоит копейки, а
 * слово «бесплатно» по сотне таких запросов — уже бюджет. Минусом становится
 * кусок, который потратил не меньше порога, собрал клики и не принёс ни
 * одной заявки ни в одном запросе.
 *
 * Перед тем как предложить, кусок проверяется на ключи кампании (`blocks`):
 * минус, который режет рабочий ключ, не предлагается никогда, — и на слова,
 * которые владелец кабинета запретил трогать (бренд, город, услуга).
 */

/** Сколько слов в минус-фразе разбираем: Директ принимает до семи, но длинные почти не повторяются. */
export const MAX_NGRAM = 3;
/** Сколько минус-фраз в одном предложении — чтобы человек мог их прочитать. */
export const MAX_PER_PROPOSAL = 30;
/** Директ: в минус-фразе не больше 7 слов, слово — не длиннее 35 знаков. */
export const YANDEX_MAX_WORDS = 7;
export const YANDEX_MAX_WORD = 35;
/** Директ: минус-фразы кампании вместе — не больше 20 000 знаков. */
export const YANDEX_CAMPAIGN_CHARS = 20_000;
/** Google: не больше 10 000 минус-слов на кампанию. */
export const GOOGLE_CAMPAIGN_NEGATIVES = 10_000;

export type Gram = {
  key: string;
  /** Как кусок пишется в запросах — его и показываем, и добавляем. */
  text: string;
  words: number;
  cost: number;
  clicks: number;
  conversions: number;
  queries: number;
  samples: string[];
};

/** Слова и пары-тройки слов запроса, каждый кусок — один раз на запрос. */
export function gramsOf(query: string, max = MAX_NGRAM): { key: string; text: string; words: number }[] {
  const words = tokens(query);
  const seen = new Map<string, { key: string; text: string; words: number }>();
  for (let n = 1; n <= max; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const part = words.slice(i, i + n);
      const key = part.map(stem).join(" ");
      if (!seen.has(key)) seen.set(key, { key, text: part.join(" "), words: n });
    }
  }
  return [...seen.values()];
}

export function aggregate(terms: readonly SearchTerm[]): Map<string, Gram> {
  const grams = new Map<string, Gram>();
  for (const term of terms) {
    for (const g of gramsOf(term.query)) {
      const row = grams.get(g.key) ?? { ...g, cost: 0, clicks: 0, conversions: 0, queries: 0, samples: [] };
      row.cost += term.cost;
      row.clicks += term.clicks;
      row.conversions += term.conversions;
      row.queries += 1;
      if (row.samples.length < 3) row.samples.push(term.query);
      grams.set(g.key, row);
    }
  }
  return grams;
}

/**
 * Опорная цена заявки: своя, если владелец её задал, иначе средняя по
 * запросам. Заявок нет совсем — десять средних кликов: столько примерно
 * стоит одна заявка при конверсии 10%, и это осторожно.
 */
export function referenceCpa(terms: readonly SearchTerm[], targetCpa: number | null): number {
  if (targetCpa && targetCpa > 0) return targetCpa;
  const cost = terms.reduce((s, t) => s + t.cost, 0);
  const conversions = terms.reduce((s, t) => s + t.conversions, 0);
  const clicks = terms.reduce((s, t) => s + t.clicks, 0);
  if (conversions > 0) return cost / conversions;
  return clicks > 0 ? (cost / clicks) * 10 : 0;
}

export type NegativeCandidate = Gram & { source: "rules" | "model"; reason?: string };

/**
 * Кандидаты в минус-слова одной кампании.
 *
 * Порог денег — `wasteCost`, а если он не задан — опорная цена заявки:
 * кусок, который потратил столько же, сколько обычно стоит заявка, и не
 * принёс её, — это уже не случайность.
 */
export function wasteGrams(
  terms: readonly SearchTerm[],
  keywords: readonly string[],
  existing: readonly string[],
  thresholds: Thresholds,
  cpa = referenceCpa(terms, thresholds.targetCpa),
): NegativeCandidate[] {
  const minCost = thresholds.wasteCost > 0 ? thresholds.wasteCost : cpa;
  if (!(minCost > 0)) return [];
  const protectedStems = new Set(thresholds.protectedWords.flatMap((w) => tokens(w).map(stem)));
  const existingKeys = new Set(existing.map((n) => tokens(n).map(stem).join(" ")));

  const picked = [...aggregate(terms).values()]
    .filter((g) => g.conversions === 0 && g.clicks >= thresholds.wasteClicks && g.cost >= minCost)
    .filter((g) => !g.key.split(" ").some((s) => protectedStems.has(s)))
    .filter((g) => !existingKeys.has(g.key))
    .filter((g) => safeNegative(g.text, keywords))
    .sort((a, b) => a.words - b.words || b.cost - a.cost);

  // Короткий минус покрывает длинные: «бесплатно» уже отсекает «курсы бесплатно».
  const out: NegativeCandidate[] = [];
  for (const g of picked) {
    const covered = out.some((o) => o.key.split(" ").every((s) => g.key.split(" ").includes(s)));
    if (!covered) out.push({ ...g, source: "rules" });
  }
  return out.sort((a, b) => b.cost - a.cost).slice(0, MAX_PER_PROPOSAL);
}

/** Минус-фраза годится: в пределах правил площадки и не режет ни одного ключа. */
export function safeNegative(phrase: string, keywords: readonly string[]): boolean {
  const words = normalize(phrase).split(" ").filter(Boolean);
  if (!words.length || words.length > YANDEX_MAX_WORDS) return false;
  if (words.some((w) => w.length > YANDEX_MAX_WORD)) return false;
  if (!tokens(phrase).length) return false;
  return !keywords.some((keyword) => blocks(phrase, keyword));
}

/**
 * Предложения по всем кампаниям: одно на кампанию, с деньгами, которые
 * эти слова потратили за период, и примерами запросов.
 */
export function negativeDrafts(input: {
  terms: readonly SearchTerm[];
  keywords: readonly Keyword[];
  existing: Record<string, string[]>;
  campaignNames: Record<string, string>;
  thresholds: Thresholds;
  extra?: Record<string, NegativeCandidate[]>;
  days: number;
  currency: string;
}): Draft[] {
  const cpa = referenceCpa(input.terms, input.thresholds.targetCpa);
  const byCampaign = new Map<string, SearchTerm[]>();
  for (const t of input.terms) byCampaign.set(t.campaignId, [...(byCampaign.get(t.campaignId) ?? []), t]);

  const drafts: Draft[] = [];
  for (const [campaignId, terms] of byCampaign) {
    const keywords = input.keywords.filter((k) => k.campaignId === campaignId).map((k) => k.text);
    const existing = input.existing[campaignId] ?? [];
    const rules = wasteGrams(terms, keywords, existing, input.thresholds, cpa);
    const extra = (input.extra?.[campaignId] ?? []).filter(
      (m) => safeNegative(m.text, keywords) && !rules.some((r) => r.key === m.key),
    );
    const all = [...rules, ...extra].slice(0, MAX_PER_PROPOSAL);
    if (!all.length) continue;

    // Деньги считаем по запросам, а не по кускам: один запрос с двумя
    // минус-словами не должен посчитаться дважды.
    const hit = terms.filter((t) => all.some((c) => blocksQuery(c.text, t.query)));
    const wasted = hit.reduce((s, t) => s + t.cost, 0);
    const clicks = hit.reduce((s, t) => s + t.clicks, 0);
    const name = input.campaignNames[campaignId] ?? campaignId;
    const phrases = all.map((c) => c.text);
    const list = all
      .slice(0, 5)
      .map((c) => `«${c.text}» — ${money(c.cost, input.currency)}, ${c.clicks} кл.${c.reason ? ` (${c.reason})` : ""}`)
      .join("; ");

    drafts.push({
      kind: "negatives",
      dedupeKey: `neg:${campaignId}:${[...phrases].sort().join("|")}`,
      title: `Минус-слова: ${phrases.length} в «${name}»`,
      why:
        `За ${input.days} дн. запросы с этими словами потратили ${money(wasted, input.currency)} ` +
        `(${clicks} кликов) и не принесли ни одной заявки. ${list}. ` +
        `Ни одно слово не задевает ваши ключи — это проверено.`,
      numbers: { wasted: round(wasted), clicks, phrases: phrases.length, monthly: round((wasted / input.days) * 30) },
      payload: { kind: "negatives", campaignId, campaignName: name, phrases },
    });
  }
  return drafts;
}

function blocksQuery(negative: string, query: string): boolean {
  return blocks(negative, query);
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function money(n: number, currency: string, locale: "ru" | "uz" = "ru"): string {
  const value = Math.round(n).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  const sum = locale === "uz" ? "so‘m" : "сум";
  return `${value} ${currency === "UZS" ? sum : currency === "RUB" ? "₽" : currency}`;
}
