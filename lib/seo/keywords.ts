import { directDispatcher, roadFetch } from "@/lib/egress.mjs";
import { plannerIdeas } from "@/lib/seo/keyword-planner-store";
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

/**
 * Где смотреть запросы. По умолчанию — Узбекистан (статьи сайта). Статьи на
 * чужих площадках (lib/outside/) читают в России: там регион Вордстата 225
 * и Trends «RU» (владелец, 07.11.2026: «Делаем по твоей рекомендации» — на
 * «тема из Вордстата и Trends, регион — по рынку площадки»).
 */
export type KeywordRegion = {
  wordstat: number;
  trends: string;
  /** Страна в планировщике Google Ads (lib/seo/keyword-planner.ts): 2000 + цифровой код ISO. */
  geo?: number;
};
export const UZ_REGION: KeywordRegion = { wordstat: WORDSTAT_UZ, trends: TRENDS_GEO, geo: 2860 };

const TIMEOUT_MS = 12_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

export type SourceResult =
  /** `asked` — фраза шире исходной, по которой нашлись данные (лесенка broaderQueries). */
  | { ok: true; phrases: Array<{ phrase: string; value: number }>; asked?: string }
  | { ok: false; reason: string };

export type KeywordResearch = {
  query: string;
  trends: SourceResult;
  wordstat: SourceResult;
  /**
   * Планировщик ключевых слов Google Ads — поиски в Google по стране (с
   * 07.11.2026, владелец: «Подключаем, аккаунт гугл адс у меня есть»). Не
   * подключён — `ok: false` с причиной, статья идёт с двумя источниками.
   */
  planner?: SourceResult;
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
  geo: string = TRENDS_GEO,
  times: readonly string[] = [TRENDS_TIME],
): Promise<SourceResult> {
  let last: SourceResult = { ok: false, reason: "Trends недоступен" };
  // Период за периодом: редкий за год запрос за пять лет набирает данные.
  for (const time of times) {
    last = await trendsOver(query, wait, geo, time);
    if (last.ok || !trendsEmpty(last)) return last;
  }
  return last;
}

/** Период Trends по умолчанию и запасной — для редкого запроса. */
export const TRENDS_TIME = "today 12-m";
export const TRENDS_LONG = "today 5-y";

