import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";

/**
 * Шторка «было / стало» в кейсах: старый сайт заказчика и наш.
 *
 * Кейс, у которого объявлено сравнение, без любого из четырёх снимков
 * отрисовал бы битую картинку на странице, куда приходят из поиска.
 */

const root = new URL("../", import.meta.url);

test("у каждого сравнения есть все четыре снимка", () => {
  const withCompare = cases.filter((item) => item.compare);
  assert.ok(withCompare.length >= 5, "сравнений меньше, чем снято");
  for (const item of withCompare) {
    for (const side of ["before", "after"]) {
      for (const view of ["desktop", "mobile"]) {
        const file = new URL(`public/cases/${item.slug}/${side}-${view}.webp`, root);
        assert.ok(existsSync(file), `${item.slug}: нет ${side}-${view}.webp`);
        // WebP: RIFF....WEBP в заголовке — не переименованный PNG.
        const head = readFileSync(file).subarray(0, 12).toString("latin1");
        assert.match(head, /^RIFF.{4}WEBP$/s, `${item.slug}: ${side}-${view} не webp`);
      }
    }
    assert.match(item.compare!.site, /^[a-z0-9.-]+\.[a-z]{2,}$/, `${item.slug}: адрес старого сайта`);
    assert.match(item.compare!.taken, /^\d{4}-(0[1-9]|1[0-2])$/, `${item.slug}: дата снимка`);
  }
});

test("подписи шторки есть на всех языках", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale).cases;
    for (const key of [
      "compareTitle",
      "compareHint",
      "compareBefore",
      "compareAfter",
      "compareDesktop",
      "compareMobile",
      "compareSlider",
      "compareAltBefore",
      "compareAltAfter",
      "compareNote",
    ] as const) {
      assert.ok(dict[key].trim(), `${locale}: нет cases.${key}`);
    }
    assert.ok(dict.compareAltBefore.includes("{name}") && dict.compareAltBefore.includes("{view}"), locale);
    assert.ok(dict.compareAltAfter.includes("{name}") && dict.compareAltAfter.includes("{view}"), locale);
    assert.ok(dict.compareNote.includes("{date}") && dict.compareNote.includes("{site}"), locale);
  }
});

test("шторку тянут за любое место кадра, а ползунок остаётся для клавиатуры", () => {
  const src = readFileSync(new URL("components/cases/before-after.tsx", root), "utf8");
  assert.match(src, /onPointerDown=/);
  assert.match(src, /setPointerCapture/);
  // Вертикальный свайп по телефонному кадру листает страницу.
  assert.match(src, /touch-pan-y/);
  assert.match(src, /type="range"/);
  assert.match(src, /aria-label=\{labels\.slider\}/);
});
