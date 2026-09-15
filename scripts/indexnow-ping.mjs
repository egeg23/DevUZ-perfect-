#!/usr/bin/env node
/**
 * Пинг IndexNow руками: сказать Bing и Яндексу, что появились новые страницы.
 *
 *   node --experimental-strip-types scripts/indexnow-ping.mjs <адрес>…
 *   node --experimental-strip-types scripts/indexnow-ping.mjs --razbors 6
 *   node --experimental-strip-types scripts/indexnow-ping.mjs --razbors --dry-run
 *
 * На выкатке пинг идёт сам — через POST /api/indexnow с самого сервера, где
 * и живёт ключ. Этот скрипт нужен, когда пингуют вне выкатки: с машины, где
 * INDEXNOW_KEY задан в окружении.
 *
 * Google протокол не поддерживает — туда страницы попадают через sitemap.xml
 * и обычный обход, и отдельного пинка не требуют.
 */
import process from "node:process";

import { razbors } from "../content/razbor/items.ts";
import { buildPayload, freshRazborUrls, sendPing } from "../lib/indexnow.ts";
import { RAZBOR_LOCALES } from "../lib/razbor/routing.ts";

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

const positional = argv.filter((a) => a.startsWith("http"));
let urls;
if (argv.includes("--razbors")) {
  const limit = Number(flagValue("--razbors"));
  urls = freshRazborUrls(
    siteUrl,
    { locales: RAZBOR_LOCALES, items: razbors },
    Number.isFinite(limit) && limit > 0 ? limit : 6,
  );
} else if (positional.length > 0) {
  urls = positional;
} else {
  console.error("Использование: node scripts/indexnow-ping.mjs <адрес>… | --razbors [N]");
  process.exit(2);
}

const key = (process.env.INDEXNOW_KEY || "").trim();
if (!key) {
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
  console.log("\n--dry-run: ничего не отправлено");
  process.exit(0);
}

const report = await sendPing(payload);
if (report.ok) {
  console.log(`IndexNow: ${report.text}`);
  process.exit(0);
}
console.error(`IndexNow: ${report.text}`);
process.exit(1);
