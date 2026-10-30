/**
 * Telegram заморозил аккаунт: любой метод отвечает FROZEN_METHOD_INVALID.
 *
 * 28–30.10.2026 так встали все четыре рабочих аккаунта: @SpamBot отвечал
 * «ограничений нет», ежечасная проверка заморозку не видела, а кода в
 * STOP_ERRORS не было — каждая попытка помечала компанию «не удалось», и
 * за три дня из работы выпали 348 компаний. Заморозка — про наш номер, не
 * про адресата: аккаунт встаёт, компания остаётся в работе
 * (outreach-queue.markFailed). Снимается обжалованием в самом Telegram.
 */
export const FROZEN_ERRORS = ["FROZEN_METHOD_INVALID", "FROZEN_PARTICIPANT_MISSING"];

export function isFrozenError(message: string): boolean {
  const upper = message.toUpperCase();
  return FROZEN_ERRORS.some((code) => upper.includes(code));
}
