import { listArticles } from "@/lib/marketing/articles-store";
import { memo } from "@/lib/memo";
import { dzenRss, feedItems } from "@/lib/outside/dzen-feed";
import { listRazbors } from "@/lib/razbor/store";

/**
 * Лента для Дзена: https://devuz.studio/dzen/rss.xml (как устроена —
 * lib/outside/dzen-feed.ts).
 *
 * Собирается при запросе, а не на сборке — как карта сайта (app/sitemap.ts):
 * сайт собирается в GitHub, базы там нет, и `revalidate` 23.11.2026 отдал
 * Дзену пустую ленту, собранную при сборке. Готовая лента живёт в памяти
 * 10 минут (FEED_MS): статьи и разборы выходят несколько раз в день, а робот
 * Дзена приходит часто. Пустую не запоминаем — база могла не ответить.
 */
export const dynamic = "force-dynamic";

const FEED_MS = 10 * 60_000;

async function build(): Promise<string> {
  const [articles, razbors] = await Promise.all([listArticles("ru", 40), listRazbors("ru")]);
  const items = feedItems(articles, razbors);
  if (!items.length) throw new Error("лента пустая");
  return dzenRss(items);
}

export async function GET() {
  const xml = await memo("dzen:rss", FEED_MS, build).catch(() => dzenRss([]));
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
