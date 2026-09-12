import { record } from "@/lib/admin/audit";
import { orderNudge, type SweepOrder } from "@/lib/admin/order-sweep";
import { esc, sendWithButtons } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Проход по заявкам на покупку.
 *
 * Живёт рядом со свипом напоминаний и вызывается из него же: своего
 * расписания ему не нужно, а лишний юнит systemd — это лишняя вещь, которую
 * однажды забудут включить на новом сервере.
 *
 * Пишет в чат отдела продаж, а не в личку. У заявки может не быть
 * ответственного вовсе — она приходит с сайта и лежит, пока кто-нибудь не
 * возьмётся; именно про такие и надо напоминать, а в личку их слать некому.
 */

/** За проход — не больше пачки, по той же причине, что и у напоминаний. */
const BATCH = 20;

export type OrderSweepResult = { checked: number; nudged: number };

export async function sweepOrders(now = new Date()): Promise<OrderSweepResult> {
  const db = serviceClient();
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!db || !chatId) return { checked: 0, nudged: 0 };

  const { data, error } = await db
    .from("orders")
    .select(
      "id, request_no, company, product_slug, status, created_at, invoice_issued_at, paid_at, last_nudged_stage",
    )
    .in("status", ["new", "invoiced", "paid"])
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error("orders: не прочитал очередь свипа", error.message);
    return { checked: 0, nudged: 0 };
  }

  const orders = (data ?? []).map(
    (row): SweepOrder => ({
      id: row.id as string,
      requestNo: (row.request_no as string | null) ?? null,
      company: (row.company as string | null) ?? "",
      productSlug: row.product_slug as string,
      status: row.status as string,
      createdAt: row.created_at as string,
      invoiceIssuedAt: (row.invoice_issued_at as string | null) ?? null,
      paidAt: (row.paid_at as string | null) ?? null,
      lastNudgedStage: (row.last_nudged_stage as string | null) ?? null,
    }),
  );

  if (!orders.length) return { checked: 0, nudged: 0 };

  // Каталог актуальных релизов читается один раз на весь проход: двадцать
  // оплаченных заказов одного продукта иначе дали бы двадцать одинаковых
  // запросов.
  const slugs = [...new Set(orders.filter((o) => o.paidAt).map((o) => o.productSlug))];
  const released = new Set<string>();
  if (slugs.length) {
    const { data: releases } = await db
      .from("store_releases")
      .select("product_slug")
      .eq("is_current", true)
      .in("product_slug", slugs);
    for (const row of releases ?? []) released.add(row.product_slug as string);
  }

  let nudged = 0;

  for (const order of orders) {
    const nudge = orderNudge(order, now, released.has(order.productSlug));
    if (!nudge) continue;

    const ok = await sendWithButtons(
      chatId,
      [`<b>${esc(nudge.headline)}</b>`, "", esc(nudge.detail)].join("\n"),
      [{ text: "Открыть заявки", url: `${siteUrl}/admin/orders` }],
    );

    // Метка ставится только после успеха. Иначе сбой Telegram навсегда
    // проглотил бы напоминание: стадия помечена, а сказано ничего не было.
    if (!ok) continue;

    await db
      .from("orders")
      .update({ last_nudged_stage: nudge.stage, last_nudged_at: now.toISOString() })
      .eq("id", order.id);

    await record("order.nudged", {
      targetType: "order",
      targetId: order.id,
      meta: { stage: nudge.stage },
    });

    nudged += 1;
  }

  return { checked: orders.length, nudged };
}
