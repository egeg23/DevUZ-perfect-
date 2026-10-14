// Проверка макета в Chromium: node check.mjs <папка для снимков>
// Приложение 390×844: каталог, фильтры, ЖК, планировка, запись на показ до «готово», подбор до «готово»,
// ипотека, карта, избранное и сравнение, профиль и вход; кадры в секунду на переходах; ru и uz.
// Сайт 390×844, 768×1024, 1440×900: горизонтальная прокрутка, ошибки, айфон с приложением, «во весь экран».
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
  const shot = (n) => p.screenshot({ path: `${OUT}/app-${lang}-${n}.png` });
  const tap = async (sel) => { await p.locator(sel).first().tap(); await p.waitForTimeout(520); };
  await shot("01-home");
  // Каталог и фильтры
  await tap('[data-tab="catalog"]'); await shot("02-catalog");
  await tap('[data-act="filters"]'); await tap('.sheet [data-f="rooms"][data-v="2"]'); await shot("03-filters");
  await tap('.sheet [data-f="apply"]');
  // ЖК
  await tap(".v:not([hidden]) .zc"); await shot("04-zk");
  await p.evaluate(() => document.querySelector(".v:not([hidden])").scrollTo(0, 520)); await p.waitForTimeout(400); await shot("05-zk-scroll");
  await tap('.v:not([hidden]) [data-act="plan"]'); await shot("06-plan");
  await tap('.sheet [data-go^="book"]'); await p.waitForTimeout(300); await shot("07-book");
  // Запись до конца
  await tap('.v:not([hidden]) [data-act="btime"]');
  await p.locator(".v:not([hidden]) #bn").fill("Азиз");
  await p.locator(".v:not([hidden]) #bp").fill("901234567");
  await p.waitForTimeout(200); await shot("08-book-filled");
  await tap('.v:not([hidden]) [data-act="bsend"]'); await p.waitForTimeout(600); await shot("09-done");
  // Подбор
  await tap('.v:not([hidden]) [data-act="home"]'); await tap('.v:not([hidden]) [data-go="podbor"]');
  await tap('.v:not([hidden]) [data-act="wset"][data-k="goal"]'); await tap('.v:not([hidden]) [data-act="wnext"]');
  await tap('.v:not([hidden]) [data-act="wds"][data-v="mirabad"]'); await tap('.v:not([hidden]) [data-act="wnext"]');
  await tap('.v:not([hidden]) [data-act="wset"][data-k="rooms"][data-v="2"]'); await tap('.v:not([hidden]) [data-act="wnext"]');
  await tap('.v:not([hidden]) [data-act="wset"][data-k="pay"]'); await shot("10-podbor-budget");
  await tap('.v:not([hidden]) [data-act="wnext"]');
  await p.locator(".v:not([hidden]) #wn").fill("Азиз"); await p.locator(".v:not([hidden]) #wp").fill("901234567");
  await shot("11-podbor-result"); await tap('.v:not([hidden]) [data-act="wnext"]'); await shot("12-podbor-done");
  // Ипотека
  await tap('.v:not([hidden]) [data-act="home"]'); await tap('.v:not([hidden]) [data-go="mortgage"]'); await shot("13-mortgage");
  await tap('.v:not([hidden]) [data-back]');
  // Карта
  await tap('[data-tab="map"]'); await tap('.v:not([hidden]) .pin'); await shot("14-map");
  await p.evaluate(() => document.getElementById("sheet-bg").click()); await p.waitForTimeout(400);
  // Избранное и сравнение
  await tap('[data-tab="fav"]'); await shot("15-fav"); await tap('.v:not([hidden]) .cmp-hint'); await shot("16-compare");
  // Профиль и уведомление
  await tap('.v:not([hidden]) [data-back]'); await tap('[data-tab="more"]'); await shot("17-more");
  await tap('.v:not([hidden]) [data-go="alerts"]'); await tap('.v:not([hidden]) [data-act="pushtest"]'); await shot("18-push");
  // Кадры в секунду на переходе вглубь и назад
  await tap('.v:not([hidden]) [data-back]'); await tap('[data-tab="catalog"]');
  const fps = await p.evaluate(async () => {
    let n = 0, run = true; const t0 = performance.now();
    (function f() { n++; if (run) requestAnimationFrame(f); })();
    for (let i = 0; i < 3; i++) { document.querySelector(".v:not([hidden]) .zc").click(); await new Promise((r) => setTimeout(r, 500)); document.querySelector(".v:not([hidden]) [data-back]").click(); await new Promise((r) => setTimeout(r, 450)); }
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
  await p.addInitScript(() => { try { sessionStorage.setItem("dt-intro", "1"); } catch (e) {} });
  await p.goto(`${URL0}${lang === "uz" ? "/uz" : ""}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/site-${lang}-${w}-01-hero.png` });
  const ids = ["put", "servisy", "novostroyki", "ceny", "prilozhenie", "predlozhenie", "konstruktor"];
  for (const [i, id] of ids.entries()) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: "start" }), id);
    await p.waitForTimeout(id === "prilozhenie" ? 2600 : 900);
    await p.screenshot({ path: `${OUT}/site-${lang}-${w}-${String(i + 2).padStart(2, "0")}-${id}.png` });
  }
  const ox = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ox > 0) bad.push(`${lang} site ${w}: горизонтальная прокрутка ${ox}`);
  const frameOk = await p.evaluate(() => { const f = document.getElementById("app-frame"); return !!(f && f.contentDocument && f.contentDocument.querySelector(".v")); });
  if (!frameOk) bad.push(`${lang} site ${w}: приложение в айфоне не загрузилось`);
  if (w >= 1000) {
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
