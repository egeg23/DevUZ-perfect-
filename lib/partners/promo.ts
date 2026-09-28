import { randomUUID } from "node:crypto";

import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import {
  PROMO_BUCKET,
  PROMO_MAX_BYTES,
  PROMO_MIME,
  isPromoLocale,
  isPromoPath,
  promoFileName,
  promoPath,
  type PromoLocale,
} from "@/lib/partners/promo-rules";
import { listPartners, notifyPartner, type Partner } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { probeObject } from "@/lib/store/releases";
import { serviceClient } from "@/lib/supabase";

/**
 * Промо-материалы партнёров: ролики и картинки, которые партнёр берёт из
 * кабинета и публикует у себя со своей ссылкой.
 *
 * Файл идёт из браузера владельца прямо в хранилище, мимо нашего сервера:
 * nginx пропускает в панель до 25 МБ, server action — до 22, а ролик для
 * соцсетей бывает и больше. Сервер выдаёт одноразовую ссылку на загрузку
 * по пути, который придумал сам, и потом проверяет, что файл по этому
 * пути действительно лёг, — так же, как с релизами продуктов.
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

/**
 * Подписанные ссылки на превью — одним запросом на все материалы.
 *
 * Шесть часов: партнёр открывает кабинет, смотрит ролик, отвлекается — и
 * через час превью всё ещё играет. Для скачивания ссылка своя, короткая,
 * и выдаётся в момент нажатия.
 */
export async function promoPreviews(items: readonly PromoMaterial[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const db = serviceClient();
  if (!db || !items.length) return out;
  const { data, error } = await db.storage
    .from(PROMO_BUCKET)
    .createSignedUrls(
      items.map((item) => item.storage_path),
      6 * 60 * 60,
    );
  if (error) {
    console.error("promo: не подписал превью", error.message);
    return out;
  }
  const byPath = new Map(items.map((item) => [item.storage_path, item.id]));
  for (const row of data ?? []) {
    const id = row.path ? byPath.get(row.path) : undefined;
    if (id && row.signedUrl) out.set(id, row.signedUrl);
  }
  return out;
}

export type TicketResult = { ok: true; path: string; url: string } | { ok: false; reason: string };

/**
 * Одноразовая ссылка на загрузку файла в бакет.
 *
 * Путь придумывает сервер, тип и размер проверяются до загрузки: ролик на
 * 80 МБ хранилище отвергнет всё равно, но только после того, как владелец
 * прождёт его загрузку.
 */
export async function promoTicket(input: { mime: string; bytes: number }): Promise<TicketResult> {
  if (!PROMO_MIME[input.mime]) {
    return { ok: false, reason: "Такой файл не примем: нужен ролик MP4, MOV или WebM или картинка PNG, JPG, WebP, GIF." };
  }
  if (!Number.isFinite(input.bytes) || input.bytes <= 0) return { ok: false, reason: "Файл пустой." };
  if (input.bytes > PROMO_MAX_BYTES) {
    return {
      ok: false,
      reason: `Файл больше 50 МБ — хранилище его не примет. Сожмите ролик (1080×1920, H.264, 8–10 Мбит/с — минута укладывается в 50 МБ).`,
    };
  }
  const path = promoPath(input.mime, randomUUID());
  if (!path) return { ok: false, reason: "Не получилось придумать путь файла." };

  const db = serviceClient();
  if (!db) return { ok: false, reason: "Нет базы." };
  const { data, error } = await db.storage.from(PROMO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, reason: `Хранилище ответило: ${error?.message ?? "без ссылки"}` };
  return { ok: true, path, url: data.signedUrl };
}

export type PromoInput = {
  path: string;
  title: string;
  locale: string;
  caption: string;
  width: number | null;
  height: number | null;
  duration: number | null;
};

const clampInt = (value: number | null, max: number) =>
  value !== null && Number.isFinite(value) && value >= 1 && value <= max ? Math.round(value) : null;

/** Записать загруженный файл как материал — после проверки, что он лёг в бакет. */
export async function registerPromo(
  input: PromoInput,
  staff: Staff,
  ip: string,
): Promise<{ ok: true; material: PromoMaterial } | { ok: false; reason: string }> {
  if (!isPromoPath(input.path)) return { ok: false, reason: "Путь файла не наш — загрузите файл заново." };
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 120);
  if (title.length < 2) return { ok: false, reason: "Назовите материал — хотя бы два знака." };
  const locale = isPromoLocale(input.locale) ? input.locale : "all";
  const caption = input.caption.trim().slice(0, 1000) || null;

  const probe = await probeObject(PROMO_BUCKET, input.path);
  if (!probe.ok) return { ok: false, reason: `Файл не дошёл до хранилища. ${probe.reason}` };
  const ext = input.path.slice(input.path.lastIndexOf(".") + 1);
  const mime = Object.entries(PROMO_MIME).find(([, e]) => e === ext)?.[0];
  if (!mime) return { ok: false, reason: "Не разобрал тип файла." };
  if (probe.bytes !== null && probe.bytes > PROMO_MAX_BYTES) return { ok: false, reason: "Файл больше 50 МБ." };

  const db = serviceClient();
  if (!db) return { ok: false, reason: "Нет базы." };
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
      storage_path: input.path,
      mime,
      bytes: probe.bytes,
      width: clampInt(input.width, 10000),
      height: clampInt(input.height, 10000),
      duration_s: duration,
    })
    .select(COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: error?.message ?? "Не записал материал." };

  const material = shape(data as Record<string, unknown>);
  await record("partner.promo_added", {
    actorStaffId: staff.id,
    targetType: "partner_promo",
    targetId: material.id,
    ip,
    meta: { title, path: input.path, bytes: probe.bytes },
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
  const { error: storageError } = await db.storage.from(PROMO_BUCKET).remove([String(data.storage_path)]);
  if (storageError) console.error("promo: строку удалил, файл — нет", storageError.message);

  await record("partner.promo_deleted", {
    actorStaffId: staff.id,
    targetType: "partner_promo",
    targetId: id,
    ip,
    meta: { title: data.title, path: data.storage_path },
  });
  return { ok: true };
}

/**
 * Скачать: строка в журнале скачиваний и короткая подписанная ссылка с
 * именем файла. null — материала нет или он скрыт.
 *
 * Две минуты хватает, чтобы браузер начал загрузку; дальше ссылка не нужна.
 */
export async function promoDownload(id: string, partner: Partner): Promise<string | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db
    .from("partner_promo")
    .select("id, title, storage_path, mime, hidden")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.hidden) return null;

  const { data: signed, error } = await db.storage
    .from(PROMO_BUCKET)
    .createSignedUrl(String(data.storage_path), 120, {
      download: promoFileName(String(data.title), String(data.id), String(data.mime)),
    });
  if (error || !signed) {
    console.error("promo: не подписал скачивание", error?.message);
    return null;
  }
  const { error: logError } = await db.from("partner_promo_downloads").insert({ promo_id: id, partner_id: partner.id });
  if (logError) console.error("promo: не записал скачивание", logError.message);
  return signed.signedUrl;
}

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
