/**
 * Тесты каталога готовых продуктов.
 *
 * Здесь нет логики — есть данные на четырёх языках, и разъезжаются они молча:
 * забытый перевод превращается в пустую строку на странице, а забытый пункт
 * списка — в блок, где на русском пять строк, а на узбекском четыре. Ни то,
 * ни другое не ломает сборку и не видно, пока кто-нибудь не откроет страницу
 * на своём языке.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { products } from "@/content/products";
import { locales } from "@/lib/i18n";

test("каталог не пуст и slug-и уникальны", () => {
  assert.ok(products.length >= 5, `продуктов ${products.length}`);
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, `дубли: ${slugs}`);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/, s);
});

test("каждый язык заполнен во всех текстовых полях", () => {
  for (const p of products) {
    for (const field of ["title", "tagline", "description", "seoTitle", "seoDescription", "readiness", "savings"] as const) {
      for (const l of locales) {
        const v = p[field][l];
        assert.ok(v && v.trim().length > 0, `${p.slug}.${field}.${l} пусто`);
      }
    }
  }
});

test("списки одинаковой длины во всех языках", () => {
  // Разная длина значит, что при переводе пункт потеряли или добавили.
  const check = (slug: string, name: string, list: Record<string, string[]>) => {
    const len = list[locales[0]].length;
    for (const l of locales) {
      assert.equal(list[l].length, len, `${slug}.${name}: ${l} даёт ${list[l].length}, ожидалось ${len}`);
      for (const item of list[l]) assert.ok(item.trim(), `${slug}.${name}.${l}: пустой пункт`);
    }
  };
  for (const p of products) {
    check(p.slug, "buyerProvides", p.buyerProvides);
    if (p.monetization) check(p.slug, "monetization", p.monetization);
    if (p.rebuild) check(p.slug, "rebuild", p.rebuild);
    p.blocks.forEach((b, i) => {
      for (const l of locales) assert.ok(b.title[l]?.trim(), `${p.slug}.blocks[${i}].title.${l} пусто`);
      check(p.slug, `blocks[${i}].items`, b.items);
    });
  }
});

test("цены осмысленны, вилка не вывернута", () => {
  for (const p of products) {
    assert.ok(p.priceUsd > 0, `${p.slug}: цена ${p.priceUsd}`);
    assert.equal(Math.round(p.priceUsd), p.priceUsd, `${p.slug}: цена не целая`);
    if (p.priceToUsd !== undefined) {
      assert.ok(p.priceToUsd > p.priceUsd, `${p.slug}: верх вилки ${p.priceToUsd} не больше низа ${p.priceUsd}`);
    }
  }
});

test("у каждого продукта названы технологии и блоки", () => {
  for (const p of products) {
    assert.ok(p.tech.length >= 3, `${p.slug}: технологий ${p.tech.length}`);
    assert.ok(p.blocks.length >= 2, `${p.slug}: блоков ${p.blocks.length}`);
  }
});

test("SEO-заголовок укладывается в то, что показывает Google", () => {
  // Гугл обрезает примерно на шестидесяти символах; всё, что длиннее,
  // до человека не доезжает.
  for (const p of products) {
    for (const l of locales) {
      const len = p.seoTitle[l].length;
      assert.ok(len <= 70, `${p.slug}.seoTitle.${l}: ${len} символов`);
    }
  }
});

test("сравнение с разработкой с нуля называет вилку и числа", () => {
  // Утверждение «дешевле» без цифр — реклама. С цифрами — проверяемое
  // обещание, за которое можно спросить.
  for (const p of products) {
    assert.match(p.savings.ru, /40–70%/, `${p.slug}: нет вилки в ru`);
    assert.match(p.savings.ru, /\d[\d\s]*(–|—)[\d\s]*\d/, `${p.slug}: нет чисел в ru`);
    for (const l of locales) {
      assert.match(p.savings[l], /40[–-]70/, `${p.slug}.savings.${l}: нет вилки`);
    }
  }
});
