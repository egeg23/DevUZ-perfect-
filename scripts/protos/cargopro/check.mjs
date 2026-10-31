// Проверка макета CARGO PRO GROUP в Chromium: node check.mjs (serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; конструктор
// тарифов считает по платному весу и контейнерам, валюты; заявка → панель →
// «В пути» → «Мои заявки» и отслеживание на сайте; демо-номер; документы;
// тумблер конструктора убирает блок допа; роль менеджера; «меньше движения».
// Диспетчерская: «Распределить» → полосы загрузки, ручной перенос в чужой
// кузов горит красным, карточка водителя, статус рейса → сайт, роль
// руководителя показывает маржу, тумблер модуля прячет выбор. Сборные грузы:
// рейс по весу, объёму и типу, оптимальный маршрут короче порядка заявок,
// ручной порядок длиннее, попутный забор, модуль только с диспетчерской.
// Супер-админка: сравнение двух админок на первой странице и в обычной,
// госномер с ошибкой и без, новая машина в распределении, водитель с
// истекающей медсправкой, пакет для брокера (чего нет, потом готов),
// журнал обмена 1С, Битрикс24, Telegram после смены статуса, допы рейса.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import assert from "node:assert/strict";
import { ALL, ALL_TMS, ALL_MODULES } from "./plan.mjs";
/* Итоги — из плана: клиентский раздел 470 $ (владелец, 31.10.2026). */
const sum = (n) => new RegExp(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "));

const B = "http://localhost:4853/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });

for (const w of [390, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 860 } });
  const p = await c.newPage(); watch(p);
  for (const path of ["", "site", "panel", "cabinet", "cabinet#map", "cabinet#tg", "dispatch", "dispatch#map", "dispatch#trips", "dispatch#drivers", "dispatch#route", "dispatch#fleet", "dispatch#int", "uz", "uz/site", "uz/panel", "uz/cabinet", "uz/cabinet#map", "uz/dispatch", "uz/dispatch#map", "uz/dispatch#route", "uz/dispatch#fleet", "uz/dispatch#int"]) {
    await p.goto(`${B}/${path}`, { waitUntil: "load" }); await skip(p);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.equal(ov, 0, `${w} ${path}: прокрутка вбок ${ov}px`);
  }
  await c.close();
}

