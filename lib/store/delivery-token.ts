import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ссылка на скачивание купленного кода.
 *
 * Почему покупателю нельзя отдать подписанную ссылку Supabase напрямую —
 * это не осторожность на всякий случай, а прямое следствие документации
 * хранилища:
 *
 *   1. Подписанная ссылка не отзывается ничем, кроме обращения в поддержку.
 *      Она подписана отдельным внутренним ключом проекта и переживает
 *      ротацию и отзыв любых ключей аутентификации.
 *   2. Ответ по ней оседает в CDN, и кэш не сбрасывается вместе с
 *      истечением токена — ссылка может отдавать файл дольше собственного
 *      срока годности.
 *
 * Значит выданная один раз ссылка Supabase — это выданный навсегда доступ.
 * Поэтому покупатель держит токен отсюда, а подписанная ссылка на минуту
 * выпускается заново на каждый клик, после проверки прав.
 *
 * Подписывается тройка (заказ, продукт, версия права). Версия — это и есть
 * рубильник: инкремент orders.entitlement_version делает все выданные
 * токены недействительными одним UPDATE, без похода в хранилище и без
 * изменения самих файлов.
 */

export type DeliveryClaim = {
  orderId: string;
  productSlug: string;
  entitlementVersion: number;
};

function secret(): string | null {
  const value = (process.env.DOWNLOAD_SIGNING_SECRET ?? "").trim();
  // Короткий секрет хуже отсутствующего: он создаёт видимость подписи.
  // Лучше выключить выдачу целиком и сказать об этом в панели.
  return value.length >= 32 ? value : null;
}

export function deliveryConfigured(): boolean {
  return secret() !== null;
}

function payload(claim: DeliveryClaim): string {
  // Разделитель, которого нет ни в uuid, ни в slug, ни в числе. Иначе
  // «order:product» и «order:pro» + «duct» подписались бы одинаково.
  return `${claim.orderId}|${claim.productSlug}|${claim.entitlementVersion}`;
}

export function signDelivery(claim: DeliveryClaim): string | null {
  const key = secret();
  if (!key) return null;

  const body = Buffer.from(payload(claim), "utf8").toString("base64url");
  const mac = createHmac("sha256", key).update(body, "utf8").digest("base64url");
  return `${body}.${mac}`;
}

/**
 * Разбор токена.
 *
 * Возвращает только то, что покупатель утверждает. Совпадает ли версия
 * права с текущей, оплачен ли заказ и не исчерпаны ли лимиты — решает
 * вызывающий, сходив в базу. Здесь проверяется ровно одно: подпись наша.
 */
export function verifyDelivery(token: string): DeliveryClaim | null {
  const key = secret();
  if (!key) return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const body = token.slice(0, dot);
  const given = token.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(body) || !/^[A-Za-z0-9_-]+$/.test(given)) return null;

  const expected = createHmac("sha256", key).update(body, "utf8").digest("base64url");

  // Сравнение постоянного времени: обычное === выходит на первом
  // несовпавшем знаке, и по времени ответа подпись подбирается побайтово.
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const parts = Buffer.from(body, "base64url").toString("utf8").split("|");
  if (parts.length !== 3) return null;

  const [orderId, productSlug, rawVersion] = parts;
  const entitlementVersion = Number.parseInt(rawVersion, 10);
  if (!orderId || !productSlug || !Number.isInteger(entitlementVersion)) return null;

  return { orderId, productSlug, entitlementVersion };
}
