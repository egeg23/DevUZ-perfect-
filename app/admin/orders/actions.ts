"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import {
  cancelOrder,
  issueInvoice,
  markOrderDelivered,
  markOrderPaid,
  reissueOrderLink,
  reopenOrder,
  setOrderAmount,
} from "@/lib/admin/orders";

/**
 * Одно действие — одна форма.
 *
 * Раньше здесь был общий обработчик, принимавший статус строкой из формы, и
 * это ровно тот случай, когда «гибко» значит «мимо проверок»: он ставил
 * «оплачена», ничего не записывая о том, откуда мы это знаем. Теперь каждое
 * действие вызывает свою операцию со своими предусловиями.
 *
 * Причина отказа доезжает до экрана параметром `e`, а не теряется в логах:
 * менеджер, нажавший «оплата получена» на заявке без счёта, должен увидеть
 * почему, а не «не получилось».
 */
async function run(
  operation: () => Promise<{ ok: true } | { ok: false; reason: string }>,
): Promise<never> {
  const result = await operation();
  revalidatePath("/admin/orders");
  redirect(
    result.ok
      ? "/admin/orders?r=ok"
      : `/admin/orders?r=failed&e=${encodeURIComponent(result.reason)}`,
  );
}

function orderId(formData: FormData): string {
  return String(formData.get("order") ?? "");
}

export async function issueInvoiceAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  await run(() => issueInvoice(orderId(formData), staff, ip));
}

export async function markPaidAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  const ref = String(formData.get("ref") ?? "");
  await run(() => markOrderPaid(orderId(formData), ref, staff, ip));
}

export async function markDeliveredAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  await run(() => markOrderDelivered(orderId(formData), staff, ip));
}

export async function cancelOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  await run(() => cancelOrder(orderId(formData), staff, ip));
}

export async function reopenOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  await run(() => reopenOrder(orderId(formData), staff, ip));
}

export async function setAmountAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  const usd = Number.parseFloat(String(formData.get("usd") ?? ""));
  await run(() => setOrderAmount(orderId(formData), usd, staff, ip));
}

/**
 * Перевыпуск ссылки — единственное действие, результат которого нужно
 * показать. Ссылка едет обратно параметром адреса: положить её в куку или в
 * сессию значило бы оставить чужой доступ лежать дольше, чем он нужен, а
 * держать в памяти процесса нельзя — контейнеров может быть несколько.
 *
 * Адресная строка при этом попадает в историю браузера менеджера. Это
 * осознанный размен: ссылку он всё равно сейчас скопирует и отправит
 * покупателю, а любой промежуточный тайник живёт дольше вкладки.
 */
export async function reissueLinkAction(formData: FormData) {
  const staff = await requireStaff();
  const ip = await requestIp();
  const result = await reissueOrderLink(orderId(formData), staff, ip);
  revalidatePath("/admin/orders");
  redirect(
    result.ok
      ? `/admin/orders?r=link&link=${encodeURIComponent(result.url)}`
      : `/admin/orders?r=failed&e=${encodeURIComponent(result.reason)}`,
  );
}
