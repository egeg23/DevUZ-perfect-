import { directDispatcher, roadFetch } from "@/lib/egress.mjs";
import { appSecret } from "@/lib/secrets";

/**
 * Что ищут в Узбекистане: Google Trends и Яндекс Вордстат.
 *
 * Правило владельца, 04.10.2026: «При составлении статей и их выкатке
 * всегда используй Google Trends для понимания запроса и Яндекс Вордстат».
 * Перед каждой статьёй смена спрашивает оба источника, с чем ищут её
 * запрос, и отдаёт модели сопутствующие запросы — их ставят в текст, если
 * они по теме. Что ответили источники, пишется в строку статьи (`research`),
 * чтобы было видно: статья писалась под живые запросы, а не наугад.
 *
 * Google Trends открыт без ключа, но отвечает только с куками первого
 * захода — поэтому сначала главная, потом запрос. Вордстат отдаёт цифры только
 * по ключу (WORDSTAT_TOKEN в .env или в хранилище секретов); нет ключа —
 * источник пропускается, а в `research` так и написано.
 *
 * Ни один сбой здесь не останавливает статью: источники — подсказка, а не
 * условие. Каждый запрос — с таймаутом, чтобы свип не висел на чужом сервере.
 */

/** Регион Узбекистан в Вордстате (дерево регионов Яндекса). */
export const WORDSTAT_UZ = 171;
export const TRENDS_GEO = "UZ";

const TIMEOUT_MS = 12_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

export type SourceResult =
  | { ok: true; phrases: Array<{ phrase: string; value: number }> }
  | { ok: false; reason: string };

export type KeywordResearch = {
  query: string;
  trends: SourceResult;
  wordstat: SourceResult;
  /** Сопутствующие запросы для модели: оба источника, без повторов. */
  related: string[];
};

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

async function timed(url: string, init: RequestInit = {}, fetcher: Fetcher = roadFetch): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetcher(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Дороги к Google Trends: сначала напрямую, потом через прокси.
 *
 * 4 октября первая статья спросила Trends с сервера — и получила 429: прокси
 * сервера — общий адрес дата-центра, а такие Google режет первыми. Google
 * из России открыт, и прямой адрес сервера он пускает. Прокси — запасная
 * дорога: и при обрыве, и при 429 на прямой.
 */
function trendsRoads(): Fetcher[] {
  const direct = directDispatcher();
  const viaDirect: Fetcher = (url, init) => fetch(url, { ...init, dispatcher: direct } as RequestInit);
  return direct ? [viaDirect, roadFetch] : [roadFetch];
}

/** Ответы Trends начинаются с защитной строки `)]}'` — до первой скобки. */
export function trendsJson(text: string): unknown {
  const start = text.search(/[[{]/);
  return JSON.parse(start >= 0 ? text.slice(start) : text);
}

type TrendsWidget = { id: string; token: string; request: unknown };
type RankedList = { rankedKeyword?: Array<{ query: string; value: number }> };

/** Популярные запросы вместе с этим — по Узбекистану за 12 месяцев. */
export async function googleTrendsRelated(
  query: string,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((done) => setTimeout(done, ms)),
): Promise<SourceResult> {
  let last: SourceResult = { ok: false, reason: "Trends недоступен" };
  // Два круга по дорогам. «Слишком часто» (429) — частый ответ Trends на
  // первый заход: 4 октября статья в 16:00 вышла без его данных именно так.
  // Пауза и второй круг — дешевле, чем статья без запросов Узбекистана.
  for (let round = 0; round < 2; round += 1) {
    if (round > 0) await wait(TRENDS_RETRY_MS);
    for (const road of trendsRoads()) {
      last = await trendsVia(query, road);
      // Ответ по существу (данные или «запрос редкий») — дальше не идём;
      // отказ Google или обрыв — пробуем следующую дорогу.
      if (last.ok || !/Trends ответил|Trends недоступен/.test(last.reason)) return last;
    }
    if (!/429/.test(last.reason)) return last;
  }
  return last;
}

/** Пауза перед вторым кругом, когда Trends ответил «слишком часто». */
export const TRENDS_RETRY_MS = 8_000;

async function trendsVia(query: string, road: Fetcher): Promise<SourceResult> {
  try {
    const home = await timed(`https://trends.google.com/trends/?geo=${TRENDS_GEO}&hl=ru`, { headers: { "user-agent": UA } }, road);
    const cookie = home.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    const headers = { "user-agent": UA, cookie, "accept-language": "ru-RU,ru;q=0.9" };

    const req = { comparisonItem: [{ keyword: query, geo: TRENDS_GEO, time: "today 12-m" }], category: 0, property: "" };
    const explore = await timed(
      `https://trends.google.com/trends/api/explore?hl=ru&tz=-300&req=${encodeURIComponent(JSON.stringify(req))}`,
      { headers },
      road,
    );
    if (!explore.ok) return { ok: false, reason: `Trends ответил ${explore.status}` };
    const widgets = (trendsJson(await explore.text()) as { widgets?: TrendsWidget[] }).widgets ?? [];
    const widget = widgets.find((w) => w.id === "RELATED_QUERIES");
    if (!widget) return { ok: false, reason: "у запроса нет данных в Trends" };

    const related = await timed(
      `https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=ru&tz=-300&req=${encodeURIComponent(
        JSON.stringify(widget.request),
      )}&token=${encodeURIComponent(widget.token)}`,
      { headers },
      road,
    );
    if (!related.ok) return { ok: false, reason: `Trends ответил ${related.status}` };
    const lists = ((trendsJson(await related.text()) as { default?: { rankedList?: RankedList[] } }).default?.rankedList ?? []);
    const phrases = (lists[0]?.rankedKeyword ?? []).map((k) => ({ phrase: k.query, value: k.value }));
    return phrases.length ? { ok: true, phrases } : { ok: false, reason: "запрос редкий — Trends данных не даёт" };
  } catch (error) {
    return { ok: false, reason: `Trends недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Куда и с чем идти в Вордстат — по виду ключа.
 *
 * 04.10 владелец дал ключ Яндекс Облака (`AQVN…`): Вордстат теперь живёт в
 * Search API облака, и ключ принимает только он — заголовок `Api-Key`, регион
 * и устройства строками, число фраз обязательно. Старый api.wordstat.yandex.net
 * берёт OAuth-токен (`y0_…`) — оставлен на случай такого токена.
 */
export function wordstatRequest(token: string, query: string): { url: string; init: RequestInit } {
  if (token.startsWith("AQVN")) {
    return {
      url: "https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests",
      init: {
        method: "POST",
        headers: { authorization: `Api-Key ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ phrase: query, numPhrases: "50", regions: [String(WORDSTAT_UZ)], devices: ["DEVICE_ALL"] }),
      },
    };
  }
  return {
    url: "https://api.wordstat.yandex.net/v1/topRequests",
    init: {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json;charset=utf-8" },
      body: JSON.stringify({ phrase: query, regions: [WORDSTAT_UZ], devices: ["all"] }),
    },
  };
}

