import { chromium } from "playwright-core";
// «Было / стало» и значки вкладки: node shots.mjs (сначала node serve.mjs).
// Было — europegas.uz, стало — первый экран прототипа; компьютер и телефон.
// Снимки PNG пишутся в /tmp, в WebP их переводит python (см. README).
import { readFileSync } from "node:fs";
const OUT = new URL("../../../public/protos/europegas/", import.meta.url).pathname;
const B = `http://localhost:4807/proto/${"A".repeat(43)}/`;
const b = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [k, vp, mob] of [["d", { width: 1440, height: 900 }, false], ["m", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto("http://europegas.uz/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `/tmp/ba-old-${k}.png` });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("eg-intro", "1"); } catch {} });
  const q = await ctx.newPage();
  await q.goto(B, { waitUntil: "load" }); await q.waitForTimeout(1500);
  await q.screenshot({ path: `/tmp/ba-new-${k}.png` });
  await ctx.close();
}
const L = JSON.parse(readFileSync(new URL("./logo.json", import.meta.url), "utf8"));
const ctx = await b.newContext({ viewport: { width: 192, height: 192 } });
const p = await ctx.newPage();
for (const [n, s] of [["icon-192", 192], ["apple-180", 180]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<body style="margin:0;background:#110e33;display:grid;place-items:center;height:${s}px"><svg viewBox="0 0 352 352" style="width:${s * 0.86}px;height:${s * 0.86}px"><path d="${L.rh}" fill="#4a42a0"/><path d="${L.flame}" fill="#00b1f1"/><path d="${L.inner}" fill="#fff"/></svg></body>`);
  await p.screenshot({ path: OUT + n + ".png" });
}
await b.close();
