// Пример шаблона «Услуги для бизнеса» на выдуманной мастерской и снимки 390 и 1440.
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs \
//     scripts/protos/instant/uslugi-preview.mjs
//
// Снимки — docs/screens/instant/uslugi-*.png (в webp сжимаются отдельно).
// Проходит и путь заявки: форма на сайте → панель первой строкой.
import { mkdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

import { buildInstant } from "../../../lib/proto/instant/build.ts";
import { EXAMPLE_USLUGI, EXAMPLE_USLUGI_UZ } from "./preview-data.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const out = mkdtempSync(join(tmpdir(), "uslugi-"));
const ru = buildInstant(EXAMPLE_USLUGI, "0".repeat(32));
const uz = buildInstant(EXAMPLE_USLUGI_UZ, "0".repeat(32));
for (const b of [ru, uz]) {
  if (b.problems.length) {
    console.error("Проверка не прошла:", b.problems);
    process.exit(1);
  }
}
const pages = { "/": ru.html, "/uz": uz.html, "/admin": ru.pages.admin, "/uz/admin": uz.pages.admin };
const fileOf = (p) => join(out, `${p.replace(/\//g, "_") || "_"}.html`);
for (const [p, html] of Object.entries(pages)) writeFileSync(fileOf(p), html.replaceAll("__PROTO_BASE__", p.startsWith("/uz") ? "/uz" : ""));

const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".mp4": "video/mp4" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/\/$/, "") || "/";
  const file = pages[path] ? fileOf(path) : join(root, "public", path);
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const shots = join(root, "docs/screens/instant");
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
let bad = 0;
const SHOTS = [
  [390, 844, "/", "uslugi-ru-390"],
  [1440, 900, "/", "uslugi-ru-1440"],
  [390, 844, "/uz", "uslugi-uz-390"],
  [1440, 900, "/uz", "uslugi-uz-1440"],
  [390, 844, "/admin", "uslugi-admin-390"],
  [1440, 900, "/admin", "uslugi-admin-1440"],
];
for (const [w, h, path, file] of SHOTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  page.on("pageerror", (e) => {
    bad++;
    console.error(`Ошибка скрипта на ${path} (${w}):`, e.message);
  });
  await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    bad++;
    console.error(`Прокрутка вбок на ${path} ${w}!`);
  }
  await page.screenshot({ path: join(shots, `${file}.png`), fullPage: !path.includes("admin") });
  await page.close();
}

// Путь заявки: форма на сайте → панель первой строкой.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
page.on("pageerror", (e) => {
  bad++;
  console.error("Ошибка скрипта (заявка):", e.message);
});
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" }).catch(() => {});
await page.fill("form[data-lead] [name=name]", "Тест Проверка");
await page.fill("form[data-lead] [name=phone]", "+998 90 111 22 33");
await page.selectOption("form[data-lead] [name=kind]", "s1");
await page.check("form[data-lead] [name=agree]");
await page.click("form[data-lead] button[type=submit]");
await page.waitForTimeout(400);
const id = (await page.textContent(".sent [data-no]")) ?? "-";
await page.goto(`http://127.0.0.1:${port}/admin#leads`, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(600);
const seen = await page.evaluate((x) => document.body.innerText.includes(x), id);
console.log(`Заявка ${id}: в панели ${seen ? "есть" : "НЕТ"}`);
if (!seen) bad++;
await ctx.close();

await browser.close();
server.close();
console.log(bad ? `Ошибок: ${bad}` : "Чисто");
process.exit(bad ? 1 : 0);
