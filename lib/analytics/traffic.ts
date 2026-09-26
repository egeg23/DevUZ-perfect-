import { createSign } from "node:crypto";

import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import {
  GOOGLE_SECRETS,
  GoogleSignInExpired,
  googleClient,
  refreshAccess,
  type GoogleClient,
} from "@/lib/analytics/google-oauth";
import { roadFetch } from "@/lib/egress.mjs";
import { appSecret } from "@/lib/secrets";

/**
 * Трафик сайта из Яндекс Метрики и Google Analytics — на дашборд владельца.
 *
 * Счётчики на сайте стоят давно (Метрика 112925960, тег GA4); здесь их
 * статистика читается обратно через API, чтобы владелец видел трафик рядом с
 * лидами и деньгами, а не в двух чужих кабинетах.
 *
 * Ключи — только на сервере, в .env или в хранилище секретов (lib/secrets.ts):
 *   YANDEX_METRIKA_TOKEN   OAuth-токен с правом «чтение статистики»;
 *   YANDEX_METRIKA_ID      номер счётчика (по умолчанию — из тега на сайте);
 *   GA4_PROPERTY_ID        числовой идентификатор ресурса GA4 (не G-…);
 * и для GA — одно из двух:
 *   GA_SERVICE_ACCOUNT     JSON-ключ сервисного аккаунта, как есть или в base64;
 *   вход через Google      кнопка во вкладке «Трафик» (lib/analytics/google-oauth.ts):
 *                          GOOGLE_OAUTH_CLIENT_ID/_SECRET и GA_OAUTH_REFRESH_TOKEN.
 * Нет ключа — источник показывается как «не подключён», а не как ошибка.
 */

export type TrafficTotals = {
  visits: number;
  users: number;
  pageviews: number;
  /** Доля отказов, 0–100. */
  bounce: number;
  /** Средняя длительность визита, секунды. */
  duration: number;
};

export type TrafficReport = {
  totals: TrafficTotals;
  prev: TrafficTotals;
  days: { date: string; visits: number; users: number }[];
  sources: { name: string; visits: number }[];
  pages: { name: string; visits: number }[];
};

/**
 * `reauth` — только у GA со входом через Google: Google больше не пускает
 * по сохранённому входу, и помочь может только новый вход.
 */
export type TrafficResult =
  | { ok: true; report: TrafficReport }
  | { ok: false; reason: "not_configured" | "failed" | "reauth"; detail?: string };

const TIMEOUT_MS = 8_000;
const CACHE_MS = 10 * 60_000;
const DAY_MS = 24 * 3600_000;

/** Даты периода по Ташкенту: последние `days` дней, включая сегодня, и столько же до них. */
export function periodDates(days: number, now: Date): { from: string; to: string; prevFrom: string; prevTo: string } {
  const day = (offset: number) =>
    new Date(now.getTime() + TASHKENT_OFFSET_MS - offset * DAY_MS).toISOString().slice(0, 10);
  return { from: day(days - 1), to: day(0), prevFrom: day(2 * days - 1), prevTo: day(days) };
}

const ZERO: TrafficTotals = { visits: 0, users: 0, pageviews: 0, bounce: 0, duration: 0 };

/**
 * Кэш на десять минут. Главную владелец открывает десятки раз в день, а
 * трафик за неделю за десять минут не меняется; без кэша каждое открытие
 * вкладки ждало бы два чужих API.
 */
const cache = new Map<string, { at: number; value: TrafficResult }>();

async function cached(key: string, load: () => Promise<TrafficResult>): Promise<TrafficResult> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await load();
  // Ошибку не кэшируем: починили ключ — увидеть результат надо сразу.
  if (value.ok) cache.set(key, { at: Date.now(), value });
  return value;
}

/* ── Яндекс Метрика ─────────────────────────────────────────────────── */

const METRIKA_API = "https://api-metrika.yandex.net/stat/v1/data";
const DEFAULT_COUNTER = "112925960";

type MetrikaRow = { dimensions: { name: string | null }[]; metrics: number[] };
type MetrikaResponse = { data?: MetrikaRow[]; totals?: number[]; message?: string };

