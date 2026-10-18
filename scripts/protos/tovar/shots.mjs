// Снимки для docs/screens/tovar: node shots.mjs (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4815/proto/${"a".repeat(43)}`;
const OUT = new URL("../../../docs/screens/tovar/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const args = ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="];
if (process.env.HTTPS_PROXY) args.push("--proxy-server=" + process.env.HTTPS_PROXY, "--proxy-bypass-list=localhost;127.0.0.1");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args });
const SHOTS = [
  // [имя, путь, ширина, высота, прокрутка: доля героя или #блок]
  ["site-390-1-steklo", "", 390, 844, 0], ["site-390-2-vitrina", "", 390, 844, 0.32], ["site-390-3-prodavcy", "", 390, 844, 0.97],
  ["site-1440-1-steklo", "", 1440, 900, 0], ["site-1440-2-vitrina", "", 1440, 900, 0.36], ["site-1440-3-prodavcy", "", 1440, 900, 0.97], ["site-1440-uz-1-steklo", "uz", 1440, 900, 0],
  ["site-390-poisk", "", 390, 844, "#poisk"], ["site-1440-poisk", "uz", 1440, 900, "#poisk"],
  ["site-1440-seychas", "", 1440, 900, "#seychas"], ["site-390-mehaniki", "", 390, 844, "#mehaniki"], ["site-1440-mehaniki", "", 1440, 900, "#mehaniki"],
  ["site-1440-put", "", 1440, 900, "#put"], ["site-1440-prodavec", "", 1440, 900, "#prodavec"], ["site-1440-luchshie", "", 1440, 900, "#luchshie"],
  ["site-1440-cena", "", 1440, 900, "#cena"], ["site-390-cena", "uz", 390, 844, "#cena"],
  ["app-390-home", "app", 390, 844, 0], ["app-390-poisk", "app#/s/4%2F128", 390, 844, 0], ["app-390-kartochka", "app#/p/127578", 390, 844, 0],
  ["app-390-opt", "uz/app#/p/53664", 390, 844, 0], ["app-390-rfq", "app#/rfq", 390, 844, 0], ["app-1440-kartochka", "app#/p/127572", 1440, 900, 0],
  ["panel-1440-dash", "panel", 1440, 900, 0], ["panel-1440-goods", "panel#goods", 1440, 900, 0], ["panel-1440-ask", "panel#ask", 1440, 900, 0],
  ["panel-1440-start", "uz/panel#start", 1440, 900, 0], ["panel-390-dash", "panel", 390, 844, 0],
];
for (const [name, path, w, h, sc] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("tv-intro", "1"); } catch {} });
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