async function trendsOver(query: string, wait: (ms: number) => Promise<void>, geo: string, time: string): Promise<SourceResult> {
  let last: SourceResult = { ok: false, reason: "Trends недоступен" };
  // Два круга по дорогам. «Слишком часто» (429) — частый ответ Trends на
  // первый заход: 4 октября статья в 16:00 вышла без его данных именно так.
  // Пауза и второй круг — дешевле, чем статья без запросов Узбекистана.
  for (let round = 0; round < 2; round += 1) {
    if (round > 0) await wait(TRENDS_RETRY_MS);
    for (const road of trendsRoads()) {
      last = await trendsVia(query, road, geo, time);
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

async function trendsVia(query: string, road: Fetcher, geo: string = TRENDS_GEO, time: string = TRENDS_TIME): Promise<SourceResult> {
  try {
    const home = await timed(`https://trends.google.com/trends/?geo=${geo}&hl=ru`, { headers: { "user-agent": UA } }, road);
    const cookie = home.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    const headers = { "user-agent": UA, cookie, "accept-language": "ru-RU,ru;q=0.9" };

    const req = { comparisonItem: [{ keyword: query, geo, time }], category: 0, property: "" };
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
export function wordstatRequest(token: string, query: string, region: number = WORDSTAT_UZ): { url: string; init: RequestInit } {
  if (token.startsWith("AQVN")) {
    return {
      url: "https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests",
      init: {
        method: "POST",
        headers: { authorization: `Api-Key ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ phrase: query, numPhrases: "50", regions: [String(region)], devices: ["DEVICE_ALL"] }),
      },
    };
  }
  return {
    url: "https://api.wordstat.yandex.net/v1/topRequests",
    init: {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json;charset=utf-8" },
      body: JSON.stringify({ phrase: query, regions: [region], devices: ["all"] }),
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
export async function wordstatTop(query: string, region: number = WORDSTAT_UZ): Promise<SourceResult> {
  const token = await appSecret("WORDSTAT_TOKEN");
  if (!token) return { ok: false, reason: "нет ключа Вордстата (WORDSTAT_TOKEN)" };
  try {
    const { url, init } = wordstatRequest(token, query, region);
    const response = await timed(url, init);
    if (!response.ok) return { ok: false, reason: `Вордстат ответил ${response.status}` };
    const phrases = wordstatPhrases(await response.json());
    return phrases.length
      ? { ok: true, phrases }
      : { ok: false, reason: region === WORDSTAT_UZ ? "в Вордстате по Узбекистану запросов нет" : "в Вордстате по региону запросов нет" };
  } catch (error) {
    return { ok: false, reason: `Вордстат недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Сопутствующие запросы для модели в порядке источников: keywordResearch
 * ставит первым планировщик Google Ads, потом Вордстат (там цифры показов),
 * потом Trends; без повторов и без самого запроса.
 */
export function mergeRelated(query: string, ...sources: SourceResult[]): string[] {
  const seen = new Set([query.toLowerCase().trim(), ...sources.flatMap((s) => (s.ok && s.asked ? [s.asked.toLowerCase().trim()] : []))]);
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

/**
 * Лесенка запросов: исходный, без слов места, короче на слово.
 *
 * Владелец, 07.11.2026: «Для всех статей мы должны использовать гугл трендс
 * и Яндекс вордстат запросы». За 30 дней до этого из 94 версий статей
 * Вордстат дал данные 25 раз, Trends — 17, и почти все отказы были не
 * блокировкой, а «по Узбекистану запросов нет» (58) и «запрос редкий» (73):
 * точная фраза статьи в маленьком регионе почти никем не набирается. Фраза
 * шире — «продвижение стоматологии» вместо «продвижение стоматологии в
 * Ташкенте» — данные даёт, и сопутствующие запросы к ней — те же по смыслу.
 * Короче двух слов не режем: «сайт» — уже не тема статьи.
 */
const PLACE = /^(в|во|по|на|для|uchun|ташкент\p{L}*|узбекистан\p{L}*|toshkent\p{L}*|o[‘'’`ʻ]?zbekiston\p{L}*|москв\p{L}*|росси\p{L}*|казахстан\p{L}*|алмат\p{L}*)$/iu;

export function broaderQueries(query: string, max = 2): string[] {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const base = words.join(" ").toLowerCase();
  const out: string[] = [];
  const add = (w: readonly string[]) => {
    const q = w.join(" ");
    if (w.length >= 2 && q.toLowerCase() !== base && !out.includes(q)) out.push(q);
  };
  const bare = words.filter((w) => !PLACE.test(w));
  add(bare);
  let cur = bare.length >= 2 ? bare : words;
  while (cur.length > 2 && out.length < max) {
    cur = cur.slice(0, -1);
    add(cur);
  }
  return out.slice(0, max);
}

/** «Данных нет» — повод спросить шире; 403, 429, обрыв — нет: это сбой, лесенка его не лечит. */
export function wordstatEmpty(r: SourceResult): boolean {
  return !r.ok && /запросов нет/.test(r.reason);
}
export function trendsEmpty(r: SourceResult): boolean {
  return !r.ok && /редкий|нет данных/.test(r.reason);
}

/** Первая ступень лесенки, где источник дал данные; сбой — сразу назад. */
export async function firstWithData(
  ladder: readonly string[],
  ask: (query: string, step: number) => Promise<SourceResult>,
  empty: (r: SourceResult) => boolean,
): Promise<SourceResult> {
  let last: SourceResult = { ok: false, reason: "нечего спрашивать" };
  for (const [step, query] of ladder.entries()) {
    last = await ask(query, step);
    if (last.ok) return step === 0 ? last : { ...last, asked: query };
    if (!empty(last)) return last;
  }
  return last;
}

export async function keywordResearch(query: string, region: KeywordRegion = UZ_REGION): Promise<KeywordResearch> {
  const ladder = [query, ...broaderQueries(query)];
  const [wordstat, trends, planner] = await Promise.all([
    firstWithData(ladder, (q) => wordstatTop(q, region.wordstat), wordstatEmpty),
    // Исходную фразу Trends смотрит и за пять лет, шире — за год.
    firstWithData(ladder, (q, step) => googleTrendsRelated(q, undefined, region.trends, step === 0 ? [TRENDS_TIME, TRENDS_LONG] : [TRENDS_TIME]), trendsEmpty),
    // Планировщик идеи даёт и по редкой фразе — лесенка ему не нужна.
    region.geo ? plannerIdeas(query, region.geo) : Promise.resolve<SourceResult>({ ok: false, reason: "у региона нет страны для планировщика" }),
  ]);
  // Планировщик первым: у него поиски в Google — там в Узбекистане и ищут.
  return { query, trends, wordstat, planner, related: mergeRelated(query, planner, wordstat, trends) };
}
