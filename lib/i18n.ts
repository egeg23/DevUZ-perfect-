/**
 * Шесть локалей сайта. Порядок важен: он определяет порядок в переключателе
 * языка и в hreflang-разметке.
 *
 * Украинский и польский стоят последними, а не рядом с русским по
 * алфавиту или по семье языков. Порядок — это приоритет рынков: первые
 * четыре пункта — те, на которых к студии приходят клиенты из Узбекистана
 * и её партнёры, и те, на которых написаны разборы. Новые языки
 * добавились позже, и сдвигать ради них привычные места в переключателе
 * значило бы переучивать тех, кто уже ходит по сайту.
 *
 * `ru` намеренно без региона — русскоязычная выдача Узбекистана, России и
 * Казахстана обслуживается одной страницей, сужать её до `ru-UZ` значит
 * потерять часть трафика. Узбекская, наоборот, помечена регионом: язык
 * встречается практически только в Узбекистане, и явный сигнал помогает
 * геотаргетингу.
 */
export const locales = ["ru", "en", "uz", "zh", "uk", "pl"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

/** Значение атрибута hreflang и `<html lang>` для каждой локали. */
export const hreflang: Record<Locale, string> = {
  ru: "ru",
  en: "en",
  uz: "uz-UZ",
  zh: "zh-Hans",
  // Без региона, как и русский: по-украински и по-польски читают не
  // только в Украине и Польше, и сужать страницу до одной страны незачем.
  uk: "uk",
  pl: "pl",
};

/**
 * Локаль Open Graph — язык_СТРАНА, как её ждут Facebook и Telegram.
 *
 * Отдельная таблица, а не hreflang с заменой дефиса: у hreflang регион
 * есть не везде (`ru`, `uk`, `pl`), а Open Graph без региона не принимает.
 */
export const ogLocale: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
  uz: "uz_UZ",
  zh: "zh_CN",
  uk: "uk_UA",
  pl: "pl_PL",
};

/** Подпись в переключателе языка — всегда на самом языке. */
export const localeLabel: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O‘zbekcha",
  zh: "中文",
  uk: "Українська",
  pl: "Polski",
};

/** Короткая подпись для компактного переключателя в шапке. */
export const localeShort: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  uz: "UZ",
  zh: "中文",
  uk: "UK",
  pl: "PL",
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
/** Языки из Accept-Language по убыванию веса `q`, в нижнем регистре. */
function rankedTags(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  for (const tag of rankedTags(acceptLanguage)) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("uz")) return tag.includes("cyrl") ? "ru" : "uz";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("uk")) return "uk";
    if (tag.startsWith("pl")) return "pl";
    // Языки постсоветского пространства чаще всего означают, что человеку
    // комфортнее на русском, чем на английском.
    if (["kk", "ky", "tg", "tk", "be", "hy", "az"].some((l) => tag.startsWith(l))) {
      return "ru";
    }
  }

  return defaultLocale;
}

/**
 * Пришёл по клику на рекламу: метка клика Директа или Google, либо платная
 * utm-метка. `ysclid` сюда не входит — его ставит и обычный поиск Яндекса.
 */
export function isAdClick(params: URLSearchParams): boolean {
  if (["yclid", "gclid", "gbraid", "wbraid"].some((key) => params.has(key))) return true;
  return /^(cpc|cpm|cpa|ppc|paid)/i.test(params.get("utm_medium") ?? "");
}

/**
 * Язык для клика по рекламе — только русский или узбекский.
 *
 * Реклама крутится на Узбекистан, а телефон там часто стоит на английском:
 * по Accept-Language такой человек попадал на английскую версию. За 28 дней
 * до 9 октября 2026 это 153 визита с Директа, 92% ушли через 4 секунды —
 * деньги за клик ушли на страницу, которую он не читает. Узбекский — если он
 * в списке языков телефона выше русского, иначе русский; переключатель
 * языка остаётся на месте.
 */
export function adLocale(acceptLanguage: string | null): Locale {
  for (const tag of rankedTags(acceptLanguage ?? "")) {
    if (tag.startsWith("uz")) return tag.includes("cyrl") ? "ru" : "uz";
    if (tag.startsWith("ru")) return "ru";
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
