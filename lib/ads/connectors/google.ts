import type { Ad, AdCopy, AdsConnector, Campaign, Keyword, Period, SearchTerm } from "@/lib/ads/types";

/**
 * Google Ads API, REST.
 *
 * - Чтение — GAQL через `googleAds:searchStream`; запись — `…:mutate` по ресурсам.
 * - Заголовки: OAuth-токен, `developer-token` (с 09.2026 необязателен: уровень
 *   доступа — у проекта Google Cloud, см. docs/ads-autopilot/api-access.md) и
 *   `login-customer-id`, если кабинет клиента открыт через MCC агентства.
 * - Тестовый developer token работает только с тестовыми аккаунтами — на них
 *   и идёт разработка.
 * - Деньги — в микро-единицах; бюджет кратен 10 000 микро.
 *
 * Только поисковые кампании. Performance Max и умные кампании Google ведёт
 * сам — их автопилот не трогает. Общие бюджеты (explicitly_shared) — тоже:
 * сдвиг такого бюджета задел бы несколько кампаний сразу.
 */

export const GOOGLE_ADS_VERSION = "v25";
export const GOOGLE_ADS_API = `https://googleads.googleapis.com/${GOOGLE_ADS_VERSION}`;
const MICRO = 1_000_000;

export type GoogleCreds = {
  /** Свежий access token — его даёт `accessToken()` (обновляет по refresh token). */
  accessToken: () => Promise<string>;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
};

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export class GoogleAdsError extends Error {}

export function googleError(body: unknown): GoogleAdsError | null {
  const first = Array.isArray(body) ? body[0] : body;
  const error = (first as { error?: { message?: string; details?: { errors?: { message?: string }[] }[] } })?.error;
  if (!error) return null;
  const detail = error.details?.flatMap((d) => d.errors ?? []).map((e) => e.message).filter(Boolean).join("; ");
  return new GoogleAdsError(`Google Ads: ${detail || error.message || "ошибка"}`);
}

/** Строка для GAQL: только цифры — id сюда приходят из нашей же базы, но кавычку пропускать нельзя. */
const id = (value: string) => {
  if (!/^\d+$/.test(value)) throw new GoogleAdsError(`Неверный id: ${value}`);
  return value;
};
const day = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new GoogleAdsError(`Неверная дата: ${value}`);
  return value;
};

