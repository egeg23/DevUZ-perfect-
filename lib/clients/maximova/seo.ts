import type { Metadata } from "next";

/**
 * SEO сайта Дарьи: адрес, индексация, разметка.
 *
 * Пока сайт живёт на devuz.studio, он закрыт от индексации: когда переедет
 * на её домен, копия у нас отбирала бы у него выдачу. Решение — в коде, а не
 * в переменной окружения: страницы собираются статически, и переменная,
 * заданная только на сервере, до них бы не доехала.
 *
 * При переезде на домен Дарьи:
 *   1. SITE_URL — её адрес (без /maximova, если сайт в корне);
 *   2. INDEXING = true;
 *   3. убрать X-Robots-Tag для /maximova в next.config.ts
 *      (тест tests/maximova-seo.test.ts напомнит, если забыть);
 *   4. 301 со старых адресов devuz.studio/maximova/… на новые.
 */
export const SITE_URL = "https://devuz.studio/maximova";
export const INDEXING = false;

export const url = (path = "") => `${SITE_URL}${path}`;
/** Файлы из public/ лежат от корня домена, а не от /maximova. */
export const asset = (path: string) => `${new URL(SITE_URL).origin}${path}`;

export function pageMetadata(input: { path: string; title: string; description: string }): Metadata {
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url(input.path) },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: url(input.path),
      title: input.title,
      description: input.description,
      siteName: "Дарья Максимова — английский и французский для детей",
      images: [{ url: asset("/clients/maximova/previews/lab.webp"), width: 1200, height: 630 }],
    },
    robots: INDEXING ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  };
}

/** JSON-LD в <script>: экранируем «<», чтобы текст не закрыл тег раньше времени. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
