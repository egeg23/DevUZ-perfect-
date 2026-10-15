// Снимки экранов: node shot.mjs <путь#экран> <ширина> <высота> <файл> [full]
// Сервер: node serve.mjs. Заставку пропускает (sessionStorage).
import { chromium } from "playwright-core";
const [path, w, h, out, full] = process.argv.slice(2);
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}) });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: +w < 800, hasTouch: +w < 800 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => { try { sessionStorage.setItem("gw-intro", "1"); } catch {} });
await p.goto(B + "/" + path, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
await p.screenshot({ path: out, fullPage: !!full });
if (errs.length) console.log("ERR", errs.join("\n"));
await b.close();
