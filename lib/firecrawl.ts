import { appSecret } from "@/lib/secrets";

/**
 * Firecrawl — открыть сайт настоящим браузером или поискать в интернете с
 * сервера студии. Сейчас — только для поиска лидов автопрогона касаний
 * (lib/admin/lead-search-store.ts).
 *
 * Владелец, 06.10.2026: «1000 запросов по firecrawl бесплатно… Растяни на 30
 * дней равномерно». Поэтому каждый вызов идёт через дневной лимит
 * (`dailyAllowance`): остаток на счёте делится поровну на дни до конца
 * расчётного периода. Остаток спрашиваем у самого Firecrawl, а не считаем
 * сами: им же пользуются сессии разработки, и их расход сервер иначе не
 * увидел бы.
 *
 * Ключ — только на сервере: FIRECRAWL_API_KEY в .env или в хранилище
 * секретов (lib/secrets.ts). В коде и в репозитории его нет.
 */

const API = "https://api.firecrawl.dev/v2";
const DAY_MS = 24 * 3600_000;

export async function firecrawlKey(): Promise<string | null> {
  return appSecret("FIRECRAWL_API_KEY");
}

export type Balance = { remaining: number; periodEnd: number };

/**
 * Сколько кредитов можно потратить сегодня.
 *
 * Остаток на начало дня (то, что на счёте сейчас, плюс уже потраченное
 * сегодня) делится на число дней до конца периода, сегодняшний включая.
 * Не потратили вчера — сегодняшняя доля чуть больше; потратили сессии
 * разработки — чуть меньше. До конца периода остаток доходит ровно к нулю.
 */
export function dailyAllowance(input: { remaining: number; usedToday: number; periodEnd: number; dayStart: number }): number {
  const days = Math.max(1, Math.ceil((input.periodEnd - input.dayStart) / DAY_MS));
  const pool = Math.max(0, input.remaining) + Math.max(0, input.usedToday);
  return Math.max(0, Math.floor(pool / days));
}

const BALANCE_TTL_MS = 30 * 60_000;
/** Не ответил — не спрашиваем пять минут: остаток читает и страница «Касаний», ждать за ним нельзя. */
const BALANCE_MISS_TTL_MS = 5 * 60_000;
let balanceCache: { value: Balance; at: number } | null = null;
let balanceMissAt = Number.NEGATIVE_INFINITY;

/** Остаток на счёте и конец периода. Ответ помнится полчаса: запрос бесплатный, но не мгновенный. */
export async function firecrawlBalance(now = Date.now()): Promise<Balance | null> {
  if (balanceCache && now - balanceCache.at < BALANCE_TTL_MS) return balanceCache.value;
  if (now - balanceMissAt < BALANCE_MISS_TTL_MS) return balanceCache?.value ?? null;
  const key = await firecrawlKey();
  if (!key) return null;
  const miss = () => {
    balanceMissAt = now;
    return balanceCache?.value ?? null;
  };
  try {
    const response = await fetch(`${API}/team/credit-usage`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as {
      data?: { remainingCredits?: unknown; billingPeriodEnd?: unknown };
    };
    const remaining = Number(body.data?.remainingCredits);
    const periodEnd = Date.parse(String(body.data?.billingPeriodEnd ?? ""));
    if (!response.ok || !Number.isFinite(remaining) || !Number.isFinite(periodEnd)) return miss();
    const value = { remaining, periodEnd };
    balanceCache = { value, at: now };
    return value;
  } catch {
    return miss();
  }
}

/** Потратили — остаток в памяти уменьшаем сразу, не дожидаясь следующего запроса. */
export function spentCredits(credits: number): void {
  if (balanceCache) balanceCache.value = { ...balanceCache.value, remaining: balanceCache.value.remaining - credits };
}

export type Found = { url: string; title: string; description: string };

/** Поиск в интернете из Узбекистана. Ответ — ссылки с заголовками; кредитов — сколько списал Firecrawl. */
export async function firecrawlSearch(query: string, limit = 10): Promise<{ results: Found[]; credits: number } | null> {
  const key = await firecrawlKey();
  if (!key) return null;
  const response = await fetch(`${API}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, location: "Uzbekistan", country: "UZ", sources: ["web"] }),
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    creditsUsed?: unknown;
    data?: { web?: { url?: unknown; title?: unknown; description?: unknown }[] };
  };
  if (!response.ok || !body.success) throw new Error(`Firecrawl ${response.status}: ${body.error ?? "без описания"}`);
  const results = (body.data?.web ?? [])
    .filter((r) => typeof r.url === "string")
    .map((r) => ({ url: String(r.url), title: String(r.title ?? ""), description: String(r.description ?? "") }));
  const credits = Number(body.creditsUsed);
  return { results, credits: Number.isFinite(credits) ? credits : Math.max(1, Math.ceil(limit / 5)) };
}

/**
 * Страница, как её видит браузер, — разметка после того, как отработали
 * скрипты. Ради этого Firecrawl и нужен: у сайтов на конструкторах контакты
 * часто появляются только после загрузки, и наш обход их не видит.
 */
export async function firecrawlPage(url: string): Promise<{ html: string; credits: number } | null> {
  const key = await firecrawlKey();
  if (!key) return null;
  const response = await fetch(`${API}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["rawHtml"],
      onlyMainContent: false,
      // Свежая загрузка, а не сохранённая копия: контакты на сайте меняются.
      maxAge: 0,
      timeout: 45_000,
      location: { country: "UZ", languages: ["ru", "uz"] },
    }),
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    data?: { rawHtml?: unknown; metadata?: { creditsUsed?: unknown } };
  };
  if (!response.ok || !body.success) throw new Error(`Firecrawl ${response.status}: ${body.error ?? "без описания"}`);
  const credits = Number(body.data?.metadata?.creditsUsed);
  return { html: typeof body.data?.rawHtml === "string" ? body.data.rawHtml : "", credits: Number.isFinite(credits) ? credits : 1 };
}
