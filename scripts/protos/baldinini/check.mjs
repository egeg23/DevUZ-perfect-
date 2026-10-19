// Проверка в Chromium: node serve.mjs, затем node check.mjs
// Магазин на 390×844 (ru, uz, en): фильтр по размеру, размер с наличием,
// бронь примерки, «сообщить о размере», подарочная упаковка, оформление с
// кодом, курьером и оплатой картой, заказ в панели первой строкой, статус и
// подтверждение брони из панели видны покупателю, закрытая распродажа.
// Панель: «Панель / Расширенная», продавец не видит себестоимость и прибыль.
// Конструктор: допы на 40% дешевле обычных (3 450 $ за все). Все страницы на 390, 768 и 1440:
// без ошибок в консоли и прокрутки вбок; шапка прячется при прокрутке и
// возвращается через 3 секунды.
import { chromium } from "playwright-core";
import { PANELS, ADDONS, ADDONS_SUM, BASE } from "./plan.mjs";
const B = `http://localhost:4812/proto/${"a".repeat(43)}`;
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="],
  ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost" } } : {}),
});
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);
async function page(w, h, ctx) {
  ctx = ctx || await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  p.errs = [];
  p.on("pageerror", (e) => p.errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text())) p.errs.push(m.text()); });
  await p.addInitScript(() => { try { sessionStorage.setItem("bd-intro", "1"); sessionStorage.setItem("dz-intro", "1"); } catch {} });
  return p;
}
async function noScroll(p, label) {
  const out = await p.evaluate((W) => {
    const bad = [];
    const scroller = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true; } return false; };
    for (const el of document.querySelectorAll("body *")) {
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= W + 1 || r.left >= W) continue;
      if (getComputedStyle(el).visibility === "hidden" || scroller(el)) continue;
      if (el.closest("#sheet[hidden],#menu[hidden],#side[hidden],.sh-box,.mn,.sd,.dock,.pd-bar,#toast")) continue;
      bad.push((el.id ? "#" + el.id : el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]) + ":" + Math.round(r.right));
      if (bad.length > 4) break;
    }
    return [document.documentElement.scrollWidth, W, bad, getComputedStyle(document.body).overflowX];
  }, p.viewportSize().width);
  if (out[0] > out[1] + 1) fail(`${label}: горизонтальная прокрутка ${out[0]} > ${out[1]}`);
  if (out[2].length) fail(`${label}: вылезло за экран ${out[2].join(", ")}`);
  if (out[3] === "hidden") fail(`${label}: у body overflow-x:hidden, sticky не держится`);
}
const S = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("bd-demo-1") || "{}"));
const hash = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(450); };
async function code(p, sel, digits) { const ins = await p.$$(sel + " input"); for (let i = 0; i < ins.length; i++) await ins[i].fill(String(digits[i] ?? 1)); }

/* Конструктор: суммы из plan.mjs. */
if (ADDONS_SUM !== 3450 || ADDONS.some((a) => a.price !== Math.round(a.full * 0.6 / 10) * 10)) fail(`допы не на 40% дешевле: ${ADDONS_SUM} $`); else ok(`сумма допов ${ADDONS_SUM} $ (−40%)`);
if (BASE.promo !== 1000 || PANELS.std.price !== 300 || PANELS.pro.price !== 500) fail("база и админки не 1000 / 300 / 500");

