import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Шифрование токенов ботов клиентов.
 *
 * Токен бота — это весь бот клиента: с ним можно читать его покупателей и
 * писать им от его имени. В базе он лежит зашифрованным AES-256-GCM, ключ —
 * `AI_STAFF_KEY` в .env или в хранилище секретов, не в базе. Дамп базы без
 * ключа токенов не отдаёт.
 *
 * Формат строки: v1.<iv>.<tag>.<данные>, всё в base64url.
 */

function keyBytes(key: string): Buffer {
  // Ключ любой длины сводится к 32 байтам: владелец кладёт в .env то, что
  // сгенерировал, и требовать от него ровно 32 байта в base64 незачем.
  return createHash("sha256").update(key).digest();
}

export function sealToken(plain: string, key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(key), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), data.toString("base64url")].join(".");
}

export function openToken(sealed: string, key: string): string | null {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(key), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Случайная строка для ключей виджета, секретов вебхуков и ссылок входа. */
export function randomKey(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Номер заявки: AI-ММДД-XXXX. Как у заявок студии (DZ-…), только с другой
 * приставкой, чтобы менеджер клиента и наша поддержка не путали их.
 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newRequestNo(now = new Date()): string {
  const day = `${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  let tail = "";
  for (const byte of randomBytes(4)) tail += ALPHABET[byte % ALPHABET.length];
  return `AI-${day}-${tail}`;
}
