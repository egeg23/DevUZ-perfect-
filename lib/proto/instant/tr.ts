/**
 * Строка шаблона на языках макета. ru и uz есть у каждой; en, ar и pl — у
 * сфер с переводом (MOCKUP_EXTRA в types.ts). Перевод — один раз в коде, без
 * модели при сборке (владелец, 13.11.2026: «В тг боте добавляем при старте
 * еще языки (английский, арабский, польский)»).
 *
 * Нет перевода — русская строка: её ловит проверка макета (код `lang`,
 * lib/proto/instant/check), и такой макет клиенту не уходит.
 */
import type { InstantLocale } from "@/lib/proto/instant/types";

export type Pair = { ru: string; uz: string; en?: string; ar?: string; pl?: string };

/** P(ru, uz) — как было; P(ru, uz, en, ar, pl) — сфера с новыми языками. */
export const P = (ru: string, uz: string, en?: string, ar?: string, pl?: string): Pair =>
  en === undefined ? { ru, uz } : { ru, uz, en, ar, pl };

export const say = (p: Pair, l: InstantLocale): string => p[l] ?? p.ru;

/** Перевод сферы: русская строка шаблона → [en, ar, pl]. */
export type TrTable = Readonly<Record<string, readonly [string, string, string]>>;
const AT = { en: 0, ar: 1, pl: 2 } as const;

/** Строка на языке макета: ru и uz — из пары, en, ar, pl — из словаря сферы. */
export function sayIn(table: TrTable, l: InstantLocale) {
  return (p: Pair): string => {
    if (l === "ru" || l === "uz") return p[l];
    return p[l] ?? table[p.ru]?.[AT[l]] ?? p.ru;
  };
}

/** Русские строки шаблона, которым нет перевода: проверка теста. */
export function missingIn(table: TrTable, pairs: readonly Pair[]): string[] {
  return pairs.filter((p) => !p.en && !table[p.ru]).map((p) => p.ru);
}

/** Дни недели с воскресенья, как у Date.getDay(). */
export const WEEKDAYS: Record<InstantLocale, string[]> = {
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
  pl: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
};

/** Имя демо-клиента в примере заявки. */
export const DEMO_NAME: Record<InstantLocale, string> = { ru: "Мадина", uz: "Madina", en: "Madina", ar: "مريم", pl: "Madina" };

/** `lang` и, для арабского, `dir="rtl"` у <html>. */
export const htmlLang = (l: InstantLocale) => `lang="${l}"${l === "ar" ? ' dir="rtl"' : ""}`;

/**
 * Арабский: шрифт с арабскими буквами (у шрифтов наших шаблонов их нет) и
 * зеркальная раскладка там, где она задана направлением текста. Шторки и
 * ссылка «К содержанию», спрятанные сдвигом влево, справа налево дают
 * прокрутку вбок: прячем их вправо и срезаем лишнее.
 */
export const rtlHead = (l: InstantLocale) =>
  l === "ar"
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap">
<style>html[dir=rtl] body,html[dir=rtl] h1,html[dir=rtl] h2,html[dir=rtl] h3,html[dir=rtl] button,html[dir=rtl] input,html[dir=rtl] textarea{font-family:"Noto Sans Arabic",system-ui,sans-serif!important;letter-spacing:0!important}
html[dir=rtl],html[dir=rtl] body{overflow-x:clip}
html[dir=rtl] .skip:not(:focus),html[dir=rtl] .vh:not(:focus){left:auto!important;right:-9999px!important}</style>`
    : "";
