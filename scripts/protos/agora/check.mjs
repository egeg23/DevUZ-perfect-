// Проверка макета Agora в Chromium: node check.mjs (сервер serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; шапка по правилу 3 с;
// на каждой ширине весь круг: бронь на сайте → вход в панель кодом 1234 →
// бронь первой строкой → «Подтвердить» → «Моя бронь» на сайте «Подтверждена»;
// заказ из меню → панель → «Принять»; стоп-лист → блюдо «Сегодня нет» на сайте;
// бот «Позвать человека» → панель «Бот и зал»; роль администратора без выручки;
// выгрузка CSV кнопкой; тумблер допа; «меньше движения».
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";
let chromium;
try { ({ chromium } = await import("playwright")); } catch { ({ chromium } = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json")("playwright")); }

const B = "http://localhost:4870/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); });

for (const w of [390, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, acceptDownloads: true });
  await c.addInitScript(() => { window.open = () => null; });
  const p = await c.newPage(); watch(p);
  for (const path of ["", "site", "panel", "uz", "uz/site", "uz/panel"]) {
    await p.goto(`${B}/${path}`, { waitUntil: "load" }); await skip(p);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 25)); } scrollTo(0, 0); });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.equal(ov, 0, `${w} /${path}: прокрутка вбок ${ov}px`);
  }

  /* Шапка: прокрутка — прячется, 3 с тишины — возвращается. */
  await p.goto(`${B}/site`, { waitUntil: "load" });
  await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(400);
  assert.ok(await p.evaluate(() => document.querySelector(".top").classList.contains("hide")), `${w}: шапка не спряталась`);
  await p.waitForTimeout(3200);
  assert.ok(!(await p.evaluate(() => document.querySelector(".top").classList.contains("hide"))), `${w}: шапка не вернулась через 3 с`);

  /* Бронь на сайте. */
  await p.evaluate(() => document.getElementById("book").scrollIntoView());
  await p.click("#bk-days button:nth-child(2)");
  await p.click('#bk-times [data-time="20:00"]');
  await p.click("#bk-p"); await p.click("#bk-p");
  await p.fill("#bk-name", "Тест"); await p.fill("#bk-ph", "+998 90 123 45 67");
  await p.click('#bk-form [type="submit"]');
  await p.waitForSelector("#sheet.on");
  assert.match(await p.textContent("#shb"), /Новая/, `${w}: «Моя бронь» без статуса`);
  const bookId = await p.evaluate(() => JSON.parse(localStorage.getItem("ag-book-1"))[0].id);
  await p.click("#sheet .x");

  /* Заказ: блюдо из меню в корзину. */
  await p.evaluate(() => document.getElementById("menu").scrollIntoView());
  await p.click('#mn-grid [data-dish]');
  await p.click("#dadd");
  await p.waitForSelector("#cart.on");
  await p.click("#cart");
  await p.fill("#on", "Тест"); await p.fill("#op", "+998 90 123 45 67");
  await p.click("#osend");
  const ordId = await p.evaluate(() => JSON.parse(localStorage.getItem("ag-ord-1"))[0].id);
  await p.click("#sheet .x");

  /* Бот: «Позвать человека» падает в панель. */
  await p.evaluate(() => document.getElementById("bot").scrollIntoView());
  await p.click('#scn [data-s="human"]');
  await p.waitForFunction(() => (JSON.parse(localStorage.getItem("ag-bot-1") || "[]")).length > 0, null, { timeout: 15000 });

  /* Панель: вход, код 1234, роль владельца. */
  const q = await c.newPage(); watch(q);
  await q.goto(`${B}/panel`, { waitUntil: "load" });
  await q.click('[data-sw="b"]'); await q.waitForTimeout(700);
  await q.click("#lg-tg");
  await q.fill("#otp", "1111"); await q.waitForTimeout(600);
  assert.equal(await q.inputValue("#otp"), "", `${w}: неверный код не очистился`);
  await q.fill("#otp", "1234");
  await q.waitForSelector('[data-r="own"]');
  await q.click('[data-r="own"]');
  await q.waitForSelector(".kpis");
  assert.match(await q.textContent(".kpi.main"), /млн/, `${w}: владелец не видит выручку`);
  /* Бронь первой строкой → подтвердить. */
  await q.click('[data-tab="book"]');
  assert.match(await q.textContent(".tbl tbody tr:first-child"), new RegExp(String(bookId)), `${w}: бронь с сайта не первой строкой`);
  await q.click(`[data-bk="${bookId}"][data-s="1"]`);
  /* Заказ → принять. */
  await q.click('[data-tab="ord"]');
  assert.match(await q.textContent(".ordc"), new RegExp(String(ordId)), `${w}: заказа с сайта нет первым`);
  await q.click(`[data-or="${ordId}"]`);
  /* Бот: ждёт ответа. */
  await q.click('[data-tab="bot"]');
  assert.match(await q.textContent(".inc"), /25/, `${w}: обращения из бота нет`);
  /* Стоп-лист: первое блюдо меню. */
  await q.click('[data-tab="menu"]');
  const stopId = await q.evaluate(() => document.querySelector("[data-stop]").getAttribute("data-stop"));
  await q.click(`[data-stop="${stopId}"]`);
  /* Выгрузка CSV кнопкой: настоящий файл. */
  await q.click('[data-tab="book"]');
  const [dl] = await Promise.all([q.waitForEvent("download"), q.click('.dot-btn[data-dl="book"]')]);
  assert.match(dl.suggestedFilename(), /\.csv$/);
  /* Роль администратора: выручка скрыта. */
  await q.click("#role");
  await q.click('[data-tab="sum"]');
  assert.doesNotMatch(await q.textContent(".kpi.main"), /млн/, `${w}: администратор видит выручку`);
  await q.click('[data-tab="log"]');
  assert.match(await q.textContent(".tbl tbody"), /Подтверждена/, `${w}: в истории нет действия`);

  /* Обратно на сайт: статус брони и стоп-лист. */
  await p.bringToFront();
  await p.reload({ waitUntil: "load" });
  await p.click("#mine");
  assert.match(await p.textContent("#shb"), /Подтверждена/, `${w}: статус из панели не виден на сайте`);
  assert.match(await p.textContent("#shb"), /Принят/, `${w}: статус заказа не виден на сайте`);
  await p.click("#sheet .x");
  assert.ok(await p.evaluate((id) => document.querySelector(`[data-dish="${id}"]`).classList.contains("off"), stopId), `${w}: стоп-лист не дошёл до сайта`);
  await q.close();

  /* Тумблер допа: бот выключен — блока нет. */
  await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
  await p.evaluate(() => { const x = document.querySelector('[data-add="tgbot"]'); x.checked = false; x.dispatchEvent(new Event("change")); });
  assert.match(await p.textContent("#total"), /2\s450/, `${w}: итог без бота не 2 450 $`);
  await p.goto(`${B}/site`, { waitUntil: "load" });
  assert.ok(await p.evaluate(() => document.getElementById("bot").hidden), `${w}: блок бота не спрятался`);
  await c.close();
}

/* Без движения: залёт сразу в конце, сцены стоят, ошибок нет. */
const r = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const rp = await r.newPage(); watch(rp);
await rp.goto(`${B}/`, { waitUntil: "load" });
assert.equal(await rp.evaluate(() => getComputedStyle(document.querySelector(".fl-tx")).opacity), "1", "без движения: текст залёта не виден");
await rp.goto(`${B}/site`, { waitUntil: "load" });
assert.equal(await rp.evaluate(() => getComputedStyle(document.querySelector(".sc-card")).opacity), "1", "без движения: карточка сцены не видна");
await r.close();

await b.close();
assert.deepEqual(errs, [], "ошибки в консоли:\n" + errs.join("\n"));
console.log("Agora: всё сошлось");