const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage(); watch(p);
await p.goto(`${B}/site`, { waitUntil: "load" });
/* Авиа из Китая: 250 кг и 1,2 м³ → платный вес 250 кг × 9,8 $ = 2 450 $. */
assert.match(await p.textContent("#tsum"), /2 450 \$/);
/* Объём 3 м³ → 501 кг по объёму. */
await p.evaluate(() => { const m = document.getElementById("m3"); m.value = "3"; m.dispatchEvent(new Event("input")); });
assert.match(await p.textContent("#cw"), /501/);
/* Турция: ж/д нет, кнопка выключена. */
await p.click('[data-dir="tr"]');
assert.ok(await p.$eval('#modes [data-m="rail"]', (e) => e.disabled), "ж/д из Турции не выключена");
/* Китай, ж/д, 2 контейнера 40′ = 10 200 $. */
await p.click('[data-dir="cn"]'); await p.click('#modes [data-m="rail"]');
await p.fill("#cn", "2"); await p.dispatchEvent("#cn", "input");
assert.match(await p.textContent("#tsum"), /10 200 \$/);
/* Сумы. */
await p.click('[data-cur="UZS"]');
assert.match(await p.textContent("#ttot"), /сум/);
/* Быстрый расчёт на первом экране. */
await p.evaluate(() => scrollTo(0, 0));
await p.selectOption("#qdir", "ae"); await p.fill("#qkg", "100"); await p.click('#qc [type="submit"]');
assert.ok(await p.$eval('[data-dir="ae"]', (e) => e.getAttribute("aria-pressed") === "true"), "быстрый расчёт не выбрал ОАЭ");
/* Заявка → панель. */
await p.click("#send"); await p.fill("#rn", "Тест"); await p.fill("#rp", "+998 90 123 45 67"); await p.click("#rgo");
await p.waitForSelector(".okk");
assert.ok(await p.$eval(".sheet .bf a", (a) => a.href.startsWith("mailto:info@cargoprogroup.com")), "нет письма им с готовым текстом");
const id = await p.evaluate(() => JSON.parse(localStorage.getItem("cp-req-1"))[0].id);
const q = await c.newPage(); watch(q);
await q.goto(`${B}/panel#reqs`, { waitUntil: "load" });
assert.match(await q.textContent(".pn-t tbody tr:first-child"), new RegExp(id));
await q.click(".pn-t tbody tr:first-child");
await q.click('[data-s="3"]');
/* Сайт видит статус: «Мои заявки» и отслеживание по номеру. */
await p.goto(`${B}/site`, { waitUntil: "load" });
await p.click("#mine");
assert.match(await p.textContent(".sheet .tl li.c"), /В пути/);
await p.click(".sheet .x");
await p.fill("#trkn", id); await p.press("#trkn", "Enter");
assert.match(await p.textContent("#tl li.c"), /В пути/);
await p.click('[data-tn="CPG-24117"]');
assert.match(await p.textContent("#tl li.c"), /Таможня/);
/* Документы по виду груза. */
await p.selectOption("#dkind", "dg");
assert.match(await p.textContent("#dlist"), /MSDS/);
/* Роль менеджера прячет маржу. */
await q.goto(`${B}/panel`, { waitUntil: "load" });
await q.selectOption("#role", "manager");
assert.ok(await q.isVisible(".pn-lock"), "менеджер видит маржу");
/* Тумблер конструктора убирает блок допа на сайте. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
await p.evaluate(() => { const i = document.querySelector('[data-add="track"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
await p.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await p.$eval("#track", (e) => e.classList.contains("off")), "доп «отслеживание» не выключился");

/* Диспетчерская. */
const dp = await c.newPage(); watch(dp);
await dp.goto(`${B}/dispatch`, { waitUntil: "load" });
await dp.click("#dist");
const filled = await dp.$$eval(".dp-t", (ts) => ts.filter((x) => x.querySelector(".dp-in .dp-c")).length);
assert.ok(filled >= 8, `распределено по ${filled} машинам`);
assert.equal(await dp.$$eval(".dp-t.bad", (x) => x.length), 0, "после распределения есть перегруз");
assert.ok(await dp.isVisible(".dp-why"), "нет причины, почему груз не лёг");
/* Рефрижераторный груз в газель: не тот кузов и перегруз, красным. */
await dp.click('.dp-c[data-c="C-310"]'); await dp.click('.dp-t[data-t="T1"]');
assert.ok(await dp.$eval('.dp-t[data-t="T1"]', (e) => e.classList.contains("bad")), "перенос в чужой кузов не горит красным");
assert.match(await dp.textContent('.dp-t[data-t="T1"] .dp-err'), /не тот кузов/);
assert.match(await dp.textContent('.dp-t[data-t="T1"] .dp-err'), /перегруз/);
/* Руководитель видит ставку и маржу, диспетчер — нет. */
assert.equal(await dp.$$eval(".dp-money", (x) => x.length), 0, "диспетчер видит маржу");
await dp.selectOption("#role", "head");
assert.ok(await dp.isVisible(".dp-money"), "руководитель не видит маржу");
/* Карта: водитель движется, карточка открывается. */
await dp.goto(`${B}/dispatch#map`, { waitUntil: "load" });
const t1 = await dp.getAttribute('[data-d="0"]', "transform"); await dp.waitForTimeout(600);
assert.notEqual(await dp.getAttribute('[data-d="0"]', "transform"), t1, "водитель на карте стоит");
await dp.click(".dp-ev");
assert.ok(await dp.isVisible(".dp-kv"), "карточка водителя не открылась");
assert.ok(await dp.$eval('.dp-call a[href^="tel:"]', (a) => !!a), "нет звонка водителю");
/* Рейс: статус «Доставлен» уходит на сайт. */
await dp.goto(`${B}/dispatch#trips`, { waitUntil: "load" });
await dp.click('[data-tr="CPG-24109"][data-s="5"]');
await p.evaluate(() => localStorage.removeItem("cp-cfg-1"));
await p.goto(`${B}/site`, { waitUntil: "load" });
await p.click('[data-tn="CPG-24109"]');
assert.match(await p.textContent("#tl li.c"), /Выдан/);
/* Выбор перевозчика: по цене — сначала дешёвый. */
await dp.goto(`${B}/dispatch#drivers`, { waitUntil: "load" });
await dp.click('[data-sort="price"]');
const pr = await dp.$$eval(".dp-off .pr", (x) => x.map((e) => +e.textContent.replace(/\D/g, "")));
assert.deepEqual(pr, [...pr].sort((a, b) => a - b), "по цене не по возрастанию");
/* Сборные грузы: рейс собран по весу, объёму и типу, оптимальный маршрут короче порядка заявок. */
await dp.goto(`${B}/dispatch#route`, { waitUntil: "load" });
await dp.selectOption("#role", "disp");
await dp.click("#rbuild");
const kmOf = async (s) => +(await dp.textContent(`${s} b`)).replace(/[^\d,]/g, "").replace(",", ".");
const naive = await kmOf(".dp-sb.n"), opt = await kmOf(".dp-sb.o");
assert.ok(opt > 0 && opt < naive, `оптимальный ${opt} км не короче порядка заявок ${naive} км`);
assert.ok(+(await dp.getAttribute("#rsave", "data-km")) > 0, "нет экономии километров");
assert.match(await dp.textContent(".dp-rin"), /нельзя вместе с продуктами/);
assert.match(await dp.textContent(".dp-rin"), /рефрижератор: отдельной машиной/);
assert.equal(await dp.$$eval(".dp-cmp .dp-money", (x) => x.length), 0, "диспетчер видит деньги на топливо");
/* Ручной порядок: километры растут, «Вернуть оптимальный» возвращает. */
await dp.click('[data-dn="0"]');
const mine = await kmOf(".dp-sb.m");
assert.ok(mine > opt, `ручной порядок ${mine} км не длиннее оптимального ${opt} км`);
await dp.click("#rback");
assert.equal(await dp.$$eval(".dp-sb.m", (x) => x.length), 0, "оптимальный не вернулся");
/* Попутный забор встаёт в самое дешёвое место и добавляет километры. */
await dp.click("#radd");
assert.match(await dp.textContent("#rins"), /\+\d/);
assert.ok((await kmOf(".dp-sb.o")) > opt, "попутный забор не добавил километров");
assert.match(await dp.textContent(".dp-stops"), /S-10/);
assert.match(await dp.getAttribute("#rsend", "href"), /^https:\/\/t\.me\/share/);
await dp.selectOption("#role", "head");
assert.ok(await dp.isVisible(".dp-cmp .dp-money"), "руководитель не видит деньги на топливо");
/* Супер-админка: сравнение с обычной — на первой странице и в обычной админке. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
assert.ok((await p.$$eval("#vs .vs-r", (x) => x.length)) >= 12, "нет сравнения двух админок");
assert.ok((await p.$$eval("#vs .vs-f", (x) => x.length)) >= 6, "в сравнении нет бесплатных пунктов");
await q.goto(`${B}/panel`, { waitUntil: "load" });
assert.ok(await q.isVisible(".vs-mini"), "в обычной админке нет «Что умеет супер-админка»");
/* Автопарк: госномер с ошибкой, потом верный; машина сразу в распределении. */
await dp.goto(`${B}/dispatch#fleet`, { waitUntil: "load" });
await dp.selectOption("#role", "disp");
await dp.click("#spat");
const fill = async (k, v) => dp.fill(`#spf [name="${k}"]`, v);
await fill("pl", "01 ABC 12"); await fill("mk", "MAN TGX 18.480"); await fill("vin", "WMA06XZZ7KM812345"); await fill("yr", "2019"); await fill("t", "20"); await fill("m3", "86"); await fill("tir", "XC 12345678");
await dp.click('#spf [type="submit"]');
assert.match(await dp.textContent("#spf .sp-bad"), /01 A 123 BC/, "кривой госномер прошёл");
await fill("pl", "01 a 777 bc"); await dp.click('#spf [type="submit"]');
assert.equal(await dp.$$eval("#spf", (x) => x.length), 0, "верный госномер не сохранился");
assert.match(await dp.textContent(".sp-t"), /01 A 777 BC/);
await dp.goto(`${B}/dispatch`, { waitUntil: "load" });
assert.ok(await dp.$$eval(".dp-t", (ts) => ts.some((x) => /01 A 777 BC/.test(x.textContent))), "новой машины нет в распределении");
/* Водитель с медсправкой на 10 дней: строка в «Сроках документов» жёлтая. */
await dp.goto(`${B}/dispatch#fleet`, { waitUntil: "load" });
await dp.click("#spad");
const day = (n) => { const x = new Date(Date.now() + n * 864e5); return x.toISOString().slice(0, 10); };
await dp.fill('#spf [name="lat"]', "TESTOV AZIZ"); await dp.fill('#spf [name="pass"]', "AB1234567"); await dp.fill('#spf [name="pinfl"]', "31234567890123"); await dp.fill('#spf [name="lic"]', "AF1234567");
for (const [k, n] of [["bd", -11000], ["iss", -700], ["exp", 2000], ["licx", 900], ["med", 10]]) await dp.fill(`#spf [name="${k}"]`, day(n));
await dp.click('#spf [type="submit"]');
assert.equal(await dp.$$eval("#spf", (x) => x.length), 0, "водитель не сохранился");
if (await dp.$("#spdocs")) await dp.click("#spdocs");
assert.ok(await dp.$$eval(".sp-di", (x) => x.some((e) => /TESTOV/.test(e.textContent) && e.querySelector(".warn"))), "истекающая медсправка не жёлтая");
/* Пакет для брокера: у CPG-24117 нет книжки МДП, у CPG-24109 дозаполняем и формируем. */
await dp.goto(`${B}/dispatch#trips`, { waitUntil: "load" });
await dp.click('[data-bk="CPG-24117"]');
assert.match(await dp.textContent("#bkmiss"), /МДП/);
assert.ok(await dp.$eval("#bkmake", (b) => b.disabled), "пакет формируется без данных");
await dp.click("#spmx"); await dp.click('[data-bk="CPG-24109"]');
for (let k = 0; k < 10 && (await dp.$$eval("#spm .sp-need", (x) => x.length)); k++) await dp.evaluate(() => { const e = document.querySelector("#spm .sp-need"); e.value = e.getAttribute("data-b") === "seal" ? "UZ-70481" : "1"; e.dispatchEvent(new Event("change")); });
assert.ok(await dp.isVisible("#bkok"), "после заполнения всё ещё не хватает полей");
await dp.click("#bkmake");
assert.match(await dp.textContent("#sheet"), /CMR/);
assert.match(await dp.getAttribute("#bktg", "href"), /^https:\/\/t\.me\/share/);
await dp.click("#spmx");
/* Простой: 50 часов — двое суток сверх нормы, 140 $. */
await dp.fill('[data-idle="CPG-24109"]', "50");
assert.match(await dp.textContent("#ids-CPG-24109"), /140 \$/);
/* Интеграции: смена статуса пишет в журнал обмена Битрикс24, 1С и Telegram. */
await dp.click('[data-tr="CPG-24095"][data-s="5"]');
await dp.goto(`${B}/dispatch#int`, { waitUntil: "load" });
const xl = await dp.textContent("#xlog");
assert.match(xl, /Битрикс24: сделка #24095/); assert.match(xl, /1С: созданы реализация/); assert.match(xl, /Telegram: клиенту отправлен статус/);
await dp.click('[data-itog="bx"]');
assert.match(await dp.textContent(".sp-int:nth-child(2) .sp-st"), /не подключено/);
await dp.evaluate(() => { localStorage.removeItem("cp-fleet-1"); });

/* Конструктор: сборные грузы только вместе с диспетчерской, итоги «с диспетчерской» и «со сборными». */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
assert.match(await p.textContent("#withl"), sum(ALL_MODULES));
await p.evaluate(() => { const i = document.querySelector('[data-mod="ltl"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
assert.ok(await p.$eval('[data-module="ltl"]', (e) => e.classList.contains("off")), "сборные выключены, а строка видна");
await dp.goto(`${B}/dispatch`, { waitUntil: "load" });
assert.equal(await dp.$$eval('.pn-tabs [data-v="route"]', (x) => x.length), 0, "сборные выключены, а вкладка есть");
await p.evaluate(() => { const i = document.querySelector('[data-mod="tms"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
await p.evaluate(() => { const i = document.querySelector('[data-mod="ltl"]'); i.checked = true; i.dispatchEvent(new Event("change")); });
assert.ok(await p.$eval('[data-mod="tms"]', (e) => e.checked), "сборные включены без диспетчерской");
assert.match(await p.textContent("#withl"), sum(ALL_MODULES));
await p.evaluate(() => { const i = document.querySelector('[data-mod="tms"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
assert.ok(!(await p.$eval('[data-mod="ltl"]', (e) => e.checked)), "диспетчерская выключена, а сборные нет");
await p.evaluate(() => { localStorage.removeItem("cp-cfg-1"); });

/* Тумблер модуля прячет выбор диспетчерской. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
assert.match(await p.textContent("#withm"), sum(ALL_TMS));
await p.evaluate(() => { const i = document.querySelector('[data-mod="tms"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
assert.ok(await p.$eval('.choice[data-module="tms"]', (e) => e.classList.contains("off")), "модуль выключен, а выбор виден");
assert.match(await p.textContent("#total"), sum(ALL));
await c.close();

/* Клиентский раздел (доп cab, владелец, 31.10.2026): вход через Telegram (демо), «Мои грузы»,
   статус из супер-админки → таймлайн и бот, машина едет по карте, тумблер допа прячет раздел. */
{
  const cc = await b.newContext({ viewport: { width: 390, height: 844 } });
  const cp = await cc.newPage(); watch(cp);
  await cp.goto(`${B}/cabinet`, { waitUntil: "load" });
  await cp.click("#intg"); await cp.waitForSelector("#tgok");
  assert.match(await cp.textContent("#shh"), /Telegram/);
  await cp.click("#tgok");
  assert.equal(await cp.$$eval(".cb-o", (x) => x.length), 3, "нет трёх демо-заказов");
  /* По телефону: неверный код не пускает, демо-код пускает. */
  await cp.click("#cbout"); await cp.click(".cb-ph summary"); await cp.fill("#inph", "+998 90 123 45 67"); await cp.click("#incode");
  const code = (await cp.textContent("#incc")).replace(/\D/g, "");
  await cp.fill("#inc", "0000"); await cp.click("#ingo"); assert.ok(await cp.$("#ingo"), "неверный код пустил");
  await cp.fill("#inc", code); await cp.click("#ingo"); assert.ok(await cp.$(".cb-o"), "демо-код не пустил");
  /* Заявка с сайта появляется в «Моих грузах». */
  await cp.evaluate(() => { const r = JSON.parse(localStorage.getItem("cp-req-1") || "[]"); r.unshift({ id: "CPG-24299", at: Date.now(), n: "Test", dir: "cn", m: "air", cw: 300, tot: 2940, days: "4-7", txt: "x" }); localStorage.setItem("cp-req-1", JSON.stringify(r)); });
  await cp.reload(); assert.ok(await cp.$('[data-o="CPG-24299"]'), "заявка с сайта не появилась в кабинете");
  /* Привязка к боту и статус из супер-админки. */
  await cp.goto(`${B}/cabinet#tg`); await cp.click('#cbv [data-link="CPG-24109"]');
  for (const pg of cc.pages()) if (pg !== cp) await pg.close();
  assert.match(await cp.textContent("#cbn"), /^1$/);
  const sp = await cc.newPage(); watch(sp);
  await sp.goto(`${B}/dispatch#trips`, { waitUntil: "load" }); await sp.click('[data-tr="CPG-24109"][data-s="4"]');
  await cp.waitForFunction(() => /таможне/.test(document.querySelector("#cbchat")?.textContent || ""), null, { timeout: 4000 });
  await sp.goto(`${B}/dispatch#int`); assert.match(await sp.textContent("#tgcab"), /^1$/);
  assert.match(await sp.textContent("#xlog"), /клиенту Demo15/);
  await sp.close();
  await cp.goto(`${B}/cabinet`); assert.match(await cp.textContent('[data-o="CPG-24109"] .st'), /Таможня/);
  /* Карта: машина в пути едет. */
  await cp.evaluate(() => { const P = JSON.parse(localStorage.getItem("cp-panel-1") || "{}"); P.st = P.st || {}; P.st["CPG-24109"] = 3; localStorage.setItem("cp-panel-1", JSON.stringify(P)); });
  await cp.goto(`${B}/cabinet#map`); await cp.waitForTimeout(300);
  const t1 = await cp.$eval("#cbtr", (e) => e.getAttribute("transform")); await cp.waitForTimeout(1500);
  const t2 = await cp.$eval("#cbtr", (e) => e.getAttribute("transform"));
  assert.notEqual(t1, t2, "машина на карте стоит");
  assert.ok(await cp.$('a[href^="tel:"]'), "нет кнопки звонка");
  /* Тумблер допа «Клиентский раздел» прячет ссылку на сайте и сам раздел. */
  await cp.evaluate(() => localStorage.setItem("cp-cfg-1", JSON.stringify({ cab: false })));
  await cp.goto(`${B}/site`); assert.ok(await cp.$eval('.lk[data-addon="cab"]', (e) => e.classList.contains("off")), "ссылка на кабинет видна при выключенном допе");
  await cp.goto(`${B}/cabinet`); assert.ok(await cp.$(".cb-off"), "кабинет открыт при выключенном допе");
  await cc.close();
}

/* «Меньше движения»: залёт без кадров, итоговая карточка видна, маршруты стоят. */
const r = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await r.newPage(); watch(rp);
await rp.goto(`${B}/`, { waitUntil: "load" });
assert.ok(await rp.$eval(".hs", (e) => e.classList.contains("end")), "без движения нет итоговой карточки");
await rp.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await rp.$eval(".rise", (e) => getComputedStyle(e).opacity === "1"), "без движения блок не виден");
await r.close();
await b.close();
assert.deepEqual(errs, [], "ошибки в консоли:\n" + errs.join("\n"));
console.log("ok");
