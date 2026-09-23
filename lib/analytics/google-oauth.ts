import { siteUrl } from "@/lib/seo";
import { appSecret } from "@/lib/secrets";

/**
 * Вход владельца через Google — чтобы панель читала Google Analytics.
 *
 * Сначала GA подключался ключом сервисного аккаунта, но 23 сентября Google
 * не дал его выпустить: в организации владельца действует политика
 * iam.disableServiceAccountKeyCreation. Поэтому вход — как у любого сервиса
 * «Войти через Google»: владелец нажимает кнопку во вкладке «Трафик», на
 * экране Google разрешает только просмотр статистики, и Google отдаёт
 * постоянный доступ (refresh token). Панель кладёт его в хранилище секретов
 * и дальше сама получает часовые токены. Номер ресурса GA4 ищется по
 * счётчику сайта — вписывать его руками не нужно.
 *
 * Что для этого нужно в Google Cloud — «OAuth client ID» типа «Web
 * application» с адресом возврата `googleRedirectUri()`. Client ID и секрет
 * владелец вставляет во вкладке «Трафик» или кладёт в `.env`.
 */

export const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";

/** Кука с проверочным значением входа: живёт десять минут и только на /admin/google. */
export const STATE_COOKIE = "devuz_ga_state";
export const STATE_PATH = "/admin/google";
export const STATE_MAX_AGE = 600;

/** Счётчик GA4 на сайте — по нему ищется ресурс. */
const DEFAULT_GA_STREAM = "G-L52MCVNS0W";

const TIMEOUT_MS = 8_000;

/** Секреты, из которых складывается вход. Имена — без «app.», как у appSecret. */
export const GOOGLE_SECRETS = {
  clientId: "GOOGLE_OAUTH_CLIENT_ID",
  clientSecret: "GOOGLE_OAUTH_CLIENT_SECRET",
  refresh: "GA_OAUTH_REFRESH_TOKEN",
  email: "GA_OAUTH_EMAIL",
  property: "GA4_PROPERTY_ID",
} as const;

/** Адрес, на который Google возвращает после входа. Должен совпасть в клиенте Google до символа. */
export function googleRedirectUri(base: string = siteUrl): string {
  return `${base.replace(/\/+$/, "")}/admin/google/callback`;
}

export function measurementId(): string {
  return (process.env.NEXT_PUBLIC_GA_ID || DEFAULT_GA_STREAM).trim();
}

export type GoogleClient = { id: string; secret: string };

export async function googleClient(): Promise<GoogleClient | null> {
  const [id, secret] = await Promise.all([
    appSecret(GOOGLE_SECRETS.clientId),
    appSecret(GOOGLE_SECRETS.clientSecret),
  ]);
  return id && secret ? { id, secret } : null;
}

/** Client ID Google всегда такого вида: цифры, дефис, буквы, .apps.googleusercontent.com. */
export function isClientId(value: string): boolean {
  return /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(value);
}

/**
 * Ссылка на экран входа Google.
 *
 * `access_type=offline` и `prompt=consent` вместе — чтобы Google отдал
 * постоянный доступ и при повторном входе тоже: без `prompt=consent` он
 * выдаёт его только в первый раз, а второй вход оставил бы панель с
 * часовым токеном, который назавтра уже не работает.
 */
