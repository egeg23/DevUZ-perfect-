import { roadFetch } from "@/lib/egress.mjs";
import { blocksOf, withUtm, type Platform } from "@/lib/outside/posts";
import { appSecret, saveAppSecret } from "@/lib/secrets";

/**
 * vc.ru — публикация тем же API, которым пользуется их веб-редактор.
 *
 * Владелец, 22.11.2026: «Давай сделаем авто постинг для vc.ru», на
 * предупреждение, что открытого API у vc.ru нет и аккаунт можно потерять:
 * «Автоматизируй все! … Любыми способом надо автоматизировать». Документации
 * у этого API нет (её убрали в 2026), поэтому всё ниже — то, что делает сам
 * редактор vc.ru в браузере:
 *   вход — POST api.vc.ru/v3.4/auth/email/login {email, password} → пара
 *   ключей; дальше POST v3.4/auth/refresh {token} даёт новую пару (ключ
 *   обновления меняется при каждом обновлении, новый пишем в хранилище);
 *   запросы — заголовок `JWTAuthorization: Bearer <ключ доступа>`;
 *   черновик — POST v2.1/editor, форма с полем `entry` (JSON записи), ответ —
 *   запись с номером; публикация — POST v2.1/editor/<номер>/publish.
 * Поменяют API — публикация вернёт причину, черновик останется в «Ждут
 * публикации», и его опубликует человек, как раньше.
 *
 * Почта и пароль аккаунта студии — в хранилище секретов
 * (`app.VCRU_LOGIN`, JSON), ключ обновления — `app.VCRU_REFRESH`. В коде,
 * журнале и на экране их нет. Адрес фиксированный — roadFetch.
 */

export const VCRU_LOGIN_KEY = "VCRU_LOGIN";
export const VCRU_REFRESH_KEY = "VCRU_REFRESH";
export const VCRU_API = "https://api.vc.ru";
export const VCRU_AUTH = `${VCRU_API}/v3.4/auth`;
export const VCRU_VERSION = "v2.1";

/** Блок записи vc.ru — как его сохраняет их редактор. */
export type VcruBlock = {
  type: "text" | "header" | "list";
  cover: false;
  hidden: false;
  anchor: "";
  data: { text?: string; style?: "h2"; items?: string[]; type?: "UL" };
};

function escHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const LINK = /\[([^\]\n]{1,120})\]\((https?:\/\/[^)\s]+)\)/g;

/** Строка с разметкой → HTML их редактора: только <a>, <b>, остальное экранировано. */
function inline(text: string, platform: Platform, topicKey: string): string {
  let out = "";
  let at = 0;
  const plain = (chunk: string) => escHtml(chunk).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  for (const m of text.matchAll(LINK)) {
    out += plain(text.slice(at, m.index));
    out += `<a href="${escHtml(withUtm(m[2], platform, topicKey))}" target="_blank">${escHtml(m[1])}</a>`;
    at = (m.index ?? 0) + m[0].length;
  }
  return out + plain(text.slice(at));
}

const block = (type: VcruBlock["type"], data: VcruBlock["data"]): VcruBlock => ({ type, cover: false, hidden: false, anchor: "", data });

/** Текст черновика → блоки записи: абзац — text с <p>, «## » — header h2, пункты подряд — list UL. */
export function vcruBlocks(body: string, platform: Platform, topicKey: string): VcruBlock[] {
  const out: VcruBlock[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(block("list", { items: list, type: "UL" }));
    list = [];
  };
  for (const b of blocksOf(body)) {
    if (b.kind === "li") {
      list.push(inline(b.text, platform, topicKey));
      continue;
    }
    flush();
    out.push(b.kind === "h" ? block("header", { text: inline(b.text, platform, topicKey), style: "h2" }) : block("text", { text: `<p>${inline(b.text, platform, topicKey)}</p>` }));
  }
  flush();
  return out;
}

/** Запись для POST editor — поля как у их редактора (новая запись: id 0). */
export function vcruEntry(subsiteId: number, title: string, body: string, platform: Platform, topicKey: string) {
  return {
    id: 0,
    user_id: subsiteId,
    type: 1,
    subsite_id: subsiteId,
    title: title.slice(0, 120),
    entry: { blocks: vcruBlocks(body, platform, topicKey) },
    external_access_link: "",
    path: "",
    is_editorial: false,
    is_advertisement: false,
    is_enabled_comments: true,
    is_enabled_likes: true,
    withheld: false,
    is_enabled_ad: true,
    is_holdonflash: false,
    forced_to_mainpage: 0,
    is_holdonmain: false,
    is_published: false,
    is_adult: false,
    repostId: null,
    repostData: null,
  };
}

/** Запрос к API: адрес и тело формы (ключ — в заголовке, не в адресе). */
export function vcruRequest(path: string, fields: Record<string, string>, access?: string): { url: string; init: RequestInit } {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return {
    url: path.startsWith("https://") ? path : `${VCRU_API}/${VCRU_VERSION}/${path}`,
    init: { method: "POST", headers: access ? { JWTAuthorization: `Bearer ${access}` } : {}, body: form },
  };
}

