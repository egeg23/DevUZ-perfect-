import { serviceClient } from "@/lib/supabase";
import { MAX_SIGNATURE_BYTES } from "@/lib/admin/upload-limits";

/**
 * Подпись владельца.
 *
 * Владелец: «я загружу тебе свою подпись в png, её нужно накладывать поверх
 * поля для подписи».
 *
 * Файл лежит в ПРИВАТНОМ хранилище и наружу не отдаётся никогда. Маршрут,
 * который его показывает, сначала проверяет две вещи: у смотрящего есть
 * сессия сотрудника, и договор подтверждён владельцем. Публичной ссылки на
 * подпись не существует — иначе достаточно один раз открыть договор, чтобы
 * забрать картинку и поставить её под чем угодно.
 *
 * Хранится один файл: подпись у владельца одна. Версии не нужны — нужна
 * возможность заменить, если подпись переснимут.
 */

const BUCKET = "private";
const PATH = "signature/owner.png";

/** Есть ли загруженная подпись. Нужно, чтобы честно сказать об этом в панели. */
export async function signatureExists(): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db.storage.from(BUCKET).list("signature", { limit: 100 });
  if (error || !data) return false;
  return data.some((f) => f.name === "owner.png");
}

/** Байты подписи. Возвращает null, если её нет или хранилище недоступно. */
export async function signatureBytes(): Promise<ArrayBuffer | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.storage.from(BUCKET).download(PATH);
  if (error || !data) return null;
  return await data.arrayBuffer();
}

/**
 * Загрузить подпись. Только владелец — проверяется вызывающим.
 *
 * PNG с прозрачным фоном: подпись накладывается поверх линии, и белый
 * прямоугольник вместо прозрачности закроет и линию, и подпись заказчика
 * рядом. Проверяем сигнатуру файла, а не расширение: расширение переименует
 * кто угодно, а восемь байт заголовка — нет.
 */
export async function saveSignature(bytes: ArrayBuffer): Promise<{ ok: boolean; why?: string }> {
  const head = new Uint8Array(bytes.slice(0, 8));
  const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (head.length < 8 || PNG_MAGIC.some((b, i) => head[i] !== b)) {
    return { ok: false, why: "Нужен файл PNG" };
  }
  if (bytes.byteLength > MAX_SIGNATURE_BYTES) return { ok: false, why: "Файл больше 2 МБ" };

  const db = serviceClient();
  if (!db) return { ok: false, why: "Хранилище недоступно" };

  const { error } = await db.storage
    .from(BUCKET)
    .upload(PATH, bytes, { contentType: "image/png", upsert: true });
  return error ? { ok: false, why: error.message } : { ok: true };
}
