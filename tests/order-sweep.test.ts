import assert from "node:assert/strict";
import { test } from "node:test";

import { buyerBot } from "@/content/buyer-bot";
import { locales } from "@/lib/i18n";
import {
  AWAITING_INVOICE_DAYS,
  INVOICE_DEAD_DAYS,
  INVOICE_OVERDUE_DAYS,
  orderNudge,
  type SweepOrder,
} from "@/lib/admin/order-sweep";
import { buyerMessage } from "@/lib/store/buyer";

/**
 * Правила напоминаний по заявкам — единственное место во всём свипе, про
 * которое можно спросить «а что будет на четырнадцатый день» и получить
 * ответ сейчас, а не наблюдением за продом через две недели.
 */

const NOW = new Date("2026-09-12T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

function order(patch: Partial<SweepOrder> = {}): SweepOrder {
  return {
    id: "7993193e-a0ad-4b3e-80d5-677939a8324b",
    requestNo: "DZ-0910-K7QX",
    company: "ООО «Пример»",
    productSlug: "delivery-service",
    status: "new",
    createdAt: daysAgo(0),
    invoiceIssuedAt: null,
    paidAt: null,
    lastNudgedStage: null,
    ...patch,
  };
}

test("свежая заявка не тревожит никого", () => {
  assert.equal(orderNudge(order(), NOW, true), null);
  assert.equal(orderNudge(order({ createdAt: daysAgo(1.9) }), NOW, true), null);
});

test("заявка без счёта напоминает о себе на второй день", () => {
  const nudge = orderNudge(order({ createdAt: daysAgo(AWAITING_INVOICE_DAYS) }), NOW, true);
  assert.equal(nudge?.stage, "awaiting_invoice");
  assert.match(nudge!.headline, /DZ-0910-K7QX/);
});

test("о каждой стадии говорят один раз", () => {
  // Свип ходит каждые пять минут. Без этой проверки одна застрявшая заявка
  // писала бы в чат продаж 288 раз в сутки, и чат выключили бы вместе с
  // брифами настоящих лидов.
  const stuck = order({ createdAt: daysAgo(10), lastNudgedStage: "awaiting_invoice" });
  assert.equal(orderNudge(stuck, NOW, true), null);
});

test("просроченный счёт: четырнадцать дней, потом тридцать", () => {
  const invoiced = (age: number, said: string | null = null) =>
    orderNudge(
      order({ status: "invoiced", invoiceIssuedAt: daysAgo(age), lastNudgedStage: said }),
      NOW,
      true,
    );

  assert.equal(invoiced(INVOICE_OVERDUE_DAYS - 1), null);
  assert.equal(invoiced(INVOICE_OVERDUE_DAYS)?.stage, "invoice_overdue");
  assert.equal(invoiced(INVOICE_OVERDUE_DAYS, "invoice_overdue"), null);

  assert.equal(invoiced(INVOICE_DEAD_DAYS)?.stage, "invoice_dead");
  // Сказали про четырнадцатый день — тридцатый всё равно новое событие.
  assert.equal(invoiced(INVOICE_DEAD_DAYS, "invoice_overdue")?.stage, "invoice_dead");

  // На сороковой день должен прийти «мёртвый», а не «просрочен», даже если
  // про четырнадцатый почему-то не сказали: проверки идут от большего.
  assert.equal(invoiced(40)?.stage, "invoice_dead");
});

test("выставленный счёт отменяет напоминание про ожидание счёта", () => {
  const nudge = orderNudge(
    order({ status: "invoiced", createdAt: daysAgo(30), invoiceIssuedAt: daysAgo(1) }),
    NOW,
    true,
  );
  assert.equal(nudge, null, "счёт выставлен вчера — тревожить не о чем");
});

test("оплачено, а отдавать нечего — самый громкий случай", () => {
  const paid = order({ status: "paid", invoiceIssuedAt: daysAgo(3), paidAt: daysAgo(1) });

  assert.equal(orderNudge(paid, NOW, true), null, "релиз есть — всё в порядке");

  const nudge = orderNudge(paid, NOW, false);
  assert.equal(nudge?.stage, "paid_no_release");
  assert.match(nudge!.headline, /оплачена/i);

  // Проверяется раньше всего остального: деньги у нас, кода у покупателя
  // нет, и это не должно ждать своей очереди за напоминанием о счёте.
  const alsoOverdue = orderNudge(
    { ...paid, invoiceIssuedAt: daysAgo(40) },
    NOW,
    false,
  );
  assert.equal(alsoOverdue?.stage, "paid_no_release");
});

test("оплаченную заявку не дёргают из-за старого счёта", () => {
  const paid = order({ status: "paid", invoiceIssuedAt: daysAgo(40), paidAt: daysAgo(1) });
  assert.equal(orderNudge(paid, NOW, true), null);
});

test("отменённую заявку свип не трогает", () => {
  const cancelled = order({ status: "cancelled", createdAt: daysAgo(90) });
  assert.equal(orderNudge(cancelled, NOW, true), null);
});

test("уведомления покупателю переведены и не теряют номер заявки", () => {
  for (const [key, value] of Object.entries(buyerBot)) {
    for (const locale of locales) {
      const text = (value as Record<string, string>)[locale];
      assert.ok(text, `buyerBot.${key} без перевода на ${locale}`);
      assert.equal(text, text.trim(), `buyerBot.${key} (${locale}) с краевым пробелом`);
    }
  }

  // Без {no} покупатель с двумя заказами не поймёт, о каком речь.
  for (const key of ["bound", "invoiced", "paid", "delivered", "cancelled"] as const) {
    for (const locale of locales) {
      assert.ok(
        buyerBot[key][locale].includes("{no}"),
        `buyerBot.${key} (${locale}) потерял {no}`,
      );
    }
  }
});

test("в готовом сообщении покупателю не остаётся маркеров", () => {
  for (const locale of locales) {
    const text = buyerMessage("paid", locale, {
      requestNo: "DZ-0910-K7QX",
      productSlug: "delivery-service",
    });
    assert.ok(text.includes("DZ-0910-K7QX"), `${locale}: номер не подставился`);
    assert.ok(!/\{[a-z]+\}/.test(text), `${locale}: остался неподставленный маркер — ${text}`);
  }

  // Номера может не быть у заявки, созданной до введения нумерации.
  const text = buyerMessage("bound", "ru", { requestNo: null, productSlug: "delivery-service" });
  assert.ok(!/\{[a-z]+\}/.test(text), `остался маркер — ${text}`);
  assert.ok(text.includes("Маркетплейс доставки"), "название продукта не подставилось");
});
