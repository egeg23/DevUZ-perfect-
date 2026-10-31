// Снимки макета CARGO PRO GROUP: node shots.mjs <папка> [ширины] — нужен
// запущенный serve.mjs (SCENE_KEY=… для кадров залёта). Пишет залёт на трёх
// точках прокрутки, выбор, конструктор, сайт по разделам, заявку, «Мои
// заявки», панель и диспетчерскую. Сообщает ошибки консоли и прокрутку вбок.
// Третий аргумент «dispatch» — только снимки диспетчерской, «route» — только
// сборных грузов и маршрута забора.
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
  if (only !== "dispatch" && only !== "route") {
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
  if (only !== "route") {
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
