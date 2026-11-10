import { modelTroubleSays } from "@/lib/model-trouble";
import { anthropic } from "@/lib/model-road";

/**
 * Что хочет заказчик — коротко и по-русски.
 *
 * Владелец, 10.11.2026: «сделай чтобы текст короткий тендера выводился еще и
 * на русском языке, что хотят». Названия лотов пишут по-узбекски латиницей и
 * кириллицей, длинно и казённо. Недорогая модель (Haiku) делает одну фразу;
 * лотов за проход — единицы, поэтому это копейки. Русское название, которое и
 * так короткое, модели не отдаём.
 */

export const TENDER_RU_MODEL = process.env.TENDER_RU_MODEL || "claude-haiku-4-5";
export const RU_MAX = 220;

const SYSTEM = `Ты переводишь названия государственных закупок Узбекистана для менеджеров веб-студии.
Напиши по-русски одной фразой, что хочет заказчик: что сделать или купить и для чего. До 20 слов.
Без кавычек вокруг ответа, без вступлений и пояснений. Названия организаций, продуктов и систем (CRM, Humo, P2P) не переводи.
Не добавляй ничего, чего нет в названии: ни сроков, ни цен, ни чисел.
Ответь только этой фразой.`;

/** Узбекская кириллица без ў, қ, ғ, ҳ: частые слова и суффиксы закупок. */
const UZ_CYRILLIC = /(?<![а-яёъ])(?:учун|билан|ва|бўйича|ишлаб|этиш|қилиш|хизмат[а-яёъ]*|тизим[а-яёъ]*|таъминот[а-яёъ]*|[а-яёъ]*лаштир[а-яёъ]*)(?![а-яёъ])/i;

/** Нужен ли перевод: латиница или узбекская кириллица, или русское, но длинное. */
export function needsRu(title: string): boolean {
  const latin = (title.match(/[a-z]/gi) ?? []).length;
  const cyr = (title.match(/[а-яё]/gi) ?? []).length;
  if (/[ўқғҳ]/i.test(title) || UZ_CYRILLIC.test(title)) return true;
  if (latin > cyr) return true;
  return title.length > RU_MAX;
}

/** Ответ модели — годный: русские буквы есть, не длиннее предела, без новых чисел. */
export function ruProblems(text: string, source: string): string[] {
  const problems: string[] = [];
  if (!text) return ["пусто"];
  if (text.length > RU_MAX) problems.push("длинно");
  if ((text.match(/[а-яё]/gi) ?? []).length < 8) problems.push("не по-русски");
  if (/[ўқғҳ]/i.test(text)) problems.push("узбекская кириллица");
  const known = new Set(source.match(/\d+/g) ?? []);
  if ((text.match(/\d+/g) ?? []).some((n) => !known.has(n))) problems.push("число, которого нет в названии");
  return problems;
}

export function cleanRu(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/^["«“„']+|["»”']+$/g, "")
    .replace(/\s+[—–]\s+/g, ": ")
    .trim();
}

export type AskRu = (title: string) => Promise<string | null>;

const askHaiku: AskRu = async (title) => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const response = await anthropic("tender-ru").messages.create({
      model: TENDER_RU_MODEL,
      max_tokens: 160,
      system: SYSTEM,
      messages: [{ role: "user", content: title.slice(0, 1200) }],
    });
    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  } catch (error) {
    console.error("тендеры: перевод не получился —", modelTroubleSays(error));
    return null;
  }
};

/** Русская фраза к лоту или null (не вышло — менеджер видит оригинал). */
export async function tenderRu(title: string, ask: AskRu = askHaiku): Promise<string | null> {
  const clean = title.replace(/\s+/g, " ").trim();
  if (!needsRu(clean)) return clean;
  const raw = await ask(clean);
  const text = raw ? cleanRu(raw) : "";
  return text && !ruProblems(text, clean).length ? text : null;
}
