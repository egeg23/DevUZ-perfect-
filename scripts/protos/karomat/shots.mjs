// Снимки для docs/screens/karomat: node shots.mjs (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4814/proto/${"a".repeat(43)}`;
const OUT = new URL("../../../docs/screens/karomat/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const SHOTS = [
  // [имя, путь, ширина, высота, прокрутка: доля героя или #блок]
  ["site-390-1-stol", "", 390, 844, 0], ["site-390-2-stol", "", 390, 844, 0.3], ["site-390-3-stol", "", 390, 844, 0.62],
  ["site-1440-1-stol", "", 1440, 900, 0], ["site-1440-2-stol", "", 1440, 900, 0.62], ["site-1440-ru-3-stol", "ru", 1440, 900, 0.7],
  ["site-390-menyu", "", 390, 844, "#menyu"], ["site-1440-menyu", "", 1440, 900, "#menyu"],
  ["site-390-bron", "", 390, 844, "#bron"], ["site-1440-bron", "", 1440, 900, "#bron"],
  ["site-390-banket", "", 390, 844, "#banket"], ["site-1440-banket", "ru", 1440, 900, "#banket"],
  ["site-1440-qr", "", 1440, 900, "#qr"], ["site-1440-video", "", 1440, 900, "#video"], ["site-1440-sharh", "ru", 1440, 900, "#sharh"],
  ["site-1440-panel", "", 1440, 900, "#panel"], ["site-1440-narx", "", 1440, 900, "#narx"], ["site-390-narx", "", 390, 844, "#narx"],
  ["app-390-home", "menu", 390, 844, 0], ["app-390-menyu", "menu#/c/all", 390, 844, 0], ["app-390-taom", "menu#/p/3755", 390, 844, 0],
  ["app-390-bron", "menu#/book", 390, 844, 0], ["app-390-banket", "ru/menu#/banket", 390, 844, 0], ["app-390-stol7", "menu#/t/7", 390, 844, 0],
  ["app-1440-menyu", "menu#/c/all", 1440, 900, 0], ["app-1440-taom", "ru/menu#/p/3790", 1440, 900, 0],
  ["panel-1440-dash", "panel", 1440, 900, 0], ["panel-1440-books", "panel#books", 1440, 900, 0], ["panel-1440-banq", "ru/panel#banq", 1440, 900, 0], ["panel-390-dash", "panel", 390, 844, 0],
];
for (const [name, path, w, h, sc] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("km-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(700);
  if (typeof sc === "string") await p.evaluate((s) => { document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); }, sc);
  else if (sc) await p.evaluate((k) => { const hero = document.querySelector(".hero"); window.scrollTo(0, (hero.offsetHeight - innerHeight) * k); }, sc);
  await p.waitForTimeout(1600);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=70,method=6)" "$f" && rm "$f"; done`);
console.log("готово", SHOTS.length);
