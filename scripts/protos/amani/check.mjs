// Проверка макета Amani в Chromium: node serve.mjs, затем node check.mjs
// (на основе проверки Greenwell; язык по умолчанию узбекский, русский — /ru)
// Магазин на 390×844 (ru и uz): весь цикл от карточки до отзыва за баллы,
// рассрочка до графика платежей, заказ виден в панели, смена статуса в
// панели видна покупателю. Все страницы на 390, 768 и 1440: без ошибок в
// консоли и без горизонтальной прокрутки, у каждой кнопки шага есть экран.
import { chromium } from "playwright-core";
const B = `http://localhost:4813/proto/${"a".repeat(43)}`;
// Шрифты Google через прокси: с запасным шрифтом таблицы уже и ошибку не видно.
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}) });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);
async function page(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  p.errs = [];
  p.on("pageerror", (e) => p.errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text())) p.errs.push(m.text()); });
  await p.addInitScript(() => { try { sessionStorage.setItem("am-intro", "1"); } catch {} });
  return p;
}
async function noScroll(p, label) {
  // Не только ширина документа: html и body обрезают лишнее, а Safari на
  // телефоне всё равно даёт листать вбок. Ищем любой блок, который вылез за
  // экран и не сидит внутри своей прокрутки (лента, таблица в карточке).
  const out = await p.evaluate((W) => {
    const bad = [];
    const scroller = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true; } return false; };
    for (const el of document.querySelectorAll("body *")) {
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= W + 1 || r.left >= W) continue;
      if (getComputedStyle(el).visibility === "hidden" || scroller(el)) continue;
      bad.push((el.id ? "#" + el.id : el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]) + ":" + Math.round(r.right));
      if (bad.length > 4) break;
    }
    return [document.documentElement.scrollWidth, W, bad];
  }, p.viewportSize().width);
  if (out[0] > out[1] + 1) fail(`${label}: горизонтальная прокрутка ${out[0]} > ${out[1]}`);
  if (out[2].length) fail(`${label}: вылезло за экран ${out[2].join(", ")}`);
}
const S = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("am-demo-1") || "{}"));
const hash = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(450); };
async function code(p, sel, digits) { const ins = await p.$$(sel + " input"); for (let i = 0; i < ins.length; i++) await ins[i].fill(String(digits[i] ?? 1)); }

