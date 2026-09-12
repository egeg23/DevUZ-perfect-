import assert from "node:assert/strict";
import { test } from "node:test";

import { orderPage } from "@/content/order-page";
import { locales } from "@/lib/i18n";
import {
  deliveryConfigured,
  signDelivery,
  verifyDelivery,
} from "@/lib/store/delivery-token";
import { DAILY_LIMIT, REPEAT_WINDOW_MINUTES, SIGNED_URL_SECONDS, TOTAL_LIMIT } from "@/lib/store/delivery";

/**
 * Токен выдачи — единственное, что отделяет купленный код от интернета.
 * Подписанную ссылку Supabase покупателю нельзя отдать в принципе: она не
 * отзывается ничем, кроме обращения в поддержку, и может пережить свой срок
 * годности в кэше CDN. Всё, что здесь проверяется, — свойства замены.
 */

const SECRET = "b".repeat(64);
const CLAIM = {
  orderId: "7993193e-a0ad-4b3e-80d5-677939a8324b",
  productSlug: "delivery-service",
  entitlementVersion: 3,
};

function withSecret<T>(secret: string | undefined, body: () => T): T {
  const saved = process.env.DOWNLOAD_SIGNING_SECRET;
  try {
    if (secret === undefined) delete process.env.DOWNLOAD_SIGNING_SECRET;
    else process.env.DOWNLOAD_SIGNING_SECRET = secret;
    return body();
  } finally {
    if (saved === undefined) delete process.env.DOWNLOAD_SIGNING_SECRET;
    else process.env.DOWNLOAD_SIGNING_SECRET = saved;
  }
}

test("без секрета выдача выключена целиком", () => {
  withSecret(undefined, () => {
    assert.equal(deliveryConfigured(), false);
    assert.equal(signDelivery(CLAIM), null);
    assert.equal(verifyDelivery("что-угодно.подпись"), null);
  });

  // Короткий секрет хуже отсутствующего: он создаёт видимость подписи.
  withSecret("слишком-короткий", () => {
    assert.equal(deliveryConfigured(), false);
    assert.equal(signDelivery(CLAIM), null);
  });
});

test("токен возвращает ровно то, что подписали", () => {
  withSecret(SECRET, () => {
    const token = signDelivery(CLAIM);
    assert.ok(token);
    assert.deepEqual(verifyDelivery(token), CLAIM);
  });
});

test("подделанный токен не проходит", () => {
  withSecret(SECRET, () => {
    const token = signDelivery(CLAIM);
    assert.ok(token);
    const [body, mac] = token.split(".");

    // Подменили полезную нагрузку, подпись оставили.
    const other = Buffer.from(
      `${CLAIM.orderId}|delivery-service|99`,
      "utf8",
    ).toString("base64url");
    assert.equal(verifyDelivery(`${other}.${mac}`), null, "версия права переписывается");

    // Подменили подпись.
    assert.equal(verifyDelivery(`${body}.${"a".repeat(mac.length)}`), null);
    // Обрезали подпись.
    assert.equal(verifyDelivery(`${body}.${mac.slice(0, -1)}`), null);
    // Убрали подпись вовсе.
    assert.equal(verifyDelivery(body), null);
    assert.equal(verifyDelivery(`${body}.`), null);
    assert.equal(verifyDelivery(`.${mac}`), null);
    assert.equal(verifyDelivery(""), null);
  });
});

test("токен, подписанный чужим ключом, не проходит", () => {
  const foreign = withSecret("c".repeat(64), () => signDelivery(CLAIM));
  assert.ok(foreign);
  withSecret(SECRET, () => {
    assert.equal(verifyDelivery(foreign), null);
  });
});

test("отзыв доступа — это смена версии права", () => {
  withSecret(SECRET, () => {
    const before = signDelivery(CLAIM);
    const after = signDelivery({ ...CLAIM, entitlementVersion: CLAIM.entitlementVersion + 1 });
    assert.ok(before && after);
    // Токены разные — значит инкремент версии в заказе действительно
    // обесценивает всё, что выдано раньше: заявленная версия перестаёт
    // совпадать с текущей.
    assert.notEqual(before, after);
    assert.equal(verifyDelivery(before)?.entitlementVersion, CLAIM.entitlementVersion);
  });
});

test("разделитель полей не склеивает соседние значения", () => {
  withSecret(SECRET, () => {
    // Без разделителя «order» + «pro» и «orderpro» + «» подписались бы
    // одинаково. Проверяем, что границы полей сохраняются.
    const a = signDelivery({ orderId: "aa", productSlug: "bb", entitlementVersion: 1 });
    const b = signDelivery({ orderId: "a", productSlug: "abb", entitlementVersion: 1 });
    assert.ok(a && b);
    assert.notEqual(a, b);
    assert.equal(verifyDelivery(a)?.orderId, "aa");
    assert.equal(verifyDelivery(b)?.orderId, "a");
  });
});

test("лимиты выдачи остаются теми, о которых договорились", () => {
  // Числа проверяются намеренно: их легко «поправить» при отладке и забыть
  // вернуть, а лимит — это то, что защищает оплаченный заказ от выкачивания
  // по утёкшей ссылке.
  assert.equal(TOTAL_LIMIT, 20);
  assert.equal(DAILY_LIMIT, 10);
  assert.equal(REPEAT_WINDOW_MINUTES, 10);
  assert.ok(DAILY_LIMIT < TOTAL_LIMIT, "дневной лимит должен быть строже общего");
  // Минута: столько живёт подписанная ссылка. Больше — и она успеет
  // разойтись, меньше — браузер не успеет начать закачку.
  assert.equal(SIGNED_URL_SECONDS, 60);
});

test("подписи выдачи переведены на все языки", () => {
  for (const key of [
    "download",
    "downloadFile",
    "downloadVersion",
    "downloadSize",
    "downloadChecksum",
    "downloadChecksumHint",
    "downloadLeft",
    "downloadPreparing",
  ] as const) {
    for (const locale of locales) {
      const text = orderPage[key][locale];
      assert.ok(text, `orderPage.${key} без перевода на ${locale}`);
      assert.equal(text, text.trim(), `orderPage.${key} (${locale}) с краевым пробелом`);
    }
  }

  // Остаток выдач подставляется в строку: потерянный при переводе маркер
  // оставил бы покупателя без числа.
  for (const locale of locales) {
    const text = orderPage.downloadLeft[locale];
    assert.ok(text.includes("{total}"), `downloadLeft (${locale}) потерял {total}`);
    assert.ok(text.includes("{today}"), `downloadLeft (${locale}) потерял {today}`);
  }
});
