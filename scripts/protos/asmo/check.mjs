import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium: заставка (промо → Asmo → первый экран) проигрывается
// сама и пропускается тапом и кнопкой «Пропустить», история листается до
// конца, горизонтальной прокрутки нет ни на одной странице, ошибок скрипта
// нет, снимки. node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const S = process.argv[2] || "/tmp/am-check", B = `http://localhost:4801/proto/${"A".repeat(43)}`;
mkdirSync(S + "/shots", { recursive: true });
const pages = ["", "plan", "uz", "uz/plan"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
  // 1. Заставка целиком: в конце первый экран без слоя и без замка прокрутки.
  {
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(`${B}/`, { waitUntil: "commit" });
    const t0 = Date.now();
    for (const at of [500, 1700, 2700, 3600, 4400, 5300, 6000]) {
      await p.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
      await p.screenshot({ path: `${S}/shots/${name}-intro-${at}.png` });
    }
    await p.waitForTimeout(3000);
    const left = await p.evaluate(() => ({ intro: !!document.getElementById("intro"), hero: document.getElementById("hero").classList.contains("hero-on"), lock: document.documentElement.style.overflow }));
    if (left.intro || !left.hero || left.lock) fail(name, "заставка не ушла сама", JSON.stringify(left));
    else console.log("ok  ", name, "заставка проигрывается и уходит сама");
    if (errs.length) fail(name, "ошибки заставки", errs.join(" ; "));
    await p.screenshot({ path: `${S}/shots/${name}-hero.png` });
    await p.close();
  }
  // 2. Тап: на промо ведёт к логотипу, второй тап открывает сайт.
  {
    const p = await ctx.newPage();
    await p.goto(`${B}/uz`, { waitUntil: "load" });
    await p.waitForTimeout(700);
    if (name === "m") await p.tap("#intro", { position: { x: 100, y: 200 } }); else await p.mouse.click(200, 200);
    await p.waitForTimeout(900);
    const mid = await p.evaluate(() => !!document.getElementById("intro"));
    if (name === "m") await p.tap("#intro", { position: { x: 100, y: 200 } }).catch(() => {}); else await p.mouse.click(200, 200);
    await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({ intro: !!document.getElementById("intro"), lock: document.documentElement.style.overflow }));
    if (!mid || st.intro || st.lock) fail(name, "пропуск тапом", JSON.stringify({ mid, ...st }));
    else console.log("ok  ", name, "заставка пропускается тапом");
    await p.close();
  }
  // 3. «Пропустить» сразу открывает сайт.
  {
    const p = await ctx.newPage();
    await p.goto(`${B}/`, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    await p.click("#in-skip");
    await p.waitForTimeout(700);
    const gone = await p.evaluate(() => !document.getElementById("intro") && !document.documentElement.style.overflow);
    if (!gone) fail(name, "«Пропустить» не открыл сайт"); else console.log("ok  ", name, "«Пропустить» открывает сайт");
    await p.close();
  }
  // 4. Без движения заставки нет, история стоит списком.
  {
    const rc = await b.newContext({ viewport: vp, reducedMotion: "reduce", isMobile: name === "m", hasTouch: name === "m" });
    const p = await rc.newPage();
    await p.goto(`${B}/`, { waitUntil: "load" }); await p.waitForTimeout(500);
    const st = await p.evaluate(() => ({ intro: !!document.getElementById("intro") && getComputedStyle(document.getElementById("intro")).display !== "none", list: getComputedStyle(document.querySelector(".st-static")).display !== "none", lock: document.documentElement.style.overflow }));
    if (st.intro || !st.list || st.lock) fail(name, "prefers-reduced-motion", JSON.stringify(st)); else console.log("ok  ", name, "без движения: заставки нет, история списком");
    await rc.close();
  }
  await ctx.addInitScript(() => { try { sessionStorage.setItem("am-intro", "1"); } catch {} });
  // 5. Все страницы: прокрутка до конца, ширина, ошибки, мелкий текст.
  for (const pth of pages) {
    const pg = await ctx.newPage(); const errs = [];
    pg.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    pg.on("pageerror", (e) => errs.push(String(e)));
    await pg.goto(`${B}/${pth}`, { waitUntil: "load" }); await pg.waitForTimeout(600);
    const H = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += vp.height * 0.6) { await pg.mouse.wheel(0, vp.height * 0.6); await pg.waitForTimeout(40); }
    await pg.waitForTimeout(300);
    const ov = await pg.evaluate(() => { const w = document.documentElement.clientWidth; const wide = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.right > w + 1 && cs.position !== "fixed" && !e.closest(".st-stage,.intro,.hero2,.days,.bgfx") ; }).slice(0, 5).map((e) => e.tagName + "." + e.className); return { sw: document.documentElement.scrollWidth, w, wide }; });
    const small = await pg.evaluate(() => [...document.querySelectorAll("main p, main li, main a, main dd")].filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 12).length);
    const f = ov.sw > ov.w || errs.length || ov.wide.length;
    if (f) bad++;
    console.log(f ? "FAIL" : "ok  ", name, (pth || "(main)").padEnd(16), JSON.stringify(ov), "small<12:", small, errs.slice(0, 3).join(" ; "));
    await pg.close();
  }
  // 5а. Запись, конструктор лечения и тест работают по нажатию.
  {
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.open = (u) => { window.__opened = u; return null; }; });
    await p.goto(`${B}/`, { waitUntil: "load" }); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise((r) => setTimeout(r, ms));
      const out = {};
      const pr = document.querySelector('.pr[data-id="papil"]');
      pr.querySelector("[data-a]").click(); pr.querySelector("[data-a]").click(); await w(900);
      out.sum = document.getElementById("prc-sum").textContent;
      document.querySelector('#bk-slots button:not(:disabled)').click();
      document.querySelector('#book [name="phone"]').value = "+998901234567";
      document.querySelector('#book button[type="submit"]').click(); await w(100);
      out.opened = window.__opened;
      const qo = () => document.querySelector('.qz-s:not([hidden]) .qo');
      qo().click(); qo().click(); qo().click(); await w(50);
      out.quiz = document.getElementById("qz-h").textContent;
      return out;
    });
    if (r.sum !== "350 000" || r.opened !== "https://t.me/asmo_clinic" || !r.quiz) fail(name, "запись, цены или тест", JSON.stringify(r));
    else console.log("ok  ", name, "запись, конструктор лечения и тест работают", JSON.stringify(r));
    await p.close();
  }
  // 6. Кадры истории и снимки блоков.
  {
    const q = await ctx.newPage();
    await q.goto(`${B}/`, { waitUntil: "load" }); await q.waitForTimeout(600);
    for (const t of [0, 2.9, 3.9, 5.6, 7.4, 9.6, 10.8, 12.8, 15.8, 18.6, 20.8]) {
      await q.evaluate((t) => { const tr = document.querySelector(".st-track"); window.scrollTo(0, tr.getBoundingClientRect().top + scrollY + t * innerHeight) }, t);
      await q.waitForTimeout(450);
      await q.screenshot({ path: `${S}/shots/${name}-story-${t}.png` });
    }
    for (const id of ["uslugi", "zapis", "ceny", "test", "faq", "kontakty"]) {
      await q.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await q.waitForTimeout(1000);
      await q.screenshot({ path: `${S}/shots/${name}-${id}.png` });
    }
    await q.goto(`${B}/plan`, { waitUntil: "load" }); await q.waitForTimeout(600);
    await q.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
    await q.waitForTimeout(800);
    await q.screenshot({ path: `${S}/shots/${name}-plan.png`, fullPage: true });
    await q.close();
  }
  await ctx.close();
}
await b.close();
console.log(bad ? `${bad} проблем` : "всё чисто");
process.exit(bad ? 1 : 0);