async function metrika(token: string, params: Record<string, string>): Promise<MetrikaResponse> {
  const url = `${METRIKA_API}?${new URLSearchParams({ accuracy: "full", ...params })}`;
  // Яндекс отвечает и напрямую: умер прокси — Метрика не должна умирать с ним.
  const response = await roadFetch(url, {
    headers: { Authorization: `OAuth ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as MetrikaResponse;
  if (!response.ok) throw new Error(`Метрика ${response.status}: ${body.message ?? "без описания"}`);
  return body;
}

const METRIKA_TOTALS = "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds";

function metrikaTotals(t: number[] | undefined): TrafficTotals {
  if (!t?.length) return ZERO;
  return { visits: t[0] ?? 0, users: t[1] ?? 0, pageviews: t[2] ?? 0, bounce: t[3] ?? 0, duration: t[4] ?? 0 };
}

// Ключи — из .env, а если их там нет — из хранилища секретов Supabase
// (lib/secrets.ts): так их можно подключить без доступа к серверу.
export async function metrikaConfigured(): Promise<boolean> {
  return Boolean(await appSecret("YANDEX_METRIKA_TOKEN"));
}

export async function loadMetrika(days: number, now: Date = new Date()): Promise<TrafficResult> {
  const token = await appSecret("YANDEX_METRIKA_TOKEN");
  if (!token) return { ok: false, reason: "not_configured" };
  const id = (process.env.YANDEX_METRIKA_ID || process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || DEFAULT_COUNTER).trim();
  const d = periodDates(days, now);

  return cached(`ym:${id}:${d.from}:${d.to}`, async () => {
    try {
      const period = { ids: id, date1: d.from, date2: d.to, lang: "ru" };
      // Парами, а не все пять разом: у API Метрики ограничение на число
      // одновременных запросов, и пятый упирался бы в отказ «слишком много».
      const [cur, prev] = await Promise.all([
        metrika(token, { ...period, metrics: METRIKA_TOTALS }),
        metrika(token, { ...period, date1: d.prevFrom, date2: d.prevTo, metrics: METRIKA_TOTALS }),
      ]);
      const [byDay, sources] = await Promise.all([
        metrika(token, { ...period, metrics: "ym:s:visits,ym:s:users", dimensions: "ym:s:date", sort: "ym:s:date", limit: "100" }),
        metrika(token, { ...period, metrics: "ym:s:visits", dimensions: "ym:s:lastTrafficSource", sort: "-ym:s:visits", limit: "6" }),
      ]);
      const pages = await metrika(token, {
        ...period,
        metrics: "ym:s:visits",
        dimensions: "ym:s:startURLPath",
        sort: "-ym:s:visits",
        limit: "8",
      });
      const rows = (r: MetrikaResponse) =>
        (r.data ?? []).map((row) => ({ name: String(row.dimensions[0]?.name ?? "—"), visits: row.metrics[0] ?? 0 }));
      return {
        ok: true,
        report: {
          totals: metrikaTotals(cur.totals),
          prev: metrikaTotals(prev.totals),
          days: (byDay.data ?? []).map((row) => ({
            date: String(row.dimensions[0]?.name ?? ""),
            visits: row.metrics[0] ?? 0,
            users: row.metrics[1] ?? 0,
          })),
          sources: rows(sources),
          pages: rows(pages),
        },
      };
    } catch (error) {
      console.error("traffic: Метрика не ответила", error);
      return { ok: false, reason: "failed", detail: error instanceof Error ? error.message : String(error) };
    }
  });
}

/* ── Google Analytics 4 ─────────────────────────────────────────────── */

type ServiceAccount = { client_email: string; private_key: string };

/**
 * Ключ сервисного аккаунта из окружения: JSON как есть или в base64 — в
 * .env многострочный JSON с переводами строк в ключе ломается чаще, чем
 * работает, и base64 спасает от этого.
 */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  const text = raw?.trim();
  if (!text) return null;
  const candidates = [text];
  if (!text.startsWith("{")) {
    try {
      candidates.push(Buffer.from(text, "base64").toString("utf8"));
    } catch {
      // не base64 — значит, битый JSON, ниже вернём null
    }
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ServiceAccount>;
      if (parsed.client_email && parsed.private_key) {
        return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
      }
    } catch {
      // следующий вариант
    }
  }
  return null;
}

/**
 * Чем панель входит в GA. Ключ сервисного аккаунта, если он есть, — первым:
 * он не истекает и не зависит от того, чей аккаунт Google нажал кнопку.
 * Иначе — сохранённый вход владельца через Google.
 */
type GaAuth = { kind: "service"; account: ServiceAccount } | { kind: "google"; client: GoogleClient; refresh: string };

async function gaAuth(): Promise<GaAuth | null> {
  const account = parseServiceAccount((await appSecret("GA_SERVICE_ACCOUNT")) ?? undefined);
  if (account) return { kind: "service", account };
  const [client, refresh] = await Promise.all([googleClient(), appSecret(GOOGLE_SECRETS.refresh)]);
  return client && refresh ? { kind: "google", client, refresh } : null;
}

export async function gaConfigured(): Promise<boolean> {
  const [property, auth] = await Promise.all([appSecret(GOOGLE_SECRETS.property), gaAuth()]);
  return Boolean(property && auth);
}

/** Что уже есть для GA — от этого зависит, что показывает карточка во вкладке «Трафик». */
export type GaConnection = {
  via: "service" | "google" | null;
  /** Client ID и секрет для входа через Google сохранены. */
  client: boolean;
  property: string | null;
  /** Чьим входом Google читается статистика. */
  email: string | null;
};

export async function gaConnection(): Promise<GaConnection> {
  const [auth, client, property, email] = await Promise.all([
    gaAuth(),
    googleClient(),
    appSecret(GOOGLE_SECRETS.property),
    appSecret(GOOGLE_SECRETS.email),
  ]);
  return { via: auth?.kind ?? null, client: Boolean(client), property, email: auth?.kind === "google" ? email : null };
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

/** Часовые токены Google — по тому, чем входили: сменили вход — старый токен не подходит. */
const gaTokens = new Map<string, { value: string; until: number }>();

async function gaAccess(auth: GaAuth): Promise<string> {
  const key = auth.kind === "service" ? `sa:${auth.account.client_email}` : `oauth:${auth.client.id}:${auth.refresh}`;
  const hit = gaTokens.get(key);
  if (hit && hit.until > Date.now() + 60_000) return hit.value;
  if (auth.kind === "service") return googleToken(auth.account, key);
  const { access, expiresIn } = await refreshAccess(auth.client, auth.refresh);
  gaTokens.set(key, { value: access, until: Date.now() + expiresIn * 1000 });
  return access;
}

/** Токен доступа Google по ключу сервисного аккаунта: подписанный JWT → OAuth. */
async function googleToken(account: ServiceAccount, key: string): Promise<string> {

  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp: iat + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${b64url(signer.sign(account.private_key))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google не выдал доступ: ${body.error_description ?? response.status}`);
  }
  gaTokens.set(key, { value: body.access_token, until: Date.now() + (body.expires_in ?? 3600) * 1000 });
  return body.access_token;
}

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type GaReport = { rows?: GaRow[] };

const num = (v: string | undefined) => Number(v ?? 0) || 0;

/** GA отдаёт дату как 20260922 — приводим к тому же виду, что у Метрики. */
function gaDate(value: string): string {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : value;
}

export async function loadGa(days: number, now: Date = new Date()): Promise<TrafficResult> {
  const [property, auth] = await Promise.all([appSecret(GOOGLE_SECRETS.property), gaAuth()]);
  if (!property || !auth) return { ok: false, reason: "not_configured" };
  const d = periodDates(days, now);

  return cached(`ga:${property}:${d.from}:${d.to}`, async () => {
    try {
      const token = await gaAccess(auth);
      const range = { startDate: d.from, endDate: d.to };
      const totals = [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ];
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property)}:batchRunReports`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              { dateRanges: [range], metrics: totals },
              { dateRanges: [{ startDate: d.prevFrom, endDate: d.prevTo }], metrics: totals },
              {
                dateRanges: [range],
                dimensions: [{ name: "date" }],
                metrics: [{ name: "sessions" }, { name: "totalUsers" }],
                orderBys: [{ dimension: { dimensionName: "date" } }],
              },
              {
                dateRanges: [range],
                dimensions: [{ name: "sessionDefaultChannelGroup" }],
                metrics: [{ name: "sessions" }],
                orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                limit: 6,
              },
              {
                dateRanges: [range],
                dimensions: [{ name: "landingPage" }],
                metrics: [{ name: "sessions" }],
                orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                limit: 8,
              },
            ],
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        },
      );
      const body = (await response.json().catch(() => ({}))) as { reports?: GaReport[]; error?: { message?: string } };
      if (!response.ok || !body.reports) {
        throw new Error(`GA ${response.status}: ${body.error?.message ?? "без описания"}`);
      }
      const [cur, prev, byDay, sources, pages] = body.reports;
      const totalsOf = (r: GaReport | undefined): TrafficTotals => {
        const m = r?.rows?.[0]?.metricValues;
        if (!m) return ZERO;
        return {
          visits: num(m[0]?.value),
          users: num(m[1]?.value),
          pageviews: num(m[2]?.value),
          // GA отдаёт долю 0–1, Метрика — проценты; приводим к процентам.
          bounce: num(m[3]?.value) * 100,
          duration: num(m[4]?.value),
        };
      };
      const rows = (r: GaReport | undefined) =>
        (r?.rows ?? []).map((row) => ({
          name: row.dimensionValues?.[0]?.value || "—",
          visits: num(row.metricValues?.[0]?.value),
        }));
      return {
        ok: true,
        report: {
          totals: totalsOf(cur),
          prev: totalsOf(prev),
          days: (byDay?.rows ?? []).map((row) => ({
            date: gaDate(row.dimensionValues?.[0]?.value ?? ""),
            visits: num(row.metricValues?.[0]?.value),
            users: num(row.metricValues?.[1]?.value),
          })),
          sources: rows(sources),
          pages: rows(pages),
        },
      };
    } catch (error) {
      if (error instanceof GoogleSignInExpired) {
        return { ok: false, reason: "reauth", detail: error.message };
      }
      console.error("traffic: Google Analytics не ответил", error);
      return { ok: false, reason: "failed", detail: error instanceof Error ? error.message : String(error) };
    }
  });
}
