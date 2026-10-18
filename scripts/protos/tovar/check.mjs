// Проверка макета tovar.uz в Chromium. Сервер: node serve.mjs (порт 4815).
//   node scripts/protos/tovar/check.mjs
// 1) все страницы ru и uz на 360, 390, 768, 1024, 1440: без ошибок в консоли и
//    без горизонтальной прокрутки, у body нет overflow-x:hidden (иначе sticky
//    не держится);
// 2) шапка главной, приложения и кабинета прячется при прокрутке и
//    возвращается через 3 секунды после остановки, не раньше;
// 3) первый экран: в конце прокрутки три продавца 4/128, дешевле всех отмечен;
// 4) весь путь покупателя на 390×844 (ru и uz): поиск «4/128», карточка с
//    продавцами, сравнение, вопрос и торг → ответ и встречная цена из
//    кабинета, опт лесенкой в корзине, оформление по коду, оплата Click,
//    статус из кабинета, запрос цены с ответами, «Цена свежая» из кабинета;
// 5) без движения (prefers-reduced-motion) первый экран стоит и три
//    продавца видны списком.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4815/proto/${"a".repeat(43)}`;
const args = ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="];
if (process.env.HTTPS_PROXY) args.push("--proxy-server=" + process.env.HTTPS_PROXY, "--proxy-bypass-list=localhost;127.0.0.1");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);
const okIf = (c, m, e) => (c ? ok(m) : fail(e || m));

