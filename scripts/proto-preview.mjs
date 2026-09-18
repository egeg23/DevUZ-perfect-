#!/usr/bin/env node
/**
 * Собрать прототип из файла с фактами, проверить и снять на телефоне и на
 * компьютере.
 *
 *   node scripts/proto-preview.mjs facts.json [--out каталог]
 *
 * Снимки делает настоящий Chromium, а не наше воображение: часть правил —
 * горизонтальная прокрутка, читаемость первого экрана, кнопка под большим
 * пальцем — проверяется только измерением в браузере. Заодно скрипт ловит
 * то, чего статическая проверка не увидит никогда: ошибки в консоли и
 * картинки, которые не загрузились.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { buildProto } from "../lib/proto/render.ts";

const PHONE = { width: 390, height: 844, scale: 3 };
const DESKTOP = { width: 1440, height: 900, scale: 2 };

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

const args = process.argv.slice(2);
const factsPath = args.find((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : "proto-out";

if (!factsPath) {
  console.error("Нужен файл с фактами: node scripts/proto-preview.mjs facts.json");
  process.exit(2);
}

const facts = JSON.parse(await readFile(factsPath, "utf8"));
const build = buildProto(facts);

if (!build) {
  console.error(`Ниша «${facts.niche}» не заведена в content/proto/models.ts`);
  process.exit(2);
}
if (build.missing.length) {
  console.error(`Не хватает для сборки: ${build.missing.join(", ")}`);
  process.exit(2);
}

await mkdir(outDir, { recursive: true });
const pagePath = path.join(outDir, "index.html");

/*
 * `--localize` складывает картинки клиента рядом со страницей и переписывает
 * на них ссылки — только в этой, просмотровой копии. Нужно там, где браузер
 * не ходит наружу напрямую: иначе снимок получается без логотипа, и решение
 * «годится или нет» принимается по странице, которой не существует.
 */
let html = build.html;
if (args.includes("--localize")) {
  await mkdir(path.join(outDir, "img"), { recursive: true });
  const remote = [...new Set([...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((match) => match[1]))];
  for (const [index, url] of remote.entries()) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const name = `${index}-${path.basename(new URL(url).pathname) || "image"}`;
      await writeFile(path.join(outDir, "img", name), Buffer.from(await response.arrayBuffer()));
      html = html.split(url).join(`img/${name}`);
    } catch {
      // Недоступную картинку оставляем как есть: пусть её отсутствие будет
      // видно на снимке, а не спрятано.
    }
  }
}

await writeFile(pagePath, html, "utf8");

console.log(`Страница: ${pagePath} (${(build.html.length / 1024).toFixed(1)} КБ)`);
if (build.problems.length) {
  console.log("\nПроверка не пройдена:");
  for (const problem of build.problems) console.log(`  · [${problem.code}] ${problem.text}`);
} else {
  console.log("Проверка пройдена.");
}

const executablePath = await chromiumPath();
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox", "--force-color-profile=srgb"] });
const issues = [];

for (const [name, size] of [["phone", PHONE], ["desktop", DESKTOP]]) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale,
    isMobile: name === "phone",
    hasTouch: name === "phone",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`${name}: ошибка в консоли — ${message.text()}`);
  });
  await page.goto(`file://${path.resolve(pagePath)}`, { waitUntil: "load" });

  const measured = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    sdt: !document.documentElement.classList.contains("no-sdt"),
    brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src),
    smallText: [...document.querySelectorAll("p,li,span,a")].filter((node) => {
      const size = parseFloat(getComputedStyle(node).fontSize);
      return node.textContent.trim().length > 20 && size < 14;
    }).length,
  }));

  if (measured.scrollWidth > measured.clientWidth + 1) {
    issues.push(`${name}: страница уезжает вбок — ${measured.scrollWidth} px при экране ${measured.clientWidth} px`);
  }
  for (const src of measured.brokenImages) issues.push(`${name}: не загрузилась картинка ${src}`);
  if (measured.smallText) issues.push(`${name}: ${measured.smallText} блоков текста мельче 14 px`);

  await page.screenshot({ path: path.join(outDir, `${name}-hero.png`) });

  // Середина сцены с трюком: колесо в развороте, а не в начальном положении.
  await page.evaluate(() => {
    const track = document.querySelector(".track");
    if (track) window.scrollTo(0, track.offsetTop + track.offsetHeight / 2);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${name}-stage.png`) });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, `${name}-end.png`) });

  console.log(
    `${name}: ${measured.scrollWidth}×${measured.height} px, scroll-driven animations ${measured.sdt ? "есть" : "нет"}`,
  );
  await context.close();
}

await browser.close();

if (issues.length) {
  console.log("\nБраузер нашёл:");
  for (const issue of issues) console.log(`  · ${issue}`);
}

process.exit(build.problems.length || issues.length ? 1 : 0);
