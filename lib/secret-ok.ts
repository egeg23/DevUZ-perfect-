/**
 * Сверка общего секрета из заголовка: вебхук Telegram, свип, отчёт смены.
 *
 * Пустой ожидаемый секрет — не пускаем никого: забытая переменная окружения
 * не должна открывать дверь. Сравнение — по хешам и за одно время: обычное
 * «===» выходит на первом несовпавшем знаке, и по времени ответа секрет в
 * теории угадывается по букве.
 */
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function secretOk(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected || typeof provided !== "string") return false;
  return timingSafeEqual(digest(provided), digest(expected));
}
