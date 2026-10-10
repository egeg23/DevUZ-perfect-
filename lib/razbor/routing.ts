/**
 * Адреса раздела разборов.
 *
 * Отдельным файлом, потому что их строят и страницы, и sitemap, и
 * перелинковка. Собранный в трёх местах руками адрес однажды разъедется, и
 * разъедется он тихо: ссылка просто перестанет вести куда надо.
 */
import type { Locale } from "@/lib/i18n";
import type { RazborReadLocale } from "@/lib/razbor/model";

/**
 * Языки, на которых у раздела свои статьи.
 *
 * Русский и узбекский пишет ночная смена под разные запросы; английский и
 * польский (с 10.10.2026) сервер делает сам из опубликованной русской
 * статьи — владелец: «На английском давай тоже делать, там 404» и «А в
 * польской версии статей вообще, русские показываются».
 */
export function isRazborLocale(locale: Locale): locale is RazborReadLocale & Locale {
  return (RAZBOR_LOCALES as readonly string[]).includes(locale);
}

export const RAZBOR_LOCALES = ["ru", "uz", "en", "pl"] as const;

/**
 * Языки, на которых у раздела есть страница, но нет своих статей.
 *
 * Украинский добавился на сайт целиком, и /uk/razbor — адрес, на который
 * человек попадает сам: переключателем языка со страницы разбора. 404 там
 * читается как «сломалось», пустой список — как «раздел заброшен». Поэтому
 * на украинском раздел честно говорит, на каких языках выходят статьи, и
 * показывает русские — с меткой языка на каждой карточке, чтобы клик не
 * стал сюрпризом.
 *
 * Китайский сюда не входит: раздела на нём нет вовсе — решение принято
 * раньше и отдельно. Английский и польский с 10.10.2026 — свои языки
 * раздела (выше).
 */
export const RAZBOR_BORROWING = ["uk"] as const;
export type RazborBorrowing = (typeof RAZBOR_BORROWING)[number];

export function isRazborBorrowing(locale: Locale): locale is RazborBorrowing {
  return (RAZBOR_BORROWING as readonly string[]).includes(locale);
}

export function localeHref(locale: RazborReadLocale, slug?: string): string {
  return slug ? `/${locale}/razbor/${slug}` : `/${locale}/razbor`;
}
