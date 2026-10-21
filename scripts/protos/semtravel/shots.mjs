// Снимки для docs/screens/semtravel: node shots.mjs (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4830/proto/${"a".repeat(43)}/`;
const OUT = new URL("../../../docs/screens/semtravel/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
const reveal = () => document.querySelectorAll(".rv").forEach((e) => e.classList.add("in"));
// [имя, путь, что сделать]
const PLAN = [
  ["1-hero", "", null],
  ["2-pick", "", async (p) => { await p.click("#tb-pick"); await p.evaluate(() => document.getElementById("poisk").scrollIntoView()); }],
  ["3-rez", "", async (p) => { await p.click("#go-know"); await p.waitForTimeout(2600); }],
  ["4-pick-rez", "", async (p) => { await p.click("#tb-pick"); await p.click("#go-pick"); await p.waitForTimeout(2600); }],
  ["5-tur", "", async (p) => { await p.click("#go-know"); await p.waitForTimeout(2600); await p.click("#rez-g [data-tour] >> nth=1"); await p.waitForTimeout(700); }],
  ["6-vou", "", async (p) => { await p.click("#go-know"); await p.waitForTimeout(2600); await p.click("#rez-g [data-tour] >> nth=1"); await p.waitForTimeout(700); await p.evaluate(() => document.getElementById("tu-vou").scrollIntoView()); }],
  ["7-bron", "", async (p) => { await p.click("#go-know"); await p.waitForTimeout(2600); await p.click("#rez-g [data-tour] >> nth=1"); await p.waitForTimeout(500); await p.click("#tu-book"); await p.waitForTimeout(500); await p.fill("#bf-n", "Dilnoza"); await p.fill("#bf-p", "+998 90 123 45 67"); await p.evaluate(() => { window.open = () => null; HTMLAnchorElement.prototype.click = function () {}; }); await p.click("#bf button[type=submit]"); await p.waitForTimeout(600); }],
  ["8-karta", "", async (p) => { await p.evaluate(() => document.getElementById("karta").scrollIntoView()); await p.waitForTimeout(3000); }],
  ["9-dcard", "", async (p) => { await p.evaluate(() => document.getElementById("karta").scrollIntoView()); await p.waitForTimeout(1500); await p.click('.karta .seg button[data-n="2"]'); await p.click('.dot[data-dest="thai"]', { force: true }); await p.waitForTimeout(1300); await p.evaluate(() => document.getElementById("dcard").scrollIntoView()); }],
  ["10-rank", "", async (p) => { await p.evaluate(() => document.getElementById("rank").scrollIntoView({ block: "center" })); await p.waitForTimeout(1300); }],
  ["11-gar", "", async (p) => { await p.evaluate(() => document.getElementById("garantii").scrollIntoView()); }],
  ["12-spec", "", async (p) => { await p.evaluate(() => document.querySelector(".spec").scrollIntoView()); }],
  ["13-club", "", async (p) => { await p.evaluate(() => document.getElementById("club").scrollIntoView()); }],
  ["14-otz", "", async (p) => { await p.evaluate(() => document.getElementById("otzyvy").scrollIntoView()); }],
  ["15-kontakty", "", async (p) => { await p.evaluate(() => document.getElementById("kontakty").scrollIntoView()); }],
  ["16-seychas", "", async (p) => { await p.evaluate(() => document.getElementById("seychas").scrollIntoView()); }],
  ["17-stoimost", "", async (p) => { await p.evaluate(() => document.getElementById("stoimost").scrollIntoView()); }],
  ["ru-1-hero", "ru", null],
  ["ru-8-karta", "ru", async (p) => { await p.evaluate(() => document.getElementById("karta").scrollIntoView()); await p.waitForTimeout(3000); }],
];
let n = 0;
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) for (const [name, path, act] of PLAN) {
  if (w === 768 && !/^(1-hero|5-tur|8-karta)$/.test(name)) continue;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); localStorage.clear(); } catch {} });
  await p.goto(B + path, { waitUntil: "load" });
  await p.waitForTimeout(2200);
  await p.evaluate(reveal);
  if (act) await act(p);
  await p.evaluate(reveal);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}${w}-${name}.png` });
  await ctx.close(); n++;
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=72,method=6)" "$f" && rm "$f"; done`);
console.log("готово", n);
