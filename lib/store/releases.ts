import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { productBySlug } from "@/content/products";
import { serviceClient } from "@/lib/supabase";

/**
 * Файлы продуктов.
 *
 * Заливает их владелец напрямую в приватный бакет со своего ноутбука, и
 * через сайт загрузки не будет: nginx режет тело запроса на 128 килобайтах
 * (deploy/nginx-devuz.conf), у контейнера нет томов, а public/ вшивается в
 * образ на сборке. Панель хранит путь и проверяет, что объект по нему
 * действительно есть.
 *
 * Проверка обязательна и делается при регистрации, а не при первой выдаче.
 * Опечатка в пути, замеченная в момент, когда покупатель уже заплатил и
 * нажал «скачать», — это худшая минута во всей сделке.
 */

export type Release = {
  id: string;
  product_slug: string;
  version: string;
  storage_bucket: string;
  storage_path: string;
  bytes: number | null;
  sha256: string | null;
  notes: string | null;
  released_at: string;
  is_current: boolean;
};

const COLUMNS =
  "id, product_slug, version, storage_bucket, storage_path, bytes, sha256, notes, released_at, is_current";

function shape(row: Record<string, unknown>): Release {
  return {
    id: row.id as string,
    product_slug: row.product_slug as string,
    version: row.version as string,
    storage_bucket: row.storage_bucket as string,
    storage_path: row.storage_path as string,
    bytes: (row.bytes as number | null) ?? null,
    sha256: (row.sha256 as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    released_at: row.released_at as string,
    is_current: Boolean(row.is_current),
  };
}

export async function listReleases(): Promise<Release[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("store_releases")
    .select(COLUMNS)
    .order("released_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("store: не прочитал релизы", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function currentRelease(productSlug: string): Promise<Release | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("store_releases")
    .select(COLUMNS)
    .eq("product_slug", productSlug)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    console.error("store: не прочитал актуальный релиз", error.message);
    return null;
  }
  return data ? shape(data as Record<string, unknown>) : null;
}

/**
 * Есть ли объект в бакете и сколько он весит.
 *
 * HEAD в клиенте Supabase не предусмотрен, поэтому спрашиваем список по
 * префиксу с точным именем. Это дороже HEAD ровно на ничего: список по
 * одному имени возвращает одну строку.
 */
async function probeObject(
  bucket: string,
  path: string,
): Promise<{ ok: true; bytes: number | null } | { ok: false; reason: string }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "Нет базы." };

  const slash = path.lastIndexOf("/");
  const dir = slash === -1 ? "" : path.slice(0, slash);
  const name = slash === -1 ? path : path.slice(slash + 1);

  const { data, error } = await db.storage.from(bucket).list(dir, { search: name, limit: 100 });
  if (error) return { ok: false, reason: `Хранилище ответило: ${error.message}` };

  // search — это поиск по подстроке, а не точное совпадение: «app.zip»
  // найдётся и по запросу «app». Сверяем имя сами.
  const found = (data ?? []).find((item) => item.name === name);
  if (!found) return { ok: false, reason: `В бакете «${bucket}» нет объекта «${path}».` };

  const size = (found.metadata as { size?: number } | null)?.size;
  return { ok: true, bytes: typeof size === "number" ? size : null };
}

export async function registerRelease(
  input: {
    productSlug: string;
    version: string;
    bucket: string;
    path: string;
    sha256: string;
    notes: string;
  },
  staff: Staff,
  ip: string,
): Promise<{ ok: true; bytes: number | null } | { ok: false; reason: string }> {
  if (!productBySlug(input.productSlug)) {
    return { ok: false, reason: `В каталоге нет продукта «${input.productSlug}».` };
  }

  const version = input.version.trim().slice(0, 60);
  const bucket = input.bucket.trim().slice(0, 100);
  const path = input.path.trim().replace(/^\/+/, "").slice(0, 500);
  if (!version || !bucket || !path) return { ok: false, reason: "Заполните версию, бакет и путь." };

  const sha = input.sha256.trim().toLowerCase().slice(0, 64);
  if (sha && !/^[0-9a-f]{64}$/.test(sha)) {
    return { ok: false, reason: "Контрольная сумма должна быть sha256 в hex, 64 знака." };
  }

  const probe = await probeObject(bucket, path);
  if (!probe.ok) return probe;

  const db = serviceClient();
  if (!db) return { ok: false, reason: "Нет базы." };

  // Прежний актуальный снимается до вставки нового: частичный уникальный
  // индекс иначе отвергнет вставку, и релиз просто не зарегистрируется.
  const { error: demote } = await db
    .from("store_releases")
    .update({ is_current: false })
    .eq("product_slug", input.productSlug)
    .eq("is_current", true);
  if (demote) return { ok: false, reason: demote.message };

  const { error } = await db.from("store_releases").insert({
    product_slug: input.productSlug,
    version,
    storage_bucket: bucket,
    storage_path: path,
    bytes: probe.bytes,
    sha256: sha || null,
    notes: input.notes.trim().slice(0, 1000) || null,
    created_by: staff.id,
    is_current: true,
  });
  if (error) return { ok: false, reason: error.message };

  await record("release.published", {
    actorStaffId: staff.id,
    targetType: "release",
    targetId: input.productSlug,
    ip,
    meta: { version, bucket, path, bytes: probe.bytes },
  });

  return { ok: true, bytes: probe.bytes };
}