for (const lang of ["", "ru/"]) {
  const L = lang ? "ru" : "uz";
  const p = await page(390, 844);
  await p.goto(`${B}/${lang}shop#/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  // Главная → карточка → в корзину.
  await p.click(".rail [data-add]");
  await hash(p, "#/p/d5503");
  await p.click('[data-sz="2"]');
  await p.click("#pd-buy [data-add]");
  let s = await S(p);
  if (s.cart?.length !== 2) fail(`${L}: в корзине ${s.cart?.length} товаров, ждали 2`);
  if (s.sz?.d5503 !== "2") fail(`${L}: размер не запомнился`);
  await p.click("#sz-open").catch(() => {});
  await hash(p, "#/kit/her");
  await p.click("#kit-add");
  s = await S(p);
  if (s.cart?.length !== 7) fail(`${L}: набор в умру положил ${s.cart?.length - 2} вещей, ждали 5`); else ok(`${L}: набор в умру в корзине`);
  // Галерея листается.
  await hash(p, "#/p/d5503");
  await p.evaluate(() => { const g = document.querySelector("#gal"); g.scrollLeft = g.clientWidth; });
  await p.waitForTimeout(300);
  if (!(await p.$(".gal-dots i:nth-child(2).on"))) fail(`${L}: точки галереи не следуют за свайпом`);
  // Фильтры шторкой.
  await hash(p, "#/c/all");
  await p.waitForTimeout(500);
  await p.click("#f-open");
  await p.waitForSelector("#sheet.on");
  await p.click("#f-sale");
  await p.click("#f-go");
  await p.waitForTimeout(300);
  const n = await p.$$eval("#cat-grid [data-card]", (x) => x.length);
  if (!(n > 0 && n < 30)) fail(`${L}: фильтр «со скидкой» дал ${n}`);
  // Поиск с подсказками по синониму.
  await p.click(".hd-s");
  await p.fill("#sq", L === "ru" ? "химар" : "himor");
  await p.waitForTimeout(200);
  if (!(await p.$(".sq-p"))) fail(`${L}: поиск «сон» без подсказок`);
  await p.click("#sq-x");
  // Корзина: промокод.
  await hash(p, "#/cart");
  await p.fill("#pc-in", "WRONG");
  await p.click("#promo button");
  if (await p.$eval("#pc-err", (e) => e.hidden)) fail(`${L}: нет ошибки неверного промокода`);
  await p.fill("#pc-in", "AMANI10");
  await p.click("#promo button");
  await p.waitForTimeout(300);
  if (!(await p.$(".sum .g"))) fail(`${L}: промокод не применился`);
  await p.click("label.gift-row");
  await p.waitForTimeout(200);
  await p.fill("#gift-n", "Onajon");
  // Оформление: вход по коду, адрес на карте, оплата Payme.
  await hash(p, "#/checkout");
  await p.fill("#ph", "901234567");
  await p.click("#ph-go");
  await code(p, "#code", "1234");
  await p.waitForTimeout(500);
  await p.fill("#nm", "Test");
  if (!(await p.$eval("#ad-s", (e) => e.textContent.length > 3))) fail(`${L}: нет адреса с карты`);
  await p.click('[data-reg="vil"]');
  if (!(await p.$("#vil-c"))) fail(`${L}: нет выбора города для региона`);
  await p.click('[data-reg="tash"]');
  await p.waitForTimeout(200);
  await p.fill("#ad-lm", "school");
  await p.check("#try");
  await p.click('label.pay:has(input[value="payme"])');
  await p.click("#co-go2");
  await p.waitForSelector("#cn");
  await p.fill("#cn", "8600123412341234");
  await p.fill("#ce", "1228");
  await p.click("#ps-go");
  await code(p, "#code2", "123456");
  await p.click("#ps-ok");
  await p.waitForFunction(() => location.hash.startsWith("#/order/"), null, { timeout: 5000 });
  s = await S(p);
  const no = s.orders?.[0]?.no;
  if (!no) fail(`${L}: заказ не создан`); else ok(`${L}: заказ ${no} оплачен`);
  if (!s.orders?.[0]?.tryon || s.orders?.[0]?.gift !== "Onajon") fail(`${L}: заказ без примерки или подарка`);
  if (s.orders?.[0]?.items?.find((i) => i.id === "d5503")?.sz !== "2") fail(`${L}: размер не дошёл до заказа`);
  // Панель видит заказ и меняет статус.
  const q = await p.context().newPage();
  q.errs = [];
  q.on("pageerror", (e) => q.errs.push(String(e)));
  await q.goto(`${B}/${lang}panel#orders`, { waitUntil: "networkidle" });
  await q.waitForTimeout(400);
  const first = await q.$eval(".tb.ord tbody tr", (r) => r.getAttribute("data-o") + (r.classList.contains("site") ? "+site" : ""));
  if (first !== no + "+site") fail(`${L}: в панели первой строкой ${first}, ждали ${no}`);
  await q.click(".tb.ord tbody tr");
  await q.waitForSelector("#oc-next");
  await q.click("#oc-next");
  await q.waitForTimeout(300);
  s = await S(p);
  if (s.orders[0].st !== 1) fail(`${L}: смена статуса в панели не дошла до покупателя`); else ok(`${L}: панель → покупатель: «Собран»`);
  // Статусы до «Доставлен» и отзыв за баллы.
  await p.reload({ waitUntil: "networkidle" });
  for (let i = 0; i < 2; i++) { await p.click("#nx"); await p.waitForTimeout(250); }
  if (!(await p.$(".rate-ask a"))) fail(`${L}: после доставки нет «Оцените покупку»`);
  const before = (await S(p)).points;
  await p.click(".rate-ask a");
  await p.waitForSelector(".rvf");
  for (const f of await p.$$(".rvf")) { await (await f.$('[data-s="5"]')).click(); await (await f.$("textarea")).fill("Пришло быстро, всё хорошо"); }
  await p.click("#rv-send");
  await p.waitForFunction(() => location.hash === "#/points", null, { timeout: 5000 });
  const after = (await S(p)).points;
  if (!(after > before)) fail(`${L}: баллы за отзыв не начислены`); else ok(`${L}: отзыв +${after - before} баллов`);
  await q.goto(`${B}/${lang}panel#reviews`, { waitUntil: "networkidle" });
  if (!(await q.$(".rvc [data-ok]"))) fail(`${L}: отзыв не пришёл в панель`);
  // Рассрочка до графика.
  await hash(p, "#/p/d6370");
  await p.click("#pd-buy [data-add]");
  await hash(p, "#/checkout");
  await p.click('label.pay:has(input[value="nasiya"])');
  await p.click("#co-go2");
  await p.waitForSelector("#ns-next");
  await p.click('[data-m="12"]');
  await p.click("#ns-next");
  await p.fill("#pf", "31234567890123");
  await p.fill("#nc2", "9860123412341234");
  await p.check("#ns-ag");
  await p.click("#ns-next");
  await code(p, "#code3", "1111");
  await p.waitForSelector(".appr", { timeout: 5000 });
  await p.click("#ns-next");
  await p.waitForFunction(() => location.hash.startsWith("#/order/"), null, { timeout: 5000 });
  await hash(p, "#/plans");
  if (!(await p.$(".plan .sch li"))) fail(`${L}: нет графика рассрочки`); else ok(`${L}: рассрочка, график ${await p.$$eval(".plan .sch li", (x) => x.length)} платежей`);
  for (const h of ["#/", "#/c/all", "#/p/d5503", "#/p/h6391", "#/kit/her", "#/kit/him", "#/cart", "#/checkout", "#/orders", "#/me", "#/fav", "#/addr", "#/points", "#/plans"]) { await hash(p, h); await noScroll(p, `${L} shop${h} 390`); }
  if (p.errs.length) fail(`${L} магазин: ${p.errs.join(" | ")}`);
  if (q.errs.length) fail(`${L} панель: ${q.errs.join(" | ")}`);
  await p.context().close();
}

// Все страницы и вкладки на трёх ширинах.
for (const [w, h] of [[360, 780], [390, 844], [428, 926], [768, 1024], [1440, 900]]) {
  for (const lang of ["", "ru/"]) {
    const p = await page(w, h);
    await p.goto(`${B}/${lang}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    await noScroll(p, `${lang}site ${w}`);
    await p.click("#kit-all");
    await p.waitForTimeout(700);
    const sum = await p.$eval("#kit-total-sum", (e) => e.textContent);
    if (!/\d/.test(sum) || sum === "1 000 $") fail(`${lang}site ${w}: конструктор не считает (${sum})`);
    if (!/^\d\d:\d\d:\d\d$/.test(await p.$eval("#tm", (e) => e.textContent))) fail(`${lang}site ${w}: нет отсчёта`);
    const h0 = await p.$eval("#fd-h", (e) => e.textContent);
    await p.click('.face[data-s="round"]');
    if ((await p.$eval("#fd-h", (e) => e.textContent)) === h0) fail(`${lang}site ${w}: подбор платка не меняет ответ`);
    const k0 = await p.$eval("#kit-sum", (e) => e.textContent);
    await p.click("#kit-list li:first-child label");
    if ((await p.$eval("#kit-sum", (e) => e.textContent)) === k0) fail(`${lang}site ${w}: набор в умру не пересчитывается`);
    await p.click('.kits-sw [data-who="him"]');
    if (!(await p.$("#kit-list li"))) fail(`${lang}site ${w}: нет набора для него`);
    const sz0 = await p.$eval("#sz-len", (e) => e.textContent);
    await p.$eval("#sz-r", (e) => { e.value = 180; e.dispatchEvent(new Event("input")); });
    if ((await p.$eval("#sz-len", (e) => e.textContent)) === sz0) fail(`${lang}site ${w}: длина по росту не считается`);
    await p.click(".bn-box button");
    if (await p.$eval("#bn-t", (e) => e.hidden)) fail(`${lang}site ${w}: подарок не открывается`);
    if (!(await p.evaluate(() => !!document.querySelector("#silk") && (document.documentElement.classList.contains("no-gl") || !!document.querySelector("#silk").getContext)))) fail(`${lang}site ${w}: нет полотна`);
    await p.goto(`${B}/${lang}panel`, { waitUntil: "networkidle" });
    for (const t of ["dash", "orders", "reviews", "goods", "logistics", "nasiya", "traffic", "log"]) {
      await p.evaluate((x) => { location.hash = x; }, "#" + t);
      await p.waitForTimeout(250);
      await noScroll(p, `${lang}panel#${t} ${w}`);
    }
    await p.goto(`${B}/${lang}shop#/`, { waitUntil: "networkidle" });
    for (const t of ["#/", "#/c/all", "#/p/h6391", "#/cart", "#/me"]) { await p.evaluate((x) => { location.hash = x; }, t); await p.waitForTimeout(300); await noScroll(p, `${lang}shop${t} ${w}`); }
    if (p.errs.length) fail(`${lang} ${w}: ${p.errs.join(" | ")}`);
    await p.context().close();
  }
}
await b.close();
console.log(bad ? `\nНе прошло: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
