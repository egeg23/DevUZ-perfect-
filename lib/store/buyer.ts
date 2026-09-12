import { buyerBot } from "@/content/buyer-bot";
import { productBySlug } from "@/content/products";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { looksLikeBindCode } from "@/lib/store/access";
import { serviceClient } from "@/lib/supabase";

/**
 * Телеграм покупателя.
 *
 * Самое слабое место ручной схемы продаж — тишина между «перевёл деньги» и
 * «получил доступ». Покупатель не знает, дошло ли, а спросить может только
 * написав человеку, который сейчас спит. Привязка закрывает эту дыру: бот
 * сам сообщает о каждом переходе.
 *
 * Привязка делается одноразовым кодом со страницы заказа, а не токеном
 * самой страницы. Payload диплинка проходит через серверы Telegram и
 * остаётся в истории того чата, откуда по ссылке нажали; будь там токен
 * страницы, каждая такая копия открывала бы заказ целиком.
 */

export const BIND_PREFIX = "order_";

export type BuyerStage = "bound" | "invoiced" | "paid" | "delivered" | "cancelled";

type BoundOrder = {
  id: string;
  requestNo: string | null;
  productSlug: string;
  locale: Locale;
};

/**
 * Привязать чат к заказу по одноразовому коду.
 *
 * Код гасится тем же запросом: `eq("bind_code", code)` в UPDATE делает
 * операцию идемпотентной и заодно защищает от гонки — второй запрос с тем
 * же кодом не найдёт строки и ничего не привяжет.
 */
export async function bindBuyer(
  code: string,
  chatId: number,
): Promise<BoundOrder | null> {
  if (!looksLikeBindCode(code)) return null;

  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("orders")
    .update({ buyer_chat_id: chatId, bind_code: null })
    .eq("bind_code", code)
    .select("id, request_no, product_slug, locale")
    .maybeSingle();

  if (error) {
    console.error("store: не привязал покупателя", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id as string,
    requestNo: (data.request_no as string | null) ?? null,
    productSlug: data.product_slug as string,
    locale: isLocale(data.locale as string) ? (data.locale as Locale) : "ru",
  };
}

/**
 * Сообщить покупателю о переходе.
 *
 * Молчит, если чат не привязан, — это обычное дело, а не ошибка: половина
 * покупателей бота не подключит. Никогда не бросает: уведомление не должно
 * ронять действие, которое его вызвало. Менеджер, подтвердивший оплату,
 * подтвердил её независимо от того, доехало ли сообщение.
 */
export async function notifyBuyer(orderId: string, stage: BuyerStage): Promise<void> {
  try {
    const db = serviceClient();
    if (!db) return;

    const { data } = await db
      .from("orders")
      .select("request_no, product_slug, locale, buyer_chat_id")
      .eq("id", orderId)
      .maybeSingle();

    const chatId = data?.buyer_chat_id as number | null | undefined;
    if (!data || !chatId) return;

    const locale: Locale = isLocale(data.locale as string) ? (data.locale as Locale) : "ru";
    await sendMessage(
      chatId,
      buyerMessage(stage, locale, {
        requestNo: (data.request_no as string | null) ?? null,
        productSlug: data.product_slug as string,
      }),
    );
  } catch (error) {
    console.error("store: не уведомил покупателя", error);
  }
}

/**
 * Текст уведомления.
 *
 * Ссылки на страницу заказа здесь нет намеренно: в базе только sha256
 * токена, восстановить из него адрес нельзя — в этом и был смысл. Класть
 * токен в открытом виде ради красивого сообщения значило бы отменить уже
 * работающую защиту. Покупатель держит ссылку с момента оформления, а
 * потерявшему её теперь есть куда написать — в этот самый чат.
 */
export function buyerMessage(
  stage: BuyerStage,
  locale: Locale,
  order: { requestNo: string | null; productSlug: string },
): string {
  const product = productBySlug(order.productSlug);

  return t(buyerBot[stage], locale)
    .replace("{no}", esc(order.requestNo ?? "—"))
    .replace("{product}", esc(product ? product.title[locale] : order.productSlug))
    .trim();
}
