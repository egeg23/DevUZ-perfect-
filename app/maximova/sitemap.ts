import type { MetadataRoute } from "next";

import { LANDINGS } from "@/content/clients/maximova/pages";
import { url } from "@/lib/clients/maximova/seo";

/**
 * Карта сайта Дарьи: /maximova/sitemap.xml.
 *
 * Только страницы для поиска: главная, программы и политика. Кабинет, архив
 * вариантов и API в неё не попадают.
 *
 * Карта есть всегда, но в Яндекс Вебмастер и Google Search Console её
 * отправляют только после того, как сайт открыт для индексации
 * (INDEXING = true): карта с адресами под noindex — противоречие, за которое
 * оба поисковика пишут предупреждения. В robots.txt студии она не
 * упоминается — у сайта Дарьи будет свой robots.txt на её домене.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-30");
  return [
    { url: url(), lastModified, changeFrequency: "monthly", priority: 1 },
    ...LANDINGS.map((l) => ({
      url: url(`/${l.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
