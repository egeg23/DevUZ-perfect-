import type { Metadata } from "next";

import { company } from "@/content/company";
import { hreflang, locales, type Locale } from "@/lib/i18n";

/**
 * Канонический адрес сайта. Держится в одной переменной окружения именно
 * потому, что домен временный: переезд с maximov-tech на собственный домен
 * должен стоить одну строку в .env, а не правку в двадцати файлах.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://devuz.studio"
).replace(/\/+$/, "");

export function absoluteUrl(path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${siteUrl}/${clean}` : siteUrl;
}

/**
 * Языковые версии, когда их набор или адреса не совпадают с общими.
 *
 * Ключ — язык, значение — путь без префикса локали. Языка нет в карте —
 * значит страницы на нём не существует, и обещать её нельзя.
 *
 * Нужна ровно там, где страница живёт не на всех четырёх языках или живёт
 * под разными адресами. Такой раздел у нас один — разборы: они пишутся
 * только по-русски и по-узбекски, и это не перевод одного текста, а два
 * запроса с разными адресами.
 */
export type AltPaths = Partial<Record<Locale, string>>;

/**
 * Строит canonical и набор hreflang-альтернатив для страницы.
 *
 * `path` — путь без префикса локали: "cases/tezketkaz" или "" для главной.
 * Каждая языковая версия ссылается на все остальные, включая себя — этого
 * требует Google, иначе связка считается неполной и игнорируется.
 *
 * x-default ведёт на русскую версию: это язык, на котором к нам приходит
 * основной поток клиентов из Узбекистана.
 *
 * `only` перекрывает общее правило «страница есть на всех языках по тому же
 * адресу». Без него разбор обещал поисковику английскую и китайскую версии,
 * которых нет, и узбекскую — по русскому адресу: пять ссылок, все пять
 * четырёхсотые. В sitemap разборы были выделены отдельно именно поэтому, а
 * до `<head>` та же правка не дошла.
 */
export function buildAlternates(locale: Locale, path = "", only?: AltPaths): Metadata["alternates"] {
  const href = (l: Locale, p: string) => {
    const clean = p.replace(/^\/+|\/+$/g, "");
    return absoluteUrl(clean ? `${l}/${clean}` : l);
  };

  const languages: Record<string, string> = {};

  if (only) {
    for (const l of locales) {
      const where = only[l];
      if (where === undefined) continue;
      languages[hreflang[l]] = href(l, where);
    }
    // x-default ведёт на русскую версию, если она есть. Если нет — на саму
    // страницу: обещать язык, которого нет, нельзя и здесь.
    languages["x-default"] = only.ru !== undefined ? href("ru", only.ru) : href(locale, only[locale] ?? path);
    return { canonical: href(locale, only[locale] ?? path), languages };
  }

  for (const l of locales) {
    languages[hreflang[l]] = href(l, path);
  }
  languages["x-default"] = href("ru", path);

  return { canonical: href(locale, path), languages };
}

/**
 * Общая обвязка метаданных страницы: title, description, canonical, hreflang,
 * Open Graph и Twitter-карточка.
 */
export function buildMetadata({
  locale,
  path = "",
  title,
  description,
  ogImage,
  noIndex = false,
  alternates,
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  ogImage?: string;
  noIndex?: boolean;
  /** Языковые версии, если они не совпадают с общим правилом. */
  alternates?: AltPaths;
}): Metadata {
  const url = absoluteUrl(path ? `${locale}/${path}` : locale);
  // Своя картинка на каждый язык: в мессенджерах превью читают чаще, чем
  // сам заголовок, и русскоязычная обложка на китайской странице выглядит
  // как чужая ссылка.
  const image = ogImage ?? absoluteUrl(`og-${locale}.png`);

  return {
    // absolute, а не обычный title: шаблон из layout дописывает «— DevUz
    // Studio» ко всему, что ему отдают, и заголовки, где бренд уже был,
    // выходили за сотню символов — Google обрезает на шестидесяти. Здесь
    // строка задаётся целиком и ровно так, как должна выглядеть в выдаче.
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, path, alternates),
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: company.name,
      title,
      description,
      url,
      locale: hreflang[locale].replace("-", "_"),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
