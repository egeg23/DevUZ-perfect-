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
 * Русский и узбекский пишет ночная смена под разные запросы; английский
 * (с 10.10.2026) сервер делает сам из опубликованной русской статьи —
 * владелец: «На английском давай тоже делать, там 404».
 */
export function isRazborLocale(locale: Locale): locale is RazborReadLocale & Locale {
  return locale === "ru" || locale === "uz" || locale === "en";
}

export const RAZBOR_LOCALES = ["ru", "uz", "en"] as const;

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
 * Китайский сюда не входит: раздела на нём нет вовсе — решение принято
 * раньше и отдельно. Английский с 10.10.2026 — свой язык раздела (выше).
 */
export const RAZBOR_BORROWING = ["uk", "pl"] as const;
export type RazborBorrowing = (typeof RAZBOR_BORROWING)[number];

export function isRazborBorrowing(locale: Locale): locale is RazborBorrowing {
  return (RAZBOR_BORROWING as readonly string[]).includes(locale);
}

export function localeHref(locale: RazborReadLocale, slug?: string): string {
  return slug ? `/${locale}/razbor/${slug}` : `/${locale}/razbor`;
}
