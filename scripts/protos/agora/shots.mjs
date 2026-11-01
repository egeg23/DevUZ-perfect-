// Снимки макета Agora: node shots.mjs <папка> [ширины] — нужен запущенный
// serve.mjs. Пишет PNG: залёт на четырёх точках, выбор, конструктор и
// поддержку, сайт по разделам, сцены витрины, бронь → «Моя бронь», вход в
// панель, код, сводку и разделы, подтверждённую бронь на сайте. Затем
// конвертировать в WebP (cwebp или Pillow) и положить в docs/screens/agora.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
let chromium;
try { ({ chromium } = await import("playwright")); } catch { ({ chromium } = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json")("playwright")); }
const [out = "shots", ws = "390,768,1440"] = process.argv.slice(2);
const R = "http://localhost:4870/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} window.open = () => null; });
  const p = await ctx.newPage();
  const shot = (name) => p.screenshot({ path: `${out}/${name}-${w}.png` });
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  await p.goto(R + "/", { waitUntil: "load" }); await p.waitForTimeout(800);
  for (const k of [0, 0.35, 0.62, 1]) {
    await p.evaluate((k) => { const s = document.getElementById("fly"); scrollTo(0, (s.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(1300); await shot(`fly-${Math.round(k * 100)}`);
  }
  for (const id of ["choose", "offer", "it"]) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(900); await shot(id); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(1500); await shot("hero");
  const n = await p.evaluate(() => document.querySelectorAll(".sc").length);
  for (let i = 0; i < n; i++) { await p.evaluate((i) => { const s = document.querySelectorAll(".sc")[i]; scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * 0.55); }, i); await p.waitForTimeout(900); await shot(`evening-${i + 1}`); }
  for (const id of ["menu", "book", "bot", "hall", "more", "contact"]) {
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY); }, id);
    await p.waitForTimeout(id === "bot" ? 6000 : 1100); await shot(id);
  }
  await p.evaluate(() => document.getElementById("menu").scrollIntoView()); await p.click("#mn-grid [data-dish]"); await p.waitForTimeout(600); await shot("dish");
  await p.click("#sheet .x");
  await p.evaluate(() => document.getElementById("book").scrollIntoView());
  await p.click("#bk-days button:nth-child(2)"); await p.click('#bk-times [data-time="20:00"]'); await p.fill("#bk-name", "Азиз"); await p.fill("#bk-ph", "+998 90 123 45 67");
  await p.click('#bk-form [type="submit"]'); await p.waitForTimeout(700); await shot("mine-new");
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(600); await shot("panel-login");
  await p.click('[data-sw="b"]'); await p.waitForTimeout(800); await shot("panel-login-tg");
  await p.click("#lg-tg"); await p.fill("#otp", "1234"); await p.waitForTimeout(500); await shot("panel-otp");
  await p.waitForSelector('[data-r="own"]'); await shot("panel-role"); await p.click('[data-r="own"]'); await p.waitForTimeout(900); await shot("panel-sum");
  for (const tab of ["book", "ord", "bot", "menu", "dlv", "set"]) { await p.click(`[data-tab="${tab}"]`); await p.waitForTimeout(700); await shot(`panel-${tab}`); }
  await p.click('[data-tab="book"]'); await p.click('.tbl tbody tr:first-child [data-s="1"]'); await p.waitForTimeout(400);
  await p.click("#role"); await p.click('[data-tab="sum"]'); await p.waitForTimeout(700); await shot("panel-admin");
  await p.goto(R + "/site", { waitUntil: "load" }); await p.click("#mine"); await p.waitForTimeout(700); await shot("mine-ok");
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
