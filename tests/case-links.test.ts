import assert from "node:assert/strict";
import { test } from "node:test";

import { cases } from "@/content/cases";

/**
 * Каждый проект с витрины globalex — ссылкой из кейса.
 *
 * Владелец, 23.09: «добавь ссылки к каждому проекту на globalex, чтобы люди
 * могли посмотреть, что было сделано. Но убери везде цены».
 */

const SHOWCASE = "https://globalex.maximov-tech.ru";

test("у каждого проекта витрины есть ссылка «Посмотреть проект»", () => {
  const expected: Record<string, string> = {
    mavera: `${SHOWCASE}/mavera`,
    "global-export": `${SHOWCASE}/ru`,
    adar: `${SHOWCASE}/adar`,
    "harvest-motion": `${SHOWCASE}/motion.html`,
    "golden-house": `${SHOWCASE}/gh`,
    namuna: `${SHOWCASE}/namuna`,
    foodmaxx: `${SHOWCASE}/foodmaxx`,
    "akbar-rich": `${SHOWCASE}/akbar`,
    transtelecom: `${SHOWCASE}/ttc`,
    tranio: `${SHOWCASE}/tranio`,
    medacademy: `${SHOWCASE}/medacademy`,
  };
  for (const [slug, url] of Object.entries(expected)) {
    const item = cases.find((c) => c.slug === slug);
    assert.ok(item, `кейса ${slug} нет`);
    assert.equal(item.url, url, `${slug}: ссылка не на витрину`);
  }
});

test("в кейсах витрины нет наших цен", () => {
  const showcase = cases.filter((c) => c.url?.startsWith(SHOWCASE));
  for (const item of showcase) {
    const text = [item.category, item.summary, item.description, ...item.metrics.map((m) => m.label)]
      .flatMap((l) => [l.ru, l.en, l.uz, l.zh])
      .join(" ");
    for (const word of [/смет[аыу] по/i, /с ценой/i, /priced/i, /narxli/i, /带价/, /долларах, сумах/i, /estimate:/i, /итог пересчитывается/i]) {
      assert.doesNotMatch(text, word, `${item.slug}: ${word}`);
    }
  }
});

test("в письма идёт проект из ниши адресата, даже если это макет", () => {
  // Владелец, 28.09: «скаут в мебельной нише почему-то ссылается на usta —
  // это ж не то. Добавь новые кейсы и ссылайся на них… пусть ссылается на
  // релевантные проекты». Раньше макеты под конкретную компанию в письма не
  // ставились вовсе — и мебельщикам уезжал маркетплейс мастеров.
  const forNiche = (niche: string) => cases.filter((c) => c.forNiches.includes(niche)).map((c) => c.slug);
  assert.deepEqual(forNiche("mebel"), ["namuna"]);
  assert.deepEqual(forNiche("svyaz"), ["transtelecom"]);
  assert.deepEqual(forNiche("agentstvo-nedvizhimosti"), ["tranio"]);
  assert.ok(!cases.find((c) => c.slug === "usta")?.forNiches.includes("mebel"), "USTA снова пример для мебели");
});
