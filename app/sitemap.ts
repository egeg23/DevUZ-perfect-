import type { MetadataRoute } from "next";

import { cases } from "@/content/cases";
import { services } from "@/content/services";
import { hreflang, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

/**
 * Карта сайта со ссылками на языковые версии.
 *
 * Каждая запись несёт полный набор альтернатив — Google рекомендует
 * дублировать hreflang и в sitemap, а не только в <head>: так связка языковых
 * версий доходит до индекса даже если робот не дошёл до самой страницы.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "services", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "cases", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "privacy", priority: 0.3, changeFrequency: "yearly" as const },
    ...services.map((s) => ({
      path: `services/${s.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...cases.map((c) => ({
      path: `cases/${c.slug}`,
      priority: 0.7,
      changeFrequency: "yearly" as const,
    })),
  ];

  const lastModified = new Date();

  return paths.flatMap((entry) =>
    locales.map((locale) => {
      const languages: Record<string, string> = {};
      for (const alt of locales) {
        languages[hreflang[alt]] = absoluteUrl(
          entry.path ? `${alt}/${entry.path}` : alt,
        );
      }
      // x-default стоит и в <head>, но в sitemap его не было — а Google
      // сверяет оба источника и неполную связку молча игнорирует. Ведёт на
      // русскую версию: это язык основного потока клиентов из Узбекистана.
      languages["x-default"] = absoluteUrl(entry.path ? `ru/${entry.path}` : "ru");

      return {
        url: absoluteUrl(entry.path ? `${locale}/${entry.path}` : locale),
        lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages },
      };
    }),
  );
}
