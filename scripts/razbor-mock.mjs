#!/usr/bin/env node
/**
 * Снимок макета «как сделали бы мы».
 *
 * Страница собирается из нашего шаблона и снимается тем же браузером и в тех
 * же размерах, что и оригинал: сравнение «было — стало» честно только тогда,
 * когда оба снимка сделаны одинаково.
 *
 *   node scripts/razbor-mock.mjs <ниша> <город> <ru|uz> <куда класть>
 *
 * Имени разобранной компании в макете нет. Выдуманных цифр — тоже.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

import { cityByKey, nicheByKey } from "../content/razbor/catalog.ts";
import { mockupHtml } from "../lib/razbor/mockup.ts";

const SHOTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

const [nicheKey, cityKey, localeRaw, outDir] = process.argv.slice(2);
if (!nicheKey || !cityKey || !localeRaw || !outDir) {
  console.error("Использование: node scripts/razbor-mock.mjs <ниша> <город> <ru|uz> <каталог>");
  process.exit(2);
}

const niche = nicheByKey(nicheKey);
const city = cityByKey(cityKey);
const locale = localeRaw === "uz" ? "uz" : "ru";
if (!niche) { console.error(`Нет такой ниши: ${nicheKey}`); process.exit(2); }
if (!city) { console.error(`Нет такого города: ${cityKey}`); process.exit(2); }

async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;
  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.startsWith("chromium-"))
    .map((d) => d.name).sort().reverse();
  for (const dir of dirs) {
    const candidate = path.join(root, dir, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const executablePath = await chromiumPath();
if (!executablePath) {
  console.error("Chromium не найден. Укажите CHROMIUM_PATH или PLAYWRIGHT_BROWSERS_PATH.");
  process.exit(3);
}

await mkdir(outDir, { recursive: true });
const html = mockupHtml({ niche, city, locale, findings: [] });
const page = path.join(outDir, `mock-${locale}.html`);
await writeFile(page, html, "utf8");

// Макет свой, ничего наружу не грузит — ни прокси, ни доверия к чужим
// сертификатам здесь не нужно. Открывается с диска.
const browser = await chromium.launch({ executablePath });
const result = { page, shots: [] };

try {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
      isMobile: shot.mobile,
      hasTouch: shot.mobile,
      locale: locale === "uz" ? "uz-UZ" : "ru-RU",
    });
    const tab = await context.newPage();
    await tab.goto(`file://${page}`, { waitUntil: "load" });
    // Шрифты системные, сеть не задействована — ждать нечего, кроме первой
    // отрисовки.
    await tab.waitForTimeout(250);

    const file = path.join(outDir, `after-${locale}-${shot.name}.png`);
    await tab.screenshot({ path: file });
    result.shots.push({ size: shot.name, file, width: shot.width, height: shot.height });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
