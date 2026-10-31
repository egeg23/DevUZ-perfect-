// Снимки макета CARGO PRO GROUP: node shots.mjs <папка> [ширины] — нужен
// запущенный serve.mjs (SCENE_KEY=… для кадров залёта). Пишет залёт на трёх
// точках прокрутки, выбор, конструктор, сайт по разделам, заявку, «Мои
// заявки» и панель. Сообщает ошибки консоли и прокрутку вбок.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const [out = "shots", ws = "390,768,1440"] = process.argv.slice(2);
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
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
