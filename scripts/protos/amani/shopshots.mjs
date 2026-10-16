// Снимки магазина и панели: node shopshots.mjs <папка>
import { chromium } from "playwright-core";
const dir = process.argv[2];
const B = `http://localhost:4813/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function shots(w, h, list) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  for (const [path, name, pre] of list) {
    await p.goto(B + "/" + path, { waitUntil: "networkidle" });
    if (pre) await pre(p);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${dir}/${name}.png` });
  }
  await ctx.close();
}
await shots(390, 844, [
  ["shop#/", "shop-390-home"], ["shop#/p/d5503", "shop-390-product"], ["shop#/kit/her", "shop-390-kit"],
  ["shop#/p/h6391", "shop-390-scarf", async (p) => { await p.click('[data-t="wrap"]').catch(() => {}); await p.evaluate(() => document.querySelector(".tabs").scrollIntoView()); }],
  ["shop#/p/d6329", "shop-390-length", async (p) => { await p.click("#sz-open"); }],
  ["ru/shop#/c/all", "shop-390-catalog-ru"],
  ["panel#dash", "panel-390-dash"],
]);
await shots(1440, 900, [["shop#/", "shop-1440-home"], ["ru/shop#/p/d5501", "shop-1440-product-ru"], ["panel#dash", "panel-1440-dash"], ["ru/panel#goods", "panel-1440-goods-ru"]]);
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true });
const p = await ctx.newPage();
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(700);
await p.screenshot({ path: `${dir}/site-390-reduced.png` });
await b.close();
console.log("ok");
