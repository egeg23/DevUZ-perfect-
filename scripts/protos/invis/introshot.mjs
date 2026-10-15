// Кадры заставки: node introshot.mjs <ширина> <высота> <папка>
import { chromium } from "playwright-core";
const [, , w = "1440", h = "900", dir = "."] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 800 });
await p.goto(`http://localhost:4811/proto/${"a".repeat(43)}/`);
const t0 = Date.now();
for (const t of [1200, 3000, 4200, 5000, 5600, 6400, 7400]) { await p.waitForTimeout(t - (Date.now() - t0)); await p.screenshot({ path: `${dir}/intro-${w}-${t}.png` }); }
await b.close();
