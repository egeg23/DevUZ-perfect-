import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";

/**
 * Карточки кейсов с роликом сцены первого экрана, как у SamAuto (владелец,
 * 24.10.2026: «сделай анимированную карточку 60 fps главной анимации в Хиро
 * секции… везде, где мы делали скролл в Хиро секции»). Только макеты,
 * собранные руками, — у собранных ботом ролика нет.
 */
const WITH_TEASER = [
  "samauto",
  "jiguli",
  "syanie-severa",
  "karomat",
  "tovar",
  "amani",
  "sia",
  "linia",
  "enotmebel",
  "lider-prof",
  "asmo-clinic",
  "gazmetprod",
];

test("у кейсов со сценой в первом экране — ролик и постер в двух форматах", () => {
  for (const slug of WITH_TEASER) {
    const item = cases.find((c) => c.slug === slug);
    assert.ok(item?.prototype, `${slug}: нет prototype`);
    assert.equal(item.prototype.teaser, `/cases/${slug}/teaser`);
    assert.match(item.prototype.href, /^\/proto\/[A-Za-z0-9_-]{43}$/, slug);
    for (const f of ["teaser-16.mp4", "teaser-9.mp4", "poster-16.webp", "poster-9.webp"]) {
      const path = `public/cases/${slug}/${f}`;
      assert.ok(existsSync(path), `${slug}: нет ${f}`);
      // Ролик в карточке играет сам: больше трёх мегабайт — уже тяжесть.
      if (f.endsWith(".mp4")) assert.ok(readFileSync(path).length < 3_000_000, `${slug}: ${f} тяжелее 3 МБ`);
    }
  }
});

test("ролик в карточке грузится, только когда карточка у экрана", () => {
  const card = readFileSync("components/sections/cases.tsx", "utf8");
  assert.match(card, /<CaseTeaser/);
  assert.doesNotMatch(card, /autoPlay/);
  const teaser = readFileSync("components/sections/case-teaser.tsx", "utf8");
  assert.match(teaser, /IntersectionObserver/);
  assert.match(teaser, /preload="none"/);
  assert.match(teaser, /prefers-reduced-motion/);
});
