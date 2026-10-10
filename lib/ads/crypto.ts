import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { appSecret } from "@/lib/secrets";

/**
 * Ключи доступа к рекламным кабинетам клиентов — только зашифрованными.
 *
 * Токен Директа или Google равен праву тратить чужие деньги, а репозиторий
 * открыт. Поэтому в базе лежит AES-256-GCM, ключ — `ADS_TOKEN_KEY` (32 байта
 * в base64) в .env или хранилище секретов, и больше нигде. Утёкшая таблица
 * без ключа не даёт ничего; подменённая строка не расшифруется (GCM
 * проверяет целостность).
 *
 * Формат: `v1.<iv>.<tag>.<данные>`, всё base64url.
 */

export async function tokenKey(): Promise<Buffer | null> {
  const raw = await appSecret("ADS_TOKEN_KEY");
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

export function seal(value: unknown, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function open<T>(sealed: string, key: Buffer): T | null {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const text = Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
