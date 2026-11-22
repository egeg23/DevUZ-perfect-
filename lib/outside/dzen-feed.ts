import type { RazborItem } from "@/content/razbor/items";
import type { MarketingArticle } from "@/lib/marketing/articles-store";
import { absoluteUrl } from "@/lib/seo";

/**
 * Лента RSS для Дзена: статьи о маркетинге и разборы сайта — полным текстом.
 *
 * Владелец, 22.11.2026: «И нам до сих пор очень нужны статьи на внешних
 * источниках», на «Дзен входит через Яндекс ID, капча и SMS» — «Проверь».
 * Входить роботом в Дзен не нужно: канал сам забирает статьи сайта по
 * ленте («Свой сайт» в Студии Дзена, https://dzen.ru/help/ru/website/site-to-channel.html).
 * Подключает человек один раз: канал с 10 подписчиками, права на сайт
 * (метатег `zen-verification` — ZEN_VERIFICATION ниже), лента — на проверку.
 *
 * Разметка — по их требованиям (https://dzen.ru/help/ru/website/rss-modify.html):
 * внутри content:encoded только p, a, b, h2, ul/li, figure/img; картинки —
 * JPEG, PNG или GIF шириной от 700 (обложка — og-ru.png 1200×630, снимки
 * разборов — PNG); адрес без меток; `guid` — адрес страницы, повтор Дзен не
 * берёт. При первом подключении в ленте нужно не меньше 10 материалов,
 * поэтому отдаём последние FEED_SIZE, а не только свежие.
 *
 * Отказ Дзена «по содержанию» — повторная заявка через 6 месяцев, поэтому
 * текст тот же, что на сайте, без добавок: проверки статей и разборов его
 * уже прошли.
 */

/** Код подтверждения прав на сайт из Студии Дзена (не секрет: он в разметке страницы). Пусто — метатега нет. */
export const ZEN_VERIFICATION = "";

export const FEED_PATH = "/dzen/rss.xml";
export const FEED_SIZE = 30;
export const FEED_COVER = "og-ru.png";

export type FeedItem = {
  title: string;
  link: string;
  description: string;
  date: string;
  cover: string;
  html: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Текст в CDATA: «]]>» внутри разорвал бы блок. */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Дата в RFC 822 по Ташкенту, как просит Дзен: «Wed, 02 Oct 2002 15:00:00 +0500». */
export function rfc822(iso: string): string {
  const at = new Date(iso.length <= 10 ? `${iso}T09:00:00+05:00` : iso);
  const t = new Date((Number.isFinite(at.getTime()) ? at.getTime() : 0) + 5 * 3600_000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${days[t.getUTCDay()]}, ${p(t.getUTCDate())} ${months[t.getUTCMonth()]} ${t.getUTCFullYear()} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())} +0500`;
}

const para = (text: string) => `<p>${esc(text)}</p>`;
const figure = (src: string, caption: string) => `<figure><img src="${esc(src)}"><figcaption>${esc(caption)}</figcaption></figure>`;
const readOn = (url: string) => `<p>Статья на сайте студии: <a href="${esc(url)}">DevUz</a></p>`;

/** Картинку Дзен берёт, только если она JPEG, PNG или GIF по полному адресу. */
export function dzenImage(src: string): string | null {
  const url = src.startsWith("/") ? absoluteUrl(src) : src;
  return /^https:\/\/[^\s"]+\.(png|jpe?g|gif)$/i.test(url) ? url : null;
}

/** Статья о маркетинге (русская версия). */
export function articleItem(article: MarketingArticle): FeedItem {
  const link = absoluteUrl(`/ru/marketing/articles/${article.slug}`);
  const tips = article.text.tips.length
    ? `<h2>Что сделать</h2><ul>${article.text.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>`
    : "";
  return {
    title: article.text.title,
    link,
    description: article.text.description,
    date: article.publishedAt,
    cover: absoluteUrl(FEED_COVER),
    html: article.text.paragraphs.map(para).join("") + tips + readOn(link),
  };
}

/** Разбор сайта (русская версия): находки со снимками, что даёт переделка, цена. */
export function razborItem(item: RazborItem): FeedItem {
  const link = absoluteUrl(`/ru/razbor/${item.slug}`);
  const before = dzenImage(item.shots.beforeDesktop);
  const after = dzenImage(item.shots.afterDesktop);
  const parts: string[] = item.intro.map(para);
  if (before) parts.push(figure(before, "Как сайт выглядит сейчас"));
  for (const finding of item.findings) {
    parts.push(`<h2>${esc(finding.title)}</h2>`);
    if (finding.impact) parts.push(para(finding.impact));
    const shot = finding.code ? item.shots.findings[finding.code] : undefined;
    const src = shot && shot.width >= 700 ? dzenImage(shot.src) : null;
    if (src) parts.push(figure(src, finding.title));
    if (finding.fix) parts.push(para(finding.fix));
  }
  if (after) parts.push(figure(after, "Как может выглядеть после переделки"));
  if (item.outcome.length) parts.push("<h2>Что это даст</h2>", ...item.outcome.map(para));
  if (item.price) parts.push(para(item.price));
  parts.push(readOn(link));
  return {
    title: item.title,
    link,
    description: item.description,
    date: item.publishedAt,
    cover: after ?? before ?? absoluteUrl(FEED_COVER),
    html: parts.join(""),
  };
}

/** Статьи и разборы вместе, свежие первыми, не больше FEED_SIZE; пустые отброшены. */
export function feedItems(articles: MarketingArticle[], razbors: RazborItem[], size = FEED_SIZE): FeedItem[] {
  return [...articles.map(articleItem), ...razbors.map(razborItem)]
    .filter((item) => item.title && item.html.length >= 300)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, size);
}

function imageType(url: string): string {
  if (/\.png$/i.test(url)) return "image/png";
  if (/\.gif$/i.test(url)) return "image/gif";
  return "image/jpeg";
}

/** Лента целиком. */
export function dzenRss(items: FeedItem[]): string {
  const site = absoluteUrl();
  const body = items
    .map(
      (item) =>
        `<item><title>${esc(item.title)}</title><link>${esc(item.link)}</link><guid>${esc(item.link)}</guid>` +
        `<pubDate>${rfc822(item.date)}</pubDate>` +
        `<category>format-article</category><category>index</category><category>comment-all</category>` +
        `<enclosure url="${esc(item.cover)}" type="${imageType(item.cover)}"/>` +
        `<description>${esc(item.description)}</description>` +
        `<content:encoded>${cdata(item.html)}</content:encoded></item>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">\n` +
    `<channel><title>DevUz Studio</title><link>${esc(site)}</link>` +
    `<description>Разборы сайтов и статьи о маркетинге студии DevUz</description><language>ru</language>\n` +
    `${body}\n</channel></rss>\n`
  );
}
