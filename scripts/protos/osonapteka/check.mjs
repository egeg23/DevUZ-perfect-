// Проверка макета Oson Apteka в Chromium: node check.mjs (сервер serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; поиск по веществу;
// окно лекарства; бронь → панель → «Собрана» → «Мои брони» на сайте; список;
// тарифы; тумблер конструктора убирает блок допа; роли; «меньше движения».
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import assert from "node:assert/strict";

const B = "http://localhost:4851/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });

for (const w of [390, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 860 } });
  const p = await c.newPage(); watch(p);
  for (const path of ["", "site", "business", "panel", "uz", "uz/site", "uz/business", "uz/panel"]) {
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
/* Поиск по действующему веществу находит Бепантен. */
await p.fill("#q", "декспант");
await p.waitForSelector("#sug.on [data-inn]");
await p.click("#sug [data-inn]");
assert.match(await p.textContent("#found"), /1/);
/* Окно лекарства: инструкция, аналоги (Изона 10 и 20 — одно вещество), аптеки, бронь. */
await p.evaluate(() => document.querySelector('[data-open="16"]').click());
await p.waitForSelector(".sheet.on .phr");
assert.ok(await p.isVisible('.sheet .an [data-open="18"]'), "нет аналога по веществу");
assert.match(await p.textContent(".sheet"), /рецепт/);
await p.click(".sheet [data-bron]");
await p.fill("#bn", "Тест"); await p.fill("#bp", "+998 90 123 45 67");
await p.click("#bgo");
await p.waitForSelector(".okk");
const id = await p.evaluate(() => JSON.parse(localStorage.getItem("oa-bron-1"))[0].id);
/* Панель: бронь первой строкой, «Собрана». */
const q = await c.newPage(); watch(q);
await q.goto(`${B}/panel#brons`, { waitUntil: "load" });
assert.match(await q.textContent(".pn-t tbody tr:first-child"), new RegExp(String(id)));
await q.click(".pn-t tbody tr:first-child");
await q.click('[data-s="1"]');
/* Сайт видит статус. */
await p.goto(`${B}/site`, { waitUntil: "load" });
await p.click("#mine");
assert.match(await p.textContent(".sheet .stl .cur"), /Собрана/);
await p.click(".sheet .x");
/* Список: два лекарства → аптеки, где есть всё. */
await p.evaluate(() => { document.querySelector('.card [data-add="6"]').click(); document.querySelector('.card [data-add="8"]').click(); });
await p.click("#lgo");
assert.ok((await p.$$(".cv")).length >= 3, "нет аптек по списку");
/* Тарифы: доставка по городу 3 раза = 45 000. */
await p.evaluate(() => { document.querySelector('input[name=get][value=city]').click(); });
assert.match(await p.textContent("#tsum"), /45 000/);
/* Раздел для аптек: тарифы аптеки и рекламный кабинет — на своей странице. */
const bz = await c.newPage(); watch(bz);
await bz.goto(`${B}/business`, { waitUntil: "load" });
assert.match(await bz.textContent("#tsum"), /290 000/);
/* Допы второго захода: рекламный кабинет считает по тарифу, фармацевт отвечает, цена за штуку в окне. */
await bz.evaluate(() => { document.getElementById("adw").value = "8"; document.getElementById("adw").dispatchEvent(new Event("input")); });
assert.match(await bz.textContent("#ado"), /700 000/);
await p.evaluate(() => document.querySelector('[data-ask="swap"]').click());
await p.waitForFunction(() => document.querySelectorAll("#askc .bt").length > 1);
assert.match(await p.textContent("#askc"), /врач/);
await p.evaluate(() => document.querySelector('.card [data-open="8"]').click());
await p.waitForSelector(".sheet.on .unitp");
assert.match(await p.textContent(".sheet .unitp"), /440/);
await p.click(".sheet .x");
/* Роль менеджера прячет выручку. */
await q.goto(`${B}/panel`, { waitUntil: "load" });
await q.selectOption("#role", "manager");
assert.ok(await q.isVisible(".pn-lock"), "менеджер видит выручку");
/* Тумблер конструктора убирает блок допа на сайте. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
await p.evaluate(() => { const i = document.querySelector('[data-add="remind"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
await p.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await p.$eval("#remind", (e) => e.classList.contains("off")), "доп «напоминания» не выключился");
await c.close();

/* «Меньше движения»: залёт без кадров, сайт целиком виден. */
const r = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await r.newPage(); watch(rp);
await rp.goto(`${B}/`, { waitUntil: "load" });
assert.ok(await rp.$eval(".hs", (e) => e.classList.contains("end")), "без движения нет итоговой карточки");
await r.close();
await b.close();
assert.deepEqual(errs, [], "ошибки в консоли:\n" + errs.join("\n"));
console.log("ok");
