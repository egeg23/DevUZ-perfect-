import { mediaKindOf, mediaName, mediaProblem, type BroadcastMedia, type MediaProblem } from "@/lib/admin/broadcast";
import type { Staff } from "@/lib/admin/session";
import { uploadBroadcastMedia } from "@/lib/qualify/telegram";

/**
 * Вложение рассылки в бот (фото, GIF, видео, файл) — загрузка в Telegram.
 * Правила — lib/admin/broadcast.ts; рассылки сотрудникам и пользователям
 * бота (broadcast-store.ts, bot-users-store.ts) зовут отсюда.
 */

/** Файл из формы рассылки — уже прочитанный сервером. */
export type MediaFile = { bytes: Uint8Array<ArrayBuffer>; name: string; type: string; size: number };

export type MediaFailure = MediaProblem | "nochat" | "media_failed";

/**
 * Загрузить вложение в Telegram: автору в личку, с подписью — он видит, как
 * придёт; в ответ — file_id для рассылки. Без Telegram у автора загрузить
 * некуда — рассылка с вложением не создаётся.
 */
export async function prepareMedia(file: MediaFile, actor: Staff): Promise<BroadcastMedia | MediaFailure> {
  const problem = mediaProblem(file);
  if (problem) return problem;
  const chat = Number(actor.telegram_user_id);
  if (!chat) return "nochat";
  const kind = mediaKindOf(file);
  const name = mediaName(file.name);
  const fileId = await uploadBroadcastMedia(chat, { ...file, name }, kind, "📎 Вложение для рассылки: так его увидят получатели.");
  return fileId ? { kind, fileId, name } : "media_failed";
}

/** Колонки вложения для вставки; без вложения — пусто (рассылка как раньше). */
export function mediaColumns(media: BroadcastMedia | null): Record<string, string> {
  return media ? { media_kind: media.kind, media_file_id: media.fileId, media_name: media.name } : {};
}
