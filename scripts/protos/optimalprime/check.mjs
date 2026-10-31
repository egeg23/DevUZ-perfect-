// Проверка макета Optimal Prime в Chromium: node check.mjs (сервер serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; вкладки услуг;
// конструктор тарифа: их три пакета по умолчанию, ползунок → «ориентировочно»;
// расчёт → панель первой строкой → «Встреча» → «Моя заявка» на сайте;
// заявка из формы; проверка учёта; роль менеджера; тумблер допа; «меньше движения».
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import assert from "node:assert/strict";

const B = "http://localhost:4861/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });
const num = (s) => +s.replace(/\D/g, "");

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
await c.addInitScript(() => { window.open = () => null; });
const p = await c.newPage(); watch(p);
await p.goto(`${B}/site`, { waitUntil: "load" });
/* Вкладки услуг. */
await p.evaluate(() => document.querySelector('[data-svc="hr"]').click());
assert.ok(await p.isVisible("#svc-hr"), "вкладка HR не открылась");
/* Конструктор: по умолчанию ровно их пакеты. */
const tot = async () => num(await p.textContent("#tsum .tot b"));
assert.equal(await tot(), 15500000, "ОСН не 15 500 000");
await p.evaluate(() => document.querySelector('[data-rg="usn"]').click());
assert.equal(await tot(), 12500000, "УСН не 12 500 000");
await p.evaluate(() => document.querySelector('[data-rg="light"]').click());
assert.equal(await tot(), 3000000, "Light не 3 000 000");
/* Ползунок вне пакета: +5 сотрудников на УСН = +1 000 000, и пометка «ориентировочно». */
await p.evaluate(() => { document.querySelector('[data-rg="usn"]').click(); const s = document.getElementById("s-emp"); s.value = "15"; s.dispatchEvent(new Event("input")); });
assert.equal(await tot(), 13500000);
assert.match(await p.textContent("#x-emp"), /ориентировочно/);
/* Разовые услуги — отдельной строкой. */
await p.evaluate(() => { document.querySelector(".once").open = true; document.querySelector('[data-once="eds"]').click(); });
assert.match(await p.textContent("#tsum"), /300 000/);
/* Расчёт → панель. */
await p.evaluate(() => document.getElementById("tsend").click());
const id = await p.evaluate(() => JSON.parse(localStorage.getItem("op-req-1"))[0].id);
const q = await c.newPage(); watch(q);
await q.goto(`${B}/panel#req`, { waitUntil: "load" });
assert.match(await q.textContent(".pn-t tbody tr:first-child"), new RegExp(String(id)));
assert.match(await q.textContent(".pn-t tbody tr:first-child"), /13 500 000/);
await q.click(".pn-t tbody tr:first-child");
await q.click('[data-s="1"]');
/* Сайт видит статус. */
await p.goto(`${B}/site`, { waitUntil: "load" });
await p.click("#mine");
assert.match(await p.textContent(".sheet .stl .cur"), /Встреча/);
await p.click(".sheet .x");
/* Форма связи: без телефона — подсказка, с телефоном — заявка в панели. */
await p.evaluate(() => document.getElementById("contact").scrollIntoView());
await p.fill("#cco", "Тест"); await p.click("#cgo");
assert.match(await p.textContent("#cerr"), /телефон/);
await p.fill("#cph", "+998 90 123 45 67"); await p.click("#cgo");
assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem("op-req-1"))[0].co), "Тест");
/* Тайна зарплат: «видит Optimal Prime» открывает суммы. */
await p.evaluate(() => document.querySelector('[data-who="out"]').click());
assert.ok(await p.$eval("#payroll", (e) => e.classList.contains("open")));
/* Проверка учёта: семь ответов «да» → список рисков. */
for (let i = 0; i < 7; i++) await p.evaluate(() => document.querySelector('#quiz [data-qa="1"]').click());
assert.equal((await p.$$("#quiz li")).length, 7);
/* Сравнение со штатом. */
assert.match(await p.textContent("#bin"), /\d/);
/* Роль менеджера прячет выручку. */
await q.goto(`${B}/panel`, { waitUntil: "load" });
await q.selectOption("#role", "manager");
assert.ok(await q.isVisible(".pn-lock"), "менеджер видит выручку");
/* Тумблер конструктора убирает блок допа на сайте. */
await p.goto(`${B}/`, { waitUntil: "load" }); await skip(p);
await p.evaluate(() => { const i = document.querySelector('[data-add="remind"]'); i.checked = false; i.dispatchEvent(new Event("change")); });
await p.goto(`${B}/site`, { waitUntil: "load" });
assert.ok(await p.$eval("#remind", (e) => e.classList.contains("off")), "доп «календарь» не выключился");
await c.close();

/* «Меньше движения»: залёт без кадров, сайт целиком виден. */
const r = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await r.newPage(); watch(rp);
await rp.goto(`${B}/`, { waitUntil: "load" });
assert.ok(await rp.$eval(".hs", (e) => e.classList.contains("end")), "без движения нет итоговой карточки");
await rp.goto(`${B}/site`, { waitUntil: "load" });
assert.equal(await rp.$eval("#why .flip", (e) => getComputedStyle(e).opacity), "1");
await r.close();
await b.close();
assert.deepEqual(errs, [], "ошибки в консоли:\n" + errs.join("\n"));
console.log("ok");
