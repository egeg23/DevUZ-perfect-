// Кадры заставки: node introshot.mjs <папка> [ширина высота]
import { chromium } from "playwright-core";
const [, , dir = "/tmp", w = "1440", h = "900"] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`http://localhost:4812/proto/${"a".repeat(43)}/`, { waitUntil: "domcontentloaded" });
for (const t of [1200, 2400, 3900, 5200, 6000, 7200]) { await p.waitForTimeout(t - (globalThis.last || 0)); globalThis.last = t; await p.screenshot({ path: `${dir}/intro-${w}-${t}.png` }); }
console.log(errs.length ? errs : "без ошибок", await p.evaluate(() => !document.getElementById("intro") && document.body.classList.contains("hero-on") ? "заставка ушла, первый экран открыт" : "заставка ещё на экране"));
await b.close();
