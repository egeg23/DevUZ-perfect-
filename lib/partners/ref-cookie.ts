/**
 * Кука партнёра: по чьей ссылке пришёл человек.
 *
 * Владелец, 28.09: «Сделай учёт по куки: если клиент сделает заказ по
 * ссылке партнёра в течение 30 дней — мы учтём этого лида к нему. Когда
 * клиент заходит по реф-ссылке, мы записываем куки и подкидываем куки к
 * этому клиенту».
 *
 * Кука ставится на сервере — короткой ссылкой (/r/…) и middleware на любой
 * странице с `?ref=` — и читается сервером при заявке: из формы, из чата на
 * сайте, при переходе из чата в бота. Скрипт браузера для этого не нужен, и
 * заявка из другой вкладки или после перезагрузки всё равно приходит с
 * кодом.
 *
 * В значении — код и время первого перехода: `КОД.секунды`. Время нужно не
 * браузеру (он и так выбросит куку через 30 дней), а нам: окно проверяется
 * и на сервере, а в карточке лида видно, сколько дней прошло от ссылки до
 * заявки.
 *
 * Модуль без импортов: его читает middleware, а там нет ни базы, ни
 * node:crypto.
 */

export const REF_COOKIE = "devuz_ref";
/** Сколько дней после перехода по ссылке заявка засчитывается партнёру. */
export const REF_TTL_DAYS = 30;
export const REF_TTL_SECONDS = REF_TTL_DAYS * 24 * 60 * 60;

const CODE_RE = /^[A-Z0-9_-]{3,24}$/;

export type RefMark = { code: string; at: number | null };

/** Значение куки: код и время первого перехода (секунды). */
export function formatRef(code: string, now: Date = new Date()): string {
  return `${code}.${Math.floor(now.getTime() / 1000)}`;
}

/**
 * Разобрать значение куки. Просроченная — как не было: окно держим и на
 * сервере, а не только сроком жизни куки в браузере. Старое значение без
 * времени (только код) принимается, но без даты.
 */
export function parseRef(raw: string | null | undefined, now: Date = new Date()): RefMark | null {
  if (!raw) return null;
  let value: string;
  try {
    value = decodeURIComponent(raw).trim();
  } catch {
    return null;
  }
  const [codePart, atPart] = value.split(".");
  const code = (codePart ?? "").toUpperCase();
  if (!CODE_RE.test(code)) return null;
  if (atPart === undefined) return { code, at: null };
  const at = Number(atPart);
  if (!Number.isInteger(at) || at <= 0) return null;
  if (now.getTime() / 1000 - at > REF_TTL_SECONDS) return null;
  return { code, at };
}

/** Кука из заголовка Cookie запроса. */
export function refFromHeader(header: string | null | undefined, now: Date = new Date()): RefMark | null {
  const match = (header ?? "").match(/(?:^|;\s*)devuz_ref=([^;]+)/);
  return match ? parseRef(match[1], now) : null;
}

/** Параметры куки — одни и те же у короткой ссылки и у middleware. */
export const REF_COOKIE_OPTIONS = {
  path: "/",
  maxAge: REF_TTL_SECONDS,
  sameSite: "lax" as const,
  // Не httpOnly: сайт переносит код в localStorage (lib/partners/client.ts)
  // для чата, открытого до перезагрузки. Секрета в коде нет — он и так в ссылке.
  httpOnly: false,
};
