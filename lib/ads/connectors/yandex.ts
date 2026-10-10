import type { Ad, AdCopy, AdsConnector, Campaign, Keyword, Period, SearchTerm } from "@/lib/ads/types";

/**
 * Яндекс Директ, API v5 (JSON + Reports API).
 *
 * - Боевой адрес — api.direct.yandex.com, песочница — api-sandbox.direct.yandex.com:
 *   та же схема, тестовые кампании, деньги не тратятся. Разработка и обкатка —
 *   на песочнице (`sandbox` у кабинета).
 * - Токен — OAuth (Authorization: Bearer). Агентство работает с кабинетами
 *   клиентов через заголовок Client-Login.
 * - Деньги в сервисах — в микро-единицах (×1 000 000); отчёты просим в обычных
 *   (returnMoneyInMicros: false).
 * - Отчёт готовится офлайн: 201/202 — «ещё строю», ждём retryIn и спрашиваем снова.
 * - Каждый запрос тратит баллы; остаток — в заголовке Units («потрачено/осталось/суточный»).
 *
 * Бюджет двигаем только у кампаний с дневным бюджетом (ручная стратегия):
 * у автостратегий бюджет недельный и живёт внутри стратегии — его v1 не трогает.
 */

export const YANDEX_API = "https://api.direct.yandex.com/json/v5";
export const YANDEX_SANDBOX = "https://api-sandbox.direct.yandex.com/json/v5";
const MICRO = 1_000_000;

