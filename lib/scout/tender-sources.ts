import { roadFetch } from "@/lib/egress.mjs";
import { tenderVerdict } from "@/lib/scout/tender-match";

/**
 * Тендеры: чтение площадок.
 *
 * Только открытые списки лотов — то, что площадка сама показывает любому
 * посетителю без входа: без логина, без капчи, без обхода защиты. Адреса
 * API фиксированные, поэтому roadFetch, а не lib/audit/fetch.ts (тот — для
 * чужих адресов со страниц и из заявок).
 *
 * Каждая площадка — свой разбор в общий вид `TenderLot`. Не ответила или
 * сменила формат — пустой список и причина словами; остальные площадки
 * читаются как обычно.
 */

export type TenderSource = "xarid" | "etender" | "hayot" | "tenderasia";

export type TenderLot = {
  source: TenderSource;
  externalId: string;
  url: string;
  title: string;
  customer: string | null;
  region: string | null;
  kind: string | null;
  price: number | null;
  currency: string | null;
  publishedAt: string | null;
  deadline: string | null;
  topics: string[];
};

export type SourceResult = { source: TenderSource; lots: TenderLot[]; seen: number; error: string | null };

export const SOURCE_LABEL: Record<TenderSource, string> = {
  xarid: "xarid.uzex.uz",
  etender: "etender.uzex.uz",
  hayot: "Hayot Birja",
  tenderasia: "Tender.asia",
};

/** Браузерная строка: у UZEX часть адресов отвечает 403 на «голый» User-Agent. */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const TIMEOUT_MS = 25_000;

