import { chromium } from "playwright-core";
// «Было / стало» и значки вкладки: node shots.mjs (сначала node serve.mjs).
// Было — asmoclinic.uz, стало — первый экран прототипа; компьютер и телефон.
import { readFileSync } from "node:fs";
const OUT = new URL("../../../public/protos/asmo/", import.meta.url).pathname;
const B = `http://localhost:4801/proto/${"A".repeat(43)}/`;
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
for (const [k, vp, mob] of [["d", { width: 1440, height: 900 }, false], ["m", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto("https://asmoclinic.uz/ru/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `/tmp/ba-old-${k}.png` });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("am-intro", "1"); } catch {} });
  const q = await ctx.newPage();
  await q.goto(B, { waitUntil: "load" }); await q.waitForTimeout(1500);
  await q.screenshot({ path: `/tmp/ba-new-${k}.png` });
  await ctx.close();
}
const ctx = await b.newContext({ viewport: { width: 192, height: 192 } });
const p = await ctx.newPage();
const mark = readFileSync(new URL("./logo.json", import.meta.url), "utf8");
const dots = JSON.parse(mark).dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${d.a ? "#caf1f8" : "#fff"}"/>`).join("");
for (const [n, s] of [["icon-192", 192], ["apple-180", 180]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<body style="margin:0;background:#06171d;display:grid;place-items:center;height:${s}px"><svg viewBox="-40 -40 932 972" style="width:${s * 0.78}px;height:${s * 0.78}px">${dots}</svg></body>`);
  await p.screenshot({ path: OUT + n + ".png" });
}
await b.close();
