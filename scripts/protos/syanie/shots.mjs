// Снимки и короткая запись прокрутки для docs/screens/syanie: node shots.mjs (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4821/proto/${"a".repeat(43)}/`;
const OUT = new URL("../../../docs/screens/syanie/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
// [имя, ширина, высота, что: доля сцены или #блок]
const SHOTS = [];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const k of [0, 0.12, 0.26, 0.4, 0.62, 0.95]) SHOTS.push([`scene-${w}-${String(Math.round(k * 100)).padStart(2, "0")}`, w, h, k]);
  for (const s of ["#all-on-6", "#ceny", "#kviz", "#vrachi", "#garantii", "#otzyvy", "#seychas", "#voprosy", "#kontakty", "#stoimost"]) SHOTS.push([`${s.slice(1)}-${w}`, w, h, s]);
}
for (const [name, w, h, sc] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById("skipf").click());
  if (typeof sc === "string") await p.evaluate((s) => { document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY); if (s === "#voprosy") document.querySelector(".fq-q").click(); }, sc);
  else await p.evaluate((k) => { const s = document.getElementById("story"); window.scrollTo(0, (s.offsetHeight - innerHeight) * k); }, sc);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
}
// Запись прокрутки сцены на телефоне: ~12 с
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir: OUT + "rec", size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(5000);
  const total = await p.evaluate(() => document.getElementById("story").offsetHeight - innerHeight);
  for (let i = 0; i <= 120; i++) { await p.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 120)); await p.waitForTimeout(60); }
  await p.waitForTimeout(800);
  await ctx.close();
  const f = readdirSync(OUT + "rec")[0];
  execSync(`ffmpeg -v error -y -i "${OUT}rec/${f}" -vf "fps=24,scale=390:-2" -c:v libx264 -crf 30 -an -movflags +faststart "${OUT}scroll-390.mp4" && rm -rf "${OUT}rec"`);
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[1][:-4]+'.jpg','JPEG',quality=72)" "$f" && rm "$f"; done`);
console.log("готово", SHOTS.length);