export type YandexCreds = { token: string; clientLogin?: string };

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export class YandexError extends Error {
  readonly code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

/** Ошибка из ответа Директа — понятной строкой. */
export function yandexError(body: unknown): YandexError | null {
  const error = (body as { error?: { error_code?: number; error_string?: string; error_detail?: string } })?.error;
  if (!error) return null;
  return new YandexError(`Директ: ${error.error_string ?? "ошибка"}${error.error_detail ? ` — ${error.error_detail}` : ""}`, error.error_code);
}

/** Ошибки отдельных объектов в AddResults / UpdateResults / SuspendResults. */
export function itemErrors(results: unknown): string[] {
  if (!Array.isArray(results)) return [];
  return results.flatMap((r: { Errors?: { Message?: string; Details?: string }[] }) =>
    (r.Errors ?? []).map((e) => `${e.Message ?? "ошибка"}${e.Details ? `: ${e.Details}` : ""}`),
  );
}

/** TSV отчёта (с заголовком колонок) — в строки. «--» — пусто, значит ноль. */
export function parseTsv(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}

export const num = (value: string | undefined) => {
  const n = Number((value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function yandexConnector(creds: YandexCreds, opts: { sandbox: boolean; fetchImpl?: Fetch; sleep?: (ms: number) => Promise<void> }): AdsConnector & { units(): string | null } {
  const base = opts.sandbox ? YANDEX_SANDBOX : YANDEX_API;
  const fetchImpl: Fetch = opts.fetchImpl ?? ((url, init) => fetch(url, init));
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  let lastUnits: string | null = null;

  const headers = (extra: Record<string, string> = {}) => ({
    Authorization: `Bearer ${creds.token}`,
    "Accept-Language": "ru",
    "Content-Type": "application/json; charset=utf-8",
    ...(creds.clientLogin ? { "Client-Login": creds.clientLogin } : {}),
    ...extra,
  });

  async function call<T>(service: string, method: string, params: unknown): Promise<T> {
    const res = await fetchImpl(`${base}/${service}`, { method: "POST", headers: headers(), body: JSON.stringify({ method, params }) });
    lastUnits = res.headers.get("Units") ?? lastUnits;
    const body = await res.json().catch(() => null);
    const error = yandexError(body);
    if (error) throw error;
    if (!res.ok || !body) throw new YandexError(`Директ: ответ ${res.status}`);
    return (body as { result: T }).result;
  }

  async function report(type: string, fields: string[], period: Period): Promise<Record<string, string>[]> {
    const body = JSON.stringify({
      params: {
        SelectionCriteria: { DateFrom: period.from, DateTo: period.to },
        FieldNames: fields,
        // Имя отчёта уникально: одинаковое имя с другими полями Директ отклоняет.
        ReportName: `devuz-${type}-${period.from}-${period.to}-${fields.join("").length}`,
        ReportType: type,
        DateRangeType: "CUSTOM_DATE",
        Format: "TSV",
        IncludeVAT: "YES",
        IncludeDiscount: "NO",
      },
    });
    for (let attempt = 0; attempt < 12; attempt++) {
      const res = await fetchImpl(`${base}/reports`, {
        method: "POST",
        headers: headers({
          // Отчёт по поисковым запросам строится только офлайн.
          processingMode: "offline",
          returnMoneyInMicros: "false",
          skipReportHeader: "true",
          skipReportSummary: "true",
        }),
        body,
      });
      if (res.status === 200) return parseTsv(await res.text());
      if (res.status === 201 || res.status === 202) {
        const wait = Math.min(Number(res.headers.get("retryIn") ?? "5") || 5, 15);
        await sleep(wait * 1000);
        continue;
      }
      const error = yandexError(await res.json().catch(() => null));
      throw error ?? new YandexError(`Директ, отчёт: ответ ${res.status}`);
    }
    throw new YandexError("Директ ещё строит отчёт — заберём в следующий проход.");
  }

  type YCampaign = { Id: number; Name: string; State: string; DailyBudget?: { Amount: number; Mode: string } | null; NegativeKeywords?: { Items: string[] } | null };

  async function rawCampaigns(): Promise<YCampaign[]> {
    const result = await call<{ Campaigns?: YCampaign[] }>("campaigns", "get", {
      SelectionCriteria: { Types: ["TEXT_CAMPAIGN"], States: ["ON", "SUSPENDED", "OFF"] },
      FieldNames: ["Id", "Name", "State", "DailyBudget", "NegativeKeywords"],
    });
    return result.Campaigns ?? [];
  }

  async function campaignIds(): Promise<number[]> {
    return (await rawCampaigns()).map((c) => c.Id);
  }

  return {
    platform: "yandex",
    units: () => lastUnits,

    async campaigns(period) {
      const [list, rows] = await Promise.all([
        rawCampaigns(),
        report("CAMPAIGN_PERFORMANCE_REPORT", ["Date", "CampaignId", "Impressions", "Clicks", "Cost", "Conversions"], period),
      ]);
      return list.map((c): Campaign => {
        const own = rows.filter((r) => r.CampaignId === String(c.Id));
        return {
          id: String(c.Id),
          name: c.Name,
          active: c.State === "ON",
          dailyBudget: c.DailyBudget?.Amount ? c.DailyBudget.Amount / MICRO : null,
          learning: false,
          activeDays: own.filter((r) => num(r.Impressions) > 0).length,
          cost: own.reduce((s, r) => s + num(r.Cost), 0),
          clicks: own.reduce((s, r) => s + num(r.Clicks), 0),
          impressions: own.reduce((s, r) => s + num(r.Impressions), 0),
          conversions: own.reduce((s, r) => s + num(r.Conversions), 0),
          revenue: 0,
        };
      });
    },

    async searchTerms(period) {
      const rows = await report(
        "SEARCH_QUERY_PERFORMANCE_REPORT",
        ["CampaignId", "AdGroupId", "Query", "Impressions", "Clicks", "Cost", "Conversions"],
        period,
      );
      return rows.map(
        (r): SearchTerm => ({
          campaignId: r.CampaignId,
          adGroupId: r.AdGroupId,
          query: r.Query,
          impressions: num(r.Impressions),
          clicks: num(r.Clicks),
          cost: num(r.Cost),
          conversions: num(r.Conversions),
        }),
      );
    },

    async keywords() {
      const ids = await campaignIds();
      const out: Keyword[] = [];
      // keywords.get принимает до 10 кампаний за раз.
      for (let i = 0; i < ids.length; i += 10) {
        const result = await call<{ Keywords?: { Id: number; Keyword: string; AdGroupId: number; CampaignId: number }[] }>("keywords", "get", {
          SelectionCriteria: { CampaignIds: ids.slice(i, i + 10) },
          FieldNames: ["Id", "Keyword", "AdGroupId", "CampaignId"],
        });
        for (const k of result.Keywords ?? []) {
          // «ремонт айфона -бесплатно»: минус-слова внутри ключа — не часть ключа.
          out.push({ id: String(k.Id), text: k.Keyword.split(" -")[0].trim(), adGroupId: String(k.AdGroupId), campaignId: String(k.CampaignId) });
        }
      }
      return out;
    },

    async ads(period) {
      const ids = await campaignIds();
      const list: { Id: number; AdGroupId: number; CampaignId: number; State: string; Status?: string; TextAd?: { Title: string; Title2?: string; Text: string; Href?: string } }[] = [];
      for (let i = 0; i < ids.length; i += 10) {
        const result = await call<{ Ads?: typeof list }>("ads", "get", {
          SelectionCriteria: { CampaignIds: ids.slice(i, i + 10), Types: ["TEXT_AD"] },
          FieldNames: ["Id", "AdGroupId", "CampaignId", "State", "Status"],
          TextAdFieldNames: ["Title", "Title2", "Text", "Href"],
        });
        list.push(...(result.Ads ?? []));
      }
      const rows = await report("AD_PERFORMANCE_REPORT", ["AdId", "Impressions", "Clicks", "Cost", "Conversions"], period);
      return list.map((a): Ad => {
        const own = rows.filter((r) => r.AdId === String(a.Id));
        return {
          id: String(a.Id),
          adGroupId: String(a.AdGroupId),
          campaignId: String(a.CampaignId),
          active: a.State === "ON",
          rejected: a.Status === "REJECTED",
          copy: {
            headlines: [a.TextAd?.Title ?? "", a.TextAd?.Title2 ?? ""].filter(Boolean),
            descriptions: [a.TextAd?.Text ?? ""],
            url: a.TextAd?.Href ?? "",
          },
          impressions: own.reduce((s, r) => s + num(r.Impressions), 0),
          clicks: own.reduce((s, r) => s + num(r.Clicks), 0),
          cost: own.reduce((s, r) => s + num(r.Cost), 0),
          conversions: own.reduce((s, r) => s + num(r.Conversions), 0),
        };
      });
    },

    async negatives(campaignId) {
      const result = await call<{ Campaigns?: YCampaign[] }>("campaigns", "get", {
        SelectionCriteria: { Ids: [Number(campaignId)] },
        FieldNames: ["Id", "NegativeKeywords"],
      });
      return result.Campaigns?.[0]?.NegativeKeywords?.Items ?? [];
    },

    async setNegatives(campaignId, phrases) {
      const result = await call<{ UpdateResults?: unknown[] }>("campaigns", "update", {
        Campaigns: [{ Id: Number(campaignId), NegativeKeywords: phrases.length ? { Items: phrases } : null }],
      });
      const errors = itemErrors(result.UpdateResults);
      if (errors.length) throw new YandexError(`Директ не принял минус-фразы: ${errors.join("; ")}`);
    },

    async setDailyBudget(campaignId, amount) {
      const current = (await rawCampaigns()).find((c) => String(c.Id) === campaignId);
      if (!current?.DailyBudget) throw new YandexError("У кампании нет дневного бюджета — бюджет в стратегии.");
      const result = await call<{ UpdateResults?: unknown[] }>("campaigns", "update", {
        Campaigns: [{ Id: Number(campaignId), DailyBudget: { Amount: Math.round(amount) * MICRO, Mode: current.DailyBudget.Mode } }],
      });
      const errors = itemErrors(result.UpdateResults);
      if (errors.length) throw new YandexError(`Директ не принял бюджет: ${errors.join("; ")}`);
    },

    async createAd(adGroupId, copy: AdCopy) {
      const result = await call<{ AddResults?: { Id?: number; Errors?: unknown[] }[] }>("ads", "add", {
        Ads: [
          {
            AdGroupId: Number(adGroupId),
            TextAd: { Title: copy.headlines[0], Title2: copy.headlines[1], Text: copy.descriptions[0], Href: copy.url, Mobile: "NO" },
          },
        ],
      });
      const errors = itemErrors(result.AddResults);
      const id = result.AddResults?.[0]?.Id;
      if (errors.length || !id) throw new YandexError(`Директ не принял объявление: ${errors.join("; ") || "без id"}`);
      // Новое объявление — черновик; на модерацию отправляем сразу.
      await call("ads", "moderate", { SelectionCriteria: { Ids: [id] } });
      return String(id);
    },

    async setAdActive(adId, active) {
      const result = await call<{ SuspendResults?: unknown[]; ResumeResults?: unknown[] }>("ads", active ? "resume" : "suspend", {
        SelectionCriteria: { Ids: [Number(adId)] },
      });
      const errors = itemErrors(result.SuspendResults ?? result.ResumeResults);
      if (errors.length) throw new YandexError(`Директ: ${errors.join("; ")}`);
    },
  };
}
