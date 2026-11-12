/**
 * Лимиты «Макета в боте».
 *
 * Владелец, 10.11.2026: «Но нужны лимиты: 1 аккаунт - 1 макет». 12.11.2026:
 * «Открываем для всех. Любой подписчик бота получает только 1 макет.
 * Менеджеры и сотрудники могут делать их без ограничений. Нет лимита 30 в
 * день.»
 *
 * - один Telegram-аккаунт — один макет навсегда;
 * - сотрудники (любая роль, по базе) — без лимита;
 * - дневного потолка на всех нет.
 */

/**
 * Кому открыт поток. С 12.11.2026 — всем, кто пишет боту («Открываем для
 * всех»). До этого, с 10.11.2026, был пилот: только владелец и руководитель.
 *
 * Откат — false: поток снова только активным admin и head (по базе, не по
 * нику), остальным /maket — неизвестная команда, приветствие прежнее.
 */
export const MOCKUP_BOT_OPEN = true;
export const PILOT_ROLES: readonly string[] = ["admin", "head"];

/** Пускать ли в поток. */
export function mayUseInstant(role: string | null, open = MOCKUP_BOT_OPEN): boolean {
  return open || (role !== null && PILOT_ROLES.includes(role));
}

/** Сколько ждём, пока идёт одна сборка: второй запрос того же человека — «уже собираем». */
export const RUN_HOLD_MS = 5 * 60_000;

export type LimitVerdict = "ok" | "has";

/** Клиенту — один макет на аккаунт, сотруднику — сколько нужно. */
export function limitVerdict(input: { staff: boolean; mine: number }): LimitVerdict {
  if (input.staff) return "ok";
  return input.mine > 0 ? "has" : "ok";
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
