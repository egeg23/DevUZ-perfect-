/**
 * Фид Google Merchant Center (владелец, 14.11.2026: «сделай так, чтобы все
 * что мы делаем было в виде товаров в гугл merchant»). Услуги Google в
 * Shopping не пускает — в фиде только готовые продукты с одной ценой.
 */
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { test } from "node:test";

import { products } from "@/content/products";
import { merchantFeed, merchantItems } from "@/lib/merchant-feed";
import { locales } from "@/lib/i18n";

test("в фиде — продукты с одной ценой, без услуг и вилок цены", () => {
  const items = merchantItems();
  // Владелец, 14.11.2026: «Готовый Корпоративный сайт: 3000$, Лендинг : 500$…
  // у нас уже готовый код в макетах, по сути они покупают его».
  assert.ok(items.length >= 6);
  for (const p of items) assert.ok(!p.priceToUsd, `${p.slug}: вилка цены`);
  for (const p of products) if (!p.priceToUsd) assert.ok(items.includes(p), `${p.slug}: нет в фиде`);
  assert.equal(items.find((p) => p.slug === "landing")?.priceUsd, 500);
  assert.equal(items.find((p) => p.slug === "corporate-site")?.priceUsd, 3000);
});

test("каждый товар фида — со всеми обязательными полями и картинкой на диске", () => {
  for (const locale of locales) {
    const xml = merchantFeed(locale);
    assert.match(xml, /xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"/);
    const items = xml.split("<item>").slice(1);
    assert.equal(items.length, merchantItems().length);
    for (const item of items) {
      for (const tag of ["id", "title", "description", "link", "image_link", "availability", "price", "condition", "brand"]) {
        assert.match(item, new RegExp(`<g:${tag}>[^<]+</g:${tag}>`), `${locale}: нет g:${tag}`);
      }
      assert.match(item, /<g:price>\d+\.\d{2} USD<\/g:price>/);
      assert.match(item, new RegExp(`<g:link>https://devuz\\.studio/${locale}/products/`));
      const img = item.match(/<g:image_link>https:\/\/devuz\.studio(\/[^<]+)<\/g:image_link>/)?.[1];
      assert.ok(img && statSync(new URL(`../public${img}`, import.meta.url)).isFile(), `${img}: нет файла`);
    }
  }
});
