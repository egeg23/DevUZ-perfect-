// Снимки макета: node serve.mjs, затем node shots.mjs [папка] — в docs/screens/baldinini.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const B = `http://localhost:4812/proto/${"a".repeat(43)}`;
const OUT = process.argv[2] || new URL("../../../docs/screens/baldinini/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}) });
const list = [
  ["site-390", 390, 844, "", null, true], ["site-1440", 1440, 900, "", null, true],
  ["shop-home-390", 390, 844, "shop#/", null], ["shop-home-1440", 1440, 900, "shop#/", null, true],
  ["shop-catalog-390", 390, 844, "shop#/c/w", null], ["shop-catalog-1440", 1440, 900, "shop#/c/all", null],
  ["shop-product-390", 390, 844, "shop#/p/d7b704-0000", null, true], ["shop-product-1440", 1440, 900, "shop#/p/d7b220-bene", null],
  ["shop-cart-390", 390, 844, "shop#/cart", "cart"], ["shop-checkout-390", 390, 844, "shop#/checkout", "cart"], ["shop-me-390", 390, 844, "shop#/me", null],
  ["panel-dash-1440", 1440, 900, "panel#dash", null], ["panel-orders-1440", 1440, 900, "panel#orders", null], ["panel-goods-1440", 1440, 900, "panel#goods", null],
  ["panel-tryon-390", 390, 844, "panel#tryon", null], ["panel-std-1440", 1440, 900, "panel#vip", "std"],
];
for (const [name, w, h, path, prep, full] of list) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.addInitScript((prep) => {
    try { sessionStorage.setItem("bd-intro", "1"); sessionStorage.setItem("dz-intro", "1");
      if (prep === "cart") localStorage.setItem("bd-demo-1", JSON.stringify({ cart: [{ id: "d7b704-0000", sz: "38", q: 1 }, { id: "b6e905-0000", sz: "one", q: 1 }], gift: { on: true, card: "С днём рождения!" } }));
      if (prep === "std") localStorage.setItem("bd-panel-1", JSON.stringify({ tier: "std" }));
    } catch {}
  }, prep);
  await p.goto(`${B}/${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  if (full) await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 70, fullPage: !!full });
  await ctx.close();
}
await b.close();
console.log("ok");
