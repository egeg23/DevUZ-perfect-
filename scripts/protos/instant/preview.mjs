// Пример «Макета в боте» на выдуманной клинике и снимки 390 и 1440.
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs \
//     scripts/protos/instant/preview.mjs [выход]
//
// Клиника выдумана целиком: реальных клиентов в репозиторий не кладём.
// Снимки — docs/screens/instant/, страница — в папку выхода (по умолчанию
// временная). Фото ниши и шрифты берутся из public/ этого репозитория.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

import { buildInstant } from "../../../lib/proto/instant/build.ts";
import { EXAMPLE, EXAMPLE_MED, EXAMPLE_MEBEL, EXAMPLE_REST, EXAMPLE_TUR } from "./preview-data.mjs";



const root = resolve(new URL("../../..", import.meta.url).pathname);
const out = process.argv[2] ?? join(tmpdir(), "instant-preview");
mkdirSync(out, { recursive: true });

const build = buildInstant(EXAMPLE, "0".repeat(32));
const med = buildInstant(EXAMPLE_MED, "0".repeat(32));
const mebel = buildInstant(EXAMPLE_MEBEL, "0".repeat(32));
const rest = buildInstant(EXAMPLE_REST, "0".repeat(32));
const tur = buildInstant(EXAMPLE_TUR, "0".repeat(32));
for (const b of [build, med, mebel, rest, tur]) {
  if (b.problems.length) {
    console.error("Проверка не прошла:", b.problems);
    process.exit(1);
  }
}
const uz = buildInstant({ ...EXAMPLE, locale: "uz", tagline: "Shoshilmasdan, xotirjam davolash", about: "Yunusoboddagi oilaviy stomatologiya.", source: "namuna, o‘ylab topilgan klinika" }, "0".repeat(32));
writeFileSync(join(out, "index.html"), build.html);
writeFileSync(join(out, "uz.html"), uz.html);
writeFileSync(join(out, "med.html"), med.html);
writeFileSync(join(out, "mebel.html"), mebel.html);
writeFileSync(join(out, "rest.html"), rest.html);
writeFileSync(join(out, "tur.html"), tur.html);
writeFileSync(join(out, "kp.html"), mebel.pages.kp.replaceAll("__PROTO_BASE__", "/mebel"));
console.log(`Страница: ${join(out, "index.html")} (${Math.round(build.html.length / 1024)} КБ), проблем uz: ${uz.problems.length}`);

const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".mp4": "video/mp4" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const file = path === "/" ? join(out, "index.html") : path === "/uz" ? join(out, "uz.html") : path === "/med" ? join(out, "med.html") : path === "/mebel" ? join(out, "mebel.html") : path === "/rest" ? join(out, "rest.html") : path === "/tur" ? join(out, "tur.html") : path === "/kp" ? join(out, "kp.html") : join(root, "public", path);
  if (!file.startsWith(root) && !file.startsWith(out)) return res.writeHead(403).end();
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
for (const [w, h, tag, path, file] of [[390, 844, "390", "/", "dental"], [1440, 900, "1440", "/", "dental"], [390, 844, "390", "/med", "medcentr"], [1440, 900, "1440", "/med", "medcentr"], [390, 844, "390", "/mebel", "mebel"], [1440, 900, "1440", "/mebel", "mebel"], [390, 844, "390", "/rest", "restoran"], [1440, 900, "1440", "/rest", "restoran"], [390, 844, "390", "/tur", "tur"], [1440, 900, "1440", "/tur", "tur"], [390, 844, "390", "/kp", "kp"], [1440, 900, "1440", "/kp", "kp"]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  page.on("pageerror", (e) => console.error(`Ошибка скрипта на ${path} (${w}):`, e.message));
  await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  // Фото ниже первого экрана грузятся по мере прокрутки: докрутить до конца.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (scroll) console.error(`Прокрутка вбок на ${w}!`);
  await page.screenshot({ path: join(shots, `${file}-${tag}.png`), fullPage: true });
  await page.close();
}
await browser.close();
server.close();
console.log(`Снимки: ${shots}`);
