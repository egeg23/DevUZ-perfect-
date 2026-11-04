// Экраны концептов для презентации: node kp/anorbank-deck/shots.mjs
// Собирает concepts/<c>.<язык>.html из шаблона и словаря (concepts/text.json)
// и снимает кадры в img/<язык>/. Шрифты и картинки — локальные, сеть не нужна.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const DIR = path.dirname(new URL(import.meta.url).pathname);
const TEXT = JSON.parse(readFileSync(`${DIR}/concepts/text.json`, "utf8"));
const build = (c, lang) => {
  let html = readFileSync(`${DIR}/concepts/${c}.tpl.html`, "utf8");
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = TEXT[c][lang][k];
    if (v === undefined) throw new Error(`${c}.${lang}: нет ключа ${k}`);
    return v;
  });
  const file = `${DIR}/concepts/${c}.${lang}.html`;
  writeFileSync(file, html);
  return file;
};

// [концепт, кадр, ширина, высота, плотность, что снимать]
const SHOTS = [
  ["c1", "d-hero", 1440, 900, 1, { view: true }],
  ["c1", "d-bento", 1440, 900, 1, { el: "section.bento" }],
  ["c1", "m-hero", 390, 844, 1.5, { view: true }],
  ["c1", "m-bento", 390, 844, 1.5, { scroll: "section.bento" }],
  ["c2", "d-hero", 1440, 900, 1, { view: true }],
  ["c2", "d-seeds", 1440, 900, 1, { el: "section:nth-of-type(2)" }],
  ["c2", "d-prem", 1440, 900, 1, { el: "section:nth-of-type(3)" }],
  ["c2", "m-hero", 390, 844, 1.5, { view: true }],
  ["c2", "m-seeds", 390, 844, 1.5, { scroll: "section:nth-of-type(2)" }],
];

const browser = await chromium.launch();
for (const lang of ["ru", "uz"]) {
  mkdirSync(`${DIR}/img/${lang}`, { recursive: true });
  for (const [c, name, w, h, dpr, how] of SHOTS) {
    const file = build(c, lang);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    await page.goto(`file://${file}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const out = `${DIR}/img/${lang}/${c}-${name}.jpg`;
    if (how.el) {
      // Закреплённая шапка c1 не должна лечь поверх снятого блока.
      await page.addStyleTag({ content: "header{position:static!important}" });
      await page.locator(how.el).screenshot({ path: out, type: "jpeg", quality: 86 });
    } else {
      if (how.scroll) await page.evaluate((s) => scrollTo(0, document.querySelector(s).offsetTop - 8), how.scroll);
      await page.waitForTimeout(200);
      await page.screenshot({ path: out, type: "jpeg", quality: 86 });
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 0) console.error(`${lang} ${c} ${name}: прокрутка вбок ${over}px`);
    await page.close();
  }
  console.log(`${lang}: ${SHOTS.length} кадров`);
}
await browser.close();
