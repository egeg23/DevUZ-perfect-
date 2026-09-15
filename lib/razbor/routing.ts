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

export function localeHref(locale: RazborLocale, slug?: string): string {
  return slug ? `/${locale}/razbor/${slug}` : `/${locale}/razbor`;
}
