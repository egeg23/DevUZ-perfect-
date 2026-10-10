import { mergeNegatives } from "@/lib/ads/guard";
import type { CrossNegativesPayload, Draft, Keyword } from "@/lib/ads/types";
import { blocks, normalize, stem, tokens } from "@/lib/ads/words";

/**
 * Кросс-минусовка групп — для Директа (research.md, §4.1, п. 3).
 *
 * В кампании ключ «купить диван» стоит в одной группе, «купить диван
 * угловой» — в другой. Запрос «купить угловой диван» подходит обоим, и
 * Директ может показать объявление первой группы — общее, а не то, что про
 * угловые. Кросс-минус: в первую группу — минус «угловой», и запрос уходит
 * в свою группу, к своему объявлению и своей странице. Click.ru делает это
 * инструментом; руками в кабинете на сотню ключей это вечер работы.
 *
 * Правила:
 * - только внутри одной кампании и между разными группами;
 * - широкий ключ A получает минус из слов, которых в нём нет, а в узком B
 *   есть (несколько слов — одной фразой: минус-фраза срабатывает, только
 *   когда в запросе все её слова, то есть ровно на запросы для B);
 * - минус не должен задевать ни один ключ своей группы — иначе группа
 *   потеряет свой же показ;
 * - фраза не длиннее 7 слов, служебные слова не считаются.
 */

export const MAX_GROUPS_PER_PROPOSAL = 20;

type Need = { adGroupId: string; phrase: string; because: string };

export function crossNegatives(keywords: readonly Keyword[], existing: Record<string, string[]> = {}): Map<string, Need[]> {
  const byCampaign = new Map<string, Keyword[]>();
  for (const k of keywords) byCampaign.set(k.campaignId, [...(byCampaign.get(k.campaignId) ?? []), k]);

  const out = new Map<string, Need[]>();
  for (const [campaignId, list] of byCampaign) {
    const needs: Need[] = [];
    for (const wide of list) {
      const wideStems = new Set(tokens(wide.text).map(stem));
      if (!wideStems.size) continue;
      for (const narrow of list) {
        if (narrow.adGroupId === wide.adGroupId) continue;
        const narrowWords = tokens(narrow.text);
        const narrowStems = narrowWords.map(stem);
        if (![...wideStems].every((s) => narrowStems.includes(s))) continue;
        const extra = narrowWords.filter((w, i) => !wideStems.has(narrowStems[i]));
        if (!extra.length || extra.length > 7) continue;
        const phrase = normalize(extra.join(" "));
        // Минус не задевает ни один ключ своей группы.
        const own = list.filter((k) => k.adGroupId === wide.adGroupId).map((k) => k.text);
        if (own.some((k) => blocks(phrase, k))) continue;
        const already = (existing[wide.adGroupId] ?? []).some((n) => normalize(n) === phrase);
        if (already || needs.some((n) => n.adGroupId === wide.adGroupId && n.phrase === phrase)) continue;
        needs.push({ adGroupId: wide.adGroupId, phrase, because: narrow.text });
      }
    }
    // Короткий минус покрывает длинный: «угловой» уже отсекает «угловой кожаный».
    const stemsOf = (p: string) => tokens(p).map(stem);
    const lean = needs.filter(
      (n) =>
        !needs.some(
          (m) => m !== n && m.adGroupId === n.adGroupId && m.phrase.length < n.phrase.length && stemsOf(m.phrase).every((s) => stemsOf(n.phrase).includes(s)),
        ),
    );
    if (lean.length) out.set(campaignId, lean);
  }
  return out;
}

export function crossDrafts(input: {
  keywords: readonly Keyword[];
  existing: Record<string, string[]>;
  campaignNames: Record<string, string>;
}): Draft[] {
  const drafts: Draft[] = [];
  for (const [campaignId, needs] of crossNegatives(input.keywords, input.existing)) {
    const groups: CrossNegativesPayload["groups"] = [];
    for (const n of needs) {
      let g = groups.find((x) => x.adGroupId === n.adGroupId);
      if (!g) {
        if (groups.length >= MAX_GROUPS_PER_PROPOSAL) continue;
        g = { adGroupId: n.adGroupId, phrases: [], because: [] };
        groups.push(g);
      }
      g.phrases = mergeNegatives(g.phrases, [n.phrase]);
      g.because.push(n.because);
    }
    const total = groups.reduce((s, g) => s + g.phrases.length, 0);
    const name = input.campaignNames[campaignId] ?? campaignId;
    const sample = needs
      .slice(0, 3)
      .map((n) => `«${n.phrase}» (ради «${n.because}»)`)
      .join("; ");
    drafts.push({
      kind: "cross_negatives",
      dedupeKey: `cross:${campaignId}:${groups.map((g) => `${g.adGroupId}=${[...g.phrases].sort().join(",")}`).join("|")}`,
      title: `Кросс-минусовка: ${total} в «${name}»`,
      why:
        `В кампании есть общие и уточнённые ключи в разных группах. Запрос по уточнённому ключу сейчас может уйти ` +
        `в общую группу, к общему объявлению. Минус-слова в общих группах отправят его в свою: ${sample}. ` +
        `Ключи самих групп эти минусы не задевают — это проверено.`,
      numbers: { phrases: total, groups: groups.length },
      payload: { kind: "cross_negatives", campaignId, campaignName: name, groups },
    });
  }
  return drafts;
}
