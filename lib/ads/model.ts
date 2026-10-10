import type Anthropic from "@anthropic-ai/sdk";

import { copyProblems } from "@/lib/ads/copy";
import type { NegativeCandidate } from "@/lib/ads/negatives";
import type { AdCopy, Platform, SearchTerm } from "@/lib/ads/types";
import { normalize, stem, tokens } from "@/lib/ads/words";
import { anthropic } from "@/lib/model-road";

/**
 * Модель в автопилоте — только там, где правила не видят смысла.
 *
 * 1. Нерелевантные запросы. Правило ловит слово, которое потратило деньги;
 *    но «стоматология для собак» у стоматологии для людей потратит мало и
 *    до порога не дойдёт, а смысл очевиден. Модель (Haiku — дешёвая, правило
 *    владельца) читает запросы без заявок пакетами и говорит, какие из них
 *    не про этот бизнес, и каким словом из самого запроса их отсечь. Слово
 *    проверяется кодом: оно есть в запросе, не режет ключи, не под запретом.
 * 2. Варианты объявлений для теста — на языке группы, под её ключи. Каждый
 *    вариант проходит `copyProblems`: длина, тире, штампы, обещания.
 *
 * Расход пишется в model_usage с метками `ads-negatives` и `ads-copy`.
 */

export const ADS_MODEL = process.env.ADS_MODEL || "claude-haiku-4-5";
export const BATCH = 60;

const CLASSIFY_SYSTEM = `Ты проверяешь поисковые запросы, по которым показывалась реклама бизнеса в Узбекистане.
Задача: найти запросы, которые явно НЕ про этот бизнес — ищут бесплатное, работу, скачать, чужой товар, другой город, учебные материалы, другое значение слова.
Если сомневаешься — запрос релевантный. Лучше пропустить мусор, чем отрезать покупателя.
Для каждого нерелевантного запроса назови одно-два слова ИЗ САМОГО ЗАПРОСА, которые его отсекают, и коротко (до 8 слов) почему.
Никогда не предлагай слова, которые есть в ключевых фразах рекламодателя.`;

const CLASSIFY_TOOL = {
  name: "irrelevant",
  description: "Нерелевантные запросы и слова, которые их отсекают",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            n: { type: "integer", description: "номер запроса из списка" },
            negative: { type: "string", description: "слово или два слова из запроса" },
            reason: { type: "string" },
          },
          required: ["n", "negative", "reason"],
        },
      },
    },
    required: ["items"],
  },
} as const;

type Client = Pick<Anthropic, "messages">;

/** Проверить ответ модели кодом: слово из запроса, не ключ, не под запретом. */
export function acceptModelNegative(
  query: string,
  negative: string,
  keywords: readonly string[],
  protectedWords: readonly string[],
): string | null {
  const neg = tokens(negative);
  if (!neg.length || neg.length > 2) return null;
  const queryStems = new Set(tokens(query).map(stem));
  if (!neg.every((w) => queryStems.has(stem(w)))) return null;
  const banned = new Set([...keywords, ...protectedWords].flatMap((k) => tokens(k).map(stem)));
  if (neg.some((w) => banned.has(stem(w)))) return null;
  return neg.join(" ");
}

export async function classifyQueries(
  input: { business: string; keywords: string[]; protectedWords: string[]; terms: SearchTerm[] },
  client: Client = anthropic("ads-negatives"),
): Promise<NegativeCandidate[]> {
  const pool = input.terms.filter((t) => t.conversions === 0 && t.clicks > 0).sort((a, b) => b.cost - a.cost);
  const found = new Map<string, NegativeCandidate>();
  for (let i = 0; i < pool.length; i += BATCH) {
    const batch = pool.slice(i, i + BATCH);
    const message = await client.messages.create({
      model: ADS_MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: CLASSIFY_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [CLASSIFY_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: CLASSIFY_TOOL.name },
      messages: [
        {
          role: "user",
          content:
            `Бизнес: ${input.business || "не описан — суди по ключам"}\n` +
            `Ключевые фразы: ${input.keywords.slice(0, 80).join("; ")}\n\nЗапросы:\n` +
            batch.map((t, n) => `${n + 1}. ${t.query}`).join("\n"),
        },
      ],
    });
    const use = message.content.find((b) => b.type === "tool_use");
    const items = (use && use.type === "tool_use" ? (use.input as { items?: unknown }).items : null) ?? [];
    for (const item of Array.isArray(items) ? items : []) {
      const { n, negative, reason } = item as { n?: number; negative?: string; reason?: string };
      const term = typeof n === "number" ? batch[n - 1] : undefined;
      if (!term || typeof negative !== "string") continue;
      const ok = acceptModelNegative(term.query, negative, input.keywords, input.protectedWords);
      if (!ok) continue;
      const key = tokens(ok).map(stem).join(" ");
      const row = found.get(key) ?? {
        key,
        text: ok,
        words: tokens(ok).length,
        cost: 0,
        clicks: 0,
        conversions: 0,
        queries: 0,
        samples: [],
        source: "model" as const,
        reason: String(reason ?? "").slice(0, 80),
      };
      row.cost += term.cost;
      row.clicks += term.clicks;
      row.queries += 1;
      if (row.samples.length < 3) row.samples.push(term.query);
      found.set(key, row);
    }
  }
  return [...found.values()];
}

