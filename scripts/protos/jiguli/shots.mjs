// Снимки и короткая запись прокрутки для docs/screens/jiguli: node shots.mjs (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4822/proto/${"a".repeat(43)}/`;
const OUT = new URL("../../../docs/screens/jiguli/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
const init = () => { try { sessionStorage.setItem("dz-intro", "1"); localStorage.setItem("jg-18", "1"); } catch {} };
// [имя, ширина, высота, путь, что: доля сцены или #блок]
const SHOTS = [];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const k of [0, 0.22, 0.5, 0.62, 1]) SHOTS.push([`scene-${w}-${String(Math.round(k * 100)).padStart(3, "0")}`, w, h, "", k]);
  for (const s of ["#fz-beer", "#fz-sour", "#fz-raki", "#fz-lamb", "#akcii", "#bron", "#kontakty", "#seychas", "#stoimost"]) SHOTS.push([`${s.slice(1)}-${w}`, w, h, "", s]);
  SHOTS.push([`uz-scene-${w}`, w, h, "uz", 0], [`uz-fz-sour-${w}`, w, h, "uz", "#fz-sour"]);
}
SHOTS.push(["age-390", 390, 844, "", "age"], ["menu-390", 390, 844, "", "menu"]);
for (const [name, w, h, path, sc] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(init);
  if (sc === "age") await p.addInitScript(() => localStorage.removeItem("jg-18"));
  await p.goto(B + path, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  if (sc === "menu") { await p.evaluate(() => document.getElementById("full-open").click()); }
  else if (typeof sc === "string" && sc.startsWith("#")) await p.evaluate((s) => { document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + (s.startsWith("#fz") ? e.offsetHeight * .3 : 0)); }, sc);
  else if (typeof sc === "number") await p.evaluate((k) => { const s = document.getElementById("story"); window.scrollTo(0, (s.offsetHeight - innerHeight) * k); }, sc);
  if (typeof sc === "string" && sc.startsWith("#fz")) { await p.mouse.move(w * .55, h * .4); await p.mouse.move(w * .6, h * .45, { steps: 6 }); }
  await p.waitForTimeout(2000);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
}
// Запись прокрутки на телефоне: кино и первые две сцены меню, ~16 с
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir: OUT + "rec", size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  await p.addInitScript(init);
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(4000);
  const total = await p.evaluate(() => { const m = document.getElementById("fz-sour"); return m.getBoundingClientRect().top + scrollY + m.offsetHeight - innerHeight; });
  for (let i = 0; i <= 200; i++) { await p.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 200)); await p.waitForTimeout(55); }
  await p.waitForTimeout(800);
  await ctx.close();
  const f = readdirSync(OUT + "rec")[0];
  execSync(`ffmpeg -v error -y -i "${OUT}rec/${f}" -vf "fps=24,scale=390:-2" -c:v libx264 -crf 30 -an -movflags +faststart "${OUT}scroll-390.mp4" && rm -rf "${OUT}rec"`);
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[1][:-4]+'.jpg','JPEG',quality=72)" "$f" && rm "$f"; done`);
console.log("готово", SHOTS.length);
