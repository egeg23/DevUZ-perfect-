import { listArticles } from "@/lib/marketing/articles-store";
import { dzenRss, feedItems } from "@/lib/outside/dzen-feed";
import { listRazbors } from "@/lib/razbor/store";

/**
 * Лента для Дзена: https://devuz.studio/dzen/rss.xml (как устроена —
 * lib/outside/dzen-feed.ts). Статьи и разборы выходят без выкатки, поэтому
 * лента пересобирается раз в 10 минут, как страницы статей.
 */
export const revalidate = 600;

export async function GET() {
  const [articles, razbors] = await Promise.all([listArticles("ru", 40), listRazbors("ru")]);
  return new Response(dzenRss(feedItems(articles, razbors)), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
