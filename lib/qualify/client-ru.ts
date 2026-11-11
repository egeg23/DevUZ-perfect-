import { modelTroubleSays } from "@/lib/model-trouble";
import { anthropic } from "@/lib/model-road";
import { detectLang } from "@/lib/talk/language";

/**
 * Слова клиента — ещё и по-русски, для команды.
 *
 * Владелец, 11.11.2026: «Если у нас клиент общается с ботом — можно перевод
 * на русский тоже сделать что пишет клиент?». Клиент пишет боту по-узбекски
 * (латиницей и кириллицей) или по-английски; в «📩 Обращение в бота»,
 * «🌙 Писал боту ночью» и «💬 Клиент написал в бот» под его словами — строка
 * «🇷🇺 Перевод». Клиенту ничего не уходит: перевод только для команды.
 *
 * Недорогая модель (Haiku), одна фраза — копейки. Не вышло или перевод не
 * прошёл проверку — строки нет, команда видит оригинал, как раньше.
 */

export const CLIENT_RU_MODEL = process.env.CLIENT_RU_MODEL || "claude-haiku-4-5";
const SOURCE_MAX = 1200;
const CACHE_MAX = 200;

const SYSTEM = `Ты переводишь сообщения клиентов веб-студии на русский для менеджеров.
Переведи сообщение на русский язык точно по смыслу, тем же тоном, без пояснений и без кавычек вокруг ответа.
Названия компаний, сайтов, продуктов, имена и ссылки оставь как есть. Числа и цены не меняй и не добавляй новых.
Ответь только переводом.`;

/** Только адрес, ник или телефон — переводить нечего. */
const NOT_WORDS = /^(?:https?:\/\/\S+|(?:www\.)?[\w-]+(?:\.[\w-]+)+\S*|@\w+|\+?[\d\s()-]{5,})$/i;

/** Нужен ли перевод: не русский, есть слова, а не только адрес или эмодзи. */
export function wantsRu(text: string): boolean {
  const body = String(text ?? "").replace(/\s+/g, " ").trim();
  if ((body.match(/\p{L}/gu) ?? []).length < 3) return false;
  if (NOT_WORDS.test(body)) return false;
  return detectLang(body) !== "ru";
}

/** Перевод годный: по-русски, без узбекских букв, без новых чисел, не роман. */
export function ruProblems(ru: string, source: string): string[] {
  const out: string[] = [];
  if (!ru.trim()) return ["пусто"];
  if ((ru.match(/[а-яё]/gi) ?? []).length < 3) out.push("не по-русски");
  if (/[ўқғҳ]/i.test(ru)) out.push("узбекская кириллица");
  if (ru.length > source.length * 3 + 80) out.push("длинно");
  const known = new Set(source.match(/\d+/g) ?? []);
  if ((ru.match(/\d+/g) ?? []).some((n) => !known.has(n))) out.push("число, которого не было");
  return out;
}

export function cleanRu(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/^["«“„']+|["»”']+$/g, "").trim();
}

export type AskRu = (text: string) => Promise<string | null>;

const askHaiku: AskRu = async (text) => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const response = await anthropic("client-ru").messages.create({
      model: CLIENT_RU_MODEL,
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    return response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  } catch (error) {
    console.error("перевод слов клиента не получился —", modelTroubleSays(error));
    return null;
  }
};

/** Одно и то же сообщение уходит и владельцу, и хозяину лида — переводим один раз. */
const cache = new Map<string, string | null>();

/** Русский перевод слов клиента или null (русский текст, адрес, сбой модели). */
export async function clientRu(text: string, ask: AskRu = askHaiku): Promise<string | null> {
  const body = String(text ?? "").replace(/\s+/g, " ").trim().slice(0, SOURCE_MAX);
  if (!wantsRu(body)) return null;
  if (cache.has(body)) return cache.get(body) ?? null;
  const raw = await ask(body).catch(() => null);
  const ru = raw ? cleanRu(raw) : "";
  const ok = ru && !ruProblems(ru, body).length && ru.toLowerCase() !== body.toLowerCase() ? ru : null;
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(body, ok);
  return ok;
}

/** Строка в уведомление команде. Текст уже экранирован вызывающим. */
export function ruLine(escaped: string | null | undefined): string | null {
  return escaped ? `🇷🇺 Перевод: «${escaped}»` : null;
}
