import { GOOGLE_ADS_API, googleError, googleHeaders, type GoogleCreds } from "@/lib/ads/connectors/google";
import type { SourceResult } from "@/lib/seo/keywords";

/**
 * Планировщик ключевых слов Google Ads — сколько раз в месяц ищут фразу в
 * Google по стране.
 *
 * Владелец, 07.11.2026, на «настоящая вундервафля по запросам — планировщик
 * Google Ads, нужен доступ к вашему кабинету»: «Подключаем, аккаунт гугл
 * адс у меня есть». Trends и Вордстат по Узбекистану чаще молчат, а в
 * Узбекистане ищут в основном в Google: планировщик отдаёт объёмы самого
 * Google, законно, через официальный API.
 *
 * Вход — тот же, что у автопилота рекламы (раздел «Реклама»): кабинет Google,
 * подключённый кнопкой «Подключить», его refresh token и номер. Какой
 * кабинет — выбирают в «Рекламе» (`PLANNER_ACCOUNT_KEY`). Планировщик в API
 * открыт с уровня доступа Basic: на Explorer Google отвечает отказом, и
 * это пишется словами (`plannerReason`).
 *
 * Здесь — запрос и разбор ответа, без базы; вход и выбор кабинета —
 * keyword-planner-store.ts.
 */

/** Страны в Google Ads — 2000 + цифровой код ISO. */
export const GEO = { UZ: 2860, RU: 2643, KZ: 2398 } as const;
/** Язык русский в Google Ads. Узбекский не ставим: без языка — все языки. */
export const LANGUAGE_RU = 1031;

export type PlannerIdea = { phrase: string; value: number; competition: string | null };

export function ideasRequest(seed: string, geo: number): Record<string, unknown> {
  return {
    ...(/[Ѐ-ӿ]/.test(seed) ? { language: `languageConstants/${LANGUAGE_RU}` } : {}),
    geoTargetConstants: [`geoTargetConstants/${geo}`],
    keywordPlanNetwork: "GOOGLE_SEARCH",
    keywordSeed: { keywords: [seed] },
    pageSize: 50,
  };
}

/** Фразы из ответа: по убыванию числа поисков, без пустых и нулевых. */
export function parseIdeas(body: unknown): PlannerIdea[] {
  const results = (body as { results?: unknown[] } | null)?.results ?? [];
  return results
    .map((r) => {
      const row = r as { text?: unknown; keywordIdeaMetrics?: { avgMonthlySearches?: unknown; competition?: unknown } };
      return {
        phrase: String(row.text ?? "").trim(),
        value: Number(row.keywordIdeaMetrics?.avgMonthlySearches ?? 0) || 0,
        competition: typeof row.keywordIdeaMetrics?.competition === "string" ? row.keywordIdeaMetrics.competition : null,
      };
    })
    .filter((i) => i.phrase && i.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Ошибка Google — словами, что делать. Самые частые: проект Google Cloud
 * ещё на уровне Test или Explorer (планировщику нужен Basic), вход отозван,
 * номер кабинета не тот.
 */
export function plannerReason(message: string): string {
  if (/CLOUD_PROJECT_NOT_APPROVED|DEVELOPER_TOKEN_NOT_APPROVED|NOT_APPROVED|ACTION_NOT_PERMITTED|access level|Basic/i.test(message)) {
    return "планировщику нужен уровень доступа Basic у проекта Google Cloud: подайте заявку в Google Ads API → Overview";
  }
  if (/invalid_grant|UNAUTHENTICATED|expired|revoked/i.test(message)) {
    return "Google не принял вход: подключите кабинет заново кнопкой «Подключить» в «Рекламе»";
  }
  if (/PERMISSION_DENIED|USER_PERMISSION_DENIED|CUSTOMER_NOT_FOUND|NOT_ADS_USER/i.test(message)) {
    return "у этого входа нет доступа к кабинету с таким номером";
  }
  return `Google Ads: ${message.slice(0, 160)}`;
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Идеи по фразе для страны. Сбой — `ok: false` с причиной словами, без исключений. */
export async function keywordIdeas(
  creds: GoogleCreds,
  seed: string,
  geo: number,
  fetchImpl: Fetch = (url, init) => fetch(url, init),
): Promise<SourceResult> {
  const cid = creds.customerId.replace(/-/g, "");
  if (!/^\d{10}$/.test(cid)) return { ok: false, reason: "номер кабинета Google Ads — 10 цифр" };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetchImpl(`${GOOGLE_ADS_API}/customers/${cid}:generateKeywordIdeas`, {
        method: "POST",
        headers: await googleHeaders(creds),
        body: JSON.stringify(ideasRequest(seed, geo)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const body = await res.json().catch(() => null);
    const error = googleError(body);
    if (error) return { ok: false, reason: plannerReason(error.message) };
    if (!res.ok) return { ok: false, reason: plannerReason(`ответ ${res.status}`) };
    const ideas = parseIdeas(body);
    return ideas.length
      ? { ok: true, phrases: ideas.map(({ phrase, value }) => ({ phrase, value })) }
      : { ok: false, reason: "в планировщике по этой стране поисков нет" };
  } catch (error) {
    return { ok: false, reason: plannerReason(error instanceof Error ? error.message : String(error)) };
  }
}
