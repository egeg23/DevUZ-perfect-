// Проверка макета Chromium'ом: node check.mjs (нужен запущенный serve.mjs).
// Обе страницы и панель на 390, 768, 1440 и 2560 без ошибок консоли и
// прокрутки вбок; полный цикл: X-COP 8900 в корзину → подарок Turbocam →
// заказ → он первой строкой в панели → статус «Передан курьеру» и новая база
// камер из панели → «Мой заказ» и «Обновления» на сайте; тумблер конструктора
// убирает блок; менеджер не видит прибыль; без движения всё видно.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const U = "http://localhost:4841/proto/" + "a".repeat(43) + "/";
const b = await chromium.launch();
const bad = [];
const ok = (c, m) => { if (!c) bad.push(m); };
async function ctxOf(w, extra = {}) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : w > 2000 ? 1440 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...extra });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("nl-intro", "1"); sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  return ctx;
}
function watch(p, tag) {
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) bad.push(`${tag}: ${m.text()}`); });
  p.on("pageerror", (e) => bad.push(`${tag}: ${e.message}`));
}
for (const w of [390, 768, 1440, 2560]) for (const path of ["", "uz/", "panel", "uz/panel"]) {
  const ctx = await ctxOf(w), p = await ctx.newPage(), tag = `${w} /${path}`;
  watch(p, tag);
  await p.goto(U + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(700);
  for (const y of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((y) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * y), y);
    await p.waitForTimeout(150);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(over <= 0, `${tag}: прокрутка вбок ${over}px на ${y * 100}%`);
  }
  await ctx.close();
}

/* Полный цикл, ru, телефон. */
{
  const ctx = await ctxOf(390), p = await ctx.newPage();
  watch(p, "цикл");
  await p.goto(U, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.click('.hero [data-buy="1000458"]');
  await p.waitForSelector("#sheet.in");
  ok(await p.locator("#shb .li.gift").count() === 1, "нет подарка Turbocam в корзине");
  await p.click("#tocheck");
  await p.fill("#fn", "Akmal"); await p.fill("#fp", "+998 90 123 45 67"); await p.fill("#fa", "Toshkent");
  ok(await p.locator(".pays label").count() === 4, "с допом оплаты не четыре способа");
  await p.click("#place");
  await p.waitForSelector(".okv");
  ok(await p.locator("#mine.on").count() === 1, "нет «Мой заказ» в шапке");
  const panel = await ctx.newPage();
  watch(panel, "панель");
  await panel.goto(U + "panel#orders", { waitUntil: "domcontentloaded" });
  await panel.waitForSelector("tr.new");
  ok((await panel.locator("tbody tr").first().getAttribute("class")) === "new", "заказ с сайта не первой строкой");
  await panel.click("tr.new");
  await panel.click('[data-s="2"]');
  await panel.goto(U + "panel#base", { waitUntil: "domcontentloaded" });
  await panel.waitForSelector('[data-b="1000458"]');
  await panel.fill('[data-b="1000458"] [data-f=v]', "v10.29");
  await panel.click('[data-save="1000458"]');
  await panel.goto(U + "panel#sum", { waitUntil: "domcontentloaded" });
  await panel.selectOption("#role", "manager");
  ok(await panel.locator(".pn-lock").count() === 1, "менеджер видит прибыль");
  await p.bringToFront(); await p.waitForTimeout(500);
  ok(/Передан курьеру/.test(await p.locator("#mine").innerText()), "статус из панели не дошёл до сайта");
  await p.click("#sheet .x");
  await p.fill("#uq", "8900"); await p.waitForTimeout(200);
  ok(/v10\.29/.test(await p.locator("#ures").innerText()), "база камер из панели не дошла до сайта");
  /* Тумблер конструктора убирает блок. */
  await p.evaluate(() => document.getElementById("offer").scrollIntoView());
  await p.locator('label.add:has([data-add="bot"])').click();
  ok(await p.locator("#bot.addon-off").count() === 1, "тумблер не убрал блок бота");
  ok(/3\s?650/.test(await p.locator("#total").innerText()), "итог не пересчитался");
  await ctx.close();
}
/* Без движения: сцена и блоки видны сразу. */
{
  const ctx = await ctxOf(1440, { reducedMotion: "reduce" }), p = await ctx.newPage();
  watch(p, "reduced");
  await p.goto(U, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector(".cap")).opacity) === "1", "без движения подписи сцены не видны");
  ok(!(await p.locator("#nli").count()), "заставка при «меньше движения»");
  await ctx.close();
}
await b.close();
console.log(bad.length ? "НЕ ПРОШЛО:\n" + bad.join("\n") : "всё прошло");
process.exit(bad.length ? 1 : 0);
