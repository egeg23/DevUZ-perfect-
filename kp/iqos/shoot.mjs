#!/usr/bin/env node
/**
 * Снимает экраны из kp/iqos/screens.html в PNG для КП kp/iqos.html.
 *
 *   node kp/iqos/shoot.mjs
 *
 * Плотность 3x: в PDF экран телефона стоит шириной ~55 мм, и при 2x буквы
 * на печати уже видны квадратиками.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }).catch(() => chromium.launch());
const tab = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 3 });
await tab.goto(`file://${path.join(here, "screens.html")}`, { waitUntil: "load" });
await tab.evaluate(() => document.fonts.ready);
for (const id of ["bot-start", "bot-fix", "bot-human", "site-help", "site-wizard", "panel"]) {
  await tab.locator(`#${id}`).screenshot({ path: path.join(here, `${id}.png`), omitBackground: true });
  console.log(id);
}
await browser.close();
