// Снимки макета: node shots.mjs <папка> [ширины через запятую] — нужен запущенный serve.mjs.
// Пишет кадры заставки (&nlt=), первый экран и разделы, ошибки консоли и прокрутку вбок.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const [out = "shots", ws = "390,768,1440,2560"] = process.argv.slice(2);
const U = "http://localhost:4841/proto/" + "a".repeat(43) + "/";
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const b = await chromium.launch({ proxy, args: ["--ignore-certificate-errors"] });
const errs = [];
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : w > 2000 ? 1440 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 3 : w > 2000 ? 1 : 2, ignoreHTTPSErrors: true });
  if (!process.env.INTRO) await ctx.addInitScript(() => { try { sessionStorage.setItem("nl-intro", "1"); sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  for (const tt of process.env.INTRO ? [0.8, 2, 3.4, 4.6, 5.6, 6.1] : []) {
    await p.goto(U + `?intro=1&nlt=${tt}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.evaluate(() => { const z = document.getElementById("dzi"); if (z) z.remove(); });
    await p.waitForFunction(() => window.nliFrame > 2 || !document.getElementById("nli"), null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/intro-${tt}-${w}.png` });
  }
  await p.goto(U, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.evaluate(() => { for (const id of ["dzi", "nli"]) { const z = document.getElementById(id); if (z) z.remove(); } document.documentElement.classList.remove("nli"); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/hero-${w}.png` });
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 0) errs.push(`${w}: прокрутка вбок на ${over}px`);
  for (const id of (process.env.SEC || "radar,cats,stand,catalog,pick,upd,why,service,bot,offer").split(",")) {
    await p.evaluate((id) => { const e = document.getElementById(id); if (!e) return; const y = e.getBoundingClientRect().top + scrollY + (id === "radar" ? e.offsetHeight * 0.3 : 0); scrollTo(0, y); }, id);
    await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelector(".top").classList.remove("hide"));
    await p.screenshot({ path: `${out}/${id}-${w}.png` });
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.click('.card [data-open="1000268"]').catch(() => p.evaluate(() => document.querySelector('[data-open="1000268"]').click()));
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/product-${w}.png` });
  await p.evaluate(() => document.querySelector('#sheet [data-buy]').click());
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/cart-${w}.png` });
  const q = await ctx.newPage();
  await q.goto(U + "panel", { waitUntil: "domcontentloaded", timeout: 60000 });
  await q.waitForTimeout(1200);
  await q.screenshot({ path: `${out}/panel-${w}.png` });
  await q.goto(U + "panel#orders", { waitUntil: "domcontentloaded", timeout: 60000 });
  await q.waitForTimeout(800);
  await q.screenshot({ path: `${out}/panel-orders-${w}.png` });
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "ошибок нет");
