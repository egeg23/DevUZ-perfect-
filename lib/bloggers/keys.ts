/**
 * Ключи ИИ-сотрудника «Блогеры» — поля в самой вкладке, а не руками в хранилище.
 *
 * Владелец, 06.11.2026: «Добавить поля, что куда вписать с инструкцией
 * понятной, откуда что взять и вставить, что бы работало». До этого ключи
 * Meta клал в хранилище секретов только разработчик, и из панели не было
 * видно, чего не хватает (docs/ai-staff/bloggers.md, «Что нужно от
 * владельца»).
 *
 * Значения уходят в хранилище секретов (saveAppSecret → app_secret_put) и
 * обратно в панель не показываются: только «задано / пусто». Проверочный
 * токен вебхука выбираем мы сами — он заводится кодом и показывается: его
 * нужно вставить в настройки приложения Meta.
 *
 * Здесь — чистые функции (их держит tests/blogger-keys.test.ts); запросы к
 * Meta и запись — lib/bloggers/keys-store.ts.
 */

export type KeyName = "BLOGGERS_IG_USER_ID" | "BLOGGERS_FB_TOKEN" | "AI_STAFF_IG_APP_ID" | "AI_STAFF_IG_APP_SECRET";

/** Поле формы → секрет и как выглядит правильное значение. */
export const KEY_FIELDS: readonly { field: "fbToken" | "igUserId" | "appId" | "appSecret"; name: KeyName; pattern: RegExp }[] = [
  // Токен Facebook (пользователя) начинается с EA… и длинный.
  { field: "fbToken", name: "BLOGGERS_FB_TOKEN", pattern: /^EA[A-Za-z0-9]{40,800}$/ },
  // Номер Instagram-аккаунта студии в Graph API: только цифры (17841…).
  { field: "igUserId", name: "BLOGGERS_IG_USER_ID", pattern: /^\d{10,25}$/ },
  // ID приложения Instagram — цифры, секрет — 32 знака 0-9a-f.
  { field: "appId", name: "AI_STAFF_IG_APP_ID", pattern: /^\d{10,20}$/ },
  { field: "appSecret", name: "AI_STAFF_IG_APP_SECRET", pattern: /^[a-f0-9]{32}$/i },
];

export type KeyField = (typeof KEY_FIELDS)[number]["field"];

/** Проверочный токен вебхука — его заводим сами. */
export const VERIFY_NAME = "AI_STAFF_IG_VERIFY_TOKEN";

/** Все секреты блока — для «задано / пусто». */
export const ALL_KEYS = [...KEY_FIELDS.map((f) => f.name), VERIFY_NAME] as const;

/**
 * Права токена для цифр чужих профилей (Business Discovery, сверено с
 * developers.facebook.com/docs/instagram-platform/instagram-graph-api/
 * reference/ig-user/business_discovery, 06.11.2026): instagram_basic,
 * instagram_manage_insights, pages_read_engagement; pages_show_list и
 * business_management — чтобы найти Instagram-аккаунт по странице; ads_read —
 * если роль на странице выдана через Business Manager.
 */
export const FB_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "ads_read",
] as const;

/** Без этих Business Discovery не ответит. */
export const FB_SCOPES_NEEDED = ["instagram_basic", "instagram_manage_insights", "pages_read_engagement"] as const;

