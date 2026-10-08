// Снимки «было / стало»: node shots.mjs <адрес> <файл без расширения>
// Пишет <файл>-d.png (1440 × 900) и <файл>-m.png (390 × 844). Через прокси
// сессии, если он задан; заставку прототипа пропускаем.
import { chromium } from "playwright-core";
const [url, out] = process.argv.slice(2);
const spki = process.env.PROXY_SPKI;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", ...(process.env.HTTPS_PROXY && !url.includes("localhost") ? { proxy: { server: process.env.HTTPS_PROXY } } : {}), args: spki ? [`--ignore-certificate-errors-spki-list=${spki}`] : [] });
for (const [sfx, w, h, mobile] of [["d", 1440, 900, false], ["m", 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("hop-intro", "1"); } catch {} });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}-${sfx}.png` });
  await ctx.close();
}
await b.close();
