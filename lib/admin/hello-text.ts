import { HELLO_TEXT, type HelloTexts } from "@/lib/admin/hello-first";
import { bannedPhrase, jargonWords, type MessageProblem } from "@/lib/admin/outreach";

/**
 * Своё «Здравствуйте» — первое сообщение касания, которое задают
 * руководитель и владелец (владелец, 12.10.2026: «Оптимизация скрипта, чтобы
 * манагеры редачили касания»).
 *
 * Правило владельца остаётся: первым с рабочего аккаунта уходит только
 * приветствие (lib/admin/hello-first.ts). Поэтому свой текст — это другое
 * приветствие, а не короткое письмо: начинается с приветствия, до восьми
 * слов, без ссылок, цифр, цен и технических слов. Русское — кириллицей,
 * узбекское — латиницей. Пусто — уходит HELLO_TEXT.
 *
 * Язык ответа от текста приветствия не зависит: «ответ без слов — на языке
 * приветствия» считается от письма (letterLang), а не от этих слов.
 */

/** Какие приветствия можно задать своими: на английском своего нет. */
export const HELLO_LANGS = ["ru", "uz"] as const;
export type OwnHelloLang = (typeof HELLO_LANGS)[number];

/** Строка в stats_snapshots — та же таблица, где лежат ограничения аккаунтов. */
export const HELLO_KEY = "hello-text";

/** Сохранённое: null — своего нет, уходит HELLO_TEXT. */
export type SavedHello = { ru: string | null; uz: string | null; by?: string | null; at?: string | null };

export const HELLO_MAX_WORDS = 8;
export const HELLO_MAX_CHARS = 80;

/** С чего приветствие может начинаться. Слово целиком: «Приветствуем вас» — да, «Привезём» — нет. */
const OPENER: Record<OwnHelloLang, RegExp> = {
  ru: /^(?:здравствуй(?:те)?|добр(?:ый|ое|ого)\s+(?:день|вечер|утро|утра|дня|вечера)|приветствую|приветствуем|привет|салам|ас+ал[ао]му?\s+ал[еэ]йкум)(?![\p{L}])/iu,
  uz: /^(?:as+alomu?\s+al[ae]y?kum|salom|x?ayrli\s+(?:kun|tong|kech))(?![\p{L}])/iu,
};

const LINK = /https?:\/\/|www\.|t\.me\/|@\w|\b[\p{L}\d-]+\.(?:uz|ru|com|studio|org|net|me|io)\b/iu;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /\p{Script=Latin}/u;

/** Что не так со своим приветствием. Пусто — можно сохранять (пустой текст — вернуть обычное). */
export function helloProblems(text: string, lang: OwnHelloLang): MessageProblem[] {
  const t = text.trim();
  if (!t) return [];
  const problems: MessageProblem[] = [];
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words > HELLO_MAX_WORDS || t.length > HELLO_MAX_CHARS) {
    problems.push({ code: "hello_long", text: `Приветствие длиннее ${HELLO_MAX_WORDS} слов — это уже письмо.`, args: [HELLO_MAX_WORDS] });
  }
  if (!OPENER[lang].test(t.replace(/^[\s"«]+/, ""))) {
    problems.push({ code: "hello_not_greeting", text: "Первое сообщение должно начинаться с приветствия." });
  }
  if (LINK.test(t)) problems.push({ code: "hello_link", text: "В приветствии ссылка или адрес." });
  if (/\d/.test(t)) problems.push({ code: "hello_digits", text: "В приветствии цифры — цены и числа уходят только после ответа." });
  const jargon = jargonWords(t);
  if (jargon.length) problems.push({ code: "hello_jargon", text: `Технические слова: ${jargon.join(", ")}.`, args: [jargon.join(", ")] });
  if (bannedPhrase(t)) problems.push({ code: "hello_banned", text: "Запрещённое обещание или знак: проценты, эмодзи, «в топ»." });
  if (lang === "ru" && (!CYRILLIC.test(t) || LATIN.test(t))) {
    problems.push({ code: "hello_script", text: "Русское приветствие пишется кириллицей, без латиницы." });
  }
  if (lang === "uz" && (CYRILLIC.test(t) || !LATIN.test(t))) {
    problems.push({ code: "hello_script", text: "Узбекское приветствие пишется латиницей, без кириллицы." });
  }
  return problems;
}

/** Своё, если оно есть и всё ещё проходит проверку, иначе обычное. */
export function effectiveHello(saved: Partial<SavedHello> | null | undefined): HelloTexts {
  const own = (lang: OwnHelloLang): string => {
    const text = typeof saved?.[lang] === "string" ? saved[lang]!.trim() : "";
    return text && !helloProblems(text, lang).length ? text : HELLO_TEXT[lang];
  };
  return { ru: own("ru"), uz: own("uz"), en: HELLO_TEXT.en };
}