/** Пробелы и переносы, которые прилипают при копировании с телефона, — долой. */
export function cleanKey(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/^["'«“]+|["'»”]+$/g, "");
}

export type KeysInput = Partial<Record<KeyField, string>>;

/**
 * Что из формы записать: пустое поле — «не менять». Неверное — поле,
 * которое не прошло; тогда не пишется ничего, чтобы не оставить половину.
 * Токен Instagram (IGAA…) в поле токена Facebook — частая путаница: своя
 * причина, чтобы подсказать, где взять нужный.
 */
export function keysToSave(
  form: KeysInput,
): { ok: true; save: { name: KeyName; value: string }[] } | { ok: false; field: KeyField; why: "format" | "ig_token" } {
  const save: { name: KeyName; value: string }[] = [];
  for (const { field, name, pattern } of KEY_FIELDS) {
    const value = cleanKey(form[field] ?? "");
    if (!value) continue;
    if (field === "fbToken" && /^IG/.test(value)) return { ok: false, field, why: "ig_token" };
    if (!pattern.test(value)) return { ok: false, field, why: "format" };
    save.push({ name, value });
  }
  return { ok: true, save };
}

/** Причина отказа Meta — словами панели, а не текстом ошибки (в адрес страницы он не идёт). */
export type CheckFail = "no_token" | "token" | "short" | "scopes" | "no_ig" | "id" | "discovery" | "network" | "other";

type GraphError = { error?: { code?: unknown; error_subcode?: unknown; message?: unknown } };

/** Код ошибки Graph API → причина. 190 — токен не тот или истёк, 10/200–299 — нет права, 100/110 — нет такого. */
export function graphFail(body: unknown): CheckFail {
  const code = Number((body as GraphError | null)?.error?.code);
  if (code === 190 || code === 102) return "token";
  if (code === 10 || (code >= 200 && code <= 299)) return "scopes";
  if (code === 100 || code === 110) return "id";
  return "other";
}

/**
 * Ответ debug_token: живой ли токен, до какого числа и каких прав не
 * хватает. expires_at = 0 — бессрочный. Короткий (меньше суток) — тот, что
 * даёт Graph API Explorer: живёт час, его надо продлить до 60 дней.
 */
export function tokenInfo(
  body: unknown,
  now = Date.now(),
): { ok: true; expiresAt: number | null; short: boolean; missing: string[] } | { ok: false; reason: CheckFail } {
  const data = (body as { data?: { is_valid?: unknown; expires_at?: unknown; scopes?: unknown } } | null)?.data;
  if (!data) return { ok: false, reason: graphFail(body) };
  if (data.is_valid !== true) return { ok: false, reason: "token" };
  const at = Number(data.expires_at);
  const expiresAt = Number.isFinite(at) && at > 0 ? at * 1000 : null;
  const scopes = Array.isArray(data.scopes) ? data.scopes.map(String) : [];
  const missing = FB_SCOPES_NEEDED.filter((s) => !scopes.includes(s));
  return { ok: true, expiresAt, short: expiresAt !== null && expiresAt - now < 24 * 3600_000, missing };
}

/** Страницы токена → Instagram-аккаунты при них (me/accounts). */
export function igAccountsFrom(body: unknown): { id: string; username: string; page: string }[] {
  const list = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(list)) return [];
  const out: { id: string; username: string; page: string }[] = [];
  for (const page of list as { name?: unknown; instagram_business_account?: { id?: unknown; username?: unknown } }[]) {
    const ig = page?.instagram_business_account;
    const id = String(ig?.id ?? "");
    if (!/^\d{10,25}$/.test(id)) continue;
    out.push({ id, username: String(ig?.username ?? ""), page: String(page?.name ?? "").slice(0, 120) });
  }
  return out;
}

/** Свой аккаунт по номеру: ник и подписчики — или причина. */
export function ownAccount(body: unknown): { ok: true; username: string; followers: number | null } | { ok: false; reason: CheckFail } {
  const b = (body ?? {}) as { username?: unknown; followers_count?: unknown };
  if (typeof b.username === "string" && b.username) {
    return { ok: true, username: b.username, followers: typeof b.followers_count === "number" ? b.followers_count : null };
  }
  return { ok: false, reason: graphFail(body) };
}

/** Итог проверки — его помнит вкладка (blogger_settings «keys-check»). */
export type KeysCheck =
  | { ok: true; at: string; username: string; followers: number | null; expiresAt: string | null; found: boolean }
  | { ok: false; at: string; reason: CheckFail; missing?: string[] };

/** Сырой итог из базы → проверка или null. */
export function keysCheckOf(raw: unknown): KeysCheck | null {
  const v = raw as Partial<KeysCheck> | null;
  if (!v || typeof v !== "object" || typeof v.at !== "string") return null;
  if (v.ok === true && typeof (v as { username?: unknown }).username === "string") return v as KeysCheck;
  if (v.ok === false && typeof (v as { reason?: unknown }).reason === "string") return v as KeysCheck;
  return null;
}

/** Скоро кончится — за неделю: пора продлить токен. */
export const EXPIRY_WARN_MS = 7 * 24 * 3600_000;

export function expiresSoon(check: KeysCheck | null, now = Date.now()): boolean {
  return Boolean(check?.ok && check.expiresAt && Date.parse(check.expiresAt) - now < EXPIRY_WARN_MS);
}
