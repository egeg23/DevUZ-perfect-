/**
 * Забор страницы для аудита.
 *
 * Три вещи, из-за которых это не `fetch()` в две строки.
 *
 * Первая — прокси. Контейнер запускается с `--use-env-proxy` (`Dockerfile:42`),
 * потому что Anthropic не обслуживает запросы из России. Если аудит пойдёт тем
 * же маршрутом, замер скорости покажет дорогу до Бразилии и обратно, а не до
 * сайта клиента, и весь отчёт станет враньём. Явный `https.Agent` перекрывает
 * глобальный независимо от того, патчит ли его флаг, — на это и рассчитано.
 *
 * Вторая — редиректы. Публичный домен вправе ответить `302` на внутренний
 * адрес, поэтому проверка адреса повторяется на каждом шаге, а не однажды.
 *
 * Третья — потолки. Чужой сайт может отдавать гигабайт или не отвечать вовсе;
 * и то и другое не должно занимать наш процесс дольше нескольких секунд.
 */
import http from "node:http";
import https from "node:https";
import type { TLSSocket } from "node:tls";

import { contactsPagePath } from "@/lib/audit/contacts";
import { BlockedAddress, normalizeUrl, resolveSafely } from "@/lib/audit/guard";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

/** Свои агенты, не глобальные: см. про прокси в шапке файла. */
const httpAgent = new http.Agent({ keepAlive: false });
const httpsAgent = new https.Agent({ keepAlive: false });

export type Hop = { url: string; status: number };

export type PageProbe = {
  finalUrl: string;
  status: number;
  redirects: Hop[];
  html: string;
  truncated: boolean;
  headers: Record<string, string>;
  /** Время до первого байта, мс — то, что клиент чувствует как «тормозит». */
  ttfbMs: number;
  totalMs: number;
  https: boolean;
  /** Дней до истечения сертификата; null — если соединение не по TLS. */
  certDaysLeft: number | null;
  /** Стили, картинки, ссылки, значок — то, что дотянуто после страницы. */
  assets?: PageAssets;
};

export type PageAssets = {
  /** Собственные стили сайта одним текстом — по ним видно, как он свёрстан. */
  css: string;
  cssCount: number;
  cssTruncated: boolean;
  /** Есть ли значок вкладки; null — проверить не удалось. */
  favicon: boolean | null;
  checkedImages: number;
  brokenImages: string[];
  checkedLinks: number;
  brokenLinks: string[];
  /** Разметка страницы контактов — там лежит почта и второй номер. */
  contactsHtml: string | null;
  contactsUrl: string | null;
  /**
   * robots.txt целиком; null — не отдался, undefined — не спрашивали.
   *
   * Необязательные, как и `design` в отчёте: разборы, снятые до появления
   * проверки, их не несут, и находка «карты сайта нет» на таком отчёте была
   * бы выдумкой о сайте, которого мы в этой части не смотрели.
   */
  robots?: string | null;
  /** Нашлась ли карта сайта: по ссылке из robots.txt или по /sitemap.xml. */
  sitemap?: boolean | null;
};

