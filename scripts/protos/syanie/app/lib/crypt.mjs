/* Ключи интеграций (amoCRM, Telegram, Wazzup) лежат в базе зашифрованными:
   AES-256-GCM, ключ — из APP_SECRET в .env на сервере. Копия базы без .env
   ключей не выдаёт. Пароли — scrypt с солью. */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function sealer(secret) {
  if (!secret || secret.length < 16) throw new Error("APP_SECRET не задан или короче 16 знаков");
  const key = createHash("sha256").update("syanie:" + secret).digest();
  return {
    seal(text) {
      const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key, iv);
      const body = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
      return "v1:" + Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
    },
    open(blob) {
      if (!blob || !blob.startsWith("v1:")) return "";
      const raw = Buffer.from(blob.slice(3), "base64");
      const d = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
      d.setAuthTag(raw.subarray(12, 28));
      return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
    },
  };
}

export function hashPass(pass) {
  const salt = randomBytes(16);
  return "s1:" + salt.toString("base64") + ":" + scryptSync(String(pass), salt, 32).toString("base64");
}

export function checkPass(pass, stored) {
  const [v, s, h] = String(stored || "").split(":");
  if (v !== "s1" || !s || !h) return false;
  const want = Buffer.from(h, "base64"), got = scryptSync(String(pass), Buffer.from(s, "base64"), want.length);
  return want.length === got.length && timingSafeEqual(want, got);
}

/* Сверка секрета за одно время: пустой ожидаемый не пускает никого. */
export function sameSecret(a, b) {
  if (!a || !b) return false;
  const x = createHash("sha256").update(String(a)).digest(), y = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(x, y);
}

export const token = (n = 24) => randomBytes(n).toString("base64url");
export const sha = (s) => createHash("sha256").update(String(s)).digest("hex");
