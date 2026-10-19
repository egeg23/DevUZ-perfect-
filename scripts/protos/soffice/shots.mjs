// Снимки для docs/screens/soffice: node shots.mjs [папка] (сервер: node serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4823/proto/${"a".repeat(43)}`;
const OUT = process.argv[2] || new URL("../../../docs/screens/soffice/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const args = ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="];
if (process.env.HTTPS_PROXY) args.push("--proxy-server=" + process.env.HTTPS_PROXY, "--proxy-bypass-list=localhost;127.0.0.1");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args });
const SHOTS = [
  // [имя, путь, ширина, высота, блок]
  ["1440-1-hero", "", 1440, 900, ""], ["1440-2-karta", "", 1440, 900, "#karta"], ["1440-3-katalog", "", 1440, 900, "#katalog"],
  ["1440-4-raschet", "", 1440, 900, "#raschet"], ["1440-5-etazh", "", 1440, 900, "#etazh"], ["1440-6-prosmotr", "", 1440, 900, "#prosmotr"],
  ["1440-7-otzyvy", "", 1440, 900, "#otzyvy"], ["1440-8-seychas", "", 1440, 900, "#seychas"], ["1440-9-cena", "", 1440, 900, "#cena"],
  ["1440-uz-hero", "uz", 1440, 900, ""], ["1440-en-hero", "en", 1440, 900, ""],
  ["390-1-hero", "", 390, 844, ""], ["390-2-finder", "", 390, 844, "#finder"], ["390-3-karta", "", 390, 844, "#karta"], ["390-4-katalog", "", 390, 844, "#katalog"],
  ["390-5-raschet", "uz", 390, 844, "#raschet"], ["390-6-etazh", "", 390, 844, "#etazh"], ["390-7-prosmotr", "en", 390, 844, "#prosmotr"], ["390-8-cena", "", 390, 844, "#cena"],
];
for (const [name, path, w, h, sel] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(900);
  if (sel) await p.evaluate((s) => { document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (s === "#finder" ? 80 : 0)); }, sel);
  await p.waitForTimeout(1400);
  if (name.includes("etazh")) await p.evaluate(() => document.querySelector(".fl-u.free")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  if (name.includes("prosmotr")) await p.evaluate(() => { document.querySelectorAll("[data-day]")[1]?.click(); document.querySelectorAll("[data-time]")[1]?.click(); });
  await p.evaluate(() => document.getElementById("top")?.classList.remove("hide"));
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
}
await b.close();
execSync(`cd ${OUT} && for f in *.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=72,method=6)" "$f" && rm "$f"; done`);
console.log("готово", SHOTS.length);
