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
        //
        // /admin здесь намеренно НЕТ. Этот файл публичный: любой может
        // открыть /robots.txt, и строка «disallow: /admin» сообщает всему
        // интернету, что по такому адресу что-то есть. Панель закрывают две
        // меры, которые не рассказывают о ней ничего: noindex в метаданных
        // (app/admin/layout.tsx) и заголовок X-Robots-Tag в next.config.ts.
        // Строка в robots.txt была бы третьей — и единственной из трёх,
        // которая работает как указатель.
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
