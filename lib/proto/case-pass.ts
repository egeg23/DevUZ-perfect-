/**
 * Пропуск кейса: прототип, который сайт показывает в кейсах без пароля, не
 * закрывается для посетителя сайта паролем, выданным клиенту.
 *
 * Кнопка открытого кейса ведёт на `/proto/<токен>?from=case`
 * (lib/proto/case-link). Сервер, если токен — прототип открытого кейса
 * (`prototype.open` в content/cases.ts), ставит куку на этот токен и уводит
 * на тот же адрес без `?from`: дальше кука пускает и на главную, и на
 * внутренние страницы, и к ключу сцены (lib/proto/promo-store).
 *
 * Кука — не секрет: она пускает только туда, что и так открыто всем на
 * странице кейса. Подделать её значит нажать ту же кнопку. Пропадает
 * `open` у кейса — пропадает и пропуск: сервер каждый раз сверяет токен со
 * списком кейсов.
 */
import { cases, type Case } from "@/content/cases";
import { CASE_FROM } from "@/lib/proto/case-link";

export const CASE_COOKIE = "proto_case";
export const CASE_COOKIE_DAYS = 30;

/** Токены прототипов, которые кейс показывает без пароля. */
export function openCaseTokens(list: readonly Pick<Case, "prototype">[] = cases): Set<string> {
  const tokens = new Set<string>();
  for (const item of list) {
    const proto = item.prototype;
    if (proto?.open) tokens.add(proto.href.slice("/proto/".length));
  }
  return tokens;
}

const OPEN = openCaseTokens();

export function isOpenCase(token: string): boolean {
  return OPEN.has(token);
}

/** Пришёл кнопкой с сайта студии. */
export function wantsCasePass(url: URL): boolean {
  return url.searchParams.get("from") === CASE_FROM;
}

/** Кука привязана к адресу прототипа: к другому токену она не уходит. */
export function caseCookieHeader(token: string): string {
  return [
    `${CASE_COOKIE}=1`,
    `Path=/proto/${token}`,
    `Max-Age=${CASE_COOKIE_DAYS * 24 * 60 * 60}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function hasCaseCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => part.trim() === `${CASE_COOKIE}=1`);
}
