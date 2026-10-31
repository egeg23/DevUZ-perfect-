// Снимки макета CARGO PRO GROUP: node shots.mjs <папка> [ширины] — нужен
// запущенный serve.mjs (SCENE_KEY=… для кадров залёта). Пишет залёт на трёх
// точках прокрутки, выбор, конструктор, сайт по разделам, заявку, «Мои
// заявки», панель и диспетчерскую. Сообщает ошибки консоли и прокрутку вбок.
// Третий аргумент «dispatch» — только снимки диспетчерской, «route» — только
// сборных грузов и маршрута забора, «super» — только супер-админки
// (сравнение, автопарк, пакет для брокера, интеграции, допы рейса), «client» —
// только клиентского раздела (вход, грузы, карта, бот).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const [out = "shots", ws = "390,768,1440", only = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const R = "http://localhost:4853/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const shot = (p, name) => p.screenshot({ path: `${out}/${name}.png` });
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  if (only === "client") {
    /* Клиентский раздел: вход, «Мои грузы», карта, Telegram и статус из супер-админки. */
    await p.goto(R + "/cabinet", { waitUntil: "load" }); await p.waitForTimeout(400);
    await shot(p, `client-login-${w}`);
    await p.click("#intg"); await p.waitForTimeout(600); await shot(p, `client-tg-ask-${w}`);
    await p.click("#tgok"); await p.waitForTimeout(2800); await shot(p, `client-orders-${w}`);
    await p.goto(R + "/cabinet#map", { waitUntil: "load" }); await p.waitForTimeout(2200); await shot(p, `client-map-${w}`);
    await p.goto(R + "/cabinet#tg", { waitUntil: "load" }); await p.click('#cbv [data-link="CPG-24109"]'); await p.waitForTimeout(300);
    for (const pg of ctx.pages()) if (pg !== p) await pg.close();
    const sp = await ctx.newPage(); await sp.goto(R + "/dispatch#trips", { waitUntil: "load" }); await sp.click('[data-tr="CPG-24109"][data-s="4"]'); await sp.waitForTimeout(300); await sp.close();
    await p.bringToFront(); await p.waitForTimeout(600); await shot(p, `client-bot-${w}`);
    await p.goto(R + "/site", { waitUntil: "load" }); await p.evaluate(() => document.getElementById("cab").scrollIntoView()); await p.waitForTimeout(1200); await shot(p, `client-site-${w}`);
    const cov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (cov > 0) errs.push(`${w}: кабинет, прокрутка вбок на ${cov}px`);
    await ctx.close(); continue;
  }
  if (only !== "dispatch" && only !== "route" && only !== "super") {
  await p.goto(R + "/", { waitUntil: "load" }); await p.evaluate(() => document.getElementById("dzi")?.remove()); await p.waitForTimeout(3500);
  for (const k of [0, 0.5, 1]) {
    await p.evaluate((k) => { const s = document.querySelector(".hs"); scrollTo(0, (s.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(1300);
    await shot(p, `fly-${Math.round(k * 100)}-${w}`);
  }
  for (const id of ["choose", "offer"]) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(900); await shot(p, `${id}-${w}`); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(2000);
  await shot(p, `hero-${w}`);
  for (const id of ["routes", "services", "calc", "track", "customs", "hubs", "cab", "bot", "partners", "seo", "faq", "contact"]) {
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY + (id === "routes" ? e.offsetHeight * 0.4 : 0)); }, id);
    await p.waitForTimeout(1100);
    await shot(p, `${id}-${w}`);
  }
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 0) errs.push(`${w}: прокрутка вбок на ${over}px`);
  await p.evaluate(() => document.getElementById("calc").scrollIntoView()); await p.waitForTimeout(400);
  await p.click("#send"); await p.fill("#rn", "Dilnoza"); await p.fill("#rc", "Demo"); await p.fill("#rp", "+998 90 111 22 33"); await p.click("#rgo"); await p.waitForTimeout(700);
  await shot(p, `request-${w}`);
  await p.goto(R + "/panel#reqs", { waitUntil: "load" }); await p.waitForTimeout(700);
  await shot(p, `panel-reqs-${w}`);
  await p.click(".pn-t tbody tr:first-child"); await p.click('[data-s="3"]'); await p.waitForTimeout(300);
  await shot(p, `panel-cargo-${w}`);
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(700);
  await shot(p, `panel-${w}`);
  await p.goto(R + "/site", { waitUntil: "load" }); await p.click("#mine"); await p.waitForTimeout(700);
  await shot(p, `mine-${w}`);
  }
  /* Диспетчерская: очередь, распределение, перенос в чужой кузов, карта, карточка водителя, рейсы, водители. */
  if (only !== "route" && only !== "super") {
  await p.goto(R + "/dispatch", { waitUntil: "load" }); await p.evaluate(() => localStorage.removeItem("cp-disp-1")); await p.reload({ waitUntil: "load" }); await p.waitForTimeout(500);
  await shot(p, `dispatch-queue-${w}`);
  await p.click("#dist"); await p.waitForTimeout(2600);
  await p.screenshot({ path: `${out}/dispatch-plan-${w}.png`, fullPage: w >= 1000 });
  await p.click('.dp-c[data-c="C-310"]'); await p.click('.dp-t[data-t="T1"]'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.dp-t[data-t="T1"]').scrollIntoView({ block: "center" })); await p.waitForTimeout(300);
  await shot(p, `dispatch-bad-${w}`);
  await p.goto(R + "/dispatch#map", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await shot(p, `dispatch-map-${w}`);
  await p.click(".dp-ev"); await p.waitForTimeout(600);
  if (w < 1000) await p.evaluate(() => document.getElementById("dside").scrollIntoView());
  await shot(p, `dispatch-driver-${w}`);
  await p.goto(R + "/dispatch#trips", { waitUntil: "load" }); await p.selectOption("#role", "head"); await p.waitForTimeout(400);
  await shot(p, `dispatch-trips-${w}`);
  await p.goto(R + "/dispatch#drivers", { waitUntil: "load" }); await p.click('[data-sort="price"]'); await p.waitForTimeout(400);
  await shot(p, `dispatch-drivers-${w}`);
  }
  /* Супер-админка: сравнение двух админок, автопарк, ошибки формы, сроки документов, пакет для брокера, интеграции, допы рейса. */
  if (only === "super" || !only) {
  await p.goto(R + "/", { waitUntil: "load" }); await p.evaluate(() => document.getElementById("dzi")?.remove());
  await p.evaluate(() => document.getElementById("vs").scrollIntoView()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelectorAll("#vs .rise").forEach((e) => e.classList.add("on"))); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/super-compare-${w}.png`, fullPage: false });
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.evaluate(() => document.getElementById("vs").scrollIntoView()); await p.waitForTimeout(500);
  await shot(p, `super-panel-${w}`);
  await p.goto(R + "/dispatch#fleet", { waitUntil: "load" }); await p.evaluate(() => { localStorage.removeItem("cp-fleet-1"); }); await p.reload({ waitUntil: "load" }); await p.waitForTimeout(500);
  await shot(p, `super-fleet-${w}`);
  await p.click("#spat"); await p.fill('#spf [name="pl"]', "01 AB 12"); await p.fill('#spf [name="mk"]', "MAN TGX 18.480"); await p.fill('#spf [name="vin"]', "WMA06XZZ7KM81234"); await p.fill('#spf [name="yr"]', "2019"); await p.fill('#spf [name="t"]', "20"); await p.fill('#spf [name="m3"]', "86");
  await p.click('#spf [type="submit"]'); await p.waitForTimeout(300); await p.evaluate(() => document.getElementById("spf").scrollIntoView({ block: "start" }));
  await shot(p, `super-form-${w}`);
  await p.goto(R + "/dispatch#trips", { waitUntil: "load" }); await p.waitForTimeout(400);
  await shot(p, `super-trips-${w}`);
  await p.click('[data-bk="CPG-24117"]'); await p.waitForTimeout(500);
  await shot(p, `super-broker-miss-${w}`);
  await p.click("#spmx"); await p.click('[data-bk="CPG-24109"]'); await p.waitForTimeout(300);
  for (let k = 0; k < 8; k++) { const n = await p.$$eval("#spm .sp-need", (x) => x.length); if (!n) break; await p.evaluate(() => { const e = document.querySelector("#spm .sp-need"); e.value = e.getAttribute("data-b") === "seal" ? "UZ-70481" : "1"; e.dispatchEvent(new Event("change")); }); await p.waitForTimeout(80); }
  await p.click("#bkmake"); await p.waitForTimeout(400); await p.evaluate(() => document.getElementById("sheet").scrollIntoView({ block: "start" })); await p.waitForTimeout(200);
  await shot(p, `super-broker-${w}`);
  await p.click("#spmx"); await p.click('[data-tr="CPG-24095"][data-s="5"]'); await p.waitForTimeout(200);
  await p.click('[data-pod="CPG-24095"]'); await p.waitForTimeout(400);
  await shot(p, `super-pod-${w}`);
  await p.click("#spmx"); await p.click('[data-wb="CPG-24095"]'); await p.waitForTimeout(400);
  await shot(p, `super-waybill-${w}`);
  await p.click("#spmx"); await p.goto(R + "/dispatch#int", { waitUntil: "load" }); await p.click('[data-iset="bx"]'); await p.waitForTimeout(400);
  await shot(p, `super-int-${w}`);
  await p.evaluate(() => document.getElementById("xlog").scrollIntoView({ block: "start" })); await p.waitForTimeout(300);
  await shot(p, `super-log-${w}`);
  }
  if (only === "super") { await ctx.close(); continue; }
  /* Сборные грузы и маршрут забора. */
  await p.goto(R + "/dispatch#route", { waitUntil: "load" }); await p.selectOption("#role", "head"); await p.click("#rbuild"); await p.waitForTimeout(2200);
  await shot(p, `route-${w}`);
  await p.evaluate(() => document.querySelector(".dp-cmp").scrollIntoView({ block: "start" })); await p.waitForTimeout(300);
  await shot(p, `route-compare-${w}`);
  await p.click('[data-dn="0"]'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector(".dp-cmp").scrollIntoView({ block: "start" })); await p.waitForTimeout(300);
  await shot(p, `route-manual-${w}`);
  await p.click("#rback"); await p.click("#radd"); await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelector(".dp-rg").scrollIntoView({ block: "start" })); await p.waitForTimeout(300);
  await shot(p, `route-add-${w}`);
  const dov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (dov > 0) errs.push(`${w}: диспетчерская, прокрутка вбок на ${dov}px`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