function headerValue(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

/** Один запрос по проверенному адресу, без следования редиректам. */
function once(
  url: URL,
  ip: string,
  opts: { maxBytes?: number; accept?: string } = {},
): Promise<{
  status: number;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  ttfbMs: number;
  certDaysLeft: number | null;
}> {
  const secure = url.protocol === "https:";
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const request = (secure ? https : http).request(
      {
        // Подключаемся к проверенному адресу, а имя передаём отдельно — в SNI
        // и в Host. Иначе между проверкой и запросом DNS успевает смениться,
        // и вся защита обходится (DNS rebinding).
        host: ip,
        servername: secure ? url.hostname : undefined,
        port: url.port || (secure ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        agent: secure ? httpsAgent : httpAgent,
        timeout: TIMEOUT_MS,
        headers: {
          Host: url.host,
          // Представляемся честно: владелец сайта должен понимать по логам,
          // кто к нему пришёл, а не гадать.
          "User-Agent": "DevUzAudit/1.0 (+https://devuz.studio)",
          Accept: opts.accept ?? "text/html,application/xhtml+xml",
          "Accept-Encoding": "identity",
        },
      },
      (response) => {
        const ttfbMs = Date.now() - started;
        const socket = response.socket as TLSSocket;
        let certDaysLeft: number | null = null;
        if (secure && typeof socket.getPeerCertificate === "function") {
          const validTo = socket.getPeerCertificate()?.valid_to;
          if (validTo) {
            const left = (new Date(validTo).getTime() - Date.now()) / 86_400_000;
            if (Number.isFinite(left)) certDaysLeft = Math.floor(left);
          }
        }

        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;

        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > (opts.maxBytes ?? MAX_BYTES)) {
            truncated = true;
            response.destroy();
            return;
          }
          chunks.push(chunk);
        });
        const done = () =>
          resolve({
            status: response.statusCode ?? 0,
            headers: Object.fromEntries(
              Object.entries(response.headers).map(([k, v]) => [k, headerValue(v)]),
            ),
            body: Buffer.concat(chunks).toString("utf8"),
            truncated,
            ttfbMs,
            certDaysLeft,
          });
        response.on("end", done);
        response.on("close", done);
        response.on("error", reject);
      },
    );

    request.on("timeout", () => request.destroy(new Error("timeout")));
    request.on("error", reject);
    request.end();
  });
}

/** Идёт по адресу, перепроверяя каждый редирект. */
export async function probe(raw: string): Promise<PageProbe> {
  const started = Date.now();
  let url = normalizeUrl(raw);
  const redirects: Hop[] = [];

  // Сертификат запоминается с того витка, где его удалось прочитать. На
  // повторном соединении к тому же хосту TLS-сессия возобновляется, и
  // сертификат заново не присылается — `getPeerCertificate()` отдаёт пустоту.
  // Без этого у любого сайта с редиректом срок сертификата молча терялся бы.
  let certDaysLeft: number | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const ip = await resolveSafely(url);
    const result = await once(url, ip);
    if (result.certDaysLeft !== null) certDaysLeft = result.certDaysLeft;

    const location = result.headers.location;
    const isRedirect = result.status >= 300 && result.status < 400 && location;

    if (isRedirect && hop < MAX_REDIRECTS) {
      redirects.push({ url: url.href, status: result.status });
      // Адрес из Location может быть относительным, а может уводить во
      // внутреннюю сеть — поэтому следующий виток начинается с проверки.
      url = normalizeUrl(new URL(location, url).href);
      continue;
    }

    return {
      finalUrl: url.href,
      status: result.status,
      redirects,
      html: result.body,
      truncated: result.truncated,
      headers: result.headers,
      ttfbMs: result.ttfbMs,
      totalMs: Date.now() - started,
      https: url.protocol === "https:",
      certDaysLeft,
    };
  }

  throw new BlockedAddress("shape", "слишком много перенаправлений");
}

/* ── Дотягивание: стили, картинки, ссылки, значок ──────────────────────── */

// Не больше этого — страница уже прочитана, дальше только уточнение.
const MAX_CSS = 2;
const MAX_IMAGES = 6;
const MAX_LINKS = 6;
const CSS_MAX_BYTES = 200 * 1024;
// Для картинок и ссылок нужен только статус: тело обрываем сразу.
const PEEK_MAX_BYTES = 4 * 1024;
const CONTACTS_MAX_BYTES = 256 * 1024;
/**
 * robots.txt и карта сайта — по четверти мегабайта хватит с запасом.
 *
 * Читаем их, потому что владелец спросил про индексацию, а сказать о ней
 * что-то честное можно только по фактам. Сколько страниц у него в индексе
 * Google, мы отсюда не узнаем и врать не будем — зато причины, по которым
 * их мало, лежат ровно в этих двух файлах и в разметке страницы.
 */
const ROBOTS_MAX_BYTES = 64 * 1024;
const SITEMAP_MAX_BYTES = 256 * 1024;

/**
 * Сущности разметки в значении — обратно в символы. В адресе картинки
 * `&amp;` стоит по правилам, а в запрос должно уйти `&`: иначе сервер
 * отвечает 400, и современный сайт получает ложные «битые картинки».
 */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities((m[1] ?? m[2] ?? m[3] ?? "").trim()) : null;
}

