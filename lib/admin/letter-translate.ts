import Anthropic from "@anthropic-ai/sdk";

import type { HelloLang } from "@/lib/admin/hello-first";
import { bannedPhrase, foreignScript, inventedNumbers, jargonWords } from "@/lib/admin/outreach";
import { effortFor } from "@/lib/model-limits";
import { anthropic } from "@/lib/model-road";
import { modelTroubleSays } from "@/lib/model-trouble";

/**
 * Письмо на языке ответа.
 *
 * Владелец, 08.10.2026: «Если ответили на другом языке — мы отвечаем на этом
 * языке, как обычно пишем». Письмо готовится заранее на языке сайта
 * (prepareOutreach), а ответить на «Здравствуйте» могут и на другом:
 * русскому сайту — «Assalomu alaykum». Тогда то же письмо, уже прошедшее
 * проверку по факту, переводится: новых фактов перевод не добавляет, и
 * проверка это держит — чисел, которых нет в исходном письме, быть не
 * должно, технических слов и запрещённых оборотов тоже.
 *
 * Не перевелось или перевод не прошёл проверку — null: разговор человеку,
 * а не письмо на чужом языке.
 */

const MODEL = process.env.OUTREACH_MODEL || "claude-sonnet-5-5";

const LANG_NAME: Record<HelloLang, string> = {
  ru: "русский",
  uz: "узбекский, латиницей",
  en: "английский",
};

export function translateSystem(to: HelloLang): string {
  return `Ты переводишь короткое деловое сообщение веб-студии DevUz Studio владельцу компании в Узбекистане. Язык перевода: ${LANG_NAME[to]}.

Правила:
— Переводи по смыслу, как написал бы живой человек на этом языке, а не дословно.
— Ничего не добавляй и не убирай: ни фактов, ни обещаний, ни чисел. Все числа, адреса сайтов, ссылки, названия компаний и имена оставь как есть.
— Не здоровайся: приветствие уже ушло отдельным сообщением.
— Без технических слов, без восклицательных знаков и эмодзи, на «вы».
${to === "uz" ? "— Узбекский — латиницей, как пишут менеджеры в Ташкенте: oʻ, gʻ через апостроф.\n" : ""}
Ответь только текстом перевода.`;
}

/** Кириллица в узбекском переводе: пишем латиницей, а модель иногда сбивается на неё посреди слова. */
const CYRILLIC_WORD = /[\p{L}ʻʼ’']*\p{Script=Cyrillic}[\p{L}ʻʼ’']*/gu;

/** Что не так с переводом. Пусто — можно отправлять. */
export function translationProblems(text: string, source: string, host: string, to?: HelloLang): string[] {
  const out: string[] = [];
  const t = text.trim();
  if (t.length < 40) out.push("слишком коротко");
  if (t.length > Math.max(900, source.length * 2)) out.push("длиннее исходного вдвое");
  const invented = inventedNumbers(t, source);
  if (invented.length) out.push(`числа не из письма: ${invented.join(", ")}`);
  if (bannedPhrase(t)) out.push("запрещённый оборот");
  const jargon = jargonWords(t, [host]);
  if (jargon.length) out.push(`технические слова: ${jargon.join(", ")}`);
  const alien = foreignScript(t);
  if (alien.length) out.push(`чужое письмо: ${alien.join(" ")}`);
  if (to === "uz") {
    // Название компании кириллицей перевод оставляет как есть — оно с большой
    // буквы и есть в исходном письме. Всё остальное кириллицей — сбой.
    const cyrillic = [...new Set(t.match(CYRILLIC_WORD) ?? [])].filter((w) => !(/^\p{Lu}/u.test(w) && source.includes(w)));
    if (cyrillic.length) out.push(`кириллица в узбекском: ${cyrillic.join(" ")}`);
  }
  return out;
}

/** Попыток перевода: сбой модели в одном слове — повод спросить ещё раз, а не отдавать разговор человеку. */
const ATTEMPTS = 2;

export async function translateLetter(letter: string, to: HelloLang, host: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const response = await anthropic("outreach-translate").beta.messages.create({
        model: MODEL,
        max_tokens: 900,
        system: translateSystem(to),
        messages: [{ role: "user", content: letter }],
        ...effortFor(MODEL, "low"),
      });
      const text = response.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
      if (!text) return null;
      const problems = translationProblems(text, letter, host, to);
      if (!problems.length) return text;
      console.error(`перевод письма для ${host} не прошёл проверку (попытка ${attempt}): ${problems.join("; ")}`);
    }
    return null;
  } catch (error) {
    console.error("перевод письма: модель не ответила —", modelTroubleSays(error));
    return null;
  }
}
