// Снимки макета Sunday: node shots.mjs <папка> [ширины] — нужен запущенный
// serve.mjs. Пишет PNG: залёт на шести точках, выбор, конструктор, сайт по
// разделам, смета → заявка → панель (вход, код, роль, сводка, заявки,
// статус, дата в календаре, гости) → «Моя заявка» и занятая дата на сайте.
// Затем конвертировать в WebP (Pillow) и положить в docs/screens/sunday.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
let chromium;
try { ({ chromium } = await import("playwright")); } catch { ({ chromium } = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json")("playwright")); }
const [out = "shots", ws = "390,768,1440"] = process.argv.slice(2);
const R = "http://localhost:4872/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
for (const w of ws.split(",").map(Number)) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch (e) {} window.open = () => ({}); });
  const p = await ctx.newPage();
  const shot = (name) => p.screenshot({ path: `${out}/${name}-${w}.png` });
  const at = (id, k = 0) => p.evaluate(([id, k]) => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * k); }, [id, k]);
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w}: ${e.message}`));
  await p.goto(R + "/", { waitUntil: "load" }); await p.waitForTimeout(800);
  for (const k of [0, 0.2, 0.4, 0.55, 0.75, 1]) { await at("fly", k); await p.waitForTimeout(1300); await shot(`fly-${Math.round(k * 100)}`); }
  for (const id of ["choose", "offer"]) { await at(id); await p.waitForTimeout(900); await shot(id); }
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(1600); await shot("hero");
  for (const id of ["dirs", "formats", "calc", "quiz", "how", "dates", "works", "cab", "rsvp", "tgbot", "seo", "admin", "about", "contact"]) { await at(id); await p.waitForTimeout(id === "tgbot" ? 3200 : 1000); await shot(id); }
  await at("dirs"); await p.click('[data-dir="show"]'); await p.waitForTimeout(900); await shot("dirs-show");
  await at("quiz"); for (const k of [0, 2, 0, 0]) { await p.click(`#qz [data-qa="${k}"]`); await p.waitForTimeout(350); } await p.waitForTimeout(500); await shot("quiz-res");
  await at("rsvp"); await p.fill("#rv-name", "Aziza"); await p.click('#rv-f button[type="submit"]'); await p.waitForTimeout(400); await shot("rsvp-done");
  await at("calc"); await p.click('label.chip:has(input[name="cf"][value="premium"])'); await p.fill("#c-g", "200"); await p.dispatchEvent("#c-g", "input"); await p.waitForTimeout(400); await shot("calc-premium");
  await p.click("#cx-send"); await p.waitForTimeout(700);
  await p.goto(R + "/panel", { waitUntil: "load" }); await p.waitForTimeout(600); await shot("panel-login");
  await p.click('[data-sw="b"]'); await p.waitForTimeout(800); await shot("panel-login-tg");
  await p.click("#lg-tg"); await p.fill("#otp", "1234"); await p.waitForTimeout(500); await shot("panel-otp");
  await p.waitForSelector('[data-r="own"]'); await shot("panel-role"); await p.click('[data-r="own"]'); await p.waitForTimeout(900); await shot("panel-sum");
  await p.click('[data-tab="req"]'); await p.waitForTimeout(600); await shot("panel-req");
  await p.click('.tbl tbody tr:first-child [data-s="1"]'); await p.waitForTimeout(400);
  await p.click('[data-tab="cal"]'); await p.waitForTimeout(600); await p.click("#co-n"); await p.waitForTimeout(400);
  await p.click('.pcal button.fr:not(.past)'); await p.waitForTimeout(500); await shot("panel-cal");
  for (const tab of ["gst", "log"]) { await p.click(`[data-tab="${tab}"]`); await p.waitForTimeout(600); await shot(`panel-${tab}`); }
  await p.click("#role"); await p.click('[data-tab="sum"]'); await p.waitForTimeout(700); await shot("panel-mgr");
  await p.goto(R + "/site", { waitUntil: "load" }); await p.waitForTimeout(800); await p.click("#mine"); await p.waitForTimeout(700); await shot("mine");
  await p.keyboard.press("Escape"); await at("dates"); await p.click("#cal-n"); await p.waitForTimeout(700); await shot("dates-busy");
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ov > 0) errs.push(`${w}: прокрутка вбок ${ov}px`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "без ошибок");
