/**
 * Какой файл примем как кружок — правила без базы и диска: их читает и
 * форма загрузки в браузере (components/admin/circle-upload.tsx).
 *
 * Кружок в Telegram — квадратное видео до минуты. Telegram сам обрезает его
 * до круга, поэтому записанный в приложении кружок (квадрат с белыми
 * углами) подходит как есть.
 */
export const CIRCLE_MIME = ["video/mp4"] as const;
export const CIRCLE_MAX_SECONDS = 60;
export const CIRCLE_MAX_BYTES = 50 * 1024 * 1024;

export type CircleProblem = "type" | "size" | "long" | "short" | "shape" | "meta";

/** Что не так с файлом. null — подходит. */
export function circleProblem(input: {
  mime: string;
  bytes: number;
  duration: number | null;
  width: number | null;
  height: number | null;
}): CircleProblem | null {
  if (!(CIRCLE_MIME as readonly string[]).includes(input.mime)) return "type";
  if (!(input.bytes > 0) || input.bytes > CIRCLE_MAX_BYTES) return "size";
  if (input.duration === null || input.width === null || input.height === null) return "meta";
  if (input.duration > CIRCLE_MAX_SECONDS + 0.5) return "long";
  if (input.duration < 1) return "short";
  // Почти квадрат: разница сторон до 10%.
  const big = Math.max(input.width, input.height);
  if (!big || Math.abs(input.width - input.height) / big > 0.1) return "shape";
  return null;
}
