import { OFFER_VERSION } from "@/content/offer";
import { asInet } from "@/lib/net";
import { newRequestNo } from "@/lib/qualify/engine";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { productBySlug } from "@/content/products";
import { serviceClient } from "@/lib/supabase";
import { siteUrl } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";

export const PAYMENTS = ["bank", "manager"] as const;
export const ORDER_STATUSES = [
  "new",
  "invoiced",
  "paid",
  "delivered",
  "cancelled",
] as const;

export type OrderInput = {
  productSlug: string;
  locale: Locale;
  company: string;
  taxId: string;
  country: string;
  contactName: string;
  contact: string;
  payment: string;
  comment: string;
  /** Покупатель подтвердил, что принимает оферту и лицензию. */
  acceptedOffer: boolean;
};

export type OrderResult =
  | { ok: true; requestNo: string }
  | { ok: false; error: "unknown_product" | "missing_fields" | "storage" | "offer_not_accepted" };

/**
 * Цена берётся из каталога на сервере, а не из формы.
 *
 * Это единственное место, где стоит остановиться. Пришли цену вместе с
 * заявкой — и покупатель, поправивший поле в браузере, купит маркетплейс за
 * доллар, а спор об этом будет стоить дороже самого маркетплейса. Форма
 * присылает только slug; во что он оценён, решает сервер.
 *
 * Для товаров с вилкой (лендинги, 800–2500) цена не фиксируется вовсе:
 * договариваться о ней всё равно человеку, и записанное число создавало бы
 * ложную определённость.
 */
export function priceFor(slug: string): number | null {
  const product = productBySlug(slug);
  if (!product) return null;

  // priceToUsd задан — значит цена вилка, а не число. Записать нижнюю
  // границу было бы хуже, чем не записать ничего: покупатель увидел бы её
  // в счёте как согласованную сумму.
  return product.priceToUsd ? null : product.priceUsd;
}

export async function createOrder(
  input: OrderInput,
  ip: string,
): Promise<OrderResult> {
  const product = productBySlug(input.productSlug);
  if (!product) return { ok: false, error: "unknown_product" };

  const company = input.company.trim().slice(0, 200);
  const contactName = input.contactName.trim().slice(0, 120);
  const contact = input.contact.trim().slice(0, 200);

  if (!company || !contactName || !contact) {
    return { ok: false, error: "missing_fields" };
  }

  // Проверка на сервере, а не только галочкой в форме.
  //
  // Оферта — это шлагбаум: до неё принимать деньги нельзя. Галочка,
  // проверяемая только браузером, шлагбаумом не является — запрос в
  // /api/order отправляется чем угодно, и первая же заявка мимо формы
  // окажется заявкой без договора. Здесь заявка без согласия просто не
  // создаётся.
  if (!input.acceptedOffer) return { ok: false, error: "offer_not_accepted" };

  const payment = (PAYMENTS as readonly string[]).includes(input.payment)
    ? input.payment
    : "bank";

  const requestNo = newRequestNo();
  const price = priceFor(input.productSlug);

  const db = serviceClient();
  if (db) {
    const { error } = await db.from("orders").insert({
      request_no: requestNo,
      product_slug: input.productSlug,
      price_usd: price,
      locale: input.locale,
      company,
      tax_id: input.taxId.trim().slice(0, 60) || null,
      country: input.country.trim().slice(0, 80) || null,
      contact_name: contactName,
      contact,
      payment,
      comment: input.comment.trim().slice(0, 2000) || null,
      // Версия, а не просто «да»: текст оферты меняется, и через год
      // «согласился с офертой» без указания редакции не значит ничего.
      offer_version: OFFER_VERSION,
      offer_accepted_at: new Date().toISOString(),
      ip: asInet(ip),
    });

    if (error) {
      console.error("store: не сохранил заявку", error.message);
      // Не выходим: заявка важнее записи о ней. Уведомление уйдёт в
      // Telegram, и менеджер увидит покупателя, даже если база недоступна.
    }
  }

  await notify({ ...input, company, contactName, contact, payment }, requestNo, price);

  // Ошибку хранения не показываем покупателю: для него заявка принята —
  // менеджер её увидит. Показать «не получилось» человеку, которого мы уже
  // видим в Telegram, значит потерять сделку из-за нашей же аварии.
  return { ok: true, requestNo };
}

const PAYMENT_LABEL: Record<string, string> = {
  bank: "безналичный расчёт по счёту",
  manager: "хочет обсудить другой способ оплаты",
};

async function notify(
  input: OrderInput & { company: string; contactName: string; contact: string; payment: string },
  requestNo: string,
  price: number | null,
): Promise<void> {
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!chatId) return;

  const product = productBySlug(input.productSlug);
  const title = product ? product.title.ru : input.productSlug;

  await sendMessage(
    chatId,
    [
      "🛒 <b>Заявка на покупку</b>",
      "",
      `<b>${esc(title)}</b>${price ? ` — ${price.toLocaleString("ru-RU")} $` : ""}`,
      `Номер: <code>${esc(requestNo)}</code>`,
      "",
      `<b>Компания:</b> ${esc(input.company)}`,
      input.taxId.trim() ? `<b>ИНН / рег. номер:</b> ${esc(input.taxId.trim())}` : "",
      input.country.trim() ? `<b>Страна:</b> ${esc(input.country.trim())}` : "",
      `<b>Контакт:</b> ${esc(input.contactName)} — ${esc(input.contact)}`,
      `<b>Оплата:</b> ${PAYMENT_LABEL[input.payment] ?? input.payment}`,
      input.comment.trim() ? "" : "",
      input.comment.trim() ? `<b>Комментарий:</b>\n${esc(input.comment.trim().slice(0, 800))}` : "",
      "",
      `${siteUrl}/admin/orders`,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  );
}
