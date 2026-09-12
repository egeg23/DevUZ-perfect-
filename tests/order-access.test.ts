import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { orderPage } from "@/content/order-page";
import { orderCopy } from "@/content/order-form";
import { locales } from "@/lib/i18n";
import {
  hashAccessToken,
  looksLikeAccessToken,
  looksLikeBindCode,
  newAccessToken,
  newBindCode,
} from "@/lib/store/access";
import { missingBankVars, sellerBank } from "@/lib/store/requisites";

/**
 * Ссылка на страницу заказа — единственное, что отделяет чужие реквизиты и
 * чужой счёт от интернета. Проверки здесь не про формат ради формата: каждая
 * закрывает способ, которым эта ссылка перестаёт быть защитой.
 */

test("токен не угадывается и не повторяется", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const token = newAccessToken();
    assert.equal(token.length, 43, `неожиданная длина: ${token}`);
    assert.ok(looksLikeAccessToken(token), `свой же токен не прошёл проверку: ${token}`);
    assert.ok(!seen.has(token), "генератор выдал повтор");
    seen.add(token);
  }
});

test("в базу уходит хеш, а не токен", () => {
  const token = newAccessToken();
  const hash = hashAccessToken(token);

  assert.match(hash, /^[0-9a-f]{64}$/, "хеш не похож на sha256 в hex");
  assert.notEqual(hash, token);
  // Хеш детерминирован: иначе поиск заказа по ссылке не находил бы ничего.
  assert.equal(hashAccessToken(token), hash);
  assert.notEqual(hashAccessToken(newAccessToken()), hash);
});

test("на мусор в адресе в базу не ходим", () => {
  for (const junk of [
    "",
    "favicon.ico",
    "../../etc/passwd",
    "a".repeat(42),
    "a".repeat(44),
    // base64 со стандартным алфавитом: + и / в адресе не наши.
    `${"a".repeat(41)}+/`,
    "<script>alert(1)</script>",
  ]) {
    assert.ok(!looksLikeAccessToken(junk), `мусор «${junk}» принят за токен`);
  }
});

test("код привязки короче токена и живёт отдельно от него", () => {
  const code = newBindCode();
  assert.equal(code.length, 22, `неожиданная длина кода: ${code}`);
  assert.ok(looksLikeBindCode(code));

  // Главное свойство: код привязки не является токеном доступа и наоборот.
  // Иначе payload диплинка, проходящий через серверы Telegram, открывал бы
  // заказ целиком.
  assert.ok(!looksLikeAccessToken(code), "код привязки принят за токен доступа");
  assert.ok(!looksLikeBindCode(newAccessToken()), "токен доступа принят за код привязки");

  // Диплинк `/start` ограничен 64 знаками payload вместе с префиксом.
  assert.ok(`order_${code}`.length <= 64);
});

test("без банковских реквизитов счёт не собирается", () => {
  const saved = {
    INVOICE_TAX_ID: process.env.INVOICE_TAX_ID,
    INVOICE_BANK_NAME: process.env.INVOICE_BANK_NAME,
    INVOICE_BANK_ACCOUNT: process.env.INVOICE_BANK_ACCOUNT,
    INVOICE_BANK_MFO: process.env.INVOICE_BANK_MFO,
    INVOICE_PAYMENT_DAYS: process.env.INVOICE_PAYMENT_DAYS,
  };

  try {
    for (const name of Object.keys(saved)) delete process.env[name];

    assert.equal(sellerBank(), null, "счёт собрался без единого реквизита");
    assert.deepEqual(missingBankVars().sort(), [
      "INVOICE_BANK_ACCOUNT",
      "INVOICE_BANK_MFO",
      "INVOICE_BANK_NAME",
      "INVOICE_TAX_ID",
    ]);

    // Одного не хватает — счёт по-прежнему не документ.
    process.env.INVOICE_TAX_ID = "123456789";
    process.env.INVOICE_BANK_NAME = "Банк";
    process.env.INVOICE_BANK_ACCOUNT = "20208000000000000001";
    assert.equal(sellerBank(), null, "счёт собрался без МФО");
    assert.deepEqual(missingBankVars(), ["INVOICE_BANK_MFO"]);

    process.env.INVOICE_BANK_MFO = "00440";
    const bank = sellerBank();
    assert.ok(bank, "полный набор реквизитов не собрался");
    assert.equal(bank.mfo, "00440");
    assert.equal(bank.swift, null, "необязательный SWIFT не должен выдумываться");
    assert.equal(bank.paymentDays, 14, "срок оплаты по умолчанию сместился");

    // Опечатка в окружении не должна превращаться в счёт со сроком оплаты
    // в четыре года.
    for (const [value, expected] of [
      ["30", 30],
      ["1400", 14],
      ["0", 14],
      ["-5", 14],
      ["две недели", 14],
    ] as const) {
      process.env.INVOICE_PAYMENT_DAYS = value;
      assert.equal(sellerBank()?.paymentDays, expected, `срок оплаты из «${value}»`);
    }
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("страница заказа переведена целиком", () => {
  for (const [key, value] of Object.entries(orderPage)) {
    for (const locale of locales) {
      const text = (value as Record<string, string>)[locale];
      assert.ok(text, `orderPage.${key} без перевода на ${locale}`);
      assert.equal(text, text.trim(), `orderPage.${key} (${locale}) с краевым пробелом`);
    }
  }
});

test("подписи ссылки на заказ в форме переведены целиком", () => {
  for (const key of ["yourPage", "savePage", "copyLink", "copied"] as const) {
    for (const locale of locales) {
      const text = orderCopy[key][locale];
      assert.ok(text, `orderCopy.${key} без перевода на ${locale}`);
      assert.equal(text, text.trim(), `orderCopy.${key} (${locale}) с краевым пробелом`);
    }
  }
});

test("страница покупателя не рассказывает про переменные окружения", async () => {
  // Покупатель — чужой человек, и внутреннее устройство сайта его не
  // касается. Имена переменных принадлежат панели, где менеджер по ним
  // и чинит. Однажды они уже утекли на страницу заказа: строку писали
  // «для менеджера», а рисовалась она покупателю.
  const page = await readFile(
    new URL("../app/[locale]/order/[token]/page.tsx", import.meta.url),
    "utf8",
  );

  for (const leak of ["INVOICE_", "SUPABASE_", "DOWNLOAD_SIGNING", "missingBankVars"]) {
    assert.ok(
      !page.includes(leak),
      `на странице заказа встречается «${leak}» — это видно покупателю`,
    );
  }
});
