#!/usr/bin/env node
/**
 * Заготовка фактов для прототипа — с сайта самого клиента.
 *
 *   node --import ./tests/alias-hook.mjs scripts/proto-facts.mjs <адрес> <ниша> > facts.json
 *
 * То же, что делает форма в панели, только из командной строки: когда нужно
 * посмотреть, что вообще снимается с сайта, не заводя прототип. Сама работа
 * живёт в lib/proto/collect.ts и одна на оба входа — иначе панель и скрипт
 * разошлись бы через неделю, и разбираться пришлось бы на живом клиенте.
 *
 * Услуги скрипт не выдумывает: печатает заголовки со страницы как сырьё, а
 * выбирает из них человек.
 */
import { collectFacts } from "../lib/proto/collect.ts";
import { protoNicheByKey } from "../content/proto/models.ts";
import { PHOTO_MIN_WIDTH } from "../lib/proto/facts.ts";

const [target, niche = "shinomontazh"] = process.argv.slice(2);
if (!target) {
  console.error("Нужен адрес: node scripts/proto-facts.mjs tirex.uz shinomontazh");
  process.exit(2);
}
if (!protoNicheByKey(niche)) {
  console.error(`Ниша «${niche}» не заведена в content/proto/models.ts`);
  process.exit(2);
}

const collected = await collectFacts({ url: target, niche });
if ("error" in collected) {
  console.error(collected.error);
  process.exit(1);
}

console.log(JSON.stringify(collected.facts, null, 2));

console.error(`\n--- ${collected.page.url} (${collected.page.status}, ${collected.page.ttfbMs} мс) ---`);
console.error(`Телефон: ${collected.facts.phone ?? "—"}`);
console.error(`Телеграм: ${collected.facts.telegram ?? "—"}  Ватсап: ${collected.facts.whatsapp ?? "—"}`);
console.error(`Логотип: ${collected.facts.logo ? `${collected.facts.logo.url} (${collected.facts.logo.width}×${collected.facts.logo.height})` : "—"}`);
if (collected.small.length) {
  console.error(`Мелкие снимки, не взятые в прототип (порог ${PHOTO_MIN_WIDTH} px):`);
  for (const line of collected.small) console.error(`  · ${line}`);
}
console.error("Заголовки страницы — сырьё для услуг, а не сам список:");
for (const heading of collected.headings) console.error(`  · ${heading}`);
