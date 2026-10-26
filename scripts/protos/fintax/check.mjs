// Проверка макета FinTax в Chromium. Сервер: node serve.mjs (порт 4832).
//   node scripts/protos/fintax/check.mjs
// 1) все страницы ru, uz, en на 390, 768, 1440: без ошибок, без прокрутки
//    вбок, шапка прячется при прокрутке и возвращается через 3 с;
// 2) «хаос → порядок»: документы разложены по папкам, когда секцию
//    пролистали; подбор тарифа считает по пределам сайта;
// 3) весь путь на каждой ширине: подбор → заявка с тарифом → в панели
//    первой строкой → статус «Клиент» → «Мои заявки» на сайте и клиент в
//    «Клиентах на обслуживании»; цена тарифа из панели → на сайте;
// 4) роли: менеджер не видит выручку и не правит тарифы; схема и стол
//    отвечают на нажатие; версия без движения стоит целой.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const BASE = "http://localhost:4832/proto/" + "A".repeat(43);
const PAGES = ["", "services", "prices", "about", "contacts", "panel"];
const LANGS = ["", "uz/", "en/"];
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } };
const b = await chromium.launch();

for (const w of [390, 768, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  for (const l of LANGS) for (const p of PAGES) {
    const path = (l + p).replace(/\/$/, "");
    await pg.goto(`${BASE}/${path}`, { waitUntil: "load" });
    await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
    const sx = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(sx <= 0, `${w} /${path}: прокрутка вбок ${sx}px`);
  }
  ok(!errs.length, `${w}: ошибки ${errs.join(" | ")}`);

  // Шапка: прокрутили — спряталась, через 3 с вернулась.
  await pg.goto(`${BASE}/about`, { waitUntil: "load" });
  await pg.mouse.wheel(0, 800); await pg.waitForTimeout(400);
  ok(await pg.$eval("#top", (e) => e.classList.contains("hide")), `${w}: шапка не прячется`);
  await pg.waitForTimeout(3300);
  ok(!(await pg.$eval("#top", (e) => e.classList.contains("hide"))), `${w}: шапка не вернулась через 3 с`);

  // Хаос → порядок: до секции — беспорядок, пролистали — по папкам.
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  const at = await pg.$eval("#order", (e) => [e.offsetTop, e.offsetHeight]);
  await pg.evaluate((y) => scrollTo(0, y), at[0]); await pg.waitForTimeout(300);
  ok(!(await pg.$eval("#order", (e) => e.classList.contains("done"))), `${w}: порядок раньше прокрутки`);
  await pg.evaluate((y) => scrollTo(0, y), at[0] + at[1] - 900); await pg.waitForTimeout(400);
  ok(await pg.$eval("#order", (e) => e.classList.contains("done")), `${w}: документы не разложились`);
  const rot = await pg.$$eval("#order .doc", (ds) => ds.map((d) => d.style.transform.match(/rotate\((-?[\d.]+)deg/)?.[1]).map(Number).filter((x) => Math.abs(x) > 2).length);
  ok(rot === 0, `${w}: документы в папках стоят криво (${rot})`);

  // Подбор: 100 документов → «Крупный бизнес», ВЭД при малом объёме → «Средний».
  await pg.locator("#picker").scrollIntoViewIfNeeded();
  await pg.$eval('#picker input[name="docs"]', (r) => { r.value = "100"; r.dispatchEvent(new Event("input", { bubbles: true })); });
  ok((await pg.textContent("#picker .pk-name")) === "Крупный бизнес", `${w}: 100 документов — не «Крупный бизнес»`);
  await pg.$eval('#picker input[name="docs"]', (r) => { r.value = "20"; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await pg.$eval('#picker input[name="staff"]', (r) => { r.value = "2"; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await pg.click('#picker [data-q="tax"] [data-v="usn"]'); await pg.click('#picker [data-q="turn"] [data-v="0"]');
  ok((await pg.textContent("#picker .pk-name")) === "Предприниматель", `${w}: малый ИП — не «Предприниматель»`);
  await pg.click('#picker [data-q="ved"]');
  ok((await pg.textContent("#picker .pk-name")) === "Средний бизнес", `${w}: ВЭД — не «Средний бизнес»`);
  ok(/t\.me\/fintax_admin\?text=.*%D0%A1%D1%80%D0%B5%D0%B4%D0%BD%D0%B8%D0%B9/.test(await pg.getAttribute("#picker [data-pk-tg]", "href")), `${w}: в Telegram не уходит подобранный тариф`);

  // Схема: нажатие на узел показывает услугу.
  await pg.locator("#scheme").scrollIntoViewIfNeeded();
  await pg.locator('#scheme .sch-list button[data-n="6"]').click();
  ok((await pg.textContent("#scheme .sch-card h3")) === "Срочная сдача отчётности", `${w}: схема не показала услугу`);

  // Стол: две заботы → две карточки ответа.
  await pg.locator("#desk").scrollIntoViewIfNeeded();
  for (const i of [1, 2, 4, 5, 6]) await pg.click(`#desk [data-w="${i}"]`);
  await pg.click("#desk [data-hand]"); await pg.waitForTimeout(1600);
  ok((await pg.$$("#desk .ans")).length === 2, `${w}: стол не передал две заботы`);

  // Путь: заявка с тарифом → панель → «Клиент» → сайт.
  await pg.goto(`${BASE}/contacts`, { waitUntil: "load" });
  ok(await pg.isVisible("#form [data-pick-in]"), `${w}: тариф из подбора не виден в форме`);
  await pg.locator("#form button[type=submit]").click();
  ok(await pg.$eval("#form .fl.bad", () => true).catch(() => false), `${w}: пустая форма ушла без проверки`);
  await pg.fill('#form [name="name"]', "Дилшод"); await pg.fill('#form [name="phone"]', "+998 90 123 45 67");
  await pg.fill('#form [name="msg"]', "Нужно восстановить учёт"); await pg.check('#form [name="agree"]');
  await pg.locator("#form button[type=submit]").click();
  await pg.waitForSelector("#form .sent:not([hidden])");
  const no = (await pg.textContent("#form [data-no]")).trim();
  ok(/^FT-/.test(no), `${w}: нет номера заявки`);
  ok(/t\.me\/fintax_admin\?text=/.test(await pg.getAttribute('#form [data-send="tg"]', "href")), `${w}: заявка не уходит в Telegram с текстом`);
  ok(/wa\.me\/998978900770\?text=/.test(await pg.getAttribute('#form [data-send="wa"]', "href")), `${w}: заявка не уходит в WhatsApp с текстом`);
  ok(await pg.isVisible("#track .tr"), `${w}: нет «Мои заявки»`);

  await pg.goto(`${BASE}/panel#leads`, { waitUntil: "load" });
  const first = await pg.$eval("#pv tbody tr", (r) => [r.getAttribute("data-id"), r.className]);
  ok(first[0] === no && /live/.test(first[1]), `${w}: заявка не первой строкой в панели`);
  ok(/Средний бизнес/.test(await pg.textContent("#pv tbody tr")), `${w}: в панели нет тарифа из подбора`);
  await pg.click("#pv tbody tr");
  ok(/Из подбора тарифа/.test(await pg.textContent("#mdl")), `${w}: в карточке нет ответов подбора`);
  await pg.click('#mdl [data-st="client"]'); await pg.click("#mdl [data-x]");
  await pg.goto(`${BASE}/panel#clients`, { waitUntil: "load" });
  ok(/Дилшод/.test(await pg.textContent("#pv tbody tr")), `${w}: клиент не появился в «Клиентах на обслуживании»`);
  await pg.goto(`${BASE}/contacts`, { waitUntil: "load" });
  ok(/Вы наш клиент/.test(await pg.textContent("#track")), `${w}: статус из панели не виден на сайте`);

  // Цена тарифа из панели → на сайте.
  await pg.goto(`${BASE}/panel#tariffs`, { waitUntil: "load" });
  await pg.fill('form[data-tf="ip"] input', "от 1,5 млн сум/мес"); await pg.click('form[data-tf="ip"] button[type=submit]');
  await pg.goto(`${BASE}/prices`, { waitUntil: "load" });
  ok((await pg.textContent('[data-price="ip"]')).trim() === "от 1,5 млн сум/мес", `${w}: цена из панели не дошла до сайта`);

  // Роли: менеджер без денег и без правки тарифов.
  await pg.goto(`${BASE}/panel#dash`, { waitUntil: "load" });
  ok(/Выручка в месяц/.test(await pg.textContent("#pv")), `${w}: владелец не видит выручку`);
  await pg.selectOption("#role", "manager");
  ok(!/Выручка в месяц/.test(await pg.textContent("#pv")), `${w}: менеджер видит выручку`);
  await pg.goto(`${BASE}/panel#tariffs`, { waitUntil: "load" });
  ok(await pg.$eval('form[data-tf="ip"] input', (i) => i.disabled), `${w}: менеджер правит тарифы`);
  await pg.goto(`${BASE}/panel#clients`, { waitUntil: "load" });
  ok(!/млн сум/.test(await pg.textContent("#pv table")), `${w}: менеджер видит суммы клиентов`);
  await pg.selectOption("#role", "owner");
  await ctx.close();
}

// Без движения: всё стоит на месте и видно сразу.
const rm = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const rp = await rm.newPage();
await rp.goto(`${BASE}/`, { waitUntil: "load" });
ok(await rp.$eval("#order", (e) => e.classList.contains("done")), "без движения: документы не разложены сразу");
ok(await rp.$eval("#desk .mv", (e) => getComputedStyle(e).opacity === "1"), "без движения: блок спрятан");
await rm.close();

await b.close();
console.log(bad ? `не прошло: ${bad}` : "check: всё прошло");
process.exit(bad ? 1 : 0);
