import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Краулеры, обучающие и отвечающие модели.
 *
 * Разрешены намеренно и перечислены поимённо. Молчаливого «*» здесь мало по
 * двум причинам. Первая: Google-Extended — отдельный переключатель, которым
 * сайт разрешает или запрещает использовать себя для ответов Gemini и AI
 * Overviews; закрыв его, из ИИ-ответов выпадаешь целиком, оставаясь в обычной
 * выдаче. Вторая: перечисление фиксирует решение. Когда через полгода кто-то
 * захочет «прикрыть ботов», он увидит, что доступ открыт осознанно, а не по
 * недосмотру.
 *
 * llms.txt мы намеренно не делаем: Google в июне 2026 прямо сказал, что
 * игнорирует файл, а среди пятидесяти самых цитируемых ИИ доменов он есть у
 * одного. Боты забирают обычный HTML — на нём и надо работать.
 */
const AI_CRAWLERS = [
  "Google-Extended", // Gemini и AI Overviews
  "GPTBot", // обучение OpenAI
  "OAI-SearchBot", // поиск ChatGPT
  "ChatGPT-User", // переходы по ссылке из ChatGPT
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
  "CCBot", // Common Crawl — источник для многих моделей
];

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
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("sitemap.xml"),
    host: absoluteUrl(),
  };
}
