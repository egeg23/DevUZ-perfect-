import { createHash } from "node:crypto";

import { asInet } from "@/lib/net";
import { currentRelease, type Release } from "@/lib/store/releases";
import { deliveryConfigured, verifyDelivery } from "@/lib/store/delivery-token";
import { serviceClient } from "@/lib/supabase";

/**
 * Ворота выдачи.
 *
 * Всё, что стоит между «покупатель нажал ссылку» и файлом, живёт здесь, в
 * одном месте и в одном порядке. Разложить эти проверки по маршруту и по
 * странице значило бы получить два набора правил, которые однажды разойдутся
 * — и разойдутся в сторону «выдали тому, кому не должны».
 *
 * Каждая попытка пишется в журнал, включая отказ и его причину. Журнал
 * только удачных скачиваний не отвечает на единственный вопрос, ради
 * которого в него полезут: почему у покупателя не скачалось.
 */

/** За всё время. Двадцати хватает на любую разумную историю с переустановками. */
export const TOTAL_LIMIT = 20;
/** За сутки. Отсекает утёкшую ссылку до того, как по ней выкачают всё. */
export const DAILY_LIMIT = 10;
/**
 * Окно склейки повторов, минуты.
 *
 * Оборванная закачка двухсот мегабайт на мобильном интернете не должна
 * стоить покупателю дневного лимита: он уже заплатил, а связь — не его вина.
 */
export const REPEAT_WINDOW_MINUTES = 10;

/** Сколько живёт подписанная ссылка хранилища. Ровно чтобы браузер начал качать. */
export const SIGNED_URL_SECONDS = 60;

export type DeliveryRefusal =
  | "not_configured"
  | "bad_token"
  | "order_not_found"
  | "not_paid"
  | "revoked"
  | "no_release"
  | "daily_limit"
  | "total_limit"
  | "storage_error";

export type DeliveryOutcome =
  | { ok: true; url: string; release: Release; repeat: boolean }
  | { ok: false; reason: DeliveryRefusal };

/** Хеш, а не сам user-agent: опознать повторную попытку хватает, следить — незачем. */
function uaHash(ua: string | null): string | null {
  return ua ? createHash("sha256").update(ua, "utf8").digest("hex").slice(0, 32) : null;
}

async function log(detail: {
  orderId: string | null;
  releaseId: string | null;
  ok: boolean;
  reason: string | null;
  counted: boolean;
  ip: string;
  ua: string | null;
}): Promise<void> {
  const db = serviceClient();
  // Заказа нет — записывать выдачу не к чему: order_id в таблице not null,
  // а заводить строку-сироту ради отказа по битому токену незачем. Такие
  // попытки видны в логе маршрута.
  if (!db || !detail.orderId) return;

  const { error } = await db.from("store_downloads").insert({
    order_id: detail.orderId,
    release_id: detail.releaseId,
    ok: detail.ok,
    reason: detail.reason,
    counted: detail.counted,
    ip: asInet(detail.ip),
    ua_hash: uaHash(detail.ua),
  });
  if (error) console.error("store: не записал выдачу", error.message);
}

export async function resolveDownload(
  token: string,
  ip: string,
  ua: string | null,
): Promise<DeliveryOutcome> {
  if (!deliveryConfigured()) return { ok: false, reason: "not_configured" };

  const claim = verifyDelivery(token);
  if (!claim) return { ok: false, reason: "bad_token" };

  const db = serviceClient();
  if (!db) return { ok: false, reason: "storage_error" };

  const { data: order } = await db
    .from("orders")
    .select("id, status, product_slug, paid_at, entitlement_version")
    .eq("id", claim.orderId)
    .maybeSingle();

  if (!order) return { ok: false, reason: "order_not_found" };

  const refuse = async (reason: DeliveryRefusal): Promise<DeliveryOutcome> => {
    await log({
      orderId: order.id as string,
      releaseId: null,
      ok: false,
      reason,
      counted: false,
      ip,
      ua,
    });
    return { ok: false, reason };
  };

  // Оплата — единственное, что открывает файлы. Статус «передан» её не
  // заменяет: он ставится человеком и может быть проставлен по ошибке.
  if (!order.paid_at || order.status === "cancelled") return refuse("not_paid");

  // Токен подписан на конкретную версию права. Отзыв — инкремент версии в
  // заказе: подпись остаётся нашей, но заявленная версия перестаёт совпадать.
  if (order.entitlement_version !== claim.entitlementVersion) return refuse("revoked");

  // Продукт в токене должен совпадать с купленным: иначе токен одного
  // заказа открывал бы чужой каталог.
  if (order.product_slug !== claim.productSlug) return refuse("revoked");

  const release = await currentRelease(claim.productSlug);
  if (!release) return refuse("no_release");

  // Повтор по тому же файлу в окне склейки не считается и лимиты не
  // проверяет: покупатель докачивает то, что уже начал.
  const since = new Date(Date.now() - REPEAT_WINDOW_MINUTES * 60_000).toISOString();
  const { data: recent } = await db
    .from("store_downloads")
    .select("id")
    .eq("order_id", order.id)
    .eq("release_id", release.id)
    .eq("ok", true)
    .gte("at", since)
    .limit(1);

  const repeat = Boolean(recent?.length);

  if (!repeat) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

    const { count: total } = await db
      .from("store_downloads")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id)
      .eq("ok", true)
      .eq("counted", true);

    if ((total ?? 0) >= TOTAL_LIMIT) return refuse("total_limit");

    const { count: today } = await db
      .from("store_downloads")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id)
      .eq("ok", true)
      .eq("counted", true)
      .gte("at", dayAgo);

    if ((today ?? 0) >= DAILY_LIMIT) return refuse("daily_limit");
  }

  const { data: signed, error: signError } = await db.storage
    .from(release.storage_bucket)
    .createSignedUrl(release.storage_path, SIGNED_URL_SECONDS, { download: true });

  if (signError || !signed?.signedUrl) {
    console.error("store: не подписал ссылку", signError?.message);
    return refuse("storage_error");
  }

  await log({
    orderId: order.id as string,
    releaseId: release.id,
    ok: true,
    reason: repeat ? "repeat" : null,
    counted: !repeat,
    ip,
    ua,
  });

  // Первое удачное скачивание и есть передача кода. Отдельная кнопка у
  // менеджера остаётся для случаев, когда передавали иначе — доступом в
  // приватный репозиторий, например.
  if (!repeat) {
    await db
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("delivered_at", null);
  }

  return { ok: true, url: signed.signedUrl, release, repeat };
}

/** Сколько выдач у заказа осталось. Показывается покупателю рядом со ссылкой. */
export async function downloadsLeft(
  orderId: string,
): Promise<{ total: number; today: number } | null> {
  const db = serviceClient();
  if (!db) return null;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const { count: total } = await db
    .from("store_downloads")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("ok", true)
    .eq("counted", true);

  const { count: today } = await db
    .from("store_downloads")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("ok", true)
    .eq("counted", true)
    .gte("at", dayAgo);

  return {
    total: Math.max(0, TOTAL_LIMIT - (total ?? 0)),
    today: Math.max(0, DAILY_LIMIT - (today ?? 0)),
  };
}
