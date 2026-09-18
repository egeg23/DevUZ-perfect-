#!/usr/bin/env node
/**
 * Снимок страницы в картинку заданного размера.
 *
 *   node scripts/shot.mjs page.html out.png 1280x720
 *
 * Нужен там, где картинку проще сверстать, чем нарисовать: рекламный баннер,
 * обложка разбора, «было / стало». Верстать — значит править текст правкой
 * строки, а не заново в редакторе, и держать те же токены, что и у продукта:
 * реклама, набранная другим шрифтом, читается как чужая.
 *
 * Шрифты и картинки перед съёмкой складываются рядом (`localizeHtml`): в
 * песочнице браузер не ходит на Google Fonts сам, и снимок вышел бы набранным
 * системным шрифтом.
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

const [source, out, size = "1280x720", scaleArg = "2"] = process.argv.slice(2);
if (!source || !out) {
  console.error("Нужны файл и куда: node scripts/shot.mjs page.html out.png 1280x720");
  process.exit(2);
}

const [width, height] = size.split("x").map(Number);
const scale = Number(scaleArg);

const work = await mkdtemp(path.join(tmpdir(), "shot-"));
const html = await localizeHtml(await readFile(source, "utf8"), "https://devuz.studio/", work);
const page = path.join(work, "index.html");
await writeFile(page, html, "utf8");

const browser = await chromium.launch({ executablePath: await chromiumPath(), args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
const tab = await context.newPage();
await tab.goto(`file://${path.resolve(page)}`, { waitUntil: "load" });
// Секунда на то, чтобы встали шрифты: снимок до их загрузки врёт про размеры
// сильнее, чем его отсутствие.
await tab.waitForTimeout(1000);
await tab.screenshot({ path: out });
await browser.close();

console.log(`${out} — ${width * scale}×${height * scale}`);
