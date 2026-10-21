// Снимки для docs/screens/samauto: node shots.mjs (сервер: node serve.mjs).
// Сцена на 390, 768 и 1440: покрывало, машина, разлёт, фара, борт, проезд,
// цифры; и запасной путь (reduced motion).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4831/proto/${"a".repeat(43)}/`;
const OUT = new URL("../../../docs/screens/samauto/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
// [имя, доля сцены или блок]
const PLAN = [["1-pokryvalo", 0], ["2-sobrana", 0.165], ["3-razlet", 0.385], ["4-fara", 0.71], ["5-bort", 0.835], ["6-proezd", 0.9], ["7-final", 1], ["8-raqamlar", "#raqamlar"], ["9-maket", "#maket"]];
let n = 0;
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  for (const calm of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800, reducedMotion: calm ? "reduce" : "no-preference" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => console.log("err", e.message));
    await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
    await p.goto(B, { waitUntil: "load" });
    if (calm) { await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}${w}-0-calm.png`, fullPage: true }); await ctx.close(); n++; continue; }
    await p.waitForFunction(() => document.getElementById("stage").classList.contains("live"), null, { timeout: 120000 });
    for (const [name, at] of PLAN) {
      if (typeof at === "number") await p.evaluate((k) => { const t = document.getElementById("track"); scrollTo(0, t.offsetTop + k * (t.offsetHeight - innerHeight)); }, at);
      else await p.evaluate((s) => { document.querySelector(s).scrollIntoView(); document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); }, at);
      await p.waitForTimeout(typeof at === "number" ? 1500 : 900);
      await p.screenshot({ path: `${OUT}${w}-${name}.png` });
      n++;
    }
    await ctx.close();
  }
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=74,method=6)" "$f" && rm "$f"; done`);
console.log("готово", n);