export function authUrl(input: { clientId: string; state: string; redirectUri?: string }): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri ?? googleRedirectUri(),
    response_type: "code",
    scope: `openid email ${GA_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    state: input.state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

type TokenAnswer = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<{ status: number; answer: TokenAnswer }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  return { status: response.status, answer: (await response.json().catch(() => ({}))) as TokenAnswer };
}

/**
 * Почта из id_token — чтобы в карточке было видно, чьим входом читается
 * статистика. Подпись не проверяем: токен пришёл прямо от Google по https в
 * ответ на наш же запрос, а почта здесь только для подписи, не для доступа.
 */
export function emailOfIdToken(idToken: string | undefined): string | null {
  const payload = idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: unknown };
    return typeof claims.email === "string" ? claims.email : null;
  } catch {
    return null;
  }
}

export type CodeExchange =
  | { ok: true; access: string; refresh: string | null; scopes: string[]; email: string | null }
  | { ok: false; detail: string };

/** Код из адреса возврата → токены. */
export async function exchangeCode(client: GoogleClient, code: string, redirectUri = googleRedirectUri()): Promise<CodeExchange> {
  try {
    const { status, answer } = await tokenRequest({
      grant_type: "authorization_code",
      code,
      client_id: client.id,
      client_secret: client.secret,
      redirect_uri: redirectUri,
    });
    if (!answer.access_token) {
      return { ok: false, detail: answer.error_description || answer.error || `ответ ${status}` };
    }
    return {
      ok: true,
      access: answer.access_token,
      refresh: answer.refresh_token ?? null,
      scopes: (answer.scope ?? "").split(/\s+/).filter(Boolean),
      email: emailOfIdToken(answer.id_token),
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Google больше не пускает по сохранённому входу: владелец отозвал доступ,
 * сменил пароль, или приложение в Google Cloud осталось в режиме
 * «Testing» — тогда вход живёт семь дней. Лечится только новым входом.
 */
export class GoogleSignInExpired extends Error {}

/** Постоянный доступ → часовой токен. */
export async function refreshAccess(client: GoogleClient, refresh: string): Promise<{ access: string; expiresIn: number }> {
  const { status, answer } = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: client.id,
    client_secret: client.secret,
  });
  if (answer.access_token) return { access: answer.access_token, expiresIn: answer.expires_in ?? 3600 };
  const detail = answer.error_description || answer.error || `ответ ${status}`;
  if (answer.error === "invalid_grant") throw new GoogleSignInExpired(detail);
  throw new Error(`Google не выдал доступ: ${detail}`);
}

export type PropertySearch =
  | { ok: true; property: string; name: string }
  | { ok: false; reason: "not_found"; checked: number }
  | { ok: false; reason: "failed"; detail: string };

async function adminGet<T>(access: string, path: string): Promise<T> {
  const response = await fetch(`${ADMIN_API}/${path}`, {
    headers: { Authorization: `Bearer ${access}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `ответ ${response.status}`);
  return body;
}

type AccountSummaries = {
  accountSummaries?: { propertySummaries?: { property?: string; displayName?: string }[] }[];
};
type DataStreams = { dataStreams?: { webStreamData?: { measurementId?: string } }[] };

/** Больше ресурсов не перебираем: у студии их единицы, а сотня запросов — это уже не поиск. */
const MAX_PROPERTIES = 50;

/**
 * Ресурс GA4, в который пишет счётчик сайта: все ресурсы, доступные вошедшему,
 * и у каждого — потоки, пока не найдётся поток с нашим G-….
 */
export async function findProperty(access: string, measurement: string = measurementId()): Promise<PropertySearch> {
  try {
    const summaries = await adminGet<AccountSummaries>(access, "accountSummaries?pageSize=200");
    const properties = (summaries.accountSummaries ?? [])
      .flatMap((account) => account.propertySummaries ?? [])
      .filter((p): p is { property: string; displayName?: string } => Boolean(p.property?.startsWith("properties/")))
      .slice(0, MAX_PROPERTIES);

    for (const p of properties) {
      const streams = await adminGet<DataStreams>(access, `${p.property}/dataStreams?pageSize=50`);
      if ((streams.dataStreams ?? []).some((s) => s.webStreamData?.measurementId === measurement)) {
        return { ok: true, property: p.property.slice("properties/".length), name: p.displayName ?? "" };
      }
    }
    return { ok: false, reason: "not_found", checked: properties.length };
  } catch (error) {
    return { ok: false, reason: "failed", detail: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Ссылка «включить API» из ответа Google.
 *
 * Когда в проекте Google Cloud не включён нужный API, Google отвечает
 * длинным английским текстом, внутри которого — ссылка на страницу, где
 * это делается одной кнопкой. Её и показываем: так быстрее, чем объяснять,
 * где эта страница.
 */
export function enableApiLink(message: string | undefined): string | null {
  const match = message?.match(/https:\/\/console\.(?:developers|cloud)\.google\.com\/apis\/(?:api|library)\/[^\s"'<>)]+/);
  return match ? match[0].replace(/[.,;]+$/, "") : null;
}
