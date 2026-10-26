/* Снимки макета: node shots.mjs [ширины] [страницы] → docs/screens/chechfarm/<страница>-<ширина>.webp
   Сервер — node serve.mjs. Видео DevUz пропускаем отметкой «уже видели». */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import sharp from "sharp";
const BASE = "http://localhost:4831/proto/" + "A".repeat(43);
const OUT = new URL("../../../docs/screens/chechfarm/", import.meta.url).pathname;
const widths = (process.argv[2] || "390,1440").split(",").map(Number);
const pages = (process.argv[3] || ",about,products,partners,investors,news,contacts,panel").split(",");
const b = await chromium.launch();
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  for (const p of pages) {
    await pg.goto(`${BASE}/${p}`, { waitUntil: "networkidle" });
    await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await pg.waitForTimeout(900);
    const sx = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const png = await pg.screenshot({ fullPage: true });
    const { data, info } = await sharp(png, { limitInputPixels: false }).resize({ width: 900, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
    /* WebP не больше 16383 px: длинную страницу телефона режем снизу. */
    await sharp(data, { limitInputPixels: false }).extract({ left: 0, top: 0, width: info.width, height: Math.min(info.height, 16000) }).webp({ quality: 68 }).toFile(`${OUT}${p || "home"}-${w}.webp`);
    console.log(w, p || "home", sx > 0 ? "ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА " + sx : "ok");
  }
  if (errs.length) console.log("ошибки:", errs);
  await ctx.close();
}
await b.close();
