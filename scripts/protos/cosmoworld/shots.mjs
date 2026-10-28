/* Снимки макета: node shots.mjs [ширины] [языки] → docs/screens/cosmoworld/
   Сервер — SCENE_KEY=… node serve.mjs. Видео DevUz пропускаем отметкой
   «уже видели». Сцена снимается в пяти точках прокрутки после счёта до 100%,
   потом страница целиком; в лог — ошибки консоли и прокрутка вбок. */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import sharp from "sharp";
const BASE = "http://localhost:4832/proto/" + "A".repeat(43);
const OUT = new URL("../../../docs/screens/cosmoworld/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const widths = (process.argv[2] || "390,1440").split(",").map(Number);
const langs = (process.argv[3] || "ru").split(",");
const b = await chromium.launch();
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  for (const l of langs) {
    const tag = (l === "ru" ? "" : l + "-");
    await pg.goto(`${BASE}/${l === "ru" ? "" : l + "/"}`, { waitUntil: "networkidle" });
    await pg.waitForFunction(() => document.querySelector(".sc-load")?.classList.contains("ok"), null, { timeout: 60000 });
    const span = await pg.evaluate(() => { const s = document.querySelector(".sc"); return s.offsetHeight - innerHeight; });
    for (const p of [0, 0.2, 1 / 3, 0.5, 2 / 3, 0.83, 1]) {
      await pg.evaluate((y) => scrollTo(0, y), Math.round(span * p));
      await pg.waitForTimeout(1600);
      await pg.screenshot({ path: `/tmp/cw-shot.png` });
      await sharp(`/tmp/cw-shot.png`).resize({ width: Math.min(w, 1440) }).webp({ quality: 70 }).toFile(`${OUT}${tag}scene-${Math.round(p * 100)}-${w}.webp`);
    }
    await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } });
    await pg.waitForTimeout(1500);
    const sx = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const top = await pg.evaluate(() => document.querySelector(".sc").offsetHeight);
    await pg.evaluate((y) => scrollTo(0, y), top);
    await pg.waitForTimeout(600);
    const png = await pg.screenshot({ fullPage: true });
    const { data, info } = await sharp(png, { limitInputPixels: false }).extract({ left: 0, top: top * (w < 500 ? 2 : 1), width: w * (w < 500 ? 2 : 1), height: (await sharp(png, { limitInputPixels: false }).metadata()).height - top * (w < 500 ? 2 : 1) }).resize({ width: 900, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
    await sharp(data, { limitInputPixels: false }).extract({ left: 0, top: 0, width: info.width, height: Math.min(info.height, 16000) }).webp({ quality: 68 }).toFile(`${OUT}${tag}site-${w}.webp`);
    console.log(w, l, sx > 0 ? "ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА " + sx : "ok");
  }
  if (errs.length) console.log("ошибки:", errs);
  await ctx.close();
}
await b.close();
