/**
 * «Ваш лид ответил» — строка менеджеру, пока модель ведёт переписку.
 *
 * Владелец, 22.10.2026: «менеджерам в их тг от бота приходили сообщения:
 * ваш лид ответил, если хотите чтобы модель ответила сама через N минут,
 * проигнорируйте, подключаетесь когда будет больше информации». До этого
 * менеджер о ходе модели узнавал только при передаче разговора.
 *
 * Ответ модели при этом ждёт `REPLY_HOLD_MIN` минут от строки менеджеру —
 * чтобы «✋ Отвечу сам» успело его снять. Не нажал — модель отвечает сама.
 * Касание автопрогона до макета ничьё (`untilMockup`): писать некому,
 * модель отвечает с обычной паузой (`humanSendAfter`).
 */

export const REPLY_HOLD_MIN = 5;
export const REPLY_HOLD_MS = REPLY_HOLD_MIN * 60_000;

export const TAKE_OVER_BUTTON = "✋ Отвечу сам";

export function takeOverCallback(prospectId: string): string {
  return `tk:${prospectId}`;
}

/** Когда уходит ответ модели: не раньше паузы «как человек» и не раньше конца окна менеджера. */
export function heldUntil(humanAfter: string | null, now: number, notified: boolean): string | null {
  if (!notified) return humanAfter;
  const hold = now + REPLY_HOLD_MS;
  const human = humanAfter ? Date.parse(humanAfter) : 0;
  return new Date(Math.max(hold, Number.isFinite(human) ? human : 0)).toISOString();
}

/** Текст строки (HTML уже экранирован снаружи — `host` и `said` приходят экранированными). */
export function headsUpText(input: { host: string; said: string }): string {
  return [
    `💬 <b>Ваш лид ответил</b> · ${input.host}`,
    `«${input.said}»`,
    "",
    `Модель ответит сама через ${REPLY_HOLD_MIN} мин. Устраивает — ничего не нажимайте.`,
    "Подключайтесь, когда будет больше информации: бот напишет, когда клиент дойдёт до макета или разговор понадобится вам.",
  ].join("\n");
}

/** Что сказал клиент — одной строкой и коротко: целиком — в карточке. */
export function saidShort(body: string, max = 200): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
