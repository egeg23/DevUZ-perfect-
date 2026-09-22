#!/usr/bin/env node
/**
 * Коммерческое предложение из вёрстки в PDF.
 *
 *   node scripts/kp-pdf.mjs kp/mavera.html kp/mavera.pdf
 *
 * КП уходит клиенту файлом в мессенджер, а не ссылкой: ссылку он не откроет
 * с чужого телефона, а файл перешлёт начальнику. Верстаем один раз в HTML —
 * правка строки, а не перерисовка в редакторе, — и снимаем в PDF.
 *
 * Страница открывается по своему настоящему пути, а не копией во временной
 * папке, как у `shot.mjs`: шрифты и стили лежат рядом с документом, и копия
 * оставила бы их за бортом.
 */
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

/** Высота листа A4 в пикселях CSS: 297 мм при 96 dpi. */
const A4 = (297 / 25.4) * 96;

async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;
  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("chromium-"))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const dir of dirs) {
    for (const layout of ["chrome-linux/chrome", "chrome-linux64/chrome"]) {
      const candidate = path.join(root, dir, layout);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

const [source, out] = process.argv.slice(2);
if (!source || !out) {
  console.error("Нужны файл и куда: node scripts/kp-pdf.mjs kp/mavera.html kp/mavera.pdf");
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: await chromiumPath(), args: ["--no-sandbox"] });
const tab = await browser.newPage();
await tab.goto(`file://${path.resolve(source)}`, { waitUntil: "load" });
// Метрики антиквы заметно отличаются от подменного шрифта, и лист, померенный
// до загрузки, врёт про переполнение в обе стороны.
await tab.evaluate(() => document.fonts.ready);

const sheets = await tab.evaluate(() =>
  [...document.querySelectorAll(".sheet")].map((el) => Math.round(el.scrollHeight)),
);

await tab.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();

// Лист, переросший A4, в PDF разрывается пополам, и вторая половина уезжает
// на пустую страницу с обрезанным подвалом. Молча такое не выпускаем.
const over = sheets
  .map((height, i) => ({ page: i + 1, height, spill: Math.round(height - A4) }))
  .filter((sheet) => sheet.spill > 1);

console.log(`${out} — листов ${sheets.length}`);
for (const sheet of over) console.error(`лист ${sheet.page}: +${sheet.spill} px сверх A4`);
if (over.length) process.exit(1);
