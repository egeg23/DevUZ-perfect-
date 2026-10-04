import { randomUUID } from "node:crypto";

import { record } from "@/lib/admin/audit";
import {
  HELP_VIDEO_MIME,
  isHelpVideoLocale,
  isHelpVideoSection,
  type HelpVideoLocale,
} from "@/lib/admin/help-video-rules";
import type { Staff } from "@/lib/admin/session";
import { promoStart, type StartResult } from "@/lib/partners/promo";
import { discardUpload, finishUpload, removePromoFile, type PromoFail } from "@/lib/partners/promo-files";
import { serviceClient } from "@/lib/supabase";

/**
 * Видео к инструкциям панели (миграция 0085).
 *
 * Владелец, 04.10.2026: команда записывает видеоинструкции, и кнопка «Как
 * пользоваться разделом» должна вести к видео раздела, а под ним — к тексту.
 * Загружают владелец и руководитель прямо на странице «Инструкции».
 *
 * Файл едет на сервер кусками и ложится в ту же папку, что и промо-материалы
 * партнёров (lib/partners/promo-files.ts): загрузка, проверка сигнатуры,
 * место на диске и раздача с Range там уже есть и проверены. На раздел и язык
 * — одно видео: новое заменяет старое, старый файл стирается с диска.
 */

export type HelpVideo = {
  id: string;
  section: string;
  locale: HelpVideoLocale;
  storage_path: string;
  mime: string;
  bytes: number | null;
  duration_s: number | null;
  created_at: string;
};

const COLUMNS = "id, section, locale, storage_path, mime, bytes, duration_s, created_at";

function shape(row: Record<string, unknown>): HelpVideo | null {
  const locale = String(row.locale ?? "");
  if (!isHelpVideoLocale(locale)) return null;
  const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
  return {
    id: String(row.id),
    section: String(row.section),
    locale,
    storage_path: String(row.storage_path),
    mime: String(row.mime),
    bytes: num(row.bytes),
    duration_s: num(row.duration_s),
    created_at: String(row.created_at),
  };
}

/** Все видео. База недоступна — пустой список: инструкция открывается и без видео. */
export async function listHelpVideos(): Promise<HelpVideo[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db.from("help_videos").select(COLUMNS).limit(500);
  if (error) {
    console.error("help-videos: не прочитал список", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as Record<string, unknown>)).filter((v): v is HelpVideo => v !== null);
}

export async function helpVideoById(id: string): Promise<HelpVideo | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.from("help_videos").select(COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return shape(data as Record<string, unknown>);
}

/** Завести загрузку: только ролики — картинку промо-хранилище приняло бы, а здесь она не нужна. */
export async function helpVideoStart(input: { mime: string; bytes: number }): Promise<StartResult> {
  if (!HELP_VIDEO_MIME.includes(input.mime)) return { ok: false, reason: "bad_type" };
  return promoStart(input);
}

/**
 * Закончить загрузку и записать видео раздела. Было видео на этом языке —
 * его строка получает новый id (адрес файла меняется, и браузер не покажет
 * старое из кэша), а старый файл стирается.
 */
export async function saveHelpVideo(
  input: {
    uploadId: string;
    section: string;
    locale: string;
    width: number | null;
    height: number | null;
    duration: number | null;
  },
  actor: Staff,
  ip: string | null,
): Promise<{ ok: true } | PromoFail> {
  if (!isHelpVideoSection(input.section) || !isHelpVideoLocale(input.locale)) {
    await discardUpload(input.uploadId);
    return { ok: false, reason: "bad_upload" };
  }
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const finished = await finishUpload(input.uploadId);
  if (!finished.ok) return finished;
  if (!HELP_VIDEO_MIME.includes(finished.mime)) {
    await removePromoFile(finished.path);
    return { ok: false, reason: "bad_type" };
  }

  const { data: before } = await db
    .from("help_videos")
    .select("storage_path")
    .eq("section", input.section)
    .eq("locale", input.locale)
    .maybeSingle();

  const id = randomUUID();
  const size = (value: number | null) => (value && value > 0 && value <= 10000 ? Math.round(value) : null);
  const { error } = await db.from("help_videos").upsert(
    {
      id,
      section: input.section,
      locale: input.locale,
      storage_path: finished.path,
      mime: finished.mime,
      bytes: finished.bytes,
      width: size(input.width),
      height: size(input.height),
      duration_s: input.duration && input.duration > 0 && input.duration <= 3600 ? Math.round(input.duration * 10) / 10 : null,
      created_at: new Date().toISOString(),
      created_by: actor.id,
    },
    { onConflict: "section,locale" },
  );
  if (error) {
    await removePromoFile(finished.path);
    return { ok: false, reason: "failed", detail: error.message };
  }

  const old = (before as { storage_path?: string } | null)?.storage_path;
  if (old && old !== finished.path) await removePromoFile(old);

  await record("help_video.saved", {
    actorStaffId: actor.id,
    targetType: "help_video",
    targetId: id,
    meta: { section: input.section, locale: input.locale, bytes: finished.bytes, replaced: Boolean(old) },
    ip,
  });
  return { ok: true };
}

export async function removeHelpVideo(id: string, actor: Staff, ip: string | null): Promise<boolean> {
  const video = await helpVideoById(id);
  const db = serviceClient();
  if (!video || !db) return false;
  const { error } = await db.from("help_videos").delete().eq("id", video.id);
  if (error) return false;
  await removePromoFile(video.storage_path);
  await record("help_video.removed", {
    actorStaffId: actor.id,
    targetType: "help_video",
    targetId: video.id,
    meta: { section: video.section, locale: video.locale },
    ip,
  });
  return true;
}