async function open(path, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { try { sessionStorage.setItem("tv-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(500);
  return { p, ctx, errs };
}

// 1. Страницы и ширины
const PAGES = ["", "uz", "app", "uz/app", "panel", "uz/panel", "app#/c/all", "app#/s/4%2F128", "app#/p/127572", "uz/app#/p/53664", "app#/cmp", "app#/cart", "app#/checkout", "app#/rfq", "app#/me", "panel#start", "panel#goods", "panel#orders", "panel#ask", "panel#rfq", "panel#stats"];
for (const w of process.env.QUICK ? [] : [360, 390, 768, 1024, 1440]) {
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
for (const [path, sel] of [["", "#top"], ["uz", "#top"], ["app#/c/all", "#top"], ["panel#goods", ".topbar"]]) {
  const { p, ctx } = await open(path, 390, 844);
  await p.mouse.wheel(0, 600); await p.waitForTimeout(300);
  await p.mouse.wheel(0, 400); await p.waitForTimeout(400);
  const hid = await p.$eval(sel, (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1800);
  const still = await p.$eval(sel, (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1500);
  const back = await p.$eval(sel, (e) => !e.classList.contains("hide"));
  okIf(hid && still && back, `${path || "/"}: шапка прячется и возвращается через 3 с`, `${path || "/"}: шапка ${hid} ${still} ${back}`);
  await ctx.close();
}

// 3. Первый экран в конце прокрутки
for (const w of [390, 1440]) {
  const { p, ctx } = await open("", w, w < 800 ? 844 : 900);
  await p.evaluate(() => { const hero = document.querySelector(".hero"); window.scrollTo(0, hero.offsetHeight - innerHeight - 4); });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({
    vis: [...document.querySelectorAll(".pr")].filter((x) => +getComputedStyle(x).opacity > 0.9).map((x) => x.dataset.id),
    badge: !!document.querySelector('.pr[data-id="127558"] .pr-badge'),
    out: +getComputedStyle(document.querySelector(".hero-out")).opacity,
    q: document.querySelector("#hq-i").value,
  }));
  okIf(r.vis.sort().join() === "113918,127558,127578" && r.badge && r.out > 0.9 && /4\/128/.test(r.q), `первый экран @${w}: три продавца 4/128, дешевле всех отмечен`, `первый экран @${w}: ${JSON.stringify(r)}`);
  await ctx.close();
}

// 4. Путь покупателя на телефоне
for (const lang of ["", "uz/"]) {
  const L = lang ? "uz" : "ru";
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("tv-intro", "1"); } catch {} });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  const st = () => p.evaluate(() => JSON.parse(localStorage.getItem("tv-demo-1") || "{}"));
  // Главная: поиск на двух языках и механики
  await p.goto(B + "/" + lang, { waitUntil: "load" });
  await p.locator("#poisk").scrollIntoViewIfNeeded();
  await p.locator("#sx").fill(L === "ru" ? "quloqchin" : "наушники"); await p.waitForTimeout(300);
  const found = await p.locator("#sx-res .gc").count();
  okIf(found >= 5, `${L}: поиск на другом языке нашёл наушники (${found})`);
  await p.locator("#mehaniki").scrollIntoViewIfNeeded();
  await p.locator("#rq-go").click(); await p.waitForTimeout(2600);
  okIf((await p.locator("#rq-a li").count()) === 3, `${L}: запрос цены на главной: три ответа`);
  await p.locator("#ld-p").click(); await p.locator("#ld-p").click(); await p.locator("#ld-p").click(); await p.locator("#ld-p").click(); await p.waitForTimeout(100);
  okIf(await p.locator('.ld-st span[data-i="1"].on').count(), `${L}: опт лесенкой: от 5 шт. другая ступень`);
  // Поиск 4/128 → карточка → продавцы
  await p.goto(B + "/" + lang + "app#/s/4%2F128", { waitUntil: "load" }); await p.waitForTimeout(400);
  okIf((await p.locator(".gl .gc").count()) === 3, `${L}: «4/128» — три смартфона у двух продавцов`);
  await p.locator('.gl .gc[href="#/p/127578"]').click(); await p.waitForTimeout(400);
  const ofr = await p.locator(".ofr li").count(), best = await p.locator(".ofr li.best a[href='#/p/127558']").count();
  okIf(ofr === 3 && best === 1, `${L}: на карточке три продавца, дешевле всех Tecno SHOP-IT`);
  await p.locator("#cmp").click();
  await p.goto(B + "/" + lang + "app#/p/113918"); await p.waitForTimeout(400); await p.locator("#cmp").click();
  await p.locator(".tabbar a[data-tab=cmp]").click(); await p.waitForTimeout(400);
  okIf((await p.locator(".cmp tr:first-child td").count()) === 2 && (await p.locator(".cmp td.best").count()) >= 1, `${L}: сравнение двух, лучшее отмечено`);
  // Вопрос и торг
  await p.goto(B + "/" + lang + "app#/p/127572/ask"); await p.waitForTimeout(500);
  await p.locator("#as-go").click(); await p.waitForTimeout(200);
  await p.goto(B + "/" + lang + "app#/p/130576/offer"); await p.waitForTimeout(500);
  await p.locator("#of-p").fill("1180000"); await p.locator("#of-go").click(); await p.waitForTimeout(200);
  let s = await st();
  okIf(s.asks.some((a) => a.src === "app") && s.offers.some((o) => o.id === 130576), `${L}: вопрос и предложение цены ушли продавцу`);
  const pp = await ctx.newPage();
  await pp.goto(B + "/" + lang + "panel#ask", { waitUntil: "load" }); await pp.waitForTimeout(400);
  const q = (await st()).asks.find((a) => a.src === "app").no;
  await pp.locator(`[data-an="${q}"]`).click(); await pp.waitForTimeout(200);
  const of = (await st()).offers.find((o) => o.id === 130576).no;
  await pp.locator(`[data-ci="${of}"]`).fill("1220000"); await pp.locator(`[data-oc="${of}"]`).click(); await pp.waitForTimeout(200);
  await p.goto(B + "/" + lang + "app#/p/127572"); await p.reload(); await p.waitForTimeout(500);
  okIf(await p.locator(".qa li p + p:not(.wait)").count(), `${L}: ответ продавца виден под карточкой`);
  await p.goto(B + "/" + lang + "app#/p/130576"); await p.waitForTimeout(500);
  await p.locator("#take").click(); await p.waitForTimeout(400);
  s = await st();
  okIf(s.cart.some((c) => c.id === 130576 && c.fp === 1220000), `${L}: встречная цена 1 220 000 в корзине`);
  // Опт лесенкой в корзине
  await p.goto(B + "/" + lang + "app#/p/53664"); await p.waitForTimeout(400);
  await p.locator("#add").click(); await p.waitForTimeout(200);
  await p.goto(B + "/" + lang + "app#/cart"); await p.waitForTimeout(400);
  const before = await p.locator(".tot .big").textContent();
  await p.locator("[data-up='53664']").click(); await p.waitForTimeout(300);
  const after = await p.locator(".tot .big").textContent();
  okIf(before !== after && (await p.locator(".lad-hint.got, .lad-hint").count()), `${L}: опт лесенкой: ${before} → ${after}`);
  // Оформление по коду и оплата Click
  await p.locator(".tot .btn-red").click(); await p.waitForTimeout(400);
  await p.locator("#co-code").click(); await p.locator("#co-cv").fill("1234"); await p.waitForTimeout(300);
  await p.locator('[data-pay="click"]').click();
  await p.locator("#co-go").click(); await p.waitForTimeout(300);
  await p.locator("#pc-c").fill("1234"); await p.locator("#pc-go").click(); await p.waitForTimeout(1600);
  const no = await p.evaluate(() => location.hash);
  okIf(/#\/o\/TV-/.test(no), `${L}: заказ оформлен и оплачен: ${no}`);
  // Статус из кабинета
  await pp.goto(B + "/" + lang + "panel#orders"); await pp.waitForTimeout(400);
  const first = await pp.locator("tbody tr").first().getAttribute("data-o");
  okIf(first === no.split("/").pop(), `${L}: заказ в кабинете SHOP-IT первой строкой`, `${L}: в кабинете первым ${first}`);
  await pp.locator(`[data-adv="${first}"]`).click(); await pp.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(500);
  const now = await p.locator(".trk li.now span").textContent();
  okIf(now === (L === "ru" ? "Продавец подтвердил" : "Sotuvchi tasdiqladi"), `${L}: статус из кабинета у покупателя: ${now}`);
  // Запрос цены
  await p.goto(B + "/" + lang + "app#/rfq"); await p.waitForTimeout(400);
  await p.locator("#rq-go").click(); await p.waitForTimeout(3600);
  await pp.goto(B + "/" + lang + "panel#rfq"); await pp.waitForTimeout(400);
  await pp.locator("[data-qs]").first().click(); await pp.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(500);
  okIf((await p.locator(".ml [data-take]").count()) === 3, `${L}: запрос цены: три ответа, один из кабинета`);
  // «Цена свежая» из кабинета
  await pp.goto(B + "/" + lang + "panel#goods"); await pp.waitForTimeout(400);
  await pp.locator("#conf-all2").click(); await pp.waitForTimeout(200);
  await p.goto(B + "/" + lang + "app#/p/127572"); await p.reload(); await p.waitForTimeout(400);
  okIf(await p.locator(".fresh .chip-ok").count(), `${L}: «Цена свежая» после подтверждения в кабинете`);
  if (errs.length) fail(`${L}: ошибки ${errs.join(" | ")}`);
  await ctx.close();
}

// 5. Без движения
{
  const { p, ctx, errs } = await open("", 390, 844, { reduced: true });
  const r = await p.evaluate(() => ({ pin: document.documentElement.classList.contains("no-pin"), trio: [...document.querySelectorAll(".trio-s li")].filter((x) => x.offsetHeight > 0).length }));
  okIf(r.pin && r.trio === 3, "без движения первый экран стоит, три продавца списком", `без движения: ${JSON.stringify(r)}`);
  if (errs.length) fail(errs.join(" | "));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nПроблем: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
