import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium: заставка (промо → буква → первый экран) проигрывается
// сама и пропускается тапом, горизонтальной прокрутки нет, ошибок скрипта
// нет, снимки. node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const S = process.argv[2] || "/tmp/sh-shots", T = "A".repeat(43), B = `http://localhost:4791/proto/${T}`;
mkdirSync(S + "/shots", { recursive: true });
const pages = ["", "katalog", "obekt", "novostroyki", "uslugi", "podbor", "plan", "offline"].flatMap((p) => [p, p ? `uz/${p}` : "uz"]);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
  // 1. Заставка целиком: кадры по времени, в конце — первый экран без слоя.
  {
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(`${B}/`, { waitUntil: "commit" });
    const t0 = Date.now();
    for (const at of [500, 1700, 2700, 3500, 4300, 5100, 5700]) {
      await p.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
      await p.screenshot({ path: `${S}/shots/${name}-intro-${at}.png` });
    }
    await p.waitForTimeout(3000);
    const left = await p.evaluate(() => ({ intro: !!document.getElementById("intro"), hero: document.getElementById("hero").classList.contains("hero-on"), lock: document.documentElement.style.overflow }));
    if (left.intro || !left.hero || left.lock) fail(name, "заставка не ушла сама", JSON.stringify(left));
    if (errs.length) fail(name, "ошибки заставки", errs.join(" ; "));
    await p.screenshot({ path: `${S}/shots/${name}-hero.png` });
    await p.close();
  }
  // 2. Пропуск тапом: тап на промо — к букве, второй тап — на первый экран.
  {
    const p = await ctx.newPage();
    await p.goto(`${B}/uz`, { waitUntil: "load" });
    await p.waitForTimeout(700);
    if (name === "m") await p.tap("#intro", { position: { x: 100, y: 200 } }); else await p.mouse.click(200, 200);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${S}/shots/${name}-skip1.png` });
    const mid = await p.evaluate(() => !!document.getElementById("intro"));
    if (name === "m") await p.tap("#intro", { position: { x: 100, y: 200 } }).catch(() => {}); else await p.mouse.click(200, 200);
    await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({ intro: !!document.getElementById("intro"), hero: document.getElementById("hero").classList.contains("hero-on") }));
    if (!mid || st.intro || !st.hero) fail(name, "пропуск тапом", JSON.stringify({ mid, ...st }));
    else console.log("ok  ", name, "заставка пропускается тапом");
    await p.close();
  }
  await ctx.addInitScript(() => { try { sessionStorage.setItem("sh-intro", "1"); } catch {} });
  // 3. Все страницы: прокрутка, ширина, ошибки, мелкий текст.
  for (const pth of pages) {
    const pg = await ctx.newPage(); const errs = [];
    pg.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    pg.on("pageerror", (e) => errs.push(String(e)));
    await pg.goto(`${B}/${pth}`, { waitUntil: "load" }); await pg.waitForTimeout(600);
    const H = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += vp.height * 0.5) { await pg.mouse.wheel(0, vp.height * 0.5); await pg.waitForTimeout(50); }
    await pg.waitForTimeout(300);
    const ov = await pg.evaluate(() => { const w = document.documentElement.clientWidth; const wide = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.right > w + 1 && cs.position !== "fixed" && !e.closest(".mq,.filters,.gal-t,.hero-ph,.band-ph,.intro,.fc,.final,.radar") ; }).slice(0, 5).map((e) => e.tagName + "." + e.className); return { sw: document.documentElement.scrollWidth, w, wide }; });
    const small = await pg.evaluate(() => [...document.querySelectorAll("main p, main li, main a, main dd")].filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 12).length);
    const f = ov.sw > ov.w || errs.length || ov.wide.length;
    if (f) bad++;
    console.log(f ? "FAIL" : "ok  ", name, (pth || "(main)").padEnd(16), JSON.stringify(ov), "small<12:", small, errs.slice(0, 3).join(" ; "));
    await pg.close();
  }
  // 4. Снимки страниц целиком.
  for (const pth of ["", "katalog", "obekt", "novostroyki", "uslugi", "podbor", "plan"]) {
    const q = await ctx.newPage(); await q.goto(`${B}/${pth}`, { waitUntil: "load" }); await q.waitForTimeout(600);
    await q.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await q.waitForTimeout(900);
    await q.screenshot({ path: `${S}/shots/${name}-${pth || "home"}.png`, fullPage: true });
    await q.close();
  }
  await ctx.close();
}
await b.close();
console.log(bad ? `${bad} проблем` : "всё чисто");
process.exit(bad ? 1 : 0);
