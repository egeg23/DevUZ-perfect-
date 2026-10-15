// Снимки ключевых экранов в docs/screens/greenwell: node serve.mjs, затем
// node screens.mjs [папка]. Проходит заказ по-настоящему, чтобы на снимках
// были корзина, оформление, курьер, отзыв и панель с этим заказом.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2] || new URL("../../../docs/screens/greenwell/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ctx(w, h) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1, isMobile: w < 800, hasTouch: w < 800 });
  await c.addInitScript(() => { try { sessionStorage.setItem("gw-intro", "1"); } catch {} });
  return c;
}
const shot = (p, name) => p.screenshot({ path: OUT + name + ".png" });
const go = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await sleep(700); };
async function code(p, sel, d) { const ins = await p.$$(sel + " input"); for (let i = 0; i < ins.length; i++) await ins[i].fill(String(d[i] ?? 1)); }

for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"]]) {
  for (const lang of ["", "uz/"]) {
    if (lang && w > 800) continue;
    const L = lang ? "-uz" : "";
    const c = await ctx(w, h), p = await c.newPage();
    await p.goto(`${B}/${lang}`, { waitUntil: "networkidle" });
    await sleep(1500);
    await shot(p, `site-${tag}-hero${L}`);
    for (const id of ["seychas", "put", "rassrochka", "panel", "cena"]) {
      await p.evaluate((x) => document.getElementById(x).scrollIntoView(), id);
      await sleep(1600);
      await shot(p, `site-${tag}-${id}${L}`);
    }
    await p.goto(`${B}/${lang}shop#/`, { waitUntil: "networkidle" });
    await sleep(800);
    await shot(p, `shop-${tag}-home${L}`);
    await go(p, "#/c/all");
    await p.click("#f-open");
    await sleep(500);
    await shot(p, `shop-${tag}-filters${L}`);
    await p.click("#f-go");
    await go(p, "#/p/mgc");
    await shot(p, `shop-${tag}-product${L}`);
    await p.click("#pd-buy [data-add]");
    await go(p, "#/p/sleep");
    await p.click("#pd-buy [data-add]");
    await p.evaluate(() => scrollTo(0, 1600));
    await sleep(500);
    await shot(p, `shop-${tag}-product-reviews${L}`);
    await p.click(".hd-s");
    await p.fill("#sq", lang ? "uyqu" : "сон");
    await sleep(300);
    await shot(p, `shop-${tag}-search${L}`);
    await p.click("#sq-x");
    await go(p, "#/cart");
    await p.fill("#pc-in", "GREEN10");
    await p.click("#promo button");
    await sleep(400);
    await shot(p, `shop-${tag}-cart${L}`);
    await go(p, "#/checkout");
    await p.fill("#ph", "901234567");
    await p.click("#ph-go");
    await code(p, "#code", "1234");
    await sleep(500);
    await p.fill("#nm", lang ? "Dilshod" : "Дильшод");
    await p.fill("#ad-lm", lang ? "110-maktab qarshisida" : "напротив школы 110");
    await p.fill("#ad-en", "2"); await p.fill("#ad-fl", "5"); await p.fill("#ad-ap", "24");
    await p.evaluate(() => document.querySelector("#co-recv").scrollIntoView({ block: "start" }));
    await sleep(400);
    await shot(p, `shop-${tag}-checkout${L}`);
    await p.click('label.pay:has(input[value="nasiya"])');
    await p.click(w < 800 ? "#co-go2" : "#co-go");
    await p.waitForSelector("#ns-next");
    await sleep(400);
    await shot(p, `shop-${tag}-nasiya${L}`);
    await p.click("#ns-next");
    await p.fill("#pf", "31234567890123"); await p.fill("#nc2", "9860123412341234"); await p.check("#ns-ag");
    await p.click("#ns-next");
    await code(p, "#code3", "1111");
    await p.waitForSelector(".appr", { timeout: 6000 });
    await sleep(500);
    await shot(p, `shop-${tag}-nasiya-ok${L}`);
    await p.click("#ns-next");
    await p.waitForFunction(() => location.hash.startsWith("#/order/"));
    await sleep(600);
    await p.click("#nx"); await sleep(200); await p.click("#nx"); await sleep(1200);
    await shot(p, `shop-${tag}-courier${L}`);
    await p.click("#nx"); await sleep(600);
    await shot(p, `shop-${tag}-rate${L}`);
    await p.click(".rate-ask a");
    await sleep(500);
    await (await p.$('.rvf [data-s="5"]')).click();
    await p.click(".rvf .qt .fchip");
    await shot(p, `shop-${tag}-review${L}`);
    for (const f of await p.$$(".rvf")) { await (await f.$('[data-s="5"]')).click(); await (await f.$("textarea")).fill(lang ? "Tez keldi, ichishni boshladim" : "Пришло быстро, начала принимать"); }
    await p.click("#rv-send");
    await sleep(700);
    await shot(p, `shop-${tag}-points-burst${L}`);
    await sleep(1800);
    await go(p, "#/me");
    await shot(p, `shop-${tag}-me${L}`);
    await go(p, "#/plans");
    await shot(p, `shop-${tag}-plans${L}`);
    await p.goto(`${B}/${lang}panel#dash`, { waitUntil: "networkidle" });
    await sleep(600);
    await shot(p, `panel-${tag}-dash${L}`);
    for (const t of ["orders", "reviews", "goods", "logistics", "nasiya", "traffic", "log"]) { await go(p, "#" + t); await shot(p, `panel-${tag}-${t}${L}`); }
    await go(p, "#orders");
    await p.click(".tb.ord tbody tr");
    await sleep(600);
    await shot(p, `panel-${tag}-order${L}`);
    await c.close();
  }
}
await b.close();
console.log("ok");
