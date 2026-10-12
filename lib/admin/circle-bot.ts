import { isCircleLang, type CircleLang } from "@/lib/admin/circle-store";
import { circleStart, saveCircle } from "@/lib/admin/circle-upload";
import { CIRCLE_MAX_BYTES, circleProblem, type CircleProblem } from "@/lib/admin/circle-rules";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";
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
 *
 * Кружков два — русский и узбекский (владелец, 12.10.2026). По видео язык не
 * узнать, поэтому бот спрашивает кнопками «🇷🇺 Русский» / «🇺🇿 O‘zbekcha»:
 * кружок ждёт ответа в базе (CIRCLE_PENDING), а нажатие сохраняет его на
 * выбранном языке.
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

export async function saveCircleFromBot(circle: TgCircle, staff: Staff, lang: CircleLang = "ru"): Promise<CircleBotResult> {
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
    lang,
  );
  return saved.ok ? { ok: true } : { ok: false, reason: "save" };
}

/** Кнопки языка под присланным кружком: «cl:<язык>:<номер сообщения с кружком>». */
export const CIRCLE_CALLBACK = "cl";

export const circleLangQuestion =
  "На каком языке этот кружок? Русский уходит тем, кто ответил на «Здравствуйте» по-русски, узбекский — тем, кто ответил по-узбекски.";

export function circleLangButtons(messageId: number): { text: string; callback_data: string }[] {
  return [
    { text: "🇷🇺 Русский", callback_data: `${CIRCLE_CALLBACK}:ru:${messageId}` },
    { text: "🇺🇿 O‘zbekcha", callback_data: `${CIRCLE_CALLBACK}:uz:${messageId}` },
  ];
}

/** Нажатие кнопки языка: язык и номер сообщения с кружком. Чужое — null. */
export function circleChoice(parts: readonly string[]): { lang: CircleLang; messageId: number } | null {
  if (parts[0] !== CIRCLE_CALLBACK || !isCircleLang(parts[1])) return null;
  const messageId = Number(parts[2]);
  return Number.isInteger(messageId) && messageId > 0 ? { lang: parts[1], messageId } : null;
}

/** Кружок, который ждёт выбора языка: чат и номер сообщения с ним. */
const pendingKey = (chatId: number | string, messageId: number) => `tg-circle-pending:${chatId}:${messageId}`;

/** Сколько кружок ждёт кнопки: дольше — пусть перешлют заново. */
export const CIRCLE_PENDING_MS = 24 * 3600_000;

export async function holdCircle(chatId: number | string, messageId: number, circle: TgCircle, now = Date.now()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("stats_snapshots")
    .upsert(
      { key: pendingKey(chatId, messageId), payload: { circle, at: now }, computed_at: new Date(now).toISOString() },
      { onConflict: "key" },
    );
  return !error;
}

/**
 * Забрать кружок, ждущий кнопки, — один раз: второе нажатие (на ту же или
 * другую кнопку) получает null, а не сохраняет кружок дважды.
 */
export async function takeCircle(chatId: number | string, messageId: number, now = Date.now()): Promise<TgCircle | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").delete().eq("key", pendingKey(chatId, messageId)).select("payload");
  const payload = (data?.[0] as { payload?: { circle?: TgCircle; at?: number } } | undefined)?.payload;
  if (!payload?.circle?.fileId || typeof payload.at !== "number" || now - payload.at > CIRCLE_PENDING_MS) return null;
  return payload.circle;
}

/** Что ответить в боте. Бот пишет по-русски (CLAUDE.md, «Инструкции к панели»). */
export function circleBotReply(result: CircleBotResult, lang: CircleLang = "ru"): string {
  if (result.ok) {
    const who = lang === "uz" ? "по-узбекски" : "по-русски";
    const which = lang === "uz" ? "Узбекский кружок" : "Русский кружок";
    return `✅ ${which} сохранён для касаний. В течение 10 минут бот положит его в «Избранное» всех рабочих аккаунтов, и дальше он уходит тем, кто ответил ${who} на «Здравствуйте». Проверить — в панели, «Аккаунты» → «Кружок для касаний».`;
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