async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await roadFetch(url, {
    ...init,
    headers: { "user-agent": UA, accept: "application/json", "language": "ru", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`ответ ${response.status}`);
  return response.json();
}

/** Время площадки без зоны — это Ташкент (UTC+5). */
export function tashkentIso(value: unknown): string | null {
  if (typeof value !== "string" || !value || value === "None") return null;
  // Только дата («2026-11-12») — приём до конца дня.
  const raw = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:00` : value;
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(`${raw.replace(" ", "T")}+05:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function text(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const clean = raw.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}

/** «Сум», «Сом», «so‘m», «Узбекский сум» — UZS. */
export function currencyOf(raw: unknown): string | null {
  const value = text(raw, 40);
  if (!value) return null;
  if (/сум|сом|so[‘'ʻ`]?m|uzs/i.test(value)) return "UZS";
  return value.length <= 10 ? value : null;
}

function num(raw: unknown): number | null {
  const value = typeof raw === "string" ? Number(raw.replace(/\s/g, "")) : typeof raw === "number" ? raw : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

/* ── etender.uzex.uz ────────────────────────────────────────────────────────
 * POST https://apietender.uzex.uz/api/common/TradeList — все активные лоты
 * (отбор и тендер), страницы по 200 (From/To, с единицы), сортировки нет.
 * Категории ПО и IT-услуг фильтруются на стороне площадки — их лоты наши
 * сразу; остальное проверяется по названию (tenderVerdict).
 */
const ETENDER_API = "https://apietender.uzex.uz/api/common/TradeList";
/** 126287 — «ПО и разработка ПО; IT-консалтинг», 126334 — «IT-услуги». */
export const ETENDER_IT_CATEGORIES = [126287, 126334] as const;
const ETENDER_PAGE = 200;
const ETENDER_MAX_PAGES = 6;
const ETENDER_KIND: Record<number, string> = { 1: "Отбор", 2: "Тендер" };

export function parseEtender(rows: unknown, itCategory = false): { lots: TenderLot[]; total: number } {
  if (!Array.isArray(rows)) return { lots: [], total: 0 };
  let total = 0;
  const lots: TenderLot[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    total = Math.max(total, Number(row.total_count) || 0);
    const id = row.id;
    const title = text(row.name, 1000);
    if ((typeof id !== "number" && typeof id !== "string") || !title) continue;
    const verdict = tenderVerdict(title, "", itCategory);
    if (!verdict.ours) continue;
    lots.push({
      source: "etender",
      externalId: String(id),
      url: `https://etender.uzex.uz/lot/${encodeURIComponent(String(id))}`,
      title,
      customer: text(row.seller_name, 400),
      region: text([row.region_name, row.district_name].filter(Boolean).join(", "), 200),
      kind: ETENDER_KIND[Number(row.type_id)] ?? null,
      price: num(row.cost),
      currency: text(row.currency_codeabc, 10),
      publishedAt: tashkentIso(row.start_date),
      deadline: tashkentIso(row.end_date),
      topics: verdict.topics,
    });
  }
  return { lots, total };
}

async function etenderPage(from: number, extra: Record<string, unknown> = {}): Promise<unknown> {
  return getJson(ETENDER_API, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ From: from, To: from + ETENDER_PAGE - 1, System_Id: 0, ...extra }),
  });
}

export async function readEtender(): Promise<SourceResult> {
  const found = new Map<string, TenderLot>();
  let seen = 0;
  try {
    // IT-категории — наши целиком.
    for (const category of ETENDER_IT_CATEGORIES) {
      const { lots } = parseEtender(await etenderPage(1, { CategoryId: category }), true);
      for (const lot of lots) found.set(lot.externalId, lot);
    }
    // Всё остальное — по названию: лот с общей категорией («услуги») бывает нашим.
    for (let page = 0; page < ETENDER_MAX_PAGES; page++) {
      const { lots, total } = parseEtender(await etenderPage(1 + page * ETENDER_PAGE));
      seen = Math.max(seen, total);
      for (const lot of lots) if (!found.has(lot.externalId)) found.set(lot.externalId, lot);
      if ((page + 1) * ETENDER_PAGE >= total) break;
    }
    return { source: "etender", lots: [...found.values()], seen, error: null };
  } catch (error) {
    return { source: "etender", lots: [...found.values()], seen, error: `etender: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/* ── Hayot Birja / XT-Xarid ────────────────────────────────────────────────
 * POST https://api.xt-xarid.uz/rpc, JSON-RPC «ref»: открытые списки тендеров,
 * отборов, запросов предложений; новые сверху. У площадки предел частоты
 * (429 после 3-4 запросов подряд) — между списками пауза `HAYOT_GAP_MS`.
 *
 * Выключено (`HAYOT_ON = false`): в robots.txt площадки закрыт обход /rpc/,
 * включаем по слову владельца (или после их разрешения).
 */
export const HAYOT_ON = false;
const HAYOT_API = "https://api.xt-xarid.uz/rpc";
const HAYOT_LISTS = ["ref_tender_public", "ref_selection_public", "ref_request_proposals_public"] as const;
const HAYOT_GAP_MS = 12_000;
const HAYOT_LIMIT = 100;
/** Классификатор: 62 — ПО и IT-консалтинг, 63 — IT-услуги, 58.29 — издание ПО. */
const HAYOT_IT_CODE = /^(?:62|63|58\.29)\./;
const HAYOT_KIND: Record<string, string> = { tender: "Тендер", selection: "Отбор", request_proposals: "Запрос предложений" };

export function parseHayot(rows: unknown): TenderLot[] {
  if (!Array.isArray(rows)) return [];
  const lots: TenderLot[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const goods = Array.isArray(meta.good_maps) ? (meta.good_maps as Record<string, unknown>[]) : [];
    const title = text(row.name, 1000);
    const id = row.id;
    if ((typeof id !== "number" && typeof id !== "string") || !title) continue;
    // Название бывает казённым («ПГЗ из Агенства №…») — смотрим и позиции.
    const goodsText = goods.map((good) => String(good.name ?? "")).join("; ");
    const itCode = goods.some((good) => HAYOT_IT_CODE.test(String(good.id ?? "")));
    const verdict = tenderVerdict(title, goodsText, itCode);
    if (!verdict.ours) continue;
    const area = Array.isArray(meta.area_path) ? (meta.area_path as unknown[]).map((part) => (typeof part === "string" ? part : String((part as { name?: unknown })?.name ?? ""))).filter(Boolean) : [];
    lots.push({
      source: "hayot",
      externalId: String(id),
      url: `https://xt-xarid.uz/procedure/${encodeURIComponent(String(id))}/core`,
      title: /^ПГЗ из Агенства/i.test(title) && goods[0]?.name ? text(`${title}: ${goods[0].name}`, 1000)! : title,
      customer: text(row.company_name, 400),
      region: text(area.join(", "), 200),
      kind: HAYOT_KIND[String(row.type)] ?? null,
      price: num(row.totalcost) ?? num(row.start_price),
      currency: text(row.currency, 10),
      publishedAt: tashkentIso(row.publicated_at) ?? tashkentIso(row.created_at),
      deadline: tashkentIso(row.close_at),
      topics: verdict.topics,
    });
  }
  return lots;
}

export async function readHayot(sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))): Promise<SourceResult> {
  const lots: TenderLot[] = [];
  let seen = 0;
  const errors: string[] = [];
  for (const [index, ref] of HAYOT_LISTS.entries()) {
    if (index) await sleep(HAYOT_GAP_MS);
    try {
      const answer = (await getJson(HAYOT_API, {
        method: "POST",
        headers: { "content-type": "application/json;charset=utf-8", origin: "https://hayotbirja.uz" },
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "ref", params: { ref, op: "read", limit: HAYOT_LIMIT, offset: 0, filters: { status: ["open"] } } }),
      })) as { result?: unknown; error?: { message?: unknown } };
      if (answer.error) throw new Error(String(answer.error.message ?? "ошибка").slice(0, 80));
      const rows = Array.isArray(answer.result) ? answer.result : [];
      seen += rows.length;
      lots.push(...parseHayot(rows));
    } catch (error) {
      errors.push(`${ref}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { source: "hayot", lots, seen, error: errors.length ? `hayot: ${errors.join("; ")}` : null };
}

/* ── xarid.uzex.uz ─────────────────────────────────────────────────────────
 * Два открытых списка (тендеры и «отбор» переехали на etender):
 * — конкурсы: POST xarid-api-purchase …/Common/GetCompetitions, новые сверху,
 *   все статусы; фильтр сервер не слушает — IT отбираем по `category_name`,
 *   название и заказчика берём из GetCompetition/<id> (по вызову на лот);
 * — обратные аукционы: POST xarid-api-auction …/Common/GetMinimizedLotsList,
 *   только активные, `category_id` работает, страница — 20 (больше — ошибка
 *   базы), детали — GetLot/<id>.
 * Без полной браузерной строки User-Agent площадка отвечает пустым списком.
 */
const XARID_PURCHASE = "https://xarid-api-purchase.uzex.uz/Common";
const XARID_AUCTION = "https://xarid-api-auction.uzex.uz/Common";
const XARID_HEADERS = { "content-type": "application/json", origin: "https://xarid.uzex.uz", referer: "https://xarid.uzex.uz/" };
const XARID_IT_CATEGORY = /программн|информационных технологий|axborot texnologiya|dasturiy/i;
const XARID_DETAILS_MAX = 12;

type XaridRow = Record<string, unknown>;

/** Конкурс из строки списка и его карточки. */
export function xaridCompetition(row: XaridRow, detail: XaridRow | null, now: Date): TenderLot | null {
  const deadline = tashkentIso(row.end_date_submitting_offers ?? detail?.end_date_submitting_offers);
  if (!deadline || new Date(deadline).getTime() < now.getTime()) return null;
  const items = Array.isArray(detail?.js_details) ? (detail!.js_details as XaridRow[]) : [];
  const itemsText = items.map((item) => String(item.product_name ?? "")).join("; ");
  const title = text(detail?.competition_description, 1000) ?? text(itemsText, 1000) ?? text(row.category_name, 1000);
  if (!title) return null;
  const verdict = tenderVerdict(title, `${itemsText} ${detail?.category_name ?? row.category_name ?? ""}`, XARID_IT_CATEGORY.test(String(row.category_name ?? "")));
  if (!verdict.ours) return null;
  return {
    source: "xarid",
    externalId: `c${row.id}`,
    url: `https://xarid.uzex.uz/purchase/competition/detail/${encodeURIComponent(String(row.id))}`,
    title,
    customer: text(detail?.customer_name, 400),
    region: text([row.customer_region_name, row.customer_district_name].filter(Boolean).join(", "), 200),
    kind: "Конкурс",
    price: num(row.cost ?? detail?.cost),
    currency: currencyOf(row.currency_name ?? detail?.currency_name),
    publishedAt: tashkentIso(detail?.published_date),
    deadline,
    topics: verdict.topics,
  };
}