for (const lang of ["", "uz/", "en/"]) {
  const L = lang ? lang.slice(0, 2) : "ru";
  const p = await page(390, 844);
  await p.goto(`${B}/${lang}shop#/c/all`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  // Фильтр по размеру в шторке.
  const all = await p.$$eval("#cat-grid [data-card]", (x) => x.length);
  await p.click("#f-open");
  await p.waitForSelector("#sheet.on");
  await p.click('[data-g="sz"][data-v="38"]');
  await p.click("#f-go");
  await p.waitForTimeout(300);
  const n = await p.$$eval("#cat-grid [data-card]", (x) => x.length);
  if (!(n > 0 && n < all)) fail(`${L}: фильтр «EU 38» дал ${n} из ${all}`); else ok(`${L}: фильтр EU 38: ${n} из ${all}`);
  // Карточка: размер с наличием в бутике, в корзину.
  await hash(p, "#/p/d7b704-0000");
  await p.click("#szs button:not(.out)");
  if (!(await p.$("#stk .ok"))) fail(`${L}: нет наличия в бутике по размеру`);
  await p.click("#pd-add");
  let s = await S(p);
  if (s.cart?.length !== 1 || !s.cart[0].sz || s.cart[0].sz === "one") fail(`${L}: пара не в корзине с размером`);
  // EU / RU.
  await p.click('[data-unit="ru"]');
  const ruLabel = await p.$eval("#szs button span", (e) => e.textContent);
  if (ruLabel !== "34") fail(`${L}: RU для EU 35 показан как ${ruLabel}`);
  await p.click('[data-unit="eu"]');
  // Подсказка по размеру: таблица бренда и расчёт по стопе.
  await p.click("#sz-guide");
  await p.waitForSelector(".szt");
  await p.fill("#foot", "23.5");
  await p.waitForTimeout(100);
  if (!(await p.$("#foot-pick"))) fail(`${L}: расчёт по стопе не предложил размер`);
  await p.click(".sh-head [data-close]");
  await p.waitForTimeout(350);
  // Бронь примерки в Tashkent City.
  await p.click("#bk-open");
  await p.waitForSelector("#bk-go");
  if (!(await p.$("#bk-times [data-tm]"))) await p.click('[data-di="1"]');
  await p.click("#bk-times [data-tm]");
  await p.fill("#bk-nm", "Test");
  await p.fill("#bk-ph", "+998 90 123 45 67");
  await p.click("#bk-go");
  await p.waitForTimeout(300);
  s = await S(p);
  if (s.bookings?.length !== 1 || s.bookings[0].st !== "new") fail(`${L}: бронь не создана`); else ok(`${L}: бронь ${s.bookings[0].id}`);
  await p.click(".sh-head [data-close]");
  await p.waitForTimeout(350);
  // «Сообщить о размере» на модели без размера.
  const outId = await p.evaluate(() => { const G = JSON.parse(document.getElementById("bd-data").textContent); const x = G.products.find((q) => q.sizes && q.sizes.some((z) => !q.stock[z])); return x && x.id; });
  await hash(p, "#/p/" + outId);
  await p.click("#szs button.out");
  await p.waitForSelector("#nt-go");
  await p.click("#nt-go");
  await p.waitForTimeout(200);
  s = await S(p);
  if (s.alerts?.length !== 1) fail(`${L}: «сообщить о размере» не записано`);
  // Корзина: подарочная упаковка и открытка.
  await hash(p, "#/cart");
  await p.check("#gift-on", { force: true });
  await p.waitForTimeout(200);
  await p.fill("#gift-t", "Happy birthday");
  s = await S(p);
  if (!s.gift?.on || s.gift.card !== "Happy birthday") fail(`${L}: подарочная упаковка не сохранилась`);
  // Оформление: код, курьер завтра, Payme, оплата с кодом.
  await p.click("#co-go");
  await p.waitForTimeout(400);
  await p.fill("#ph", "901234567");
  await p.click("#ph-go");
  await code(p, "#code", "1234");
  await p.waitForTimeout(400);
  await p.fill("#nm", "Test");
  await p.click('[data-cday="1"]');
  await p.waitForTimeout(300);
  await p.click("[data-cslot]:not([disabled])");
  await p.fill("#ad", "Amir Temur 1");
  await p.click('label.op:has(input[value="payme"])');
  await p.waitForTimeout(300);
  await p.click("#co-pay");
  await p.waitForSelector("#cn");
  await p.fill("#cn", "8600123412341234");
  await p.fill("#ce", "1228");
  await p.click("#ps-go");
  await code(p, "#code2", "123456");
  await p.click("#ps-go");
  await p.waitForFunction(() => location.hash.startsWith("#/o/"), null, { timeout: 5000 });
  s = await S(p);
  const no = s.orders?.[0]?.no;
  if (!no || !s.orders[0].gift) fail(`${L}: заказ не создан или без подарка`); else ok(`${L}: заказ ${no} оплачен, подарок с открыткой`);
  // Панель: заказ первой строкой, статус до покупателя.
  const q = await page(390, 844, p.context());
  await q.goto(`${B}/${lang}panel#orders`, { waitUntil: "networkidle" });
  await q.waitForTimeout(400);
  const first = await q.$eval(".tb.ord tbody tr", (r) => r.getAttribute("data-o") + (r.classList.contains("site") ? "+site" : ""));
  if (first !== no + "+site") fail(`${L}: в панели первой строкой ${first}, ждали ${no}`);
  await q.click(".tb.ord tbody tr");
  await q.waitForSelector("#oc-next");
  await q.click("#oc-next");
  await q.waitForTimeout(300);
  s = await S(p);
  if (s.orders[0].st !== 1) fail(`${L}: смена статуса не дошла до покупателя`); else ok(`${L}: панель → покупатель: «собран»`);
  await p.reload({ waitUntil: "networkidle" });
  if ((await p.$$("#steps li.done")).length !== 1) fail(`${L}: покупатель не видит шаг «собран»`);
  // Бронь: в панели первой строкой, подтверждение видно в кабинете.
  await q.goto(`${B}/${lang}panel#tryon`, { waitUntil: "networkidle" });
  await q.waitForTimeout(300);
  const tr = await q.$eval(".tb.tr tbody tr", (r) => r.getAttribute("data-tr") + (r.classList.contains("site") ? "+site" : ""));
  if (tr !== s.bookings[0].id + "+site") fail(`${L}: бронь не первой строкой (${tr})`);
  await q.click(`[data-ok="${s.bookings[0].id}"]`);
  await q.waitForTimeout(200);
  await hash(p, "#/me?bk");
  if (!(await p.$(".pill.b-ok"))) fail(`${L}: подтверждение брони не видно в кабинете`); else ok(`${L}: бронь подтверждена в панели, видна покупателю`);
  // «Ждут размер» с сайта.
  await q.goto(`${B}/${lang}panel#restock`, { waitUntil: "networkidle" });
  if (!(await q.$(".vb li.site"))) fail(`${L}: «сообщить о размере» не пришло в панель`);
  // Закрытая распродажа после первой покупки.
  await hash(p, "#/private");
  if (!(await p.$(".priv .grid [data-card]"))) fail(`${L}: закрытая распродажа не открылась клиенту бутика`);
  // Уровни панели и роли.
  await q.goto(`${B}/${lang}panel#dash`, { waitUntil: "networkidle" });
  await q.click("#menu-b");
  await q.waitForTimeout(350);
  await q.click('[data-tier="std"]');
  await q.waitForTimeout(200);
  if (!(await q.$(".lock-v")) || !(await q.$('.nav a[href="#dash"].off'))) fail(`${L}: «Панель» не закрывает разделы Расширенной`);
  await q.click("#to-pro");
  await q.waitForTimeout(200);
  if (await q.$(".lock-v")) fail(`${L}: переключение в Расширенную не открыло раздел`); else ok(`${L}: переключатель «Панель / Расширенная»`);
  await q.click("#menu-b");
  await q.waitForTimeout(350);
  await q.selectOption("#role", "seller");
  await q.waitForTimeout(200);
  if (await q.$(".kpi") || !(await q.$(".lockline"))) fail(`${L}: продавец видит сводку денег`);
  await q.evaluate(() => { location.hash = "goods"; });
  await q.waitForTimeout(250);
  if ((await q.$$(".tb.gd th")).length !== 4) fail(`${L}: продавец видит себестоимость в товарах`);
  await q.evaluate(() => { location.hash = "orders"; });
  await q.waitForTimeout(250);
  await q.click(".tb.ord tbody tr");
  await q.waitForSelector("#oc-next");
  const txt = await q.$eval(".sd-b", (e) => e.textContent);
  if (/себест|tannarx|cost/i.test(txt)) fail(`${L}: продавец видит себестоимость в карточке заказа`); else ok(`${L}: продавец не видит себестоимость и прибыль`);
  await q.selectOption("#role", "owner");
  for (const h of ["#/", "#/c/all", "#/p/d7b220-bene", "#/cart", "#/checkout", "#/me", "#/private", "#/boutique"]) { await hash(p, h); await noScroll(p, `${L} shop${h} 390`); }
  if (p.errs.length) fail(`${L} магазин: ${p.errs.join(" | ")}`);
  if (q.errs.length) fail(`${L} панель: ${q.errs.join(" | ")}`);
  await p.context().close();
}

// Конструктор и шапка на главной.
{
  const p = await page(390, 844);
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.click("#kit-all");
  await p.click('label.pn:has(input[value="pro"])');
  await p.waitForTimeout(800);
  const sum = +(await p.$eval("#kit-sum", (e) => e.textContent)).replace(/\D/g, "");
  if (sum !== BASE.promo + PANELS.pro.price + ADDONS_SUM) fail(`конструктор: ${sum}, ждали ${BASE.promo + PANELS.pro.price + ADDONS_SUM}`); else ok(`конструктор: всё с Расширенной ${sum} $`);
  if (!/^\d\d:\d\d:\d\d$/.test(await p.$eval("#tm", (e) => e.textContent))) fail("нет отсчёта 48 часов");
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(3300);
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(400);
  if (!(await p.$eval("#top", (e) => e.classList.contains("hide")))) fail("шапка не прячется при прокрутке вниз");
  await p.waitForTimeout(3300);
  if (await p.$eval("#top", (e) => e.classList.contains("hide"))) fail("шапка не вернулась через 3 секунды");
  await p.mouse.wheel(0, -300);
  await p.waitForTimeout(400);
  if (!(await p.$eval("#top", (e) => e.classList.contains("hide")))) fail("шапка не прячется при прокрутке вверх"); else ok("шапка: прячется при любой прокрутке, возвращается через 3 с");
  // Шапка магазина — по тому же правилу.
  await p.goto(`${B}/shop#/c/all`, { waitUntil: "networkidle" });
  await p.mouse.wheel(0, 700);
  await p.waitForTimeout(400);
  if (!(await p.$eval("#top", (e) => e.classList.contains("hide")))) fail("шапка магазина не прячется");
  await p.waitForTimeout(3300);
  if (await p.$eval("#top", (e) => e.classList.contains("hide"))) fail("шапка магазина не вернулась через 3 секунды");
  await p.context().close();
}

// Все страницы и разделы на трёх ширинах.
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  for (const lang of ["", "uz/", "en/"]) {
    const p = await page(w, h);
    await p.goto(`${B}/${lang}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    await noScroll(p, `${lang}site ${w}`);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
    await p.waitForTimeout(400);
    await noScroll(p, `${lang}site ${w} после прокрутки`);
    await p.goto(`${B}/${lang}panel`, { waitUntil: "networkidle" });
    for (const t of ["dash", "orders", "tryon", "goods", "clients", "gifts", "returns", "team", "traffic", "vip", "private", "restock", "sellers"]) {
      await p.evaluate((x) => { location.hash = x; }, "#" + t);
      await p.waitForTimeout(200);
      await noScroll(p, `${lang}panel#${t} ${w}`);
    }
    await p.goto(`${B}/${lang}shop#/`, { waitUntil: "networkidle" });
    for (const t of ["#/", "#/c/w", "#/c/bag", "#/p/b6e905-4060", "#/p/u6b010-0000", "#/cart", "#/me", "#/private", "#/boutique"]) { await p.evaluate((x) => { location.hash = x; }, t); await p.waitForTimeout(300); await noScroll(p, `${lang}shop${t} ${w}`); }
    if (p.errs.length) fail(`${lang} ${w}: ${p.errs.join(" | ")}`);
    await p.context().close();
  }
}
await b.close();
console.log(bad ? `\nНе прошло: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
