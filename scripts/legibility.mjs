#!/usr/bin/env node
/**
 * Читается ли макет с телефона.
 *
 *   node scripts/legibility.mjs ad/telegram-post.html 390 488
 *
 * Картинка в ленте телеграма занимает по ширине около 390 px, а грузим мы её
 * в 1080 — то есть всё, что нарисовано, человек видит втрое мельче. Спорить об
 * этом на глаз бесполезно: скрипт открывает макет ровно на той ширине, на
 * которой его увидят, и снимает посчитанные браузером кегли.
 *
 * Порог — 4% ширины кадра: на 390 px это 15,6 px, то есть примерно нижняя
 * граница, на которой текст ещё читается с вытянутой руки. Всё, что не
 * помещается в этот размер, из картинки убирается и живёт в тексте поста.
 *
 * Заодно ловится вылет за кадр: `overflow:hidden` обрезает молча, и на снимке
 * недостающая строка выглядит так, будто её и не задумывали.
 */
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

import { localizeHtml } from "./site-mirror.mjs";

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
    const candidate = path.join(root, dir, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const [source, widthArg = "390", heightArg = "488"] = process.argv.slice(2);
if (!source) {
  console.error("Нужен файл: node scripts/legibility.mjs page.html 390 488");
  process.exit(2);
}

const width = Number(widthArg);
const height = Number(heightArg);
const floor = Math.round(width * 0.04 * 10) / 10;

const work = await mkdtemp(path.join(tmpdir(), "legibility-"));
const html = await localizeHtml(await readFile(source, "utf8"), "https://devuz.studio/", work);
await writeFile(path.join(work, "index.html"), html, "utf8");

const browser = await chromium.launch({ executablePath: await chromiumPath(), args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width, height } });
const tab = await context.newPage();
await tab.goto(`file://${path.join(work, "index.html")}`, { waitUntil: "load" });
// Секунда на шрифты: до их загрузки кегли меряются по подменному шрифту и врут.
await tab.waitForTimeout(1000);

const report = await tab.evaluate(() => {
  const rows = [];
  for (const el of document.querySelectorAll("body *")) {
    const ownText = [...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
    if (!ownText) continue;
    const style = getComputedStyle(el);
    rows.push({
      what: el.textContent.trim().replace(/\s+/g, " ").slice(0, 30),
      px: Math.round(parseFloat(style.fontSize) * 10) / 10,
      weight: style.fontWeight,
      font: style.fontFamily.split(",")[0].replace(/"/g, ""),
    });
  }
  return {
    rows,
    tall: document.documentElement.scrollHeight - window.innerHeight,
    wide: document.documentElement.scrollWidth - window.innerWidth,
  };
});
await browser.close();

console.log(`${source} на ширине ${width}px, порог ${floor}px\n`);
for (const row of report.rows) {
  console.log(
    `${String(row.px).padStart(6)}px  ${row.weight.padEnd(4)} ${row.font.padEnd(12)} ${row.what}` +
      (row.px < floor ? "   ← мелко" : ""),
  );
}

const small = report.rows.filter((row) => row.px < floor);
const spill = [
  report.tall > 0 ? `по высоте на ${report.tall}px` : "",
  report.wide > 0 ? `по ширине на ${report.wide}px` : "",
].filter(Boolean);

console.log("");
if (spill.length) console.log(`вылет за кадр: ${spill.join(", ")}`);
if (small.length) {
  console.log(`отправлять нельзя: ${small.length} строк мельче ${floor}px`);
  process.exit(1);
}
if (spill.length) process.exit(1);
console.log("все кегли не меньше порога, вылета нет");
