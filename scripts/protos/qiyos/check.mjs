// Проверка макета Qiyos в Chromium: node check.mjs (сервер serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; расчёт платежа;
// фильтры и сортировка; «Получить» → переход в админке первой строкой →
// «Выдано» → «Мои заявки» на сайте; админка скрывает банк и меняет ставку →
// сайт пересчитал; сравнение; роль менеджера; тумблер допа; «меньше движения».
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const B = "http://localhost:4861/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });
const num = (s) => +String(s).replace(/\D/g, "");

for (const w of [390, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 860 } });
  const p = await c.newPage(); watch(p);
  for (const path of ["", "site", "panel", "uz", "uz/site", "uz/panel"]) {
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
/* 10 млн на 12 месяцев: Микрокредитбанк 24% — аннуитет 945 596 сум. */
await p.fill("#is", "10000000"); await p.press("#is", "Enter");
await p.fill("#in", "12"); await p.press("#in", "Enter");
assert.equal(num(await p.textContent('.offer[data-id="mkb"] .v-pay')), 945596, "аннуитет Микрокредитбанка");
assert.match(await p.textContent('.offer[data-id="mkb"] .v-over'), /1\s347\s152/);
/* 100 млн на 60 месяцев: Tenge (до 90 млн, до 36 мес) серый с причиной. */
await p.fill("#is", "100000000"); await p.press("#is", "Enter");
await p.fill("#in", "60"); await p.press("#in", "Enter");
assert.ok(await p.$eval('.offer[data-id="tenge"]', (e) => e.classList.contains("no")), "неподходящий банк не серый");
assert.match(await p.textContent('.offer[data-id="tenge"] .o-why'), /90/);
/* Фильтр «без справок»: только Ипак Йули, Tenge, Uzum, TBC. */
await p.fill("#is", "10000000"); await p.press("#is", "Enter");
await p.fill("#in", "12"); await p.press("#in", "Enter");
await p.click('[data-f="docs"]');
const vis = await p.$$eval(".offer:not([hidden])", (a) => a.map((e) => e.getAttribute("data-id")).sort());
assert.deepEqual(vis, ["ipak", "tbc", "tenge", "uzum"]);
await p.click('[data-f="docs"]');
/* «Первый займ 0%»: пусто, честная строка. */
await p.click('[data-f="zero"]');
assert.ok(await p.isVisible("#empty"), "нет пустого состояния");
await p.click("#reset");
/* Сортировка «Меньше платёж»: первый — самый дешёвый по нижней ставке. */
await p.click('[data-sort="pay"]');
const pays = await p.$$eval(".offer:not([hidden]):not(.no) .v-pay", (a) => a.map((e) => +e.textContent.replace(/\D/g, "")));
assert.deepEqual(pays, [...pays].sort((x, y) => x - y), "не по возрастанию платежа");
/* Сравнение двух. */
await p.check('[data-cmp="mkb"]'); await p.check('[data-cmp="tbc"]');
await p.click("#cmpgo");
assert.match(await p.textContent("#sheet"), /TBC Bank/);
await p.click("#sheet .x");
/* «Получить»: открывается банк с меткой перехода. */
const [pop] = await Promise.all([c.waitForEvent("page"), p.click('.offer[data-id="tbc"] .go')]);
assert.match(pop.url(), /tbcbank\.uz.*sub_id=7001/);
await pop.close();
/* Админка: переход первой строкой, «Выдано». */
const q = await c.newPage(); watch(q);
await q.goto(`${B}/panel#clicks`, { waitUntil: "load" });
assert.match(await q.textContent(".pn-t tbody tr:first-child"), /7001/);
await q.click(".pn-t tbody tr:first-child");
await q.click('[data-s="3"]');
/* Сайт видит статус. */
await p.goto(`${B}/site`, { waitUntil: "load" });
await p.click("#mine");
assert.match(await p.textContent("#sheet .stl .cur"), /Выдано/);
await p.click("#sheet .x");
/* Админка скрывает Алокабанк и ставит TBC 20% — сайт пересчитал. */
await q.goto(`${B}/panel#partners`, { waitUntil: "load" });
await q.click('[data-pid="aloqa"] [data-on] + i');
await q.click('[data-pid="tbc"] [data-ed]');
await q.fill('[data-pid="tbc"] input[name=lo]', "20"); await q.fill('[data-pid="tbc"] input[name=hi]', "20");
await q.click('[data-pid="tbc"] button[type=submit]');
await p.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await p.evaluate(() => { const e = document.querySelector('.offer[data-id="aloqa"]'); return !e || e.hidden; }), "скрытый банк на сайте");
assert.match(await p.textContent('.offer[data-id="tbc"] .v-rate'), /^20%$/);
/* Роль менеджера прячет вознаграждение. */
await q.goto(`${B}/panel#pay`, { waitUntil: "load" });
await q.selectOption("#role", "manager");
assert.ok(await q.isVisible(".pn-lock"), "менеджер видит выплаты");
await q.goto(`${B}/panel#log`, { waitUntil: "load" });
assert.ok((await q.$$(".pn-t tbody tr")).length >= 3, "история пустая");
/* Тумблер конструктора убирает блок допа на сайте. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
await p.evaluate(() => { const i = document.querySelector('[data-add="dti"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
await p.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await p.$eval("#dti", (e) => e.classList.contains("off")), "доп не выключился");
await c.close();

/* «Меньше движения»: залёт без анимации, итоговая карточка видна. */
const r = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await r.newPage(); watch(rp);
await rp.goto(`${B}/`, { waitUntil: "load" });
assert.ok(await rp.$eval("#fly", (e) => e.classList.contains("end")), "без движения нет итоговой карточки");
await r.close();
await b.close();
assert.deepEqual(errs, [], "ошибки в консоли:\n" + errs.join("\n"));
console.log("ok");
