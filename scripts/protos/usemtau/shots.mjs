// Снимки для docs/screens/usemtau: node shots.mjs [имя…] (сервер: node serve.mjs).
// Без имени — все. OUT=папка, чтобы снять во временную.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4822/proto/${"a".repeat(43)}`;
const OUT = process.env.OUT || new URL("../../../docs/screens/usemtau/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const px = process.env.HTTPS_PROXY;
/* Прокси среды — только для https (шрифты Google); макет на localhost идёт мимо него. TLS не выключаем. */
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: [...(px ? [`--proxy-server=https=${px}`, "--proxy-bypass-list=localhost;127.0.0.1"] : []), "--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="] });
const SHOTS = [
  // [имя, путь, ширина, высота, прокрутка: #блок, доля сцены сборки или 0, действие]
  ["390-1-hero", "", 390, 844, 0], ["1440-1-hero", "", 1440, 900, 0], ["768-1-hero", "", 768, 1024, 0],
  ["390-2-poisk", "", 390, 844, "#poisk", "search"], ["1440-2-poisk", "", 1440, 900, "#poisk", "search"],
  ["390-kompaniya", "", 390, 844, "#kompaniya"], ["1440-kompaniya", "", 1440, 900, "#kompaniya"],
  ["390-katalog", "", 390, 844, "#katalog"], ["1440-katalog", "", 1440, 900, "#katalog", "hover"],
  ["390-kalk", "", 390, 844, "#kalk"], ["1440-kalk", "", 1440, 900, "#kalk"],
  ["1440-snab", "", 1440, 900, "#snab", "fill"], ["390-zayavka", "", 390, 844, 0, "cart"], ["1440-zayavka", "", 1440, 900, 0, "cart"],
  ["390-dostavka", "", 390, 844, "#dostavka"], ["1440-dostavka", "", 1440, 900, "#dostavka"],
  ["390-sborka-2", "", 390, 844, 0.6, "asm"], ["1440-sborka-1", "", 1440, 900, 0.3, "asm"], ["1440-sborka-3", "", 1440, 900, 1, "asm"],
  ["1440-obekty", "", 1440, 900, "#obekty"], ["390-obekty", "", 390, 844, "#obekty"], ["1440-gofro", "", 1440, 900, "#gofro"], ["1440-paneli", "", 1440, 900, "#paneli"],
  ["390-angar", "", 390, 844, "#angar"], ["1440-angar", "", 1440, 900, "#angar"], ["1440-seychas", "", 1440, 900, "#seychas"], ["1440-sosedi", "", 1440, 900, "#sosedi"],
  ["1440-sklad", "", 1440, 900, "#sklad"], ["390-sklad", "", 390, 844, "#sklad"], ["1440-cena", "", 1440, 900, "#cena"], ["390-cena", "", 390, 844, "#cena"], ["1440-podval", "", 1440, 900, ".foot"],
  ["katalog-390", "katalog", 390, 844, 0], ["katalog-1440", "katalog", 1440, 900, 0], ["katalog-1440-poisk", "katalog?q=труба 40×20", 1440, 900, 0],
];
const want = process.argv.slice(2);
for (const [name, path, w, h, sc, act] of SHOTS) {
  if (want.length && !want.some((x) => name.includes(x))) continue;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("ошибка", name, String(e)));
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(900);
  if (act === "fill" || act === "cart") await p.evaluate(() => document.getElementById("sd-fill")?.click());
  if (typeof sc === "string") await p.evaluate((s) => { document.querySelectorAll(".rv,.ln,.sh").forEach((e) => e.classList.add("in")); const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); }, sc);
  else if (act === "asm") await p.evaluate((k) => { const a = document.getElementById("stroyka"); window.scrollTo(0, a.offsetTop + (a.offsetHeight - innerHeight) * k); }, sc);
  if (act === "search") { await p.fill("#q", "труба 40×20"); }
  if (act === "hover") { const r = await p.$$("#ix .ix-r"); if (r[1]) { const bx = await r[1].boundingBox(); await p.mouse.move(bx.x + 300, bx.y + bx.height / 2); await p.mouse.move(bx.x + 320, bx.y + bx.height / 2); } }
  if (act === "cart") { await p.click("[data-cart] >> visible=true"); await p.selectOption("#dr-city", "10"); await p.fill("#dr-bin", "060540000008"); }
  await p.waitForTimeout(act === "asm" ? 1400 : 1600);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=72,method=6)" "$f" && rm "$f"; done`);
console.log("готово");
