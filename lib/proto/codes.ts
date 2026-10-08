/**
 * Пароли на время к прототипам и витрине (раздел «Макеты»).
 *
 * Владелец, 08.10.2026: «Там же генерируется пароль на 24 часа для доступа
 * клиента, после пароль протухает».
 *
 * Пароль — пять цифр, как у закрытых витрин globalex: его диктуют голосом и
 * набирают на телефоне. В базе — только хеш (supabase/migrations/0094).
 * Перебор держат два предела: по адресу (PIN_LIMIT в lib/proto/lock) и по
 * самому макету (CODE_LIMIT) — за сутки жизни пароля это меньше тысячи
 * попыток из ста тысяч.
 *
 * Кука доступа — «id строки.подпись», подпись выводится из хеша пароля,
 * которого в браузере нет. Подделать её, не зная пароля, нельзя, а живёт
 * она ровно до той минуты, когда протухает сам пароль: сервер на каждом
 * открытии сверяет её с живой строкой в базе.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/** Сколько живёт пароль клиента. */
export const CODE_TTL_MS = 24 * 60 * 60_000;

/** Сколько живёт «Открыть» из панели — доступ команды. */
export const TEAM_TTL_MS = 12 * 60 * 60_000;

/** Попыток ввода на один макет в час — со всех адресов вместе. */
export const CODE_LIMIT = { limit: 30, windowMs: 60 * 60_000 } as const;

export type CodeKind = "client" | "team";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

/** Пять цифр, первая может быть нулём: «04817» — тоже пароль. */
export function newCode(): string {
  return String(randomInt(0, 100_000)).padStart(5, "0");
}

export function isCode(value: string): boolean {
  return /^[0-9]{5}$/.test(value);
}

/** Хеш пароля к прототипу — то, что лежит в proto_codes.code_hash. */
export function protoCodeHash(protoId: string, code: string): string {
  return sha(`proto:${protoId}:${code.trim()}`);
}

/**
 * Хеш пароля к витрине — тот же, что считает база в showcase_code_hash:
 * sha256 от «витрина:пароль» (supabase/migrations/0091).
 */
export function showcaseCodeHash(showcase: string, code: string): string {
  return sha(`${showcase}:${code.trim()}`);
}

export function codeCookieName(protoId: string): string {
  return `proto_key_${protoId.replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
}

function signature(codeHash: string): string {
  return sha(`${codeHash}:open`);
}

export function codeCookieValue(codeId: string, codeHash: string): string {
  return `${codeId}.${signature(codeHash)}`;
}

/** Что лежит в куке доступа: id строки и подпись. Ничего не проверяет — только разбирает. */
export function readCodeCookie(cookieHeader: string | null, protoId: string): { id: string; sig: string } | null {
  if (!cookieHeader) return null;
  const name = codeCookieName(protoId);
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== name) continue;
    const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(rest.join("="));
    return match ? { id: match[1], sig: match[2] } : null;
  }
  return null;
}

/** Подпись из куки сходится с хешем пароля из базы. */
export function codeCookieMatches(sig: string, codeHash: string): boolean {
  const x = Buffer.from(sig);
  const y = Buffer.from(signature(codeHash));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Кука живёт ровно до конца пароля — не дольше. */
export function codeCookieHeader(input: {
  protoId: string;
  token: string;
  codeId: string;
  codeHash: string;
  expiresAt: string;
  now?: number;
}): string {
  const left = Math.max(0, Math.floor((Date.parse(input.expiresAt) - (input.now ?? Date.now())) / 1000));
  return [
    `${codeCookieName(input.protoId)}=${codeCookieValue(input.codeId, input.codeHash)}`,
    `Path=/proto/${input.token}`,
    `Max-Age=${left}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}