/** Абсолютный адрес того же хоста — или null: чужие хосты не трогаем. */
function sameOrigin(raw: string, base: URL): URL | null {
  if (!raw || /^(data|javascript|mailto|tel|blob):/i.test(raw)) return null;
  try {
    const url = new URL(raw, base);
    if (url.host !== base.host || !/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function unique(urls: URL[], limit: number, skip?: string): URL[] {
  const seen = new Set<string>();
  const out: URL[] = [];
  for (const url of urls) {
    if (url.href === skip || seen.has(url.href)) continue;
    seen.add(url.href);
    out.push(url);
    if (out.length >= limit) break;
  }
  return out;
}

export function stylesheetUrls(html: string, base: URL): URL[] {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const urls: URL[] = [];
  for (const tag of tags) {
    if (!/\brel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = attr(tag, "href");
    const url = href ? sameOrigin(href, base) : null;
    if (url) urls.push(url);
  }
  return unique(urls, MAX_CSS);
}

export function imageUrls(html: string, base: URL): URL[] {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  const urls: URL[] = [];
  for (const tag of tags) {
    const src = attr(tag, "src");
    const url = src ? sameOrigin(src, base) : null;
    if (url) urls.push(url);
  }
  return unique(urls, MAX_IMAGES);
}

export function internalLinks(html: string, base: URL): URL[] {
  const tags = html.match(/<a\b[^>]*>/gi) ?? [];
  const urls: URL[] = [];
  for (const tag of tags) {
    const href = attr(tag, "href");
    if (!href || href.startsWith("#")) continue;
    const url = sameOrigin(href, base);
    // Файлы не проверяем: их отдают долго и весят они много.
    if (url && !/\.(pdf|zip|rar|docx?|xlsx?|pptx?|mp4|mp3|apk|exe)$/i.test(url.pathname)) urls.push(url);
  }
  return unique(urls, MAX_LINKS, base.href);
}

/**
 * Битый — это «файла нет» или «сервер сломался». 401 и 403 — не битый:
 * так сайты отвечают роботам и запросам без нужных заголовков, а
 * посетитель в браузере картинку видит. Жаловаться владельцу на то, чего
 * посетитель не видит, нельзя.
 */
export function broken(status: number | null | undefined): boolean {
  return typeof status === "number" && (status === 404 || status === 410 || status >= 500);
}

async function status(url: URL, ip: string): Promise<number | null> {
  try {
    return (await once(url, ip, { maxBytes: PEEK_MAX_BYTES, accept: "*/*" })).status;
  } catch {
    // Таймаут и обрыв — не 404. Считать их битыми значит жаловаться
    // владельцу на то, чего посетитель, возможно, не видит.
    return null;
  }
}

/**
 * Дотянуть к странице то, без чего о вёрстке и битых файлах судить нельзя.
 *
 * Стили — чтобы отличить сайт, свёрстанный таблицами, от современного;
 * первые картинки и ссылки — чтобы найти битые; значок — чтобы заметить
 * вкладку без него. Всё с того же хоста и в жёстких пределах: это
 * уточнение, а не обход сайта.
 *
 * Никогда не бросает: не удалось дотянуть — отчёт строится по странице,
 * как строился до этого.
 */
/** Адрес карты сайта, если robots.txt на неё показывает. */
function sitemapFromRobots(robots: string | null, base: URL): URL | null {
  if (!robots) return null;
  const line = robots.match(/^\s*sitemap\s*:\s*(\S+)/im);
  if (!line) return null;
  try {
    const url = new URL(line[1], base);
    // Чужой хост не проверяем: запрос по адресу из чужого файла — это уже
    // не разбор сайта, а поход туда, куда нас послали.
    return url.hostname === base.hostname ? url : null;
  } catch {
    return null;
  }
}

export async function enrich(probe: PageProbe): Promise<PageProbe> {
  // Страница ошибки — не сайт: её картинки, ссылки и значок ничего не
  // говорят о сайте, а находка «нет значка» на 503-й — ложь владельцу.
  if (probe.status >= 400) return probe;

  let base: URL;
  let ip: string;
  try {
    base = new URL(probe.finalUrl);
    ip = await resolveSafely(base);
  } catch {
    return probe;
  }

  const html = probe.html;
  const cssUrls = stylesheetUrls(html, base);
  const images = imageUrls(html, base);
  const links = internalLinks(html, base);

  // Страница контактов: там почта и второй номер, которых нет в шапке.
  // Одна ссылка своего же хоста — это уточнение, а не обход сайта.
  const contactsHref = contactsPagePath(html);
  const contactsTarget = contactsHref ? sameOrigin(contactsHref, base) : null;

  const [sheets, imageStatuses, linkStatuses, faviconStatus, contactsPage, robotsBody] = await Promise.all([
    Promise.all(
      cssUrls.map(async (url) => {
        try {
          const r = await once(url, ip, { maxBytes: CSS_MAX_BYTES, accept: "text/css,*/*" });
          return r.status < 400 ? { body: r.body, truncated: r.truncated } : null;
        } catch {
          return null;
        }
      }),
    ),
    Promise.all(images.map((url) => status(url, ip))),
    Promise.all(links.map((url) => status(url, ip))),
    /<link\b[^>]*\brel\s*=\s*["']?[^"'>]*icon/i.test(html)
      ? Promise.resolve(200)
      : status(new URL("/favicon.ico", base), ip),
    contactsTarget && contactsTarget.href !== base.href
      ? once(contactsTarget, ip, { maxBytes: CONTACTS_MAX_BYTES })
          .then((r) => (r.status < 400 ? r.body : null))
          .catch(() => null)
      : Promise.resolve(null),
    once(new URL("/robots.txt", base), ip, { maxBytes: ROBOTS_MAX_BYTES, accept: "text/plain,*/*" })
      .then((r) => (r.status < 400 ? r.body : null))
      .catch(() => null),
  ]);

  // Карта сайта: сначала там, куда показывает robots.txt, потом по обычному
  // адресу. Проверяем содержимое, а не только код ответа: хостинги любят
  // отдавать на несуществующий путь 200 и страницу «не найдено», и по коду
  // карта тогда «есть» у каждого второго.
  const sitemapUrl = sitemapFromRobots(robotsBody, base) ?? new URL("/sitemap.xml", base);
  const sitemap = await once(sitemapUrl, ip, { maxBytes: SITEMAP_MAX_BYTES, accept: "application/xml,text/xml,*/*" })
    .then((r) => (r.status < 400 && /<(?:urlset|sitemapindex)\b/i.test(r.body) ? true : false))
    .catch(() => null);

  const fetched = sheets.filter((s): s is { body: string; truncated: boolean } => s !== null);
  const assets: PageAssets = {
    css: fetched.map((s) => s.body).join("\n"),
    cssCount: fetched.length,
    cssTruncated: fetched.some((s) => s.truncated),
    favicon: faviconStatus === null ? null : !broken(faviconStatus),
    checkedImages: imageStatuses.filter((s) => s !== null).length,
    brokenImages: images.filter((_, i) => broken(imageStatuses[i])).map((u) => u.href),
    checkedLinks: linkStatuses.filter((s) => s !== null).length,
    brokenLinks: links.filter((_, i) => broken(linkStatuses[i])).map((u) => u.href),
    contactsHtml: contactsPage,
    contactsUrl: contactsPage ? (contactsTarget?.href ?? null) : null,
    robots: robotsBody,
    sitemap,
  };

  return { ...probe, assets };
}

/* ── Обход: несколько страниц вместо одной главной ─────────────────────── */

/**
 * Разбор нескольких страниц вместо одной.
 *
 * Отдельной функцией от `enrich`, а не внутри него, потому что цена разная.
 * `enrich` стоит секунду и нужен всем, включая публичную проверку, где
 * человек смотрит на крутящийся кружок. Обход стоит полминуты и нужен там,
 * где из разбора родится письмо, — а письмо готовится в фоне, и полминуты
 * там не стоят ничего.
 *
 * Зачем вообще: с одной главной честно звучит только «на главной не нашли
 * цен», и адресат пожимает плечами — цены у него на отдельной странице. С
 * шести страниц звучит «цен нет ни на одной, включая „Услуги" и „Прайс"»,
 * и возразить нечего. Разница между разбором и шаблоном — в том, что можно
 * утверждать.
 */
export type CrawlPage = { url: string; status: number; html: string };

export type CrawlResult = {
  pages: CrawlPage[];
  /** Сколько адресов в карте сайта; null — карты нет или не разобрали. */
  sitemapUrls: number | null;
  /** Самая свежая дата в карте сайта, YYYY-MM-DD. */
  sitemapFresh: string | null;
  /** Вес главной со всем, что она тянет. */
  homeBytes: number | null;
  imageBytes: number | null;
};

const CRAWL_PAGES = 5;
const CRAWL_MAX_BYTES = 512 * 1024;
const WEIGHED_IMAGES = 12;

const EMPTY_CRAWL: CrawlResult = {
  pages: [],
  sitemapUrls: null,
  sitemapFresh: null,
  homeBytes: null,
  imageBytes: null,
};

/**
 * Даты и адреса из карты сайта.
 *
 * Возраст сайта больше неоткуда взять: `lastmod` ставит сам движок, и он
 * показывает, когда на сайте последний раз что-то менялось. Для владельца
 * это самая неожиданная строка в разборе — он обычно думает, что «сайт же
 * есть», а по карте видно, что последняя правка была год назад.
 */
export function readSitemap(xml: string): { urls: number; fresh: string | null } {
  const urls = (xml.match(/<loc>/gi) ?? []).length;
  const dates = [...xml.matchAll(/<lastmod>\s*(\d{4}-\d{2}-\d{2})/gi)].map((m) => m[1]).sort();
  return { urls, fresh: dates.length ? dates[dates.length - 1] : null };
}

export async function crawl(probe: PageProbe, pick: (links: string[]) => string[]): Promise<CrawlResult> {
  if (probe.status >= 400) return EMPTY_CRAWL;

  let base: URL;
  let ip: string;
  try {
    base = new URL(probe.finalUrl);
    ip = await resolveSafely(base);
  } catch {
    return EMPTY_CRAWL;
  }

  const links = internalLinks(probe.html, base).map((u) => u.href);
  const wanted = pick(links).slice(0, CRAWL_PAGES);

  // Последовательно, а не пачкой. Это чужой сайт, и полдюжины одновременных
  // запросов с одного адреса выглядят со стороны ровно как то, чем не
  // являются. Полминуты у нас есть.
  const pages: CrawlPage[] = [];
  for (const href of wanted) {
    try {
      const url = new URL(href);
      const r = await once(url, ip, { maxBytes: CRAWL_MAX_BYTES });
      pages.push({ url: href, status: r.status, html: r.body });
    } catch {
      // Страница не отдалась — это не находка о сайте: мало ли что по дороге.
    }
  }

  const sitemap = await once(new URL("/sitemap.xml", base), ip, {
    maxBytes: CRAWL_MAX_BYTES,
    accept: "application/xml,text/xml,*/*",
  })
    .then((r) => (r.status < 400 && /<(?:urlset|sitemapindex)\b/i.test(r.body) ? readSitemap(r.body) : null))
    .catch(() => null);

  // Вес: считаем по Content-Length, а не по скачанному. Качать четыре
  // мегабайта картинок ради числа, которое сервер и так называет в
  // заголовке, — это перекладывать свой аудит на чужой канал.
  let imageBytes = 0;
  let weighed = 0;
  for (const url of imageUrls(probe.html, base).slice(0, WEIGHED_IMAGES)) {
    try {
      const r = await once(url, ip, { maxBytes: 1, accept: "image/*,*/*" });
      const size = Number(r.headers["content-length"]);
      if (Number.isFinite(size) && size > 0) {
        imageBytes += size;
        weighed += 1;
      }
    } catch {
      /* картинка не отдалась — в вес не идёт */
    }
  }

  const htmlBytes = Buffer.byteLength(probe.html, "utf8");
  const cssBytes = probe.assets?.css ? Buffer.byteLength(probe.assets.css, "utf8") : 0;

  return {
    pages,
    sitemapUrls: sitemap?.urls ?? null,
    sitemapFresh: sitemap?.fresh ?? null,
    homeBytes: htmlBytes + cssBytes + imageBytes,
    imageBytes: weighed ? imageBytes : null,
  };
}
