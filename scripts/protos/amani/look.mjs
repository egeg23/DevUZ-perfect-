// Быстрый осмотр главной: node look.mjs <ширина> <высота> <папка> [ru]
import { chromium } from "playwright-core";
const [w, h, dir, lang] = process.argv.slice(2);
const B = `http://localhost:4813/proto/${"a".repeat(43)}${lang === "ru" ? "/ru" : ""}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 800, hasTouch: +w < 800 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => { try { sessionStorage.setItem("am-intro", "1"); } catch {} });
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const H = await p.evaluate(() => document.querySelector(".hero").offsetHeight - innerHeight);
for (const [k, f] of [["a", 0], ["b", 0.35], ["c", 0.7], ["d", 1]]) { await p.evaluate((y) => scrollTo(0, y), Math.round(H * f)); await p.waitForTimeout(900); await p.screenshot({ path: `${dir}/hero-${w}-${k}.png` }); }
for (const id of ["kolleksiya", "umra", "podbor", "kak", "razmer", "upakovka", "dostavka", "podarok", "luchshie", "put", "cena"]) {
  await p.evaluate((i) => { const el = document.getElementById(i); scrollTo(0, el.getBoundingClientRect().top + scrollY + (i === "kolleksiya" ? innerHeight * 0.8 : 0)); }, id);
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${dir}/${id}-${w}.png` });
}
const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log("overflow", ov, "errors", errs.length ? errs.join("\n") : 0);
await b.close();
