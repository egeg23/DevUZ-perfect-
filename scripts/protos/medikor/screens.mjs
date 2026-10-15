// Снимки ключевых экранов в docs/screens/medikor: node serve.mjs, затем
// node screens.mjs [папка]. Проходит заказ и КП по-настоящему, чтобы на
// снимках были корзина, счёт по ИНН, статус, КП с ответом и панель.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2] || new URL("../../../docs/screens/medikor/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (p, name) => p.screenshot({ path: OUT + name + ".png" });
const go = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await sleep(700); };

for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1, isMobile: w < 800, hasTouch: w < 800 });
  await c.addInitScript(() => { try { sessionStorage.setItem("mk-intro", "1"); } catch {} });
  const p = await c.newPage();
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  await sleep(1500);
  await shot(p, `site-${tag}-hero`);
  for (const id of ["seychas", "skaner", "put", "schet", "panel", "cena"]) {
    await p.evaluate((x) => document.getElementById(x).scrollIntoView(), id);
    await sleep(1600);
    if (id === "skaner") { await p.evaluate(() => { const b = document.getElementById("sc-box"); scrollTo(0, scrollY + b.getBoundingClientRect().top - innerHeight * 0.18); }); await sleep(900); }
    if (id === "schet") { await p.click('[data-inn="7700000027"]'); await sleep(600); await p.evaluate(() => document.getElementById("inn").scrollIntoView({ block: "center" })); await sleep(600); }
    await shot(p, `site-${tag}-${id}`);
  }
  await p.goto(`${B}/shop#/`, { waitUntil: "networkidle" });
  await sleep(800);
  await shot(p, `shop-${tag}-home`);
  await go(p, "#/c/all");
  await p.click("#f-open");
  await sleep(500);
  await shot(p, `shop-${tag}-filters`);
  await p.click("#f-go");
  await go(p, "#/p/hr501");
  await shot(p, `shop-${tag}-product`);
  await p.click("#pd-buy [data-add]");
  await p.evaluate(() => scrollTo(0, 1300));
  await sleep(500);
  await shot(p, `shop-${tag}-product-specs`);
  await go(p, "#/p/aedbox");
  await p.click("#pd-buy [data-add]");
  await go(p, "#/p/voms");
  await shot(p, `shop-${tag}-product-ask`);
  await go(p, "#/");
  await p.click(w < 1024 ? ".srch" : ".hd-s");
  await p.fill("#sq", "манекен");
  await sleep(300);
  await shot(p, `shop-${tag}-search`);
  await p.click("#sq-x");
  await go(p, "#/cart");
  await p.click('[data-who="org"]');
  await sleep(500);
  await shot(p, `shop-${tag}-cart`);
  await go(p, "#/checkout");
  await p.click('[data-inn="7700000027"]');
  await p.fill("#nm", "Анна Смирнова");
  await p.fill("#ph", "9001234567");
  await p.fill("#em", "zakupki@clinic.ru");
  await p.fill("#ad", "Москва, ул. Профсоюзная, 10");
  await sleep(300);
  await shot(p, `shop-${tag}-checkout`);
  await p.click(w < 1024 ? "#co-go2" : "#co-go");
  await p.waitForFunction(() => location.hash.startsWith("#/invoice/"));
  await sleep(700);
  await shot(p, `shop-${tag}-invoice`);
  await p.click(".ord-a a");
  await sleep(600);
  await p.click("#nx"); await sleep(250); await p.click("#nx"); await sleep(250); await p.click("#nx"); await sleep(600);
  await shot(p, `shop-${tag}-order`);
  await go(p, "#/p/voms");
  await p.click("#pd-buy [data-kp]");
  await go(p, "#/kp");
  await p.click('[data-kinn="7700000010"]');
  await p.fill("#kem", "zakupki@college.ru");
  await shot(p, `shop-${tag}-kp`);
  await p.click("#k-go");
  await sleep(600);
  const kno = await p.evaluate(() => decodeURIComponent(location.hash.split("/")[2]));
  const q = await c.newPage();
  await q.goto(`${B}/panel#kp/${encodeURIComponent(kno)}`, { waitUntil: "networkidle" });
  await sleep(800);
  await q.fill('[data-ki="0"]', "1250000");
  await sleep(300);
  await shot(q, `panel-${tag}-kp-answer`);
  await q.click("#kp-send");
  await sleep(500);
  await p.reload({ waitUntil: "networkidle" });
  await sleep(700);
  await shot(p, `shop-${tag}-kp-answered`);
  await go(p, "#/me");
  await shot(p, `shop-${tag}-me`);
  for (const t of ["dash", "orders", "kp", "invoices", "clients", "goods", "log"]) { await q.evaluate((x) => { location.hash = x; }, "#" + t); await sleep(600); await shot(q, `panel-${tag}-${t}`); }
  await q.evaluate(() => { location.hash = "#orders"; });
  await sleep(500);
  await q.click(".tb.ord tbody tr");
  await sleep(600);
  await shot(q, `panel-${tag}-order`);
  await c.close();
}
await b.close();
console.log("ok");
