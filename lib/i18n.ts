/**
 * Четыре локали сайта. Порядок важен: он определяет порядок в переключателе
 * языка и в hreflang-разметке.
 *
 * `ru` намеренно без региона — русскоязычная выдача Узбекистана, России и
 * Казахстана обслуживается одной страницей, сужать её до `ru-UZ` значит
 * потерять часть трафика. Узбекская, наоборот, помечена регионом: язык
 * встречается практически только в Узбекистане, и явный сигнал помогает
 * геотаргетингу.
 */
export const locales = ["ru", "en", "uz", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

/** Значение атрибута hreflang и `<html lang>` для каждой локали. */
export const hreflang: Record<Locale, string> = {
  ru: "ru",
  en: "en",
  uz: "uz-UZ",
  zh: "zh-Hans",
};

/** Подпись в переключателе языка — всегда на самом языке. */
export const localeLabel: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O‘zbekcha",
  zh: "中文",
};

/** Короткая подпись для компактного переключателя в шапке. */
export const localeShort: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  uz: "UZ",
  zh: "中文",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Подбирает локаль по заголовку Accept-Language.
 *
 * Разбор ручной, а не через Intl: нам нужен только префикс языка и вес `q`,
 * а `Intl.LocaleMatcher` в рантайме Next пока недоступен. Узбекскую кириллицу
 * (`uz-Cyrl`) сознательно отправляем на русскую версию — сайт на узбекском
 * только латиницей.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("uz")) return tag.includes("cyrl") ? "ru" : "uz";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("en")) return "en";
    // Языки постсоветского пространства чаще всего означают, что человеку
    // комфортнее на русском, чем на английском.
    if (["kk", "ky", "tg", "tk", "be", "hy", "az"].some((l) => tag.startsWith(l))) {
      return "ru";
    }
  }

  return defaultLocale;
}

/** Строит внутренний путь с префиксом локали: localeHref("uz", "cases"). */
export function localeHref(locale: Locale, path = ""): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/** Текст, у которого есть вариант на каждом языке сайта. */
export type LocalizedText = Record<Locale, string>;

export function t(value: LocalizedText, locale: Locale): string {
  return value[locale] || value[defaultLocale];
}

/** Текст со списком пунктов на каждом языке. */
export type LocalizedList = Record<Locale, string[]>;

export function tList(value: LocalizedList, locale: Locale): string[] {
  return value[locale] ?? value[defaultLocale];
}