/** Ответ API: `data` у успешного, причина — словами. */
export function vcruAnswer(status: number, json: unknown): { data: Record<string, unknown> } | { error: string } {
  const r = (json ?? {}) as { data?: unknown; result?: unknown; message?: unknown; code?: unknown };
  const data = (r.data ?? r.result) as Record<string, unknown> | undefined;
  if (status >= 200 && status < 300 && data && typeof data === "object" && r.code === undefined) return { data };
  if (status === 401 || r.code === 104) return { error: "vc.ru не принял вход: проверьте почту и пароль в «Статьях на площадках»" };
  if (status === 429) return { error: "vc.ru: слишком часто, повторим позже" };
  const message = typeof r.message === "string" ? r.message.slice(0, 160) : "";
  return { error: `vc.ru ответил ${status}${message ? `: ${message}` : ""}` };
}

async function call(path: string, fields: Record<string, string>, access?: string): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const { url, init } = vcruRequest(path, fields, access);
  try {
    const response = await roadFetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
    const json = await response.json().catch(() => null);
    return vcruAnswer(response.status, json);
  } catch (error) {
    return { error: `vc.ru недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

type Pair = { accessToken: string; refreshToken: string };

function pairOf(data: Record<string, unknown>): Pair | null {
  const a = data.accessToken;
  const r = data.refreshToken;
  return typeof a === "string" && a && typeof r === "string" && r ? { accessToken: a, refreshToken: r } : null;
}

export type VcruLogin = { email: string; password: string };

/** Почта и пароль из хранилища (JSON). */
export function parseLogin(raw: string | null | undefined): VcruLogin | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { email?: unknown; password?: unknown };
    return typeof v.email === "string" && typeof v.password === "string" && v.email && v.password ? { email: v.email, password: v.password } : null;
  } catch {
    return null;
  }
}

/** Вход по почте и паролю: пара ключей или причина. */
export async function vcruSignIn(login: VcruLogin): Promise<Pair | { error: string }> {
  const res = await call(`${VCRU_AUTH}/email/login`, { email: login.email, password: login.password });
  if ("error" in res) return res;
  return pairOf(res.data) ?? { error: "vc.ru не выдал ключи входа" };
}

/**
 * Ключ доступа: сначала по сохранённому ключу обновления (его меняет каждое
 * обновление — новый сразу в хранилище), не вышло — вход по почте и паролю.
 */
export async function vcruAccess(): Promise<string | { error: string }> {
  const refresh = await appSecret(VCRU_REFRESH_KEY);
  if (refresh) {
    const res = await call(`${VCRU_AUTH}/refresh`, { token: refresh });
    const pair = "data" in res ? pairOf(res.data) : null;
    if (pair) {
      await saveAppSecret(VCRU_REFRESH_KEY, pair.refreshToken);
      return pair.accessToken;
    }
  }
  const login = parseLogin(await appSecret(VCRU_LOGIN_KEY));
  if (!login) return { error: "вход vc.ru не задан" };
  const pair = await vcruSignIn(login);
  if ("error" in pair) return pair;
  await saveAppSecret(VCRU_REFRESH_KEY, pair.refreshToken);
  return pair.accessToken;
}

export type VcruMe = { id: number; name: string; url: string };

/** Чей аккаунт: GET subsite/me (их редактор пишет от имени этого сайта). */
export async function vcruMe(access: string): Promise<VcruMe | { error: string }> {
  try {
    const response = await roadFetch(`${VCRU_API}/${VCRU_VERSION}/subsite/me`, {
      headers: { JWTAuthorization: `Bearer ${access}` },
      signal: AbortSignal.timeout(20_000),
    });
    const res = vcruAnswer(response.status, await response.json().catch(() => null));
    if ("error" in res) return res;
    const id = Number(res.data.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "vc.ru не назвал аккаунт" };
    return { id, name: String(res.data.name ?? "").slice(0, 120), url: typeof res.data.url === "string" ? res.data.url : `https://vc.ru/id${id}` };
  } catch (error) {
    return { error: `vc.ru недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Адрес записи из ответа редактора; нет — короткий адрес по номеру (vc.ru ведёт его на запись). */
export function entryUrl(data: Record<string, unknown>, id: number): string {
  const url = typeof data.url === "string" ? data.url : "";
  return /^https:\/\/vc\.ru\/.+/.test(url) ? url : `https://vc.ru/${id}`;
}

/** Черновик и публикация: адрес вышедшей статьи или почему не вышло. */
export async function vcruPublish(title: string, body: string, platform: Platform, topicKey: string): Promise<{ url: string } | { error: string }> {
  const access = await vcruAccess();
  if (typeof access !== "string") return access;
  const me = await vcruMe(access);
  if ("error" in me) return me;
  const saved = await call("editor", { entry: JSON.stringify(vcruEntry(me.id, title, body, platform, topicKey)) }, access);
  if ("error" in saved) return saved;
  const entry = (saved.data.entry ?? saved.data) as Record<string, unknown>;
  const id = Number(entry.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "vc.ru не вернул номер черновика" };
  const published = await call(`editor/${id}/publish`, {}, access);
  if ("error" in published) return { error: `черновик ${id} создан, но не опубликован: ${published.error}` };
  return { url: entryUrl(entry, id) };
}

/** Есть ли что-то для входа. */
export async function vcruReady(): Promise<boolean> {
  return Boolean((await appSecret(VCRU_REFRESH_KEY)) || parseLogin(await appSecret(VCRU_LOGIN_KEY)));
}

