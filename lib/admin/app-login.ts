import { createHash, randomInt } from "node:crypto";

/**
 * Вход в установленное приложение панели — кодом из бота.
 *
 * Зачем. У приложения, поставленного на экран iPhone, свои куки — отдельные
 * от Safari. Ссылка входа из бота откроется в Safari, Safari войдёт, а
 * приложение так и останется на экране входа. Поэтому в приложении вход
 * другой: «Получить код в боте» → бот присылает этому сотруднику шесть
 * цифр → человек вводит их в приложении.
 *
 * Именно человек вводит код от бота, а не бот подтверждает код с экрана:
 * иначе чужое приложение могло бы подсунуть сотруднику свою ссылку, он
 * нажал бы «подтвердить» — и вошёл бы чужой. Здесь код видит только тот,
 * кому его прислал бот, и вводит его туда, где сам нажал кнопку.
 *
 * Попытка входа привязана к приложению: нажатие заводит строку
 * app_login_codes, её ключ — в куке приложения, и ссылка в бота несёт его
 * же. Код живёт 5 минут, гасится первым верным вводом, после 5 неверных —
 * только новый. Правила — здесь, без базы: их держит tests/web-push.test.ts.
 */

/** Сколько живёт код. */
export const APP_CODE_TTL_MS = 5 * 60_000;

/** Сколько неверных вводов, прежде чем код сгорит. */
export const APP_CODE_TRIES = 5;

/** Сколько живёт сама попытка входа, пока человек идёт в бота. */
export const APP_REQUEST_TTL_MS = 15 * 60_000;

/** Кука приложения с ключом попытки входа. */
export const APP_LOGIN_COOKIE = "devuz_app_login";

/** Начало команды бота: t.me/<бот>?start=app-<ключ>. */
export const APP_START_PREFIX = "app-";

export function appStartPayload(requestId: string): string {
  return `${APP_START_PREFIX}${requestId}`;
}

/** Ключ попытки из /start — или null, если это не вход в приложение. */
export function requestFromStart(payload: string): string | null {
  const match = /^app-([A-Za-z0-9_-]{22,60})$/.exec(payload.trim());
  return match ? match[1] : null;
}

/** Это вообще про вход в приложение — с ключом или без. */
export function isAppStart(payload: string): boolean {
  const p = payload.trim();
  return p === "app" || p.startsWith(APP_START_PREFIX);
}

export function requestHash(requestId: string): string {
  return createHash("sha256").update(`app-login:${requestId}`).digest("hex");
}

/** Шесть цифр из системного генератора. */
export function mintCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** В базе — только хеш кода, и свой у каждой попытки. */
export function codeHash(reqHash: string, code: string): string {
  return createHash("sha256").update(`${reqHash}:${code}`).digest("hex");
}

/** Что человек ввёл — в шесть цифр: пробелы и дефисы прощаем. */
export function normalizeCode(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

export type CodeRow = {
  staff_id: string | null;
  code_hash: string | null;
  attempts: number;
  expires_at: string | null;
  used_at: string | null;
};

export type CodeCheck = "ok" | "wrong" | "expired" | "used" | "spent" | "none";

/**
 * Ввод против строки попытки. «spent» — пять неверных уже было: дальше не
 * помогает даже верный код. «none» — бот ещё не прислал код (человек не
 * дошёл до бота или это не сотрудник).
 */
export function checkCode(row: CodeRow | null, reqHash: string, code: string, now: number): CodeCheck {
  if (!row || !row.code_hash || !row.staff_id || !row.expires_at) return "none";
  if (row.used_at) return "used";
  if (row.attempts >= APP_CODE_TRIES) return "spent";
  if (Date.parse(row.expires_at) <= now) return "expired";
  return codeHash(reqHash, code) === row.code_hash ? "ok" : "wrong";
}

/** Сообщение бота с кодом — только в личку, в пуш не зеркалится. */
export function codeMessage(code: string): string {
  return [
    "<b>Код для входа в приложение DevUz</b>",
    "",
    `<code>${code}</code>`,
    "",
    "Введите его в приложении. Код действует 5 минут и подходит один раз.",
    "Никому его не сообщайте, даже коллегам: с ним входят под вашим именем.",
  ].join("\n");
}

export const APP_START_NO_REQUEST =
  "Код для приложения выдаётся из самого приложения: откройте DevUz на телефоне и нажмите «Получить код в боте».";

export const APP_START_STALE =
  "Эта попытка входа устарела. Нажмите «Получить код в боте» в приложении ещё раз.";

/** «/start <ключ>» — ключ, иначе null. Регистр и @имя бота не мешают. */
export function startPayloadOf(text: string | null | undefined): string | null {
  const match = /^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/i.exec((text ?? "").trim());
  return match ? (match[1] ?? "") : null;
}

/**
 * Код без ссылки из приложения: кнопка внизу чата и команда /code
 * (владелец, 25.10.2026: «он отправляет в бот Start, но код не выдаёт.
 * Сделай отдельную кнопку для генерации кода в боте»). Код — к последнему
 * входу, начатому в приложении за 15 минут и ещё ничьему (или уже этого
 * сотрудника). Чужого входа так не открыть: код видит только тот, кому его
 * прислал бот, а подходит он только приложению, где нажали «Получить код в
 * боте».
 */
export const APP_CODE_BUTTON = "🔑 Код для приложения";

export function appCodeCommand(text: string | null | undefined): boolean {
  const plain = (text ?? "")
    .trim()
    .replace(/^[^\p{L}/]+/u, "")
    .trim()
    .toLowerCase();
  return /^\/code(?:@\w+)?$/.test(plain) || plain === "код для приложения";
}

export const APP_CODE_NONE =
  "Сначала откройте приложение DevUz на телефоне и нажмите «Получить код в боте». Потом здесь — «🔑 Код для приложения» или /code, и код придёт сразу.";
