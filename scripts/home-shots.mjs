// Снимки главной для владельца: node scripts/home-shots.mjs <папка> [адрес]
// Каждая ширина — первый экран и страница целиком (рус.), остальные языки —
// первый экран на компьютере. Пишет PNG в docs/screens/home-samarkand/<папка>; в репозиторий — webp.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const dir = process.argv[2] || "after";
const base = process.argv[3] || "http://localhost:3100";
const out = `docs/screens/home-samarkand/${dir}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium" });
async function shot(locale, width, full) {
  const height = width < 500 ? 844 : width < 1000 ? 1024 : 900;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle", timeout: 120000 });
  if (full) {
    // Ленивые картинки и ролики грузятся, когда до них докрутили.
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 600) await page.evaluate((v) => window.scrollTo(0, v), y), await page.waitForTimeout(120);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.waitForTimeout(1500);
  const name = `${out}/${locale}-${width}${full ? "-full" : ""}.png`;
  await page.screenshot({ path: name, fullPage: full });
  await page.close();
  return name;
}
for (const w of [390, 768, 1440]) {
  console.log(await shot("ru", w, false));
  console.log(await shot("ru", w, true));
}
for (const l of ["en", "uz", "zh", "uk", "pl"]) console.log(await shot(l, 1440, false));
await browser.close();
