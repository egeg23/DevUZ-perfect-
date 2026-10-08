import { circleStart, saveCircle } from "@/lib/admin/circle-upload";
import { CIRCLE_MAX_BYTES, circleProblem, type CircleProblem } from "@/lib/admin/circle-rules";
import type { Staff } from "@/lib/admin/session";
import { appendChunk, discardUpload } from "@/lib/partners/promo-files";
import { PROMO_CHUNK_BYTES } from "@/lib/partners/promo-rules";
import { BOT_FILE_MAX_BYTES, downloadBotFile } from "@/lib/qualify/telegram";

/**
 * Кружок для касаний — пересылкой боту.
 *
 * 08.10.2026 кружок не ушёл ни одному из шестнадцати ответивших: его так и
 * не загрузили в «Аккаунтах», в «Избранном» рабочих аккаунтов было пусто, и
 * вместо кружка каждый раз уходило письмо. Владелец прислал кружок в чат
 * разработки и ждал, что он заработает. Кружок записывают в Telegram —
 * значит, и отдавать его проще всего там же: переслать боту студии. Бот
 * скачивает его и сохраняет тем же путём, что и загрузка в «Аккаунтах»
 * (lib/admin/circle-upload.ts), а скаут кладёт его в «Избранное» каждого
 * аккаунта.
 *
 * Менять кружок могут те же, кто в «Аккаунтах»: владелец и руководитель.
 */

/** Кто вправе заменить кружок: как в «Аккаунтах» (app/admin/accounts/actions.ts). */
export function changesCircle(staff: Pick<Staff, "role">): boolean {
  return staff.role === "admin" || staff.role === "head";
}

type VideoNote = { file_id: string; length?: number; duration?: number; file_size?: number };
type Video = { file_id: string; width?: number; height?: number; duration?: number; mime_type?: string; file_size?: number };

export type TgCircle = { fileId: string; mime: string; width: number | null; height: number | null; duration: number | null; bytes: number | null };

/** Кружок или квадратное видео в сообщении. Другое — null. */
export function circleFromMessage(message: { video_note?: VideoNote; video?: Video } | undefined): TgCircle | null {
  const note = message?.video_note;
  if (note?.file_id) {
    return {
      fileId: note.file_id,
      mime: "video/mp4",
      width: note.length ?? null,
      height: note.length ?? null,
      duration: note.duration ?? null,
      bytes: note.file_size ?? null,
    };
  }
  const video = message?.video;
  if (video?.file_id) {
    return {
      fileId: video.file_id,
      mime: video.mime_type || "video/mp4",
      width: video.width ?? null,
      height: video.height ?? null,
      duration: video.duration ?? null,
      bytes: video.file_size ?? null,
    };
  }
  return null;
}

export type CircleBotResult = { ok: true } | { ok: false; reason: CircleProblem | "bot_limit" | "download" | "save" };

export async function saveCircleFromBot(circle: TgCircle, staff: Staff): Promise<CircleBotResult> {
  // Сначала то, что видно без скачивания: формат, длина, форма.
  const early = circleProblem({ ...circle, bytes: circle.bytes ?? 1 });
  if (early) return { ok: false, reason: early };
  if ((circle.bytes ?? 0) > BOT_FILE_MAX_BYTES) return { ok: false, reason: "bot_limit" };

  const data = await downloadBotFile(circle.fileId, Math.min(BOT_FILE_MAX_BYTES, CIRCLE_MAX_BYTES));
  if (!data) return { ok: false, reason: "download" };

  const slot = await circleStart({ mime: circle.mime, bytes: data.byteLength });
  if (!slot.ok) return { ok: false, reason: "save" };
  for (let offset = 0; offset < data.byteLength; offset += PROMO_CHUNK_BYTES) {
    const part = await appendChunk(slot.uploadId, offset, data.subarray(offset, offset + PROMO_CHUNK_BYTES));
    if (!part.ok) {
      await discardUpload(slot.uploadId).catch(() => undefined);
      return { ok: false, reason: "save" };
    }
  }
  const saved = await saveCircle(
    { uploadId: slot.uploadId, width: circle.width, height: circle.height, duration: circle.duration },
    staff,
    null,
  );
  return saved.ok ? { ok: true } : { ok: false, reason: "save" };
}

/** Что ответить в боте. Бот пишет по-русски (CLAUDE.md, «Инструкции к панели»). */
export function circleBotReply(result: CircleBotResult): string {
  if (result.ok) {
    return "✅ Кружок сохранён для касаний. В течение 10 минут бот положит его в «Избранное» всех рабочих аккаунтов, и дальше он уходит тем, кто ответил по-русски на «Здравствуйте». Проверить — в панели, «Аккаунты» → «Кружок для касаний».";
  }
  const why: Record<Exclude<CircleBotResult, { ok: true }>["reason"], string> = {
    type: "это не видео MP4",
    size: "файл пустой или больше 50 МБ",
    meta: "Telegram не сказал длительность и размер видео",
    long: "видео длиннее минуты",
    short: "видео короче секунды",
    shape: "видео не квадратное, а кружок должен быть квадратным",
    bot_limit: "файл больше 20 МБ: такие бот скачать не может",
    download: "файл не скачался из Telegram",
    save: "файл не сохранился на сервере",
  };
  return `Кружок не сохранён: ${why[result.reason]}. Перешлите кружок ещё раз или загрузите файл в панели: «Аккаунты» → «Кружок для касаний».`;
}
