import { randomUUID } from "node:crypto";

import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import {
  appendChunk,
  discardUpload,
  finishUpload,
  removePromoFile,
  startUpload,
  type PromoFail,
} from "@/lib/partners/promo-files";
import {
  PROMO_MAX_BYTES,
  PROMO_MIME,
  isPromoLocale,
  promoPath,
  type PromoLocale,
} from "@/lib/partners/promo-rules";
import { listPartners, notifyPartner, type Partner } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

export type { PromoFail, PromoReason } from "@/lib/partners/promo-files";

/**
 * Промо-материалы партнёров: ролики и картинки, которые партнёр берёт из
 * кабинета и публикует у себя со своей ссылкой.
 *
 * Файлы лежат на диске нашего сервера (lib/partners/promo-files.ts), в
 * базе — только строка о них: название, подпись, кто скачал. Владелец,
 * 29.09: «зачем Supabase? Мы не можем просто разместить на сервере… там же
 * лимит 50 МБ, а платную версию пока покупать не хочу». У бесплатного
 * Supabase и скачивания ограничены 5 ГБ в месяц, а у сервера их нет.
 */

export type PromoMaterial = {
  id: string;
  created_at: string;
  title: string;
  locale: PromoLocale;
  caption: string | null;
  storage_path: string;
  mime: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_s: number | null;
  hidden: boolean;
};

export type PromoStats = { downloads: number; partners: number };

const COLUMNS = "id, created_at, title, locale, caption, storage_path, mime, bytes, width, height, duration_s, hidden";

function shape(row: Record<string, unknown>): PromoMaterial {
  const locale = String(row.locale ?? "all");
  const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    title: String(row.title),
    locale: isPromoLocale(locale) ? locale : "all",
    caption: (row.caption as string | null) ?? null,
    storage_path: String(row.storage_path),
    mime: String(row.mime),
    bytes: num(row.bytes),
    width: num(row.width),
    height: num(row.height),
    duration_s: num(row.duration_s),
    hidden: Boolean(row.hidden),
  };
}

/** Материалы, новые сверху. Партнёру — только открытые. */
export async function listPromo(options: { withHidden: boolean }): Promise<PromoMaterial[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db.from("partner_promo").select(COLUMNS).order("created_at", { ascending: false }).limit(200);
  if (!options.withHidden) query = query.eq("hidden", false);
  const { data, error } = await query;
  if (error) {
    console.error("promo: не прочитал материалы", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/** Сколько раз скачали и сколько разных партнёров — для панели. */
export async function promoStats(): Promise<Map<string, PromoStats>> {
  const out = new Map<string, PromoStats>();
  const db = serviceClient();
  if (!db) return out;
  const { data, error } = await db.from("partner_promo_downloads").select("promo_id, partner_id").limit(20000);
  if (error) {
    console.error("promo: не прочитал скачивания", error.message);
    return out;
  }
  const people = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const id = String(row.promo_id);
    const stats = out.get(id) ?? { downloads: 0, partners: 0 };
    stats.downloads += 1;
    const set = people.get(id) ?? new Set<string>();
    set.add(String(row.partner_id));
    people.set(id, set);
    stats.partners = set.size;
    out.set(id, stats);
  }
  return out;
}

export type StartResult = { ok: true; uploadId: string } | PromoFail;

/**
 * Завести загрузку. Путь файла придумывает сервер, тип и размер проверяются
 * до первого байта: ролик на гигабайт сервер отвергнет всё равно, но лучше
 * сразу, чем после десяти минут ожидания.
 */
export async function promoStart(input: { mime: string; bytes: number }): Promise<StartResult> {
  if (!PROMO_MIME[input.mime]) {
    return { ok: false, reason: "bad_type" };
  }
  if (!Number.isInteger(input.bytes) || input.bytes <= 0) return { ok: false, reason: "empty" };
  if (input.bytes > PROMO_MAX_BYTES) {
    return { ok: false, reason: "too_big" };
  }
  const uploadId = randomUUID();
  const path = promoPath(input.mime, randomUUID());
  if (!path) return { ok: false, reason: "no_path" };
  const started = await startUpload({ uploadId, path, mime: input.mime, bytes: input.bytes });
  return started.ok ? { ok: true, uploadId } : started;
}

/** Очередной кусок файла. */
export async function promoChunk(uploadId: string, offset: number, data: Uint8Array) {
  return appendChunk(uploadId, offset, data);
}

export type PromoInput = {
  uploadId: string;
  title: string;
  locale: string;
  caption: string;
  width: number | null;
  height: number | null;
  duration: number | null;
};

const clampInt = (value: number | null, max: number) =>
  value !== null && Number.isFinite(value) && value >= 1 && value <= max ? Math.round(value) : null;

/** Записать загруженный файл как материал — после того, как он дошёл целиком и оказался тем, чем назван. */
export async function registerPromo(
  input: PromoInput,
  staff: Staff,
  ip: string,
): Promise<{ ok: true; material: PromoMaterial } | PromoFail> {
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 120);
  if (title.length < 2) return { ok: false, reason: "title" };
  const locale = isPromoLocale(input.locale) ? input.locale : "all";
  const caption = input.caption.trim().slice(0, 1000) || null;

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const file = await finishUpload(input.uploadId);
  if (!file.ok) return file;
  const duration =
    input.duration !== null && Number.isFinite(input.duration) && input.duration > 0 && input.duration <= 3600
      ? Math.round(input.duration * 10) / 10
      : null;
  const { data, error } = await db
    .from("partner_promo")
    .insert({
      created_by: staff.id,
      title,
      locale,
      caption,
      storage_path: file.path,
      mime: file.mime,
      bytes: file.bytes,
      width: clampInt(input.width, 10000),
      height: clampInt(input.height, 10000),
      duration_s: duration,
    })
    .select(COLUMNS)
    .single();
  if (error || !data) {
    // Файл без строки в базе никто не увидит и не удалит из панели.
    await removePromoFile(file.path);
    return { ok: false, reason: "failed", detail: error?.message };
  }

  const material = shape(data as Record<string, unknown>);
  await record("partner.promo_added", {
    actorStaffId: staff.id,
    targetType: "partner_promo",
    targetId: material.id,
    ip,
    meta: { title, path: file.path, bytes: file.bytes },
  });
  return { ok: true, material };
}

/** Поправить название, язык, подпись или видимость. */
export async function updatePromo(
  id: string,
  patch: { title?: string; locale?: string; caption?: string; hidden?: boolean },
  staff: Staff,
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: "offline" | "invalid" | "failed" }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim().replace(/\s+/g, " ").slice(0, 120);
    if (title.length < 2) return { ok: false, reason: "invalid" };
    update.title = title;
  }
  if (patch.locale !== undefined) update.locale = isPromoLocale(patch.locale) ? patch.locale : "all";
  if (patch.caption !== undefined) update.caption = patch.caption.trim().slice(0, 1000) || null;
  if (patch.hidden !== undefined) update.hidden = patch.hidden;
  if (!Object.keys(update).length) return { ok: true };

  const { error } = await db.from("partner_promo").update(update).eq("id", id);
  if (error) return { ok: false, reason: "failed" };
  await record("partner.promo_updated", {
    actorStaffId: staff.id,
    targetType: "partner_promo",
    targetId: id,
    ip,
    meta: update,
  });
  return { ok: true };
}

