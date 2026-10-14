// Кадры заставки: node introshot.mjs <w> <h> <префикс>
import { chromium } from "playwright-core";
const [, , w = "1440", h = "900", pre = "i"] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`http://localhost:4811/proto/${"a".repeat(43)}/`);
const t0 = Date.now();
for (const t of [1200, 3300, 4300, 5000, 5900, 6500, 6900, 7400]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `${pre}-${t}.png` }); }
console.log("errors:", errs.length ? errs : "none");
await b.close();
