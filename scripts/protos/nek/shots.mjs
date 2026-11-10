// Снимки макета Nek Dental Studio: node shots.mjs <папка> [ширины] [язык] —
// нужен запущенный serve.mjs (SCENE_KEY=… для кадров пролёта). Пишет пролёт
// на пяти точках прокрутки, выбор, конструктор, сайт по разделам, запись →
// панель → «Моя запись». Сообщает ошибки консоли и прокрутку вбок.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const [out = "shots", ws = "390,768,1440", lang = ""] = process.argv.slice(2);
const R = "http://localhost:4871/proto/" + "A".repeat(43) + (lang ? "/" + lang : "");
const b = await chromium.launch();
const errs = [];
const shot = (p, name) => p.screenshot({ path: `${out}/${name}${lang ? "-" + lang : ""}.png` });
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  const over = async (where) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) errs.push(`${w} ${where}: прокрутка вбок на ${o}px`); };
  await p.goto(R + "/", { waitUntil: "load" });
  await p.evaluate(() => { document.getElementById("dzi")?.remove(); });
  await p.waitForTimeout(4000);
  await over("land");
  for (const k of [0, 0.3, 0.52, 0.74, 1]) {
    await p.evaluate((k) => { const s = document.querySelector(".hs"); scrollTo(0, (s.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(1600);
    await shot(p, `fly-${Math.round(k * 100)}-${w}`);
  }
  for (const id of ["choose", "offer"]) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(900); await shot(p, `${id}-${w}`); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await shot(p, `hero-${w}`);
  await over("site");
  for (const id of ["services", "resto", "fly-ad", "care", "quiz", "space", "team", "reviews", "reviews-g", "abroad", "remind", "pages", "admin", "faq", "visit"]) {
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 40); }, id);
    await p.waitForTimeout(1000);
    await shot(p, `${id}-${w}`);
  }
  await p.evaluate(() => { const r = document.getElementById("lyr"); r.value = "3"; r.dispatchEvent(new Event("input")); document.getElementById("resto").scrollIntoView(); });
  await p.waitForTimeout(900); await shot(p, `resto-3-${w}`);
  /* Запись: шторка, день, время, имя, телефон. */
  await p.evaluate(() => { window.open = () => null; HTMLAnchorElement.prototype.click = function () {}; });
  await p.click("[data-book]:visible");
  await p.waitForTimeout(500);
  await p.click('#shb [data-k="day"]'); await p.click('#shb [data-k="time"]');
  await p.fill("#bk-n", "Nino"); await p.fill("#bk-p", "+995 555 12 34 56");
  await shot(p, `book-${w}`);
  await p.click("#bk-go"); await p.waitForTimeout(500);
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(900);
  await shot(p, `panel-sum-${w}`); await over("panel");
  await p.click('[data-tab="req"]'); await p.waitForTimeout(300);
  await shot(p, `panel-req-${w}`);
  await p.click(".fresh [data-st=ok]"); await p.waitForTimeout(300);
  await p.click('[data-tab="cal"]'); await p.waitForTimeout(300); await shot(p, `panel-cal-${w}`);
  await p.selectOption("#role", "adm"); await p.click('[data-tab="sum"]'); await p.waitForTimeout(300); await shot(p, `panel-adm-${w}`);
  await p.selectOption("#role", "doc");
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(800);
  await p.click("#mine").catch(async () => { await p.evaluate(() => document.getElementById("mine").click()); });
  await p.waitForTimeout(600); await shot(p, `mine-${w}`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "ошибок нет");