/* ── Варианты объявлений ───────────────────────────────────────────────── */

const COPY_SYSTEM = `Ты пишешь вариант поискового объявления для теста против текущего. Пиши как живой владелец бизнеса в Ташкенте: конкретно, коротко, просто, с фактом из текущего объявления или ключей.
Нельзя: длинное тире (— или –), «уникальный», «инновационный», «индивидуальный подход», «на новый уровень», «гарантия», «100%», «лучший», «№1», «бесплатно», восклицательные знаки подряд, слова заглавными буквами.
Не выдумывай цен, сроков и фактов, которых нет в текущем объявлении.
Вариант должен отличаться по смыслу: другая выгода, другой призыв, вопрос вместо утверждения.`;

const COPY_TOOL = {
  name: "ad",
  description: "Вариант объявления",
  input_schema: {
    type: "object",
    properties: {
      headlines: { type: "array", items: { type: "string" } },
      descriptions: { type: "array", items: { type: "string" } },
    },
    required: ["headlines", "descriptions"],
  },
} as const;

export function copyShapeHint(platform: Platform): string {
  return platform === "google"
    ? "Google, адаптивное объявление: 5–8 заголовков, каждый до 30 знаков; 2–3 описания, каждое до 90 знаков."
    : "Яндекс Директ: ровно два заголовка — первый до 56 знаков, второй до 30; ровно одно описание до 81 знака.";
}

/**
 * Вариант для теста. Две попытки: вторая — с замечаниями проверки. Не
 * прошёл обе — null, и теста в этой группе в этот раз не будет.
 */
export async function writeVariant(
  input: { platform: Platform; lang: "ru" | "uz"; current: AdCopy; keywords: string[] },
  client: Client = anthropic("ads-copy"),
): Promise<AdCopy | null> {
  let notes = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const message = await client.messages.create({
      model: ADS_MODEL,
      max_tokens: 800,
      system: [{ type: "text", text: COPY_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [COPY_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: COPY_TOOL.name },
      messages: [
        {
          role: "user",
          content:
            `Язык: ${input.lang === "uz" ? "узбекский, латиница" : "русский"}.\n${copyShapeHint(input.platform)}\n` +
            `Текущее объявление:\nЗаголовки: ${input.current.headlines.join(" | ")}\nТекст: ${input.current.descriptions.join(" | ")}\n` +
            `Ключевые фразы группы: ${input.keywords.slice(0, 20).join("; ")}` +
            (notes ? `\n\nПрошлый вариант не прошёл проверку: ${notes} Исправь.` : ""),
        },
      ],
    });
    const use = message.content.find((b) => b.type === "tool_use");
    if (!use || use.type !== "tool_use") continue;
    const raw = use.input as { headlines?: unknown; descriptions?: unknown };
    const clean = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").map((s) => s.trim()) : []);
    const copy: AdCopy = { headlines: clean(raw.headlines), descriptions: clean(raw.descriptions), url: input.current.url };
    const problems = copyProblems(copy, input.platform);
    if (!problems.length && !sameCopy(copy, input.current)) return copy;
    notes = problems.map((p) => p.text).join(" ") || "Вариант совпадает с текущим.";
  }
  return null;
}

export function sameCopy(a: AdCopy, b: AdCopy): boolean {
  const flat = (c: AdCopy) => normalize([...c.headlines, ...c.descriptions].join(" "));
  return flat(a) === flat(b);
}

/** Язык группы по ключам: латиница с узбекскими буквосочетаниями — узбекский. */
export function groupLang(keywords: readonly string[]): "ru" | "uz" {
  const text = keywords.join(" ").toLowerCase();
  const latin = (text.match(/[a-z]/g) ?? []).length;
  const cyr = (text.match(/[а-яё]/g) ?? []).length;
  return latin > cyr && /(o‘|o'|g‘|g'|sh|ch|lar\b|ni\b|uchun|kurs)/.test(text) ? "uz" : "ru";
}