/** Фразы из ответа: облако — `results`, числа строкой; старый API — `topRequests`. */
export function wordstatPhrases(data: unknown): Array<{ phrase: string; value: number }> {
  const d = (data ?? {}) as {
    results?: Array<{ phrase: string; count: string | number }>;
    topRequests?: Array<{ phrase: string; count: string | number }>;
  };
  return (d.results ?? d.topRequests ?? [])
    .map((r) => ({ phrase: String(r.phrase ?? "").trim(), value: Number(r.count) || 0 }))
    .filter((r) => r.phrase);
}

/** Запросы с этим словом за 30 дней — Вордстат, регион Узбекистан. */
export async function wordstatTop(query: string): Promise<SourceResult> {
  const token = await appSecret("WORDSTAT_TOKEN");
  if (!token) return { ok: false, reason: "нет ключа Вордстата (WORDSTAT_TOKEN)" };
  try {
    const { url, init } = wordstatRequest(token, query);
    const response = await timed(url, init);
    if (!response.ok) return { ok: false, reason: `Вордстат ответил ${response.status}` };
    const phrases = wordstatPhrases(await response.json());
    return phrases.length ? { ok: true, phrases } : { ok: false, reason: "в Вордстате по Узбекистану запросов нет" };
  } catch (error) {
    return { ok: false, reason: `Вордстат недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Сопутствующие запросы для модели: сначала Вордстат (там цифры показов),
 * потом Trends; без повторов и без самого запроса.
 */
export function mergeRelated(query: string, ...sources: SourceResult[]): string[] {
  const seen = new Set([query.toLowerCase().trim()]);
  const out: string[] = [];
  for (const source of sources) {
    if (!source.ok) continue;
    for (const { phrase } of source.phrases) {
      const key = phrase.toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(phrase.trim());
      if (out.length >= 12) return out;
    }
  }
  return out;
}

export async function keywordResearch(query: string): Promise<KeywordResearch> {
  const [wordstat, trends] = await Promise.all([wordstatTop(query), googleTrendsRelated(query)]);
  return { query, trends, wordstat, related: mergeRelated(query, wordstat, trends) };
}
