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
};

function headerValue(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

/** Один запрос по проверенному адресу, без следования редиректам. */
function once(url: URL, ip: string): Promise<{
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
          "User-Agent": "DevUzAudit/1.0 (+https://devuz.maximov-tech.ru)",
          Accept: "text/html,application/xhtml+xml",
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
          if (size > MAX_BYTES) {
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
