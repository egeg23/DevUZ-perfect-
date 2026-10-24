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
  "hop",
  "tirex",
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
      // Ролик в карточке играет сам: больше 4 МБ (как у SamAuto) — уже тяжесть.
      if (f.endsWith(".mp4")) assert.ok(readFileSync(path).length < 4_000_000, `${slug}: ${f} тяжелее 4 МБ`);
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

test("Engelberg: ролик в карточке, а ведёт она на страницу кейса — витрина под паролем", () => {
  const item = cases.find((c) => c.slug === "engelberg");
  assert.equal(item?.teaser, "/cases/engelberg/teaser");
  assert.equal(item?.prototype, undefined);
  for (const f of ["teaser-16.mp4", "teaser-9.mp4", "poster-16.webp", "poster-9.webp"]) {
    assert.ok(existsSync(`public/cases/engelberg/${f}`), f);
  }
});

test("снимки экранов: у каждого кейса с shots лежат все файлы", () => {
  // Владелец, 24.10.2026: «для каждого макета сделай скрины просто, чтобы
  // можно было посмотреть что мы делали, а то сейчас просто текст».
  const withShots = cases.filter((c) => c.shots);
  assert.ok(withShots.length >= 45, `снимки только у ${withShots.length}`);
  for (const item of withShots) {
    for (let n = 1; n <= (item.shots ?? 0); n++) {
      for (const kind of ["desktop", "mobile"]) {
        const path = `public/cases/${item.slug}/shot-${n}-${kind}.webp`;
        assert.ok(existsSync(path), `${item.slug}: нет ${path}`);
        assert.ok(readFileSync(path).length < 400_000, `${path} тяжелее 400 КБ`);
      }
    }
  }
  const page = readFileSync("app/[locale]/cases/[slug]/page.tsx", "utf8");
  assert.match(page, /<CaseShots/);
});

test("прототип — со страницы кейса: сначала проект, потом «Запросить прототип» или «Хочу так же»", () => {
  // Владелец, 24.10.2026: «Разве я не должен сначала провалиться внутрь
  // карточки в кейсах, а уже там кнопкой перейти в макет по паролю». И в тот
  // же день: «Я просил, чтобы открывалась карточка проекта, а потом уже
  // выбор — запросить прототип или хочу так же» (tests/case-page-choice.test.ts).
  const card = readFileSync("components/sections/cases.tsx", "utf8");
  assert.doesNotMatch(card, /href=\{item\.prototype\.href\}/);
  const page = readFileSync("app/[locale]/cases/[slug]/page.tsx", "utf8");
  assert.match(page, /dict\.cases\.protoRequest/);
  assert.match(page, /company\.salesTelegramUrl/);
  assert.match(readFileSync("content/company.ts", "utf8"), /salesTelegramUrl: "https:\/\/t\.me\/devuz_sales"/);
  // Открыт без пароля только SamAuto — по слову владельца, 21.10.2026.
  assert.deepEqual(cases.filter((c) => c.prototype?.open).map((c) => c.slug), ["samauto"]);
});
