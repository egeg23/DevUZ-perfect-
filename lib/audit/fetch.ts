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

  const [sheets, imageStatuses, linkStatuses, faviconStatus, contactsPage] = await Promise.all([
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
  ]);

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
  };

  return { ...probe, assets };
}