export function googleConnector(creds: GoogleCreds, opts: { fetchImpl?: Fetch } = {}): AdsConnector {
  const fetchImpl: Fetch = opts.fetchImpl ?? ((url, init) => fetch(url, init));
  const cid = id(creds.customerId.replace(/-/g, ""));
  const budgets = new Map<string, string>();

  async function headers() {
    return {
      Authorization: `Bearer ${await creds.accessToken()}`,
      // С сентября 2026 доступ привязан к проекту Google Cloud, а заголовок
      // необязателен; пока он задан — шлём, как просит страница REST auth.
      ...(creds.developerToken ? { "developer-token": creds.developerToken } : {}),
      "Content-Type": "application/json",
      ...(creds.loginCustomerId ? { "login-customer-id": creds.loginCustomerId.replace(/-/g, "") } : {}),
    };
  }

  async function query<T = Record<string, unknown>>(gaql: string): Promise<T[]> {
    const res = await fetchImpl(`${GOOGLE_ADS_API}/customers/${cid}/googleAds:searchStream`, {
      method: "POST",
      headers: await headers(),
      body: JSON.stringify({ query: gaql }),
    });
    const body = await res.json().catch(() => null);
    const error = googleError(body);
    if (error) throw error;
    if (!res.ok || !Array.isArray(body)) throw new GoogleAdsError(`Google Ads: ответ ${res.status}`);
    return body.flatMap((batch: { results?: T[] }) => batch.results ?? []);
  }

  async function mutate(resource: string, operations: unknown[]): Promise<{ resourceName: string }[]> {
    const res = await fetchImpl(`${GOOGLE_ADS_API}/customers/${cid}/${resource}:mutate`, {
      method: "POST",
      headers: await headers(),
      body: JSON.stringify({ operations }),
    });
    const body = await res.json().catch(() => null);
    const error = googleError(body);
    if (error) throw error;
    if (!res.ok) throw new GoogleAdsError(`Google Ads: ответ ${res.status}`);
    return (body as { results?: { resourceName: string }[] })?.results ?? [];
  }

  const range = (p: Period) => `segments.date BETWEEN '${day(p.from)}' AND '${day(p.to)}'`;
  const n = (v: unknown) => Number(v ?? 0) || 0;

  type Row = {
    campaign?: { id?: string; name?: string; status?: string; primaryStatusReasons?: string[] };
    campaignBudget?: { resourceName?: string; amountMicros?: string; explicitlyShared?: boolean };
    adGroup?: { id?: string };
    segments?: { date?: string };
    metrics?: { costMicros?: string; clicks?: string; impressions?: string; conversions?: number; conversionsValue?: number };
  };

  return {
    platform: "google",

    async campaigns(period) {
      const rows = await query<Row>(
        `SELECT campaign.id, campaign.name, campaign.status, campaign.primary_status_reasons, ` +
          `campaign_budget.resource_name, campaign_budget.amount_micros, campaign_budget.explicitly_shared, ` +
          `segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value ` +
          `FROM campaign WHERE ${range(period)} AND campaign.status != 'REMOVED' AND campaign.advertising_channel_type = 'SEARCH'`,
      );
      const byId = new Map<string, Campaign>();
      for (const r of rows) {
        const key = String(r.campaign?.id);
        if (r.campaignBudget?.resourceName) budgets.set(key, r.campaignBudget.resourceName);
        const c = byId.get(key) ?? {
          id: key,
          name: r.campaign?.name ?? key,
          active: r.campaign?.status === "ENABLED",
          dailyBudget: r.campaignBudget?.explicitlyShared ? null : n(r.campaignBudget?.amountMicros) / MICRO || null,
          learning: (r.campaign?.primaryStatusReasons ?? []).includes("BIDDING_STRATEGY_LEARNING"),
          activeDays: 0,
          cost: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          revenue: 0,
        };
        if (n(r.metrics?.impressions) > 0) c.activeDays += 1;
        c.cost += n(r.metrics?.costMicros) / MICRO;
        c.clicks += n(r.metrics?.clicks);
        c.impressions += n(r.metrics?.impressions);
        c.conversions += n(r.metrics?.conversions);
        c.revenue += n(r.metrics?.conversionsValue);
        byId.set(key, c);
      }
      return [...byId.values()];
    },

    async searchTerms(period) {
      const rows = await query<Row & { searchTermView?: { searchTerm?: string } }>(
        `SELECT campaign.id, ad_group.id, search_term_view.search_term, metrics.clicks, metrics.impressions, ` +
          `metrics.cost_micros, metrics.conversions FROM search_term_view WHERE ${range(period)}`,
      );
      return rows.map(
        (r): SearchTerm => ({
          campaignId: String(r.campaign?.id),
          adGroupId: String(r.adGroup?.id),
          query: r.searchTermView?.searchTerm ?? "",
          clicks: n(r.metrics?.clicks),
          impressions: n(r.metrics?.impressions),
          cost: n(r.metrics?.costMicros) / MICRO,
          conversions: n(r.metrics?.conversions),
        }),
      );
    },

    async keywords() {
      const rows = await query<Row & { adGroupCriterion?: { criterionId?: string; keyword?: { text?: string } } }>(
        `SELECT campaign.id, ad_group.id, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text ` +
          `FROM keyword_view WHERE ad_group_criterion.status != 'REMOVED' AND ad_group_criterion.negative = FALSE`,
      );
      return rows.map(
        (r): Keyword => ({
          campaignId: String(r.campaign?.id),
          adGroupId: String(r.adGroup?.id),
          id: String(r.adGroupCriterion?.criterionId),
          text: r.adGroupCriterion?.keyword?.text ?? "",
        }),
      );
    },

    async ads(period) {
      type AdRow = Row & {
        adGroupAd?: {
          status?: string;
          policySummary?: { approvalStatus?: string };
          ad?: { id?: string; finalUrls?: string[]; responsiveSearchAd?: { headlines?: { text: string }[]; descriptions?: { text: string }[] } };
        };
      };
      const rows = await query<AdRow>(
        `SELECT campaign.id, ad_group.id, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, ad_group_ad.ad.id, ad_group_ad.ad.final_urls, ` +
          `ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ` +
          `metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM ad_group_ad ` +
          `WHERE ${range(period)} AND ad_group_ad.status != 'REMOVED' AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'`,
      );
      return rows.map(
        (r): Ad => ({
          // Ресурс объявления — «группа~объявление»: им же и меняем статус.
          id: `${r.adGroup?.id}~${r.adGroupAd?.ad?.id}`,
          campaignId: String(r.campaign?.id),
          adGroupId: String(r.adGroup?.id),
          active: r.adGroupAd?.status === "ENABLED",
          rejected: r.adGroupAd?.policySummary?.approvalStatus === "DISAPPROVED",
          copy: {
            headlines: (r.adGroupAd?.ad?.responsiveSearchAd?.headlines ?? []).map((h) => h.text),
            descriptions: (r.adGroupAd?.ad?.responsiveSearchAd?.descriptions ?? []).map((d) => d.text),
            url: r.adGroupAd?.ad?.finalUrls?.[0] ?? "",
          },
          clicks: n(r.metrics?.clicks),
          impressions: n(r.metrics?.impressions),
          cost: n(r.metrics?.costMicros) / MICRO,
          conversions: n(r.metrics?.conversions),
        }),
      );
    },

    async negatives(campaignId) {
      const rows = await query<{ campaignCriterion?: { keyword?: { text?: string } } }>(
        `SELECT campaign_criterion.resource_name, campaign_criterion.keyword.text FROM campaign_criterion ` +
          `WHERE campaign.id = ${id(campaignId)} AND campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD'`,
      );
      return rows.map((r) => r.campaignCriterion?.keyword?.text ?? "").filter(Boolean);
    },

    async setNegatives(campaignId, phrases) {
      const rows = await query<{ campaignCriterion?: { resourceName?: string; keyword?: { text?: string } } }>(
        `SELECT campaign_criterion.resource_name, campaign_criterion.keyword.text FROM campaign_criterion ` +
          `WHERE campaign.id = ${id(campaignId)} AND campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD'`,
      );
      const want = new Set(phrases.map((p) => p.toLowerCase()));
      const have = new Map(rows.map((r) => [(r.campaignCriterion?.keyword?.text ?? "").toLowerCase(), r.campaignCriterion?.resourceName ?? ""]));
      const operations: unknown[] = [];
      for (const phrase of phrases) {
        if (!have.has(phrase.toLowerCase())) {
          operations.push({
            create: { campaign: `customers/${cid}/campaigns/${id(campaignId)}`, negative: true, keyword: { text: phrase, matchType: "PHRASE" } },
          });
        }
      }
      for (const [text, resourceName] of have) if (!want.has(text) && resourceName) operations.push({ remove: resourceName });
      if (operations.length) await mutate("campaignCriteria", operations);
    },

    async groupNegatives(adGroupId) {
      const rows = await query<{ adGroupCriterion?: { keyword?: { text?: string } } }>(
        `SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text FROM ad_group_criterion ` +
          `WHERE ad_group.id = ${id(adGroupId)} AND ad_group_criterion.negative = TRUE AND ad_group_criterion.type = 'KEYWORD'`,
      );
      return rows.map((r) => r.adGroupCriterion?.keyword?.text ?? "").filter(Boolean);
    },

    async setGroupNegatives(adGroupId, phrases) {
      const rows = await query<{ adGroupCriterion?: { resourceName?: string; keyword?: { text?: string } } }>(
        `SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text FROM ad_group_criterion ` +
          `WHERE ad_group.id = ${id(adGroupId)} AND ad_group_criterion.negative = TRUE AND ad_group_criterion.type = 'KEYWORD'`,
      );
      const want = new Set(phrases.map((p) => p.toLowerCase()));
      const have = new Map(rows.map((r) => [(r.adGroupCriterion?.keyword?.text ?? "").toLowerCase(), r.adGroupCriterion?.resourceName ?? ""]));
      const operations: unknown[] = [];
      for (const phrase of phrases) {
        if (!have.has(phrase.toLowerCase())) {
          operations.push({ create: { adGroup: `customers/${cid}/adGroups/${id(adGroupId)}`, negative: true, keyword: { text: phrase, matchType: "PHRASE" } } });
        }
      }
      for (const [text, resourceName] of have) if (!want.has(text) && resourceName) operations.push({ remove: resourceName });
      if (operations.length) await mutate("adGroupCriteria", operations);
    },

    async setDailyBudget(campaignId, amount) {
      const resourceName = budgets.get(campaignId);
      if (!resourceName) throw new GoogleAdsError("Бюджет кампании не найден — заберите отчёт заново.");
      const micros = Math.round((amount * MICRO) / 10_000) * 10_000;
      await mutate("campaignBudgets", [{ update: { resourceName, amountMicros: String(micros) }, updateMask: "amountMicros" }]);
    },

    async createAd(adGroupId, copy: AdCopy) {
      const [result] = await mutate("adGroupAds", [
        {
          create: {
            adGroup: `customers/${cid}/adGroups/${id(adGroupId)}`,
            status: "ENABLED",
            ad: {
              finalUrls: [copy.url],
              responsiveSearchAd: {
                headlines: copy.headlines.map((text) => ({ text })),
                descriptions: copy.descriptions.map((text) => ({ text })),
              },
            },
          },
        },
      ]);
      const name = result?.resourceName ?? "";
      const tail = name.split("/adGroupAds/")[1];
      if (!tail) throw new GoogleAdsError("Google Ads не вернул объявление.");
      return tail;
    },

    async setAdActive(adId, active) {
      const [group, ad] = adId.split("~");
      await mutate("adGroupAds", [
        {
          update: { resourceName: `customers/${cid}/adGroupAds/${id(group)}~${id(ad)}`, status: active ? "ENABLED" : "PAUSED" },
          updateMask: "status",
        },
      ]);
    },
  };
}
