#!/usr/bin/env node
/**
 * Разведка по чужим сайтам: не «нравится / не нравится», а числа.
 *
 *   node scripts/proto-recon.mjs sites.txt --out recon
 *
 * Владелец: «наш прототип выглядит будто первоклашка делал». Спорить с этим
 * нечем, а вот понять, чем именно чужая страница отличается от нашей, можно
 * только измерением. На глаз разница между «дорого» и «дёшево» неуловима —
 * в цифрах она видна сразу: размер заголовка относительно текста, сколько
 * всего размеров шрифта на странице, есть ли фотография на первом экране,
 * какой у них воздух между блоками.
 *
 * Снимает настоящий Chromium, поэтому считаются посчитанные браузером
 * значения, а не то, что написано в стилях: `clamp()` и медиазапросы иначе
 * пришлось бы разбирать самим и врать себе на каждом втором сайте.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { mirrorSite } from "./site-mirror.mjs";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

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

/**
 * Что именно меряем.
 *
 * Считается в браузере, поэтому здесь одна функция-строка без импортов: всё,
 * что ей нужно, должно существовать на чужой странице, а не у нас.
 */
const MEASURE = () => {
  const px = (value) => Math.round(parseFloat(value) || 0);
  const seen = (nodes, read) => {
    const counts = new Map();
    for (const node of nodes) {
      const key = read(node);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const all = [...document.querySelectorAll("body *")].slice(0, 4000);
  const текст = all.filter((node) => {
    const own = [...node.childNodes].some((child) => child.nodeType === 3 && child.textContent.trim().length > 1);
    return own && node.offsetParent !== null;
  });

  const h1 = document.querySelector("h1");
  const h1s = h1 ? getComputedStyle(h1) : null;
  const body = getComputedStyle(document.body);

  // Размеры шрифта: сколько их всего и какой разброс. У страницы, сделанной
  // на глаз, размеров либо три, либо двадцать три.
  const sizes = seen(текст, (node) => px(getComputedStyle(node).fontSize)).filter(([, count]) => count >= 2);
  const weights = seen(текст, (node) => getComputedStyle(node).fontWeight);
  const families = seen(all, (node) => getComputedStyle(node).fontFamily.split(",")[0].replace(/["']/g, "").trim());
  const colors = seen(текст, (node) => getComputedStyle(node).color);
  const backgrounds = seen(all, (node) => {
    const value = getComputedStyle(node).backgroundColor;
    return value === "rgba(0, 0, 0, 0)" ? null : value;
  });

  const sections = [...document.querySelectorAll("section, main > div, body > div > div")].filter(
    (node) => node.offsetHeight > 200,
  );
  const paddings = seen(sections, (node) => px(getComputedStyle(node).paddingTop)).filter(([value]) => value > 0);

  const viewport = window.innerHeight;
  const heroImages = [...document.querySelectorAll("img, video")].filter((node) => {
    const box = node.getBoundingClientRect();
    return box.top < viewport && box.width > 200 && box.height > 150;
  }).length;

  const html = document.documentElement.outerHTML;
  const libs = ["gsap", "lenis", "locomotive", "framer-motion", "aos", "swiper", "three", "barba"].filter((name) =>
    new RegExp(name, "i").test(html),
  );

  const widest = seen(
    [...document.querySelectorAll("div, section, main")].filter((node) => node.offsetWidth > 600),
    (node) => px(getComputedStyle(node).maxWidth),
  ).filter(([value]) => value > 0 && value < 2000);

  return {
    title: document.title.slice(0, 80),
    h1: h1
      ? {
          text: h1.textContent.trim().slice(0, 60),
          size: px(h1s.fontSize),
          weight: h1s.fontWeight,
          lineHeight: px(h1s.lineHeight),
          tracking: h1s.letterSpacing,
          family: h1s.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        }
      : null,
    bodySize: px(body.fontSize),
    bodyBg: body.backgroundColor,
    /** Во сколько раз заголовок крупнее текста. Ниже 2.5 страница выглядит плоско. */
    scale: h1s ? +(px(h1s.fontSize) / px(body.fontSize)).toFixed(2) : null,
    fontSizes: sizes.slice(0, 10),
    fontWeights: weights.slice(0, 6),
    families: families.slice(0, 4),
    textColors: colors.slice(0, 6),
    backgrounds: backgrounds.slice(0, 6),
    sectionPadding: paddings.slice(0, 5),
    maxWidth: widest.slice(0, 3),
    heroMedia: heroImages,
    libs,
    height: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
  };
};

const args = process.argv.slice(2);
const listPath = args.find((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : "recon";
if (!listPath) {
  console.error("Нужен файл со списком адресов: node scripts/proto-recon.mjs sites.txt");
  process.exit(2);
}

const urls = (await readFile(listPath, "utf8"))
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => (/^(https?|file):/.test(line) ? line : `https://${line}`));

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: await chromiumPath(), args: ["--no-sandbox"] });
const report = [];

for (const url of urls) {
  const parsed = new URL(url);
  const name = (parsed.protocol === "file:" ? path.basename(path.dirname(parsed.pathname)) : parsed.hostname.replace(/^www\./, "")).replace(/\./g, "-");
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  });
  const page = await context.newPage();
  try {
    /*
     * Свою страницу меряем тем же прибором, что и чужие, — иначе сравнение
     * ничего не стоит: разные способы измерения дают разные числа даже на
     * одной вёрстке. Локальный файл открывается как есть, зеркало ему не
     * нужно.
     */
    const local = url.startsWith("file://") ? url : null;
    if (local) {
      await page.goto(local, { waitUntil: "load", timeout: 30000 });
    } else {
      // Браузер открывает зеркало на диске, а не сеть: почему — в site-mirror.mjs.
      const mirror = await mirrorSite(url, path.join(outDir, "mirror", name));
      await page.goto(`file://${path.resolve(mirror.file)}`, { waitUntil: "load", timeout: 30000 });
    }
    // Полторы секунды на то, чтобы шрифты встали и первый экран дорисовался:
    // снимок до загрузки шрифта врёт про размеры сильнее, чем его отсутствие.
    await page.waitForTimeout(1800);
    const measured = await page.evaluate(MEASURE);
    await page.screenshot({ path: path.join(outDir, `${name}-desktop.png`) });
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `${name}-scrolled.png`) });

    await page.setViewportSize(PHONE);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `${name}-phone.png`) });

    report.push({ url, name, ...measured });
    console.log(
      `${name}: h1 ${measured.h1?.size ?? "—"}px / текст ${measured.bodySize}px (×${measured.scale ?? "—"}), ` +
        `размеров ${measured.fontSizes.length}, шрифты ${measured.families.map((f) => f[0]).join(", ")}, ` +
        `медиа на первом экране ${measured.heroMedia}, ${measured.libs.join("+") || "без библиотек"}`,
    );
  } catch (error) {
    console.log(`${name}: не открылся — ${error.message.split("\n")[0]}`);
    report.push({ url, name, error: String(error.message).slice(0, 120) });
  }
  await context.close();
}

await browser.close();
await writeFile(path.join(outDir, "recon.json"), JSON.stringify(report, null, 2), "utf8");
console.log(`\nОтчёт: ${path.join(outDir, "recon.json")}`);
