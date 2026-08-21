import type { Metadata } from "next";

import { company } from "@/content/company";
import { hreflang, locales, type Locale } from "@/lib/i18n";

/**
 * Канонический адрес сайта. Держится в одной переменной окружения именно
 * потому, что домен временный: переезд с maximov-tech на собственный домен
 * должен стоить одну строку в .env, а не правку в двадцати файлах.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://devuz.maximov-tech.ru"
).replace(/\/+$/, "");

export function absoluteUrl(path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${siteUrl}/${clean}` : siteUrl;
}

/**
 * Строит canonical и полный набор hreflang-альтернатив для страницы.
 *
 * `path` — путь без префикса локали: "cases/tezketkaz" или "" для главной.
 * Каждая языковая версия ссылается на все остальные, включая себя — этого
 * требует Google, иначе связка считается неполной и игнорируется.
 *
 * x-default ведёт на русскую версию: это язык, на котором к нам приходит
 * основной поток клиентов из Узбекистана.
 */
export function buildAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const href = (l: Locale) => absoluteUrl(clean ? `${l}/${clean}` : l);

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[hreflang[l]] = href(l);
  }
  languages["x-default"] = href("ru");

  return { canonical: href(locale), languages };
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
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path ? `${locale}/${path}` : locale);
  // Своя картинка на каждый язык: в мессенджерах превью читают чаще, чем
  // сам заголовок, и русскоязычная обложка на китайской странице выглядит
  // как чужая ссылка.
  const image = ogImage ?? absoluteUrl(`og-${locale}.png`);

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
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
