// Проверка макета Karomat в Chromium. Сервер: node serve.mjs (порт 4814).
//   node scripts/protos/karomat/check.mjs
// 1) все страницы uz и ru на 360, 390, 768, 1440: без ошибок в консоли и без
//    горизонтальной прокрутки, у body нет overflow-x:hidden (иначе sticky не держится);
// 2) шапка главной, приложения и панели прячется при прокрутке и возвращается
//    через 3 секунды после остановки, не раньше;
// 3) весь путь гостя на 390×844: бронь стола на схеме, банкет, заказ из меню
//    с оплатой Click и кодом, статус из панели доходит до гостя, бронь из
//    приложения в панели, официант со стола 7 по QR, стоп-лист;
// 4) без движения (prefers-reduced-motion) все блюда стола на месте.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4814/proto/${"a".repeat(43)}`;
const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: exe });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);

async function open(path, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { try { sessionStorage.setItem("km-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(500);
  return { p, ctx, errs };
}

// 1. Страницы и ширины
const PAGES = ["", "ru", "menu", "ru/menu", "panel", "ru/panel", "menu#/c/all", "menu#/p/3755", "menu#/cart", "menu#/book", "menu#/banket", "menu#/me", "menu#/t/7", "panel#orders", "panel#books", "panel#banq", "panel#hall", "panel#menu", "panel#dishes"];
for (const w of process.env.QUICK ? [] : [360, 390, 768, 1440]) {
  for (const path of PAGES) {
    const { p, ctx, errs } = await open(path, w, w < 800 ? 844 : 900);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bx: getComputedStyle(document.body).overflowX }));
    if (r.ov > 0) fail(`${path || "/"} @${w}: горизонтальная прокрутка ${r.ov}px`);
    if (r.bx === "hidden") fail(`${path || "/"} @${w}: у body overflow-x:hidden`);
    if (errs.length) fail(`${path || "/"} @${w}: ${errs.join(" | ")}`);
    await ctx.close();
  }
}
ok("страницы без ошибок и прокрутки вбок, если выше нет ✗");

