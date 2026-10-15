import { chromium } from "../../../node_modules/playwright-core/index.mjs";
/* Снимки макета: node shots.mjs <папка> [1440|390]. Сервер — node serve.mjs. */
const [, , dir = "/tmp/sia-shots", only] = process.argv;
const URL0 = `http://localhost:4813/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const bad = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  if (only && +only !== w) continue;
  const mob = w < 800;
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  p.on("pageerror", (e) => bad.push(`${w}: ${e.message}`));
  p.on("response", (r) => r.status() >= 400 && bad.push(`${w}: ${r.status()} ${r.url()}`));
  const snap = (n) => p.screenshot({ path: `${dir}/${w}-${n}.png` });
  await p.addInitScript(() => sessionStorage.setItem("sia-intro", "1"));
  await p.goto(URL0 + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1300); await snap("hero-0");
  await p.waitForTimeout(2600); await snap("hero");
  if (!mob) { await p.mouse.move(w * 0.6, h * 0.45); await p.waitForTimeout(700); await snap("hero-lens"); await p.mouse.move(w - 5, h - 5); }
  const at = async (sel, k, name, wait = 1400) => { await p.evaluate(([s, k]) => { const el = document.querySelector(s); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * k); }, [sel, k]); await p.waitForTimeout(wait); await snap(name); };
  const to = async (sel, dy, name, wait = 1600) => { await p.evaluate(([s, dy]) => { const el = document.querySelector(s); scrollTo(0, el.getBoundingClientRect().top + scrollY + dy); }, [sel, dy]); await p.waitForTimeout(wait); await snap(name); };
  await at(".hero", 0.35, "hero-35"); await at(".hero", 0.8, "hero-80");
  await to(".stats", -80, "stats", 2600);
  await at(".stmt", 0.6, "stmt");
  for (const k of [0.05, 0.4, 0.8]) await at(".arh", k, `arh-${Math.round(k * 100)}`);
  for (const k of [0.02, 0.2, 0.45, 0.6, 0.66, 0.72, 0.85, 0.99]) await at(".fly", k, `fly-${Math.round(k * 100)}`, 1500);
  await to(".int", 0, "int"); await to(".ic:nth-child(3)", -200, "int-3");
  await to(".velo", -200, "velo", 1200); await to(".kd", -60, "kd", 1200); await to(".folders", 40, "folders", 2200);
  await p.click(".gf-cell .gf-hit"); await p.waitForTimeout(1400); await snap("folders-open"); await p.keyboard.press("Escape");
  await to(".ix", -40, "ix"); await to(".ix-list", -200, "ix-rows");
  if (!mob) { await p.hover(".ix-list li:nth-child(3) .ix-row"); await p.waitForTimeout(800); await snap("ix-peek"); }
  await to(".sv", 0, "sv", 2200); await to(".sv-i:nth-child(2)", -100, "sv-2", 2200);
  await to(".pr", 200, "pr");
  await to(".ev", 0, "ev"); await to(".tm", 0, "tm", 2200); await to(".ct", 0, "ct"); await to(".foot", 0, "foot");
  const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ow > 0) bad.push(`${w}: вбок ${ow}px`);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.click("#burger"); await p.waitForTimeout(1100); await snap("menu"); await p.keyboard.press("Escape");
  await p.goto(URL0 + "/proekt/apx180-2606", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000); await snap("pp");
  await at(".pp-hero", 0.5, "pp-50"); await at(".pp-hero", 1, "pp-100");
  await to(".pp-lead", 0, "pp-lead"); await to(".pg", -100, "pp-gal"); await to(".pp-done", 0, "pp-done"); await to(".pp-next", 0, "pp-next");
  const ow2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ow2 > 0) bad.push(`${w} проект: вбок ${ow2}px`);
  await p.close();
}
await b.close();
console.log(bad.length ? bad : "без ошибок и без прокрутки вбок");