/** Удалить насовсем: и строку, и файл. Скачанные партнёрами копии остаются у них. */
export async function deletePromo(
  id: string,
  staff: Staff,
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: "offline" | "gone" | "failed" }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { data } = await db.from("partner_promo").select("title, storage_path").eq("id", id).maybeSingle();
  if (!data) return { ok: false, reason: "gone" };

  // Сначала строка, потом файл: наоборот партнёр успел бы увидеть материал,
  // который уже не скачивается.
  const { error } = await db.from("partner_promo").delete().eq("id", id);
  if (error) return { ok: false, reason: "failed" };
  await removePromoFile(String(data.storage_path)).catch((e: Error) => console.error("promo: строку удалил, файл — нет", e.message));

  await record("partner.promo_deleted", {
    actorStaffId: staff.id,
    targetType: "partner_promo",
    targetId: id,
    ip,
    meta: { title: data.title, path: data.storage_path },
  });
  return { ok: true };
}

/** Материал для раздачи по id; скрытый — только владельцу. */
export async function promoById(id: string): Promise<PromoMaterial | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db.from("partner_promo").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}

/** Строка в журнале скачиваний: по ней владелец видит, что партнёрам нужно. */
export async function logPromoDownload(id: string, partner: Partner): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("partner_promo_downloads").insert({ promo_id: id, partner_id: partner.id });
  if (error) console.error("promo: не записал скачивание", error.message);
}

export { discardUpload as promoDiscard };

/**
 * Сообщить партнёрам в Telegram, что появился новый материал.
 *
 * По одному сообщению с паузой: Telegram режет больше тридцати в секунду,
 * а сообщение, отвергнутое на тридцать первом партнёре, никто не повторит.
 */
export async function announcePromo(material: PromoMaterial): Promise<number> {
  const partners = (await listPartners()).filter((p) => p.status === "active" && p.telegram_user_id !== null);
  const text =
    `🎬 В кабинете партнёра новый промо-материал: «${esc(material.title)}».\n\n` +
    "Скачайте и опубликуйте у себя — подпись к посту с вашей ссылкой уже готова: /cabinet";
  let sent = 0;
  for (const partner of partners) {
    await notifyPartner(partner, text);
    sent += 1;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  return sent;
}
