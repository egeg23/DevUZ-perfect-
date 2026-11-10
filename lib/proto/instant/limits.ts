/**
 * Лимиты «Макета в боте» (владелец, 10.11.2026: «Но нужны лимиты: 1 аккаунт
 * - 1 макет»).
 *
 * - один Telegram-аккаунт — один макет навсегда;
 * - на всех — не больше `DAILY_CAP` в день по Ташкенту (меняет владелец);
 * - сотрудники — без лимита: проверяют, как это выглядит у клиента.
 */
export const DAILY_CAP = 30;

/** Сколько ждём, пока идёт одна сборка: второй запрос того же человека — «уже собираем». */
export const RUN_HOLD_MS = 5 * 60_000;

export type LimitVerdict = "ok" | "has" | "day";

export function limitVerdict(input: { staff: boolean; mine: number; today: number; cap?: number }): LimitVerdict {
  if (input.staff) return "ok";
  if (input.mine > 0) return "has";
  if (input.today >= (input.cap ?? DAILY_CAP)) return "day";
  return "ok";
}

/** Начало дня по Ташкенту (UTC+5, без перехода на летнее время). */
export function tashkentDayStart(now: Date): Date {
  const shifted = new Date(now.getTime() + 5 * 3600_000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 5 * 3600_000);
}

/** Похоже ли на адрес сайта: домен с точкой, можно с https://. */
export function siteUrlOf(text: string): string | null {
  const raw = text.trim().split(/\s+/)[0] ?? "";
  if (/^@/.test(raw) || /instagram\.com|t\.me\//i.test(raw)) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
