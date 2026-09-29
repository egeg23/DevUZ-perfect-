import { DELIVER_HOUR, REPORT_HOUR, isWorkday, outcomeOf, tashkentHour } from "@/lib/admin/portion";

/**
 * Поток «Получать лиды» — правила. База и Telegram — в stream-store.
 *
 * Владелец, 29.09: «Сделать кнопку — получать лиды (в тг). Туда будут
 * прилетать компании без ограничений, пока не нажмут кнопку — не получать
 * лиды».
 *
 * Компании те же, что в порции дня, — из общего пула, с готовым текстом и
 * теми же кнопками. Без дневного лимита, но и не разом: у человека
 * одновременно не больше STREAM_BUFFER неразобранных, разобрал одну —
 * пришла следующая. Иначе «без ограничений» значило бы вывалить в личку
 * весь пул, и к вечеру он вернулся бы обратно нетронутым.
 */

/** Неразобранных компаний потока у человека одновременно — не больше. */
export const STREAM_BUFFER = 3;

/** Кнопки внизу чата с ботом — ровно этот текст приходит боту при нажатии. */
export const STREAM_ON = "▶️ Получать лиды";
export const STREAM_OFF = "⏸ Не получать лиды";

/**
 * Поток идёт по будням с 09:00 до 18:00 по Ташкенту — в часы порции.
 *
 * Не ночью: письмо от незнакомой студии в 23:00 — повод пожаловаться, а
 * в 18:00 несделанное за день возвращается в пул вместе с порцией.
 * Включённый поток не выключается сам: в следующий рабочий день он
 * продолжится после утренней порции.
 */
export function streamHours(now: Date): boolean {
  const hour = tashkentHour(now);
  return isWorkday(now) && hour >= DELIVER_HOUR && hour < REPORT_HOUR;
}

/** Сколько компаний долить, чтобы неразобранных стало STREAM_BUFFER. */
export function streamNeed(waiting: number): number {
  return Math.max(0, STREAM_BUFFER - waiting);
}

/**
 * Ждёт ли компания из потока человека: он её ещё не тронул, и её не забрал
 * другой (подготовил письмо в панели или написал сам). Забранная другим
 * место в потоке не держит — иначе поток встал бы до вечера.
 */
export function streamWaiting(
  p: { status: string; touched_by: string | null; touched_at: string | null; claimed_by: string | null },
  staffId: string,
  day: string,
): boolean {
  if (outcomeOf(p, staffId, day) !== null) return false;
  if (p.status !== "new" && p.status !== "contacting") return false;
  return !p.claimed_by || p.claimed_by === staffId;
}

export type StreamCommand = "on" | "off" | "toggle";

/**
 * Что прислал человек: кнопку внизу чата или команду /leads.
 *
 * Кнопку сравниваем без значка и регистра: старый Telegram может прислать
 * текст кнопки без эмодзи, а человек — набрать «получать лиды» руками.
 * /leads — переключатель: из меню команд бота не видно, включён ли поток.
 */
export function streamCommand(text: string | null | undefined): StreamCommand | null {
  const plain = (text ?? "")
    .trim()
    .replace(/^[^\p{L}/]+/u, "")
    .trim()
    .toLowerCase();
  if (!plain) return null;
  if (plain === "получать лиды") return "on";
  if (plain === "не получать лиды") return "off";
  if (plain.split(/[\s@]/)[0] === "/leads") return "toggle";
  return null;
}