// 2. Шапка: прячется при прокрутке, возвращается через 3 с
for (const [path, sel] of [["", "#top"], ["ru", "#top"], ["menu#/c/all", "#top"], ["panel#orders", ".topbar"]]) {
  const { p, ctx } = await open(path, 390, 844);
  await p.mouse.wheel(0, 600); await p.waitForTimeout(300);
  await p.mouse.wheel(0, 400); await p.waitForTimeout(400);
  const hid = await p.$eval(sel, (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1800);
  const still = await p.$eval(sel, (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1500);
  const back = await p.$eval(sel, (e) => !e.classList.contains("hide"));
  if (hid && still && back) ok(`${path || "/"}: шапка прячется и возвращается через 3 с`); else fail(`${path || "/"}: шапка ${hid} ${still} ${back}`);
  await ctx.close();
}

// 3. Путь гостя на телефоне
for (const lang of ["", "ru/"]) {
  const L = lang ? "ru" : "uz";
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("km-intro", "1"); } catch {} });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(B + "/" + (lang || ""), { waitUntil: "load" });
  // Бронь на главной: свободный стол на 4+
  await p.locator("#bron").scrollIntoViewIfNeeded();
  const free = await p.$$eval("#hall .tb", (gs) => gs.filter((g) => !g.classList.contains("busy") && +g.dataset.s >= 4).map((g) => g.dataset.t));
  if (!free.length) fail(`${L}: на схеме нет свободного стола`);
  await p.locator(`#hall .tb[data-t="${free[0]}"]`).click();
  await p.locator("#bk-go").click();
  const booked = await p.evaluate(() => JSON.parse(localStorage.getItem("km-demo-1")).books.length);
  if (booked === 1 && (await p.locator("#bk-sum .ok").count())) ok(`${L}: бронь стола ${free[0]} с главной`); else fail(`${L}: бронь с главной не прошла`);
  // Банкет
  await p.locator("#banket").scrollIntoViewIfNeeded();
  const t0 = await p.locator("#bq-big").textContent();
  await p.locator("#bq-r").fill("120"); await p.locator("#bq-r").dispatchEvent("input");
  await p.waitForTimeout(600);
  const t1 = await p.locator("#bq-big").textContent();
  if (t0 !== t1) ok(`${L}: банкет пересчитался: ${t0} → ${t1}`); else fail(`${L}: банкет не пересчитался`);
  await p.locator("#bq-go").click();
  const bq = await p.evaluate(() => JSON.parse(localStorage.getItem("km-demo-1")).banq[0]);
  if (bq && bq.g === 120 && bq.tot > 0) ok(`${L}: заявка на банкет ${bq.no}, ${bq.tot} сум`); else fail(`${L}: заявка на банкет`);
  // Заказ в приложении
  await p.goto(B + "/" + lang + "menu#/c/shorva", { waitUntil: "load" });
  await p.waitForTimeout(400);
  await p.locator("[data-add]").first().click();
  await p.goto(B + "/" + lang + "menu#/p/3755"); await p.waitForTimeout(400);
  await p.locator('[data-v="1"]').click();
  await p.locator("[data-padd]").click();
  await p.locator(".tabbar a[data-tab=cart]").click(); await p.waitForTimeout(400);
  const items = await p.locator(".cl li").count();
  if (items === 2) ok(`${L}: в корзине 2 позиции`); else fail(`${L}: в корзине ${items}`);
  await p.locator(".cart-bar .btn-gold").click(); await p.waitForTimeout(400);
  await p.locator("#co-code").click();
  await p.locator("#co-cv").fill("1234"); await p.waitForTimeout(200);
  await p.locator("#co-go2").click(); await p.waitForTimeout(300);
  await p.locator("#pc-c").fill("1234");
  await p.locator("#pc-go").click(); await p.waitForTimeout(1600);
  const no = await p.evaluate(() => location.hash);
  if (/#\/o\/KR-/.test(no)) ok(`${L}: заказ оформлен и оплачен: ${no}`); else fail(`${L}: заказ не оформился (${no})`);
  // Панель видит заказ и меняет статус
  const pp = await ctx.newPage();
  await pp.goto(B + "/" + lang + "panel#orders", { waitUntil: "load" }); await pp.waitForTimeout(400);
  const first = await pp.locator("tbody tr").first().getAttribute("data-o");
  if (first === no.split("/").pop()) ok(`${L}: заказ в панели первой строкой`); else fail(`${L}: в панели первым ${first}`);
  await pp.locator(`[data-adv="${first}"]`).click(); await pp.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(500);
  const now = await p.locator(".trk li.now span").textContent();
  const want = L === "ru" ? "Готовится" : "Tayyorlanmoqda";
  if (now === want) ok(`${L}: статус из панели у гостя: ${now}`); else fail(`${L}: у гостя статус «${now}»`);
  // Бронь в приложении → панель
  await p.goto(B + "/" + lang + "menu#/book"); await p.waitForTimeout(400);
  const t2 = await p.$$eval(".hall .tb", (gs) => gs.filter((g) => !g.classList.contains("busy") && +g.dataset.s >= 2).map((g) => g.dataset.t));
  await p.locator(`.hall .tb[data-t="${t2[0]}"]`).click(); await p.waitForTimeout(300);
  await p.locator("#bk-go").click(); await p.waitForTimeout(400);
  if (/#\/b\/B-/.test(await p.evaluate(() => location.hash))) ok(`${L}: бронь в приложении, стол ${t2[0]}`); else fail(`${L}: бронь в приложении`);
  await pp.goto(B + "/" + lang + "panel#books"); await pp.waitForTimeout(400);
  const live = await pp.locator(".tl-b.live, .feed .nw").count();
  if (live >= 1) ok(`${L}: брони с сайта видны в панели (${live})`); else fail(`${L}: брони не в панели`);
  // QR: стол 7 зовёт официанта
  await p.goto(B + "/" + lang + "menu#/t/7"); await p.waitForTimeout(500);
  await p.locator("#call-w").click();
  await pp.goto(B + "/" + lang + "panel#hall"); await pp.waitForTimeout(400);
  if (await pp.locator(".calls li").count()) ok(`${L}: вызов со стола 7 в панели`); else fail(`${L}: вызова нет в панели`);
  // Стоп-лист: шурпа закончилась
  await pp.goto(B + "/" + lang + "panel#menu"); await pp.waitForTimeout(300);
  await pp.locator('[data-mc="shorva"]').click(); await pp.waitForTimeout(200);
  await pp.locator('label:has([data-stop="3745"])').click(); await pp.waitForTimeout(200);
  await p.goto(B + "/" + lang + "menu#/p/3745"); await p.reload(); await p.waitForTimeout(400);
  if (await p.locator(".stop-l.big").count()) ok(`${L}: стоп-лист из панели виден гостю`); else fail(`${L}: стоп-лист не дошёл`);
  if (errs.length) fail(`${L}: ошибки ${errs.join(" | ")}`);
  await ctx.close();
}

// 4. Без движения
{
  const { p, ctx, errs } = await open("", 390, 844, { reduced: true });
  const vis = await p.$$eval(".pl", (ps) => ps.filter((x) => +getComputedStyle(x).opacity > 0.9).length);
  if (vis === 9) ok("без движения все 9 блюд на столе"); else fail(`без движения видно блюд: ${vis}`);
  if (errs.length) fail(errs.join(" | "));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nПроблем: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
