// Снимок всей страницы, с прокруткой до конца (чтобы сработали появления): node fullshot.mjs <путь> <w> <h> <файл>
import { chromium } from "playwright-core";
const [, , path = "", w = "390", h = "844", out = "f.png"] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript(() => { try { sessionStorage.setItem("iv-intro", "1"); } catch (e) {} });
await p.goto(`http://localhost:4811/proto/${"a".repeat(43)}/${path}`, { waitUntil: "networkidle" });
for (let y = 0; y < 30000; y += 400) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); }
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true });
console.log("errors:", errs.length ? errs : "none", "overflowX:", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close();
