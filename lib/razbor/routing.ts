/**
 * Адреса раздела разборов.
 *
 * Отдельным файлом, потому что их строят и страницы, и sitemap, и
 * перелинковка. Собранный в трёх местах руками адрес однажды разъедется, и
 * разъедется он тихо: ссылка просто перестанет вести куда надо.
 */
import type { Locale } from "@/lib/i18n";
import type { RazborLocale } from "@/lib/razbor/model";

/** Разборы пишутся только на русском и узбекском. */
export function isRazborLocale(locale: Locale): locale is RazborLocale & Locale {
  return locale === "ru" || locale === "uz";
}

export const RAZBOR_LOCALES = ["ru", "uz"] as const;

/**
 * Языки, на которых у раздела есть страница, но нет своих статей.
 *
 * Украинский и польский добавились на сайт целиком, и /uk/razbor — адрес,
 * на который человек попадает сам: переключателем языка со страницы
 * разбора. 404 там читается как «сломалось», пустой список — как «раздел
 * заброшен». Поэтому на этих языках раздел честно говорит, что статьи
 * пока выходят по-русски и по-узбекски, и показывает русские — с меткой
 * языка на каждой карточке, чтобы клик не стал сюрпризом.
 *
 * Английский и китайский сюда не входят: их решение (раздела нет вовсе)
 * принято раньше и отдельно, и этот список его не пересматривает.
 */
export const RAZBOR_BORROWING = ["uk", "pl"] as const;
export type RazborBorrowing = (typeof RAZBOR_BORROWING)[number];

export function isRazborBorrowing(locale: Locale): locale is RazborBorrowing {
  return (RAZBOR_BORROWING as readonly string[]).includes(locale);
}

export function localeHref(locale: RazborLocale, slug?: string): string {
  return slug ? `/${locale}/razbor/${slug}` : `/${locale}/razbor`;
}
