import assert from "node:assert/strict";
import { test } from "node:test";

import { products } from "@/content/products";
import { PAYMENTS, createOrder, priceFor } from "@/lib/store/orders";

/**
 * Денежный путь: цена и шлагбаум оферты.
 *
 * Оба правила ломаются молча. Неправильная цена уезжает в счёт и
 * обнаруживается на разговоре с покупателем; пропущенное согласие
 * обнаруживается в суде.
 */

test("цену берём из каталога, а не из формы", () => {
  // Главное правило файла. Пришли цену вместе с заявкой — и покупатель,
  // поправивший поле в браузере, купит маркетплейс за доллар, а спор об
  // этом будет стоить дороже самого маркетплейса.
  for (const product of products) {
    const price = priceFor(product.slug);
    if (product.priceToUsd) {
      // Товар с вилкой: записанное число создало бы ложную определённость —
      // покупатель увидел бы нижнюю границу в счёте как согласованную сумму.
      assert.equal(price, null, `${product.slug}: у вилки зафиксирована цена ${price}`);
    } else {
      assert.equal(price, product.priceUsd, `${product.slug}: цена разошлась с каталогом`);
    }
  }
});

test("неизвестный товар цены не имеет", () => {
  assert.equal(priceFor("нет-такого-товара"), null);
  assert.equal(priceFor(""), null);
});

const FILLED = {
  productSlug: products[0].slug,
  locale: "ru" as const,
  company: "ООО Пример",
  taxId: "300123456",
  country: "UZ",
  contactName: "Азиз",
  contact: "@aziz",
  payment: "bank",
  comment: "",
};

test("без согласия с офертой заявка не создаётся", async () => {
  // Шлагбаум стоит до всего остального: до базы, до Telegram, до записи
  // чего бы то ни было. Проверка в форме — для человека, эта — настоящая.
  const result = await createOrder({ ...FILLED, acceptedOffer: false }, "203.0.113.9");
  assert.deepEqual(result, { ok: false, error: "offer_not_accepted" });
});

test("незаполненные поля отсекаются раньше согласия", async () => {
  // Порядок проверок важен: сказать «примите оферту» человеку, который
  // просто не дописал название компании, — значит отправить его читать
  // договор вместо того, чтобы дописать одно поле.
  for (const missing of ["company", "contactName", "contact"] as const) {
    const result = await createOrder(
      { ...FILLED, [missing]: "   ", acceptedOffer: false },
      "203.0.113.9",
    );
    assert.deepEqual(
      result,
      { ok: false, error: "missing_fields" },
      `пустое поле ${missing} должно отсекаться как missing_fields`,
    );
  }
});

test("неизвестный товар отсекается прежде всего", async () => {
  const result = await createOrder(
    { ...FILLED, productSlug: "нет-такого", acceptedOffer: true },
    "203.0.113.9",
  );
  assert.deepEqual(result, { ok: false, error: "unknown_product" });
});

test("способов оплаты ровно два, и криптовалюты среди них нет", () => {
  // ПП-3832 п.6 пп.«в» запрещает криптовалюту как средство платежа.
  assert.deepEqual([...PAYMENTS], ["bank", "manager"]);
});