/** Аукцион из строки списка и его карточки. */
export function xaridAuction(row: XaridRow, detail: XaridRow | null): TenderLot | null {
  const items = Array.isArray(detail?.js_details) ? (detail!.js_details as XaridRow[]) : [];
  const itemsText = items.map((item) => `${item.product_name ?? ""} ${item.description ?? ""}`).join("; ");
  const name = text(items[0]?.product_name, 300);
  const about = text(items[0]?.description, 700);
  const title = name ? (about && about.toLowerCase() !== name.toLowerCase() ? `${name}: ${about}` : name) : text(row.category_name, 1000);
  if (!title) return null;
  const verdict = tenderVerdict(title, itemsText, true);
  if (!verdict.ours) return null;
  return {
    source: "xarid",
    externalId: `a${row.id}`,
    url: `https://xarid.uzex.uz/auction/detail/${encodeURIComponent(String(row.id))}`,
    title,
    customer: text(detail?.customer_name, 400),
    region: text([row.region_name, row.district_name].filter(Boolean).join(", "), 200),
    kind: "Аукцион",
    price: num(row.start_cost),
    currency: currencyOf(row.currency_name),
    publishedAt: tashkentIso(detail?.start_date),
    deadline: tashkentIso(row.end_date),
    topics: verdict.topics,
  };
}

