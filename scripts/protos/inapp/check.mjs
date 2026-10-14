// Проверка макета в Chromium: node check.mjs <папка для снимков>
// Приложение 390×844 (ru и uz): поиск у операторов, отель и «кто дешевле», тур,
// проверка цены, бронь с демо-данными до заявки, оплата до чека, статусы,
// документы, чат, слежка за ценой, профиль и вход; кадры в секунду.
// Страница 390×844, 768×1024, 1440×900: горизонтальная прокрутка, ошибки,
// айфон с приложением, канбан связан с айфоном, «во весь экран».
import { chromium } from "playwright-core";
const OUT = process.argv[2] || ".";
const URL0 = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const bad = [];
async function app(lang) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on("pageerror", (e) => bad.push(`${lang} app: ${e.message}`));
  await p.goto(`${URL0}${lang === "uz" ? "/uz" : ""}/app`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1900);
  const V = ".v:not([hidden])";
  const shot = (n) => p.screenshot({ path: `${OUT}/app-${lang}-${n}.png` });
  const tap = async (sel, w = 520) => { await p.locator(sel).first().tap(); await p.waitForTimeout(w); };
  await shot("01-home");
  await tap(`${V} [data-act="pickPeople"]`); await tap('.sheet [data-st="kids"][data-d="1"]'); await shot("02-people"); await tap(".sheet [data-close]");
  await tap(`${V} [data-act="pickDates"]`); await shot("03-dates"); await tap(".sheet [data-close]");
  await tap(`${V} [data-act="search"]`, 900); await shot("04-searching"); await p.waitForTimeout(1800); await shot("05-results");
  await tap(`${V} .hc`); await shot("06-hotel");
  await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 640)); await p.waitForTimeout(400); await shot("07-hotel-ops");
  await tap(`${V} .off`); await shot("08-tour");
  await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 500)); await p.waitForTimeout(300); await shot("09-tour-more");
  await tap(`${V} .cta [data-go^="check"]`, 2600); await shot("10-check");
  await tap(`${V} [data-act="flipCheck"]`, 2600); await shot("11-check-other");
  await tap(`${V} .cta [data-go^="book"]`); await shot("12-book");
  await tap(`${V} [data-act="fillDemo"]`); await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 1e5)); await p.waitForTimeout(300); await shot("13-book-filled");
  await tap(`${V} #bgo`, 900); await shot("14-booked");
  await tap(`${V} [data-go^="pay"]`); await shot("15-pay");
  await tap(`${V} [data-act="paygo"]`); await shot("16-pay-sheet");
  await tap("#pok", 1800); await shot("17-receipt");
  await tap(`${V} [data-act="openTrip"]`, 900); await shot("18-trip");
  await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 1e5)); await p.waitForTimeout(300);
  await tap(`${V} [data-act="advance"]`, 900); await shot("19-trip-next");
  await p.waitForTimeout(4200);
  // Документы демо-брони
  await tap(`${V} [data-back]`);
  await tap(`${V} .trc >> nth=-1`, 700); await shot("20-trip-docs");
  await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 900)); await p.waitForTimeout(300); await shot("21-trip-docs-list");
  await tap(`${V} .doc`); await shot("22-voucher");
  await tap(`${V} [data-back]`); await tap(`${V} [data-go^="doc"] >> nth=1`); await shot("23-tickets");
  await tap(`${V} [data-back]`);
  await tap(`${V} [data-go^="chat"]`); await tap(`${V} [data-act="say"]`, 2000); await shot("24-chat");
  await tap(`${V} [data-back]`); await tap(`${V} [data-back]`);
  await tap('[data-tab="fav"]'); await tap(`${V} [data-act="ftab"][data-v="w"]`); await tap(`${V} [data-act="priceDrop"]`, 900); await shot("25-watch");
  await tap('[data-tab="hot"]'); await shot("26-hot");
  await tap('[data-tab="more"]'); await tap(`${V} [data-act="login"]`); await p.locator(".sheet #ln").fill("Азиз"); await p.locator(".sheet #lp").fill("901234567"); await tap(".sheet #lgo"); await shot("27-sms");
  await p.keyboard.type("1234"); await p.waitForTimeout(600); await shot("28-profile");
  await tap('[data-tab="home"]');
  const fps = await p.evaluate(async () => {
    let n = 0, run = true; const t0 = performance.now();
    (function f() { n++; if (run) requestAnimationFrame(f); })();
    for (let i = 0; i < 3; i++) { document.querySelector(".v:not([hidden]) .hc").click(); await new Promise((r) => setTimeout(r, 500)); document.querySelector(".v:not([hidden]) [data-back]").click(); await new Promise((r) => setTimeout(r, 450)); }
    run = false; return Math.round(n / ((performance.now() - t0) / 1000));
  });
  const ox = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(`${lang} app: fps ${fps}, overflowX ${ox}`);
  if (ox > 0) bad.push(`${lang} app: горизонтальная прокрутка`);
  await p.close();
}
async function site(lang, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 800, hasTouch: w < 800 });
  p.on("pageerror", (e) => bad.push(`${lang} site ${w}: ${e.message}`));
  await p.addInitScript(() => { try { sessionStorage.setItem("tb-intro", "1"); } catch (e) {} });
  await p.goto(`${URL0}${lang === "uz" ? "/uz" : ""}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/site-${lang}-${w}-01-hero.png` });
  const ids = ["put", "prilozhenie", "menedzher", "shema", "otvet", "nuzhno", "keys", "predlozhenie", "konstruktor"];
  for (const [i, id] of ids.entries()) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: "start" }), id);
    await p.waitForTimeout(id === "prilozhenie" ? 2800 : 900);
    await p.screenshot({ path: `${OUT}/site-${lang}-${w}-${String(i + 2).padStart(2, "0")}-${id}.png` });
  }
  const ox = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ox > 0) bad.push(`${lang} site ${w}: горизонтальная прокрутка ${ox}`);
  const frameOk = await p.evaluate(() => { const f = document.getElementById("app-frame"); return !!(f && f.contentDocument && f.contentDocument.querySelector(".v")); });
  if (!frameOk) bad.push(`${lang} site ${w}: приложение в айфоне не загрузилось`);
  // Канбан: демо-сделка из приложения на месте, перенос меняет статус в айфоне.
  await p.evaluate(() => document.getElementById("menedzher").scrollIntoView({ block: "start" }));
  await p.waitForTimeout(600);
  const app = p.locator(".bx-card.app").first();
  if (!(await app.count())) bad.push(`${lang} site ${w}: в канбане нет сделки из приложения`);
  else {
    await app.click(); await p.waitForTimeout(300);
    await p.locator('.bx-side [data-move="2"]').click(); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector(".bx").scrollIntoView({ block: "start" })); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/site-${lang}-${w}-10-kanban-move.png` });
    const st = await p.evaluate(() => { const d = document.getElementById("app-frame").contentDocument; const v = d.querySelector(".v:not([hidden])"); return v ? v.getAttribute("data-view") + ":" + (v.querySelector(".tl li.is-now b") || {}).textContent : ""; });
    if (!/^trip:/.test(st)) bad.push(`${lang} site ${w}: перенос в канбане не открыл бронь в айфоне (${st})`);
    console.log(`  kanban → app: ${st}`);
  }
  if (w >= 1000) {
    await p.evaluate(() => document.getElementById("prilozhenie").scrollIntoView({ block: "start" }));
    await p.locator("#ap-full").click(); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/site-${lang}-${w}-99-full.png` });
    await p.keyboard.press("Escape");
  }
  console.log(`${lang} site ${w}×${h}: overflowX ${ox}, app in phone ${frameOk}`);
  await p.close();
}
for (const l of ["ru", "uz"]) await app(l);
for (const l of ["ru", "uz"]) for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) await site(l, w, h);
await b.close();
console.log(bad.length ? "ПРОБЛЕМЫ:\n" + bad.join("\n") : "Без ошибок");
