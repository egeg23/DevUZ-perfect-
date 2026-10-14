// Снимки для проверки: node shot.mjs <путь после токена> <ширина> <высота> <файл> [js перед снимком]
import { chromium } from "playwright-core";
const [, , path = "", w = "390", h = "844", out = "s.png", js = ""] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.addInitScript(() => { try { sessionStorage.setItem("tb-intro", "1"); } catch (e) {} });
await p.goto(`http://localhost:4811/proto/${"a".repeat(43)}/${path}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
if (js) { await p.evaluate(js); await p.waitForTimeout(1500); }
await p.screenshot({ path: out });
const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log("errors:", errs.length ? errs : "none", "overflowX:", sw);
await b.close();
