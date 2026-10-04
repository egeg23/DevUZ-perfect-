import { createHmac, timingSafeEqual } from "node:crypto";

import { helpVideoUrl } from "@/lib/admin/help-video-rules";
import { PROMO_MIME, isPromoPath } from "@/lib/partners/promo-rules";

/**
 * Подписанная ссылка на видео инструкции — чтобы видео шло без базы.
 *
 * Владелец, 05.10.2026: «видео в инструкции долго грузится». Плеер берёт
 * ролик кусками — при старте, по мере просмотра, при перемотке, — и раньше
 * каждый кусок проверял вход заново: сессия, сотрудник, продление сессии и
 * строка видео — четыре запроса подряд в базу во Франкфурте, а все исходящие
 * запросы сервера идут через прокси. Кусок ждал базу дольше, чем ехал сам.
 *
 * Теперь права проверяет страница инструкций: она открывается только
 * вошедшему и рисует видео только из открытых ему разделов. В ссылку она
 * кладёт путь файла, срок и подпись; маршрут файла сверяет подпись и отдаёт
 * кусок с диска сразу.
 *
 * Срок — окнами по 12 часов: ссылка одна и та же всё окно, поэтому браузер
 * при повторном просмотре берёт ролик из своего кэша, а не качает заново.
 * Живёт она от 12 до 24 часов — переслать её «на потом» не выйдет.
 *
 * Ключ подписи выводится из ключа сервиса Supabase: отдельного секрета на
 * сервере заводить не нужно, а сменили ключ — старые ссылки перестали работать.
 */

export const LINK_WINDOW_S = 12 * 3600;

function key(): Buffer | null {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return base ? createHmac("sha256", "devuz:help-video-link").update(base).digest() : null;
}

function sign(k: Buffer, id: string, path: string, exp: number): string {
  return createHmac("sha256", k).update(`${id}\n${path}\n${exp}`).digest("base64url");
}

/** Ссылка на файл видео; без ключа — обычная, с проверкой входа на каждый кусок. */
export function signedHelpVideoUrl(video: { id: string; storage_path: string }, nowMs = Date.now()): string {
  const k = key();
  if (!k || !isPromoPath(video.storage_path)) return helpVideoUrl(video.id);
  const exp = (Math.floor(nowMs / 1000 / LINK_WINDOW_S) + 2) * LINK_WINDOW_S;
  const query = new URLSearchParams({
    p: video.storage_path,
    e: String(exp),
    s: sign(k, video.id, video.storage_path, exp),
  });
  return `${helpVideoUrl(video.id)}?${query}`;
}

const MIME_BY_EXT = new Map(Object.entries(PROMO_MIME).map(([mime, ext]) => [ext, mime]));

/** Подпись сошлась и срок не вышел — путь и тип файла; иначе null. */
export function verifyHelpVideoLink(
  id: string,
  params: URLSearchParams,
  nowMs = Date.now(),
): { path: string; mime: string } | null {
  const k = key();
  if (!k) return null;
  const path = params.get("p") ?? "";
  const exp = Number(params.get("e"));
  const got = Buffer.from(params.get("s") ?? "");
  if (!isPromoPath(path) || !Number.isInteger(exp) || exp * 1000 <= nowMs) return null;
  const want = Buffer.from(sign(k, id, path, exp));
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const mime = MIME_BY_EXT.get(path.split(".").pop() ?? "");
  return mime?.startsWith("video/") ? { path, mime } : null;
}
