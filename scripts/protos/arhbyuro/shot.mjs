// Снимок: node shot.mjs <путь после токена> <ширина> <высота> <файл> [прокрутка в долях пролёта или js]
import { chromium } from "playwright-core";
const [, , path = "", w = "390", h = "844", out = "s.png", js = ""] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 800 ? 2 : 1, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.addInitScript(() => { try { sessionStorage.setItem("arh-intro", "1"); } catch (e) {} });
await p.goto(`http://localhost:4812/proto/${"a".repeat(43)}/${path}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
if (js) { await p.evaluate(js); await p.waitForTimeout(2200); }
await p.screenshot({ path: out });
const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const e404 = errs.filter((e) => /404/.test(e)).length; const rest = errs.filter((e) => !/404/.test(e));
console.log("errors:", rest.length ? rest : "none", "404:", e404, "overflowX:", sw);
await b.close();
