// Проверка в Chromium: node serve.mjs, затем node check.mjs
// Магазин на 390×844: покупка картой с кодом, по QR через СБП, счёт
// организации по ИНН, оплата счёта из панели доходит до покупателя, статус
// до «Получен» с документами, запрос КП → ответ из панели → «Принять» →
// счёт. Все страницы на 360, 390, 428, 768 и 1440: без ошибок в консоли и
// без горизонтальной прокрутки, конструктор считает, отсчёт идёт, сканер
// доходит до конца.
import { chromium } from "playwright-core";
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
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
  await p.addInitScript(() => { try { sessionStorage.setItem("mk-intro", "1"); } catch {} });
  return p;
}
async function noScroll(p, label) {
  // Ищем любой блок, который вылез за экран и не сидит внутри своей
  // прокрутки (лента, таблица в карточке). Ширина — из viewportSize.
  const out = await p.evaluate((W) => {
    const bad = [];
    const scroller = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true; } return false; };
    for (const el of document.querySelectorAll("body *")) {
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= W + 1 || r.left >= W) continue;
      if (getComputedStyle(el).visibility === "hidden" || scroller(el)) continue;
      bad.push((el.id ? "#" + el.id : el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]) + ":" + Math.round(r.right) + "«" + (el.textContent || "").trim().slice(0, 40) + "»");
      if (bad.length > 4) break;
    }
    return [document.documentElement.scrollWidth, W, bad];
  }, p.viewportSize().width);
  if (out[0] > out[1] + 1) fail(`${label}: горизонтальная прокрутка ${out[0]} > ${out[1]}`);
  if (out[2].length) fail(`${label}: вылезло за экран ${out[2].join(", ")}`);
}
const S = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("mk-demo-1") || "{}"));
const hash = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(450); };
async function code(p, sel, digits) { const ins = await p.$$(sel + " input"); for (let i = 0; i < ins.length; i++) await ins[i].fill(String(digits[i] ?? 1)); }
async function fillBuyer(p) { await p.fill("#nm", "Анна"); await p.fill("#ph", "9001234567"); await p.fill("#em", "a@clinic.ru"); const ad = await p.$("#ad"); if (ad) await ad.fill("Москва, Профсоюзная, 10"); }

