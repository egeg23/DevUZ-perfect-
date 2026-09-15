#!/usr/bin/env node
/**
 * Пинг IndexNow: сказать Bing и Яндексу, что появились новые страницы.
 *
 *   node scripts/indexnow-ping.mjs <адрес> [<адрес> …]
 *   node scripts/indexnow-ping.mjs --razbors 6      # шесть свежих разборов
 *   node scripts/indexnow-ping.mjs --razbors --dry-run
 *
 * Google протокол не поддерживает — туда страницы попадают через
 * sitemap.xml и обычный обход, и отдельного пинка не требуют. Этот скрипт
 * нужен ради Яндекса: в Узбекистане он даёт заметную часть поиска, а
 * планового обхода там ждать дольше.
 *
 * Ключ берётся из INDEXNOW_KEY, домен — из NEXT_PUBLIC_SITE_URL (или --site).
 */
import process from "node:process";

import { razbors } from "../content/razbor/items.ts";
import { RAZBOR_LOCALES } from "../lib/razbor/routing.ts";
import { INDEXNOW_ENDPOINT, buildPayload, verdictFor } from "../lib/indexnow.ts";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");

function flagValue(name) {
  const at = argv.indexOf(name);
  return at < 0 ? null : (argv[at + 1] ?? null);
}

const siteUrl = (
  flagValue("--site") ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://devuz.studio"
).replace(/\/+$/, "");

/**
 * Свежие разборы плюс сами разделы.
 *
 * Раздел идёт в список вместе со статьями: он меняется при каждой
 * публикации, и без него робот узнаёт о новой статье, но не о том, что
 * список обновился.
 */
function razborUrls(limitRaw) {
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 6;
  const fresh = [...razbors]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, limit)
    .map((item) => `${siteUrl}/${item.locale}/razbor/${item.slug}`);
  return [...RAZBOR_LOCALES.map((l) => `${siteUrl}/${l}/razbor`), ...fresh];
}

const positional = argv.filter((a) => a.startsWith("http"));
let urls;
if (argv.includes("--razbors")) {
  urls = razborUrls(Number(flagValue("--razbors")));
} else if (positional.length > 0) {
  urls = positional;
} else {
  console.error("Использование: node scripts/indexnow-ping.mjs <адрес>… | --razbors [N]");
  process.exit(2);
}

const key = (process.env.INDEXNOW_KEY || "").trim();
if (!key) {
  // Не ошибка выкатки: на машине без ключа пинговать просто нечем.
  console.error("INDEXNOW_KEY не задан — пинг пропущен");
  process.exit(dryRun ? 0 : 1);
}

let payload;
try {
  payload = buildPayload({ key, siteUrl, urls });
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(2);
}

console.log(`${payload.host}: ${payload.urlList.length} адрес(ов)`);
for (const url of payload.urlList) console.log(`  ${url}`);

if (dryRun) {
  // Ключ в выводе не печатаем: dry-run зовут в логах CI.
  console.log(`\n--dry-run: ничего не отправлено (keyLocation ${payload.keyLocation})`);
  process.exit(0);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= 3; attempt++) {
  let verdict;
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    verdict = verdictFor(response.status);
  } catch (error) {
    verdict = { ok: false, retry: true, text: `сеть: ${error instanceof Error ? error.message : error}` };
  }

  if (verdict.ok) {
    console.log(`IndexNow: ${verdict.text}`);
    process.exit(0);
  }
  if (!verdict.retry || attempt === 3) {
    console.error(`IndexNow: ${verdict.text}`);
    process.exit(1);
  }
  const pause = 2000 * 2 ** (attempt - 1);
  console.error(`IndexNow: ${verdict.text} — повтор через ${pause / 1000}с`);
  await wait(pause);
}
