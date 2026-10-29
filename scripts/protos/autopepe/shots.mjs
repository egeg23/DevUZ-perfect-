// Снимки макета: node shots.mjs [папка] (нужен запущенный serve.mjs).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const OUT = process.argv[2] || new URL("../../../docs/screens/autopepe/", import.meta.url).pathname;
const U = "http://localhost:4851/proto/" + "a".repeat(43) + "/";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
async function page(w, path, skip = true) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  if (skip) await ctx.addInitScript(() => { try { sessionStorage.setItem("ap-intro", "1"); sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(`${w} ${path}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${w} ${path}: ${e.message}`));
  await p.goto(U + path, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1200);
  return { p, ctx };
}
async function at(p, sel, name, dy = 0) {
  await p.evaluate(([s, dy]) => { const e = document.querySelector(s); scrollTo(0, (e ? e.getBoundingClientRect().top + scrollY : 0) + dy * innerHeight); }, [sel, dy]);
  await p.waitForTimeout(3600);
  await p.screenshot({ path: OUT + name + ".png" });
}
for (const w of [390, 1440]) {
  const tag = w < 700 ? "m" : "d";
  { const { p, ctx } = await page(w, "?intro=1&apt=1.6", false); await p.evaluate(() => { const z = document.getElementById("dzi"); if (z) z.remove(); }); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + `${tag}-intro.png` }); await ctx.close(); }
  { const { p, ctx } = await page(w, ""); await p.screenshot({ path: OUT + `${tag}-land.png` }); await at(p, "#offer", `${tag}-offer`); await ctx.close(); }
  { const { p, ctx } = await page(w, "site");
    await p.screenshot({ path: OUT + `${tag}-hero.png` });
    for (const [k, dy] of [["lustro1", .3], ["lustro2", 1.3], ["lustro3", 2.4], ["lustro4", 3.3]]) await at(p, "#lustro", `${tag}-${k}`, dy);
    await at(p, "#uslugi", `${tag}-uslugi`); await at(p, "#przedpo", `${tag}-przedpo`);
    await p.click('#car [data-part="mk"]'); await p.click('[data-dmg="pdr"]'); await p.click('#car [data-part="dlp"]'); await p.click('[data-dmg="lak"]');
    await at(p, "#wycena", `${tag}-wycena`, .1); await at(p, "#oc", `${tag}-oc`); await at(p, "#kontakt", `${tag}-kontakt`);
    await ctx.close(); }
  { const { p, ctx } = await page(w, "panel"); await p.screenshot({ path: OUT + `${tag}-panel.png` }); await ctx.close(); }
}
console.log(errs.length ? errs.join("\n") : "без ошибок");
await b.close();