{
  const p = await page(390, 844);
  await p.goto(`${B}/shop#/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  // Главная → в корзину с ленты, карточка HR-501 → в корзину, галерея листается.
  await p.click(".rail [data-add]");
  await hash(p, "#/p/hr501");
  await p.click("#pd-buy [data-add]");
  let s = await S(p);
  if (s.cart?.length !== 2) fail(`в корзине ${s.cart?.length} товаров, ждали 2`);
  if (!(await p.$(".cmpx li"))) fail("у HR-501 нет цен других продавцов");
  await p.evaluate(() => { const g = document.querySelector("#gal"); g.scrollLeft = g.clientWidth; });
  await p.waitForTimeout(300);
  if (!(await p.$(".gal-dots i:nth-child(2).on"))) fail("точки галереи не следуют за свайпом");
  // Фильтры шторкой: «по запросу» оставляет только товары без цены.
  await hash(p, "#/c/all");
  await p.click("#f-open");
  await p.waitForSelector("#sheet.on");
  await p.click('label.fchip:has(input[name=fp][value=ask])');
  await p.click("#f-go");
  await p.waitForTimeout(300);
  const asks = await p.$$eval("#cat-grid [data-card] .pc-price", (x) => x.map((e) => e.classList.contains("ask")));
  if (!asks.length || asks.some((a) => !a)) fail(`фильтр «по запросу» дал ${asks.length} карточек, не все без цены`);
  // Поиск понимает «АНД».
  await hash(p, "#/");
  await p.click(".srch");
  await p.fill("#sq", "анд");
  await p.waitForTimeout(200);
  if (!(await p.$(".sq-p"))) fail("поиск «анд» без подсказок");
  await p.click("#sq-x");
  // Частное лицо: оплата картой с кодом.
  await hash(p, "#/cart");
  await p.selectOption("#city", "Казань");
  await p.waitForTimeout(400);
  if (!(await p.$eval("#sm-sh", (e) => /\d/.test(e.textContent) && e.textContent !== "0 ₽"))) fail("доставка в Казань не посчиталась");
  await hash(p, "#/checkout");
  await fillBuyer(p);
  await p.click("#co-go2");
  await p.waitForSelector("#cn");
  await p.fill("#cn", "2200123412341234");
  await p.fill("#ce", "1228");
  await p.click("#ps-go");
  await code(p, "#code", "1234");
  await p.click("#ps-go");
  await p.waitForFunction(() => location.hash.startsWith("#/order/"), null, { timeout: 5000 });
  s = await S(p);
  if (!s.orders?.[0]?.paid) fail("оплата картой не прошла"); else ok(`картой: заказ ${s.orders[0].no} оплачен`);
  // СБП.
  await hash(p, "#/p/tbandk");
  await p.click("#pd-buy [data-add]");
  await hash(p, "#/checkout");
  await fillBuyer(p);
  await p.click('label.pay:has(input[value="sbp"])');
  await p.click("#co-go2");
  await p.waitForSelector(".qr svg");
  await p.click("#sbp-ok");
  await p.waitForFunction(() => location.hash.startsWith("#/order/"), null, { timeout: 5000 });
  if (!(await S(p)).orders[0].paid) fail("оплата по QR не прошла"); else ok("СБП: оплачено по QR");
  // Организация: счёт по ИНН.
  await hash(p, "#/p/aedbox");
  await p.click("[data-inv]");
  await p.waitForSelector("#inn");
  await p.click('[data-inn="7700000027"]');
  if (!(await p.$("#org .org"))) fail("реквизиты по ИНН не подставились");
  await fillBuyer(p);
  await p.click("#co-go2");
  await p.waitForFunction(() => location.hash.startsWith("#/invoice/"), null, { timeout: 5000 });
  s = await S(p);
  const no = s.orders[0].no;
  if (!s.orders[0].inv || s.orders[0].org?.inn !== "7700000027") fail("счёт не выставлен на организацию"); else ok(`счёт ${s.orders[0].inv} на ИНН 7700000027`);
  // Панель видит заказ первой строкой, «Оплата поступила» доходит до покупателя.
  const q = await p.context().newPage();
  q.errs = [];
  q.on("pageerror", (e) => q.errs.push(String(e)));
  await q.goto(`${B}/panel#orders`, { waitUntil: "networkidle" });
  await q.waitForTimeout(400);
  const first = await q.$eval(".tb.ord tbody tr", (r) => r.getAttribute("data-o") + (r.classList.contains("site") ? "+site" : ""));
  if (first !== no + "+site") fail(`в панели первой строкой ${first}, ждали ${no}`);
  await q.goto(`${B}/panel#invoices`, { waitUntil: "networkidle" });
  await q.click(`[data-pay="${no}"]`);
  await q.waitForTimeout(300);
  s = await S(p);
  if (!(s.orders[0].paid && s.orders[0].st === 1)) fail("оплата из панели не дошла до покупателя"); else ok("панель → покупатель: счёт оплачен");
  // Статус до «Получен», документы в заказе.
  await p.goto(`${B}/shop#/order/${no}`, { waitUntil: "networkidle" });
  for (let i = 0; i < 3; i++) { await p.click("#nx"); await p.waitForTimeout(250); }
  const docs = await p.$$eval("[data-odoc]", (x) => x.map((e) => e.getAttribute("data-odoc")));
  for (const d of ["inv", "upd", "war"]) if (!docs.includes(d)) fail(`в заказе нет документа ${d}`);
  if ((await S(p)).orders[0].st !== 4) fail("заказ не дошёл до «Получен»"); else ok("заказ получен, документы: " + docs.join(", "));
  await p.click('[data-odoc="upd"]');
  await p.waitForSelector("#sheet.on .paper");
  await p.click("#sheet [data-close]");
  // КП: микроскоп без цены → запрос → ответ из панели → «Принять» → счёт.
  await hash(p, "#/p/voms");
  await p.click("#pd-buy [data-kp]");
  await hash(p, "#/kp");
  await p.click('[data-kinn="7700000010"]');
  await p.fill("#kem", "z@college.ru");
  await p.click("#k-go");
  await p.waitForFunction(() => location.hash.startsWith("#/k/"), null, { timeout: 5000 });
  const kno = (await S(p)).kps[0].no;
  await q.goto(`${B}/panel#kp/${encodeURIComponent(kno)}`, { waitUntil: "networkidle" });
  await q.waitForSelector("#kp-send");
  await q.fill('[data-ki="0"]', "1250000");
  await q.selectOption("#kp-d", "5");
  await q.click("#kp-send");
  await q.waitForTimeout(300);
  s = await S(p);
  if (s.kps[0].st !== "sent" || s.kps[0].items[0].price !== 1187500) fail(`ответ на КП не дошёл: ${JSON.stringify(s.kps[0])}`); else ok("КП: ответ из панели со скидкой 5 % у покупателя");
  await p.reload({ waitUntil: "networkidle" });
  await p.click("#k-acc");
  await p.waitForFunction(() => location.hash.startsWith("#/invoice/"), null, { timeout: 5000 });
  s = await S(p);
  if (s.kps[0].st !== "accepted" || s.orders[0].sum !== 1187500) fail("принятое КП не стало счётом"); else ok(`КП принято, счёт ${s.orders[0].inv}`);
  for (const h of ["#/", "#/c/all", "#/p/hr501", "#/p/voms", "#/cart", "#/checkout", "#/orders", `#/order/${no}`, `#/invoice/${no}`, "#/kp", "#/kps", `#/k/${encodeURIComponent(kno)}`, "#/me", "#/docs", "#/fav"]) { await hash(p, h); await noScroll(p, `shop${h} 390`); }
  for (const t of ["dash", "orders", "kp", "invoices", "clients", "goods", "log"]) { await q.evaluate((x) => { location.hash = x; }, "#" + t); await q.waitForTimeout(250); await noScroll(q, `panel#${t} 390`); }
  await q.evaluate(() => { location.hash = "#kp"; });
  await q.waitForTimeout(250);
  await q.click(".tb tbody tr");
  await q.waitForTimeout(400);
  await noScroll(q, "panel КП в карточке 390");
  if (p.errs.length) fail(`магазин: ${p.errs.join(" | ")}`);
  if (q.errs.length) fail(`панель: ${q.errs.join(" | ")}`);
  await p.context().close();
}

// Все страницы на пяти ширинах.
for (const [w, h] of [[360, 780], [390, 844], [428, 926], [768, 1024], [1440, 900]]) {
  const p = await page(w, h);
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await noScroll(p, `site ${w}`);
  await p.click("#kit-all");
  await p.waitForTimeout(700);
  const sum = await p.$eval("#kit-sum", (e) => e.textContent);
  if (!/\d/.test(sum) || sum === "1 000 $") fail(`site ${w}: конструктор не считает (${sum})`);
  if (!/^\d\d:\d\d:\d\d$/.test(await p.$eval("#tm", (e) => e.textContent))) fail(`site ${w}: нет отсчёта`);
  await p.click('[data-inn="7700000034"]');
  if (!(await p.$("#inn-doc.on"))) fail(`site ${w}: счёт по ИНН не собрался`);
  await p.evaluate(() => { const b = document.getElementById("sc-box"); scrollTo(0, scrollY + b.getBoundingClientRect().bottom); });
  await p.waitForTimeout(400);
  const pr = await p.$eval("#sc-box", (e) => +getComputedStyle(e).getPropertyValue("--p"));
  if (!(pr > 0.6)) fail(`site ${w}: сканер не идёт за прокруткой (${pr})`);
  await noScroll(p, `site ${w} после прокрутки`);
  await p.goto(`${B}/panel`, { waitUntil: "networkidle" });
  for (const t of ["dash", "orders", "kp", "invoices", "clients", "goods", "log"]) {
    await p.evaluate((x) => { location.hash = x; }, "#" + t);
    await p.waitForTimeout(250);
    await noScroll(p, `panel#${t} ${w}`);
  }
  await p.goto(`${B}/shop#/`, { waitUntil: "networkidle" });
  for (const t of ["#/", "#/c/all", "#/c/anat", "#/p/dcs103", "#/p/z21", "#/cart", "#/kp", "#/me"]) { await p.evaluate((x) => { location.hash = x; }, t); await p.waitForTimeout(300); await noScroll(p, `shop${t} ${w}`); }
  if (p.errs.length) fail(`${w}: ${p.errs.join(" | ")}`);
  await p.context().close();
}
// Заставка: проходит сама и открывает первый экран.
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(8500);
  if (await p.$("#intro")) fail("заставка не закрылась за 8,5 с");
  if (!(await p.$("#hero.hero-on"))) fail("после заставки первый экран не открыт");
  if (errs.length) fail(`заставка: ${errs.join(" | ")}`); else ok("заставка: пульс, знак, разряд, первый экран");
  await ctx.close();
}
await b.close();
console.log(bad ? `\nНе прошло: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
