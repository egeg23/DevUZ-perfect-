// Снимки макета Oson Apteka: node shots.mjs <папка> [ширины] — нужен запущенный
// serve.mjs (SCENE_KEY=… для кадров залёта). Пишет залёт на четырёх точках
// прокрутки, выбор, конструктор, сайт по разделам, окно лекарства, бронь и
// панель. Сообщает ошибки консоли и прокрутку вбок. Разделы с допами — webp.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const [out = "shots", ws = "390,768,1440"] = process.argv.slice(2);
const R = "http://localhost:4851/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const shot = (p, name) => p.screenshot({ path: `${out}/${name}.png` });
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  const clean = () => p.evaluate(() => { document.getElementById("dzi")?.remove(); });
  await p.goto(R + "/", { waitUntil: "load" }); await clean(); await p.waitForTimeout(3500);
  for (const k of [0, 0.4, 0.75, 1]) {
    await p.evaluate((k) => { const s = document.querySelector(".hs"); scrollTo(0, (s.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(1300);
    await shot(p, `fly-${Math.round(k * 100)}-${w}`);
  }
  for (const id of ["choose", "offer"]) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(900); await shot(p, `${id}-${w}`); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await shot(p, `hero-${w}`);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 0) errs.push(`${w}: прокрутка вбок на ${over}px`);
  for (const id of ["how", "search", "list", "map", "tarif", "remind", "bot", "pharm", "reviews"]) {
    await p.evaluate((id) => { const e = document.getElementById(id); const y = e.getBoundingClientRect().top + scrollY + (id === "how" ? e.offsetHeight * 0.45 : 0); scrollTo(0, y); }, id);
    await p.waitForTimeout(1100);
    await shot(p, `${id}-${w}`);
  }
  await p.fill("#q", w < 700 ? "изо" : "декспант"); await p.evaluate(() => scrollTo(0, 0)); await p.focus("#q"); await p.waitForTimeout(500);
  await shot(p, `suggest-${w}`);
  await p.evaluate(() => document.querySelector('.card [data-open="16"]').click()); await p.waitForTimeout(900);
  await shot(p, `drug-${w}`);
  await p.click(".sheet [data-bron]"); await p.fill("#bn", "Dilnoza"); await p.fill("#bp", "+998 90 111 22 33"); await p.click("#bgo"); await p.waitForTimeout(600);
  await shot(p, `bron-${w}`);
  await p.goto(R + "/panel#brons", { waitUntil: "load" }); await p.waitForTimeout(800);
  await shot(p, `panel-brons-${w}`);
  await p.click(".pn-t tbody tr:first-child"); await p.click('[data-s="1"]'); await p.waitForTimeout(300);
  await shot(p, `panel-bron-${w}`);
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(800);
  await shot(p, `panel-${w}`);
  await p.goto(R + "/site", { waitUntil: "load" }); await p.click("#mine"); await p.waitForTimeout(700);
  await shot(p, `mine-${w}`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
