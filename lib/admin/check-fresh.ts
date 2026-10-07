/**
 * Сколько живёт проверка сайта по факту (lib/audit/verify.ts). Сайт за три
 * дня может починиться или сломаться иначе — письмо о нём тогда пишется
 * заново.
 *
 * Отдельным модулем, без зависимостей: проверку читает не только отправка
 * письма (outreach-store), но и разговор (outreach-talk-store) — письмо
 * теперь уходит после ответа на «Здравствуйте», и свежесть смотрится ещё
 * раз в эту минуту.
 */
export const CHECK_FRESH_MS = 3 * 24 * 3600_000;

/** Проверка по факту свежая — по ней можно отправлять. */
export function checkFresh(checkedAt: string | null, now = Date.now()): boolean {
  const at = checkedAt ? Date.parse(checkedAt) : Number.NaN;
  return Number.isFinite(at) && now - at <= CHECK_FRESH_MS;
}
