// Проверка макета CARGO PRO GROUP в Chromium: node check.mjs (serve.mjs запущен).
// 6 страниц на 390, 768, 1440 без ошибок и прокрутки вбок; конструктор
// тарифов считает по платному весу и контейнерам, валюты; заявка → панель →
// «В пути» → «Мои заявки» и отслеживание на сайте; демо-номер; документы;
// тумблер конструктора убирает блок допа; роль менеджера; «меньше движения».
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
import assert from "node:assert/strict";

const B = "http://localhost:4853/proto/" + "A".repeat(43);
const b = await chromium.launch();
const errs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g/.test(m.text())) errs.push(m.text()); }); };
const skip = async (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });

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
await c.close();

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
