/**
 * На каком языке пишет покупатель: русский или узбекский.
 *
 * Модель отвечает на языке покупателя сама — это сказано в промпте. Язык
 * здесь нужен коду: на нём уходят фразы шаблоном (прощание с номером
 * заявки, «менеджер ответит», «напишите текстом»), и узбеку они не должны
 * приходить по-русски.
 *
 * Узбекский узнаём по буквам кириллицы, которых нет в русском (ў қ ғ ҳ), и
 * по частым словам — латиницей и кириллицей: в Ташкенте пишут и так, и так,
 * и часто вперемешку с русским. Слова сверяются целиком (границы — по
 * буквам Unicode: `\b` в JavaScript кириллицу не знает).
 */

export type Lang = "ru" | "uz";

const UZ_LETTERS = /[ўқғҳЎҚҒҲ]|[og][‘'ʻ`’]/u;

const UZ_WORDS = [
  "salom", "assalomu", "alaykum", "narx", "narxi", "narxlari", "qancha", "necha", "bormi", "bor", "yo'q", "yoq",
  "kerak", "rahmat", "raxmat", "yaxshi", "qayerda", "qayer", "manzil", "manzilingiz", "buyurtma", "mumkin", "mumkinmi",
  "iltimos", "xizmat", "yetkazib", "qachon", "sizda", "menga", "uchun", "va", "ha", "yo'q", "nima", "qanday", "ishlaysiz",
  "салом", "ассалому", "алайкум", "нарх", "нархи", "қанча", "канча", "борми", "керак", "рахмат", "яхши", "қаерда", "каерда",
  "мумкин", "мумкинми", "илтимос", "хизмат", "қачон", "качон", "сизда", "менга", "учун", "нима", "қандай", "кандай",
];
const UZ_SET = new Set(UZ_WORDS);

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}'‘ʻ’]+/gu) ?? [];
}

/** Язык текста или null, если по нему не понять (цифры, смайлик, «ok»). */
export function langOf(text: string): Lang | null {
  if (UZ_LETTERS.test(text)) return "uz";
  const list = words(text);
  if (!list.length) return null;
  const uzHits = list.filter((w) => UZ_SET.has(w.replace(/[‘ʻ’]/g, "'"))).length;
  if (uzHits > 0 && uzHits * 4 >= list.length) return "uz";
  if (uzHits >= 2) return "uz";
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru";
  return null;
}

/** Язык разговора: последнее понятное сообщение покупателя, иначе язык клиента. */
export function talkLang(customerTexts: readonly string[], fallback: Lang): Lang {
  for (let i = customerTexts.length - 1; i >= 0; i--) {
    const lang = langOf(customerTexts[i]);
    if (lang) return lang;
  }
  return fallback;
}
