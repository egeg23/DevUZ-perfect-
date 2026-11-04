// Снимки макета SAMIST AUTO: node shots.mjs <папка> [ширины] — нужен запущенный
// serve.mjs. Пишет PNG: залёт на шести точках, выбор, конструктор, сайт по
// разделам, окно машины, сравнение, заявка → панель (вход, код, роль,
// сводка, разделы, статус) → «Моя заявка» на сайте, «Продано» на сайте. Затем
// конвертировать в WebP (Pillow) и положить в docs/screens/samist.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
let chromium;
try { ({ chromium } = await import("playwright")); } catch { ({ chromium } = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json")("playwright")); }
const [out = "shots", ws = "390,768,1440"] = process.argv.slice(2);
const R = "http://localhost:4871/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} window.open = () => null; });
  const p = await ctx.newPage();
  const shot = (name) => p.screenshot({ path: `${out}/${name}-${w}.png` });
  const at = (id, k = 0) => p.evaluate(([id, k]) => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * k); }, [id, k]);
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  await p.goto(R + "/", { waitUntil: "load" }); await p.waitForTimeout(800);
  for (const k of [0, 0.22, 0.5, 0.6, 0.7, 1]) { await at("fly", k); await p.waitForTimeout(1300); await shot(`fly-${Math.round(k * 100)}`); }
  for (const id of ["choose", "offer"]) { await at(id); await p.waitForTimeout(900); await shot(id); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForFunction(() => !document.documentElement.classList.contains("lock"), null, { timeout: 35000 }).catch(() => {}); await p.waitForTimeout(1500); await shot("hero");
  for (const k of [0.1, 0.5, 0.9]) { await at("scn", k); await p.waitForTimeout(1300); await shot(`scene-${Math.round(k * 100)}`); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600); await shot("dmax");
  await at("ryad"); await p.waitForTimeout(1200); await shot("ryad");
  await p.click('.ry-c[data-cat="truck"]'); await p.waitForTimeout(450); await shot("ryad-pick"); await p.waitForTimeout(1500); await shot("razdel"); await p.click("[data-rzclose]"); await p.waitForTimeout(700);
  for (const id of ["lineup", "pick", "credit", "trade", "drive", "service", "fleet", "tgbot", "admin", "about", "contact"]) { await at(id); await p.waitForTimeout(id === "tgbot" ? 7500 : 1100); await shot(id); }
  await at("lineup"); await p.waitForTimeout(500);
  await p.click('#grid [data-open="isuzu-fvr-34q"]'); await p.waitForTimeout(1400); await shot("model");
  await p.click('[data-cmp="isuzu-fvr-34q"]'); await p.click(".mdl-x"); await p.waitForTimeout(400);
  await p.click('#grid [data-open="faw-j6l"]'); await p.waitForTimeout(1000); await p.click('[data-cmp="faw-j6l"]'); await p.click(".mdl-x");
  await at("compare"); await p.waitForTimeout(900); await shot("compare");
  await at("credit"); await p.fill("#cr-r", "24"); await p.waitForTimeout(400); await shot("credit-pay");
  await at("lineup"); await p.click('#grid [data-open="isuzu-npr-75k"]'); await p.waitForTimeout(900); await p.click("[data-want]"); await p.waitForTimeout(400);
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(600); await shot("panel-login");
  await p.click('[data-sw="b"]'); await p.waitForTimeout(800); await shot("panel-login-tg");
  await p.click("#lg-tg"); await p.fill("#otp", "1234"); await p.waitForTimeout(500); await shot("panel-otp");
  await p.waitForSelector('[data-r="own"]'); await shot("panel-role"); await p.click('[data-r="own"]'); await p.waitForTimeout(900); await shot("panel-sum");
  for (const tab of ["req", "stock", "svc"]) { await p.click(`[data-tab="${tab}"]`); await p.waitForTimeout(700); await shot(`panel-${tab}`); }
  await p.click('[data-tab="req"]'); await p.click('.tbl tbody tr:first-child [data-s="1"]'); await p.waitForTimeout(300); await p.click('.tbl tbody tr:first-child [data-s="2"]'); await p.waitForTimeout(300);
  await p.click('[data-tab="stock"]'); await p.selectOption('[data-ss="isuzu-fvr-34q"]', "sold"); await p.waitForTimeout(400);
  await p.click('[data-tab="log"]'); await p.waitForTimeout(600); await shot("panel-log");
  await p.click("#role"); await p.click('[data-tab="sum"]'); await p.waitForTimeout(700); await shot("panel-mgr");
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForFunction(() => !document.documentElement.classList.contains("lock"), null, { timeout: 35000 }).catch(() => {}); await p.click("#mine"); await p.waitForTimeout(700); await shot("mine");
  await p.keyboard.press("Escape"); await at("lineup"); await p.waitForTimeout(900); await shot("lineup-sold");
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ov > 0) errs.push(`${w}: прокрутка вбок ${ov}px`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