export async function readXarid(now = new Date()): Promise<SourceResult> {
  const lots: TenderLot[] = [];
  const errors: string[] = [];
  let seen = 0;
  const post = (url: string, body: unknown) => getJson(url, { method: "POST", headers: XARID_HEADERS, body: JSON.stringify(body) });
  const get = (url: string) => getJson(url, { headers: XARID_HEADERS }).then((data) => (data && typeof data === "object" ? (data as XaridRow) : null)).catch(() => null);
  try {
    const rows = (await post(`${XARID_PURCHASE}/GetCompetitions`, { from: 1, to: 60 })) as XaridRow[];
    const open = (Array.isArray(rows) ? rows : []).filter((row) => {
      const end = tashkentIso(row.end_date_submitting_offers);
      return end && new Date(end).getTime() >= now.getTime();
    });
    seen += open.length;
    // Карточка — только IT-категориям и тем, где по категории не понять (не больше XARID_DETAILS_MAX).
    for (const row of open.filter((item) => XARID_IT_CATEGORY.test(String(item.category_name ?? ""))).slice(0, XARID_DETAILS_MAX)) {
      const lot = xaridCompetition(row, await get(`${XARID_PURCHASE}/GetCompetition/${encodeURIComponent(String(row.id))}`), now);
      if (lot) lots.push(lot);
    }
  } catch (error) {
    errors.push(`конкурсы: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const category of ETENDER_IT_CATEGORIES) {
    try {
      const rows = (await post(`${XARID_AUCTION}/GetMinimizedLotsList`, { from: 1, to: 20, category_id: category })) as XaridRow[];
      const list = Array.isArray(rows) ? rows : [];
      seen += list.length;
      for (const row of list.slice(0, XARID_DETAILS_MAX)) {
        const lot = xaridAuction(row, await get(`${XARID_AUCTION}/GetLot/${encodeURIComponent(String(row.id))}`));
        if (lot) lots.push(lot);
      }
    } catch (error) {
      // «Нет данных» площадка отдаёт ошибкой 500 — это пустая категория, не сбой.
      const message = error instanceof Error ? error.message : String(error);
      if (!/500/.test(message)) errors.push(`аукционы ${category}: ${message}`);
    }
  }
  return { source: "xarid", lots, seen, error: errors.length ? `xarid: ${errors.join("; ")}` : null };
}

/** Все включённые площадки одним проходом. Tender.asia не читаем: её соглашение запрещает парсинг. */
export async function readAllSources(now = new Date()): Promise<SourceResult[]> {
  const jobs: Promise<SourceResult>[] = [readEtender(), readXarid(now)];
  if (HAYOT_ON) jobs.push(readHayot());
  return Promise.all(jobs);
}
