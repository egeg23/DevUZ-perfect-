/**
 * Прототип из нескольких страниц: адрес страницы внутри ссылки.
 *
 * Один прототип — одна ссылка `/proto/<токен>`; у сайта, где у каждого курса
 * или услуги своя страница, остальные живут под ней:
 * `/proto/<токен>/kurs/python`. Так макет показывает не картинку главной, а
 * устройство сайта целиком — свои адреса, заголовки и описания у каждой
 * страницы. Защита та же: страницы лежат в той же записи, с тем же
 * отпечатком, и каждое открытие пишется в журнал показа с адресом.
 *
 * Ссылки между страницами в html пишутся через PROTO_BASE: токен
 * подставляется при показе. Так страницу можно собрать до того, как у
 * прототипа появился токен, и не переписывать её при новом.
 */

/** Заглушка в html вместо `/proto/<токен>`. */
export const PROTO_BASE = "__PROTO_BASE__";

/** Подставить адрес прототипа вместо заглушки. */
export function withBase(html: string, token: string): string {
  return html.split(PROTO_BASE).join(`/proto/${token}`);
}

/**
 * Адрес страницы из частей пути — или null, если такого адреса быть не может.
 *
 * Только латиница в нижнем регистре, цифры и дефис, не глубже трёх уровней:
 * адрес — ключ в базе, и всё прочее (точки, кодированные символы, `..`) —
 * либо опечатка, либо попытка выйти за пределы прототипа.
 */
export function protoPagePath(segments: readonly string[]): string | null {
  if (!segments.length || segments.length > 3) return null;
  if (!segments.every((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part) && part.length <= 40)) return null;
  return segments.join("/");
}

/**
 * Служебные файлы прототипа «сайт как приложение» (прототип AUTOMECHANIC):
 * манифест и service worker живут под той же ссылкой, что и страницы, —
 * `/proto/<токен>/manifest`, `/proto/<токен>/sw`. Так у приложения своя
 * область (scope) — ровно этот прототип, — и манифест знает свой токен.
 *
 * Отдаются тем же способом, что страницы, но со своим типом: service worker
 * с типом text/html браузер не зарегистрирует. Отпечаток их не трогает —
 * он живёт только в стилях страниц.
 */
const FILE_TYPES: Record<string, string> = {
  manifest: "application/manifest+json; charset=utf-8",
  sw: "text/javascript; charset=utf-8",
};

/** Тип ответа для адреса внутри прототипа: служебный файл или страница. */
export function protoContentType(path: string): string {
  return FILE_TYPES[path.split("/").pop() ?? ""] ?? "text/html; charset=utf-8";
}

/**
 * Что не пишется в журнал показа: служебные файлы и офлайн-страница. Их
 * запрашивает сам телефон (service worker кладёт офлайн-страницу в память
 * при установке), а не человек, который открыл макет.
 */
export function isQuietProtoPath(path: string): boolean {
  const last = path.split("/").pop() ?? "";
  return last in FILE_TYPES || last === "offline";
}
