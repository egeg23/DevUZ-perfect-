import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Служебные маршруты индексировать нечего, а вот попасть в выдачу
        // они теоретически могут — закрываем явно.
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("sitemap.xml"),
    host: absoluteUrl(),
  };
}
