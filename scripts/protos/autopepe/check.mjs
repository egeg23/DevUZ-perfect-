// Проверка макета Chromium'ом: node check.mjs (нужен запущенный serve.mjs).
// Выбор, сайт и панель на 390, 768 и 1440 без ошибок консоли и прокрутки
// вбок; полный цикл: на сайте капот «wgniecenie», дверь «lakierowanie» →
// цена пересчиталась → заявка ушла → она первой строкой в панели → «Przyjmij
// auto» → этап «Lakiernia» → «Status naprawy» и «Moja naprawa» на сайте;
// тумблер конструктора убирает блок; recepcja не видит marży; без движения
// всё видно.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const U = "http://localhost:4851/proto/" + "a".repeat(43) + "/";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const bad = [];
const ok = (c, m) => { if (!c) bad.push(m); };
async function ctxOf(w, extra = {}) {
  const h = w < 700 ? 844 : w < 1000 ? 1024 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...extra });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("ap-intro", "1"); sessionStorage.setItem("dz-intro", "1"); } catch (e) {} });
  return ctx;
}
function watch(p, tag) {
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) bad.push(`${tag}: ${m.text()}`); });
  p.on("pageerror", (e) => bad.push(`${tag}: ${e.message}`));
}
for (const w of [390, 768, 1440]) for (const path of ["", "site", "panel", "panel#orders", "panel#cal", "panel#mat"]) {
  const ctx = await ctxOf(w), p = await ctx.newPage(), tag = `${w} /${path}`;
  watch(p, tag);
  await p.goto(U + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(700);
  for (const y of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    await p.evaluate((y) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * y), y);
    await p.waitForTimeout(120);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(over <= 0, `${tag}: прокрутка вбок ${over}px на ${y * 100}%`);
  }
  await ctx.close();
}

/* Полный цикл на телефоне. */
{
  const ctx = await ctxOf(390, { hasTouch: true, isMobile: true }), p = await ctx.newPage();
  watch(p, "цикл");
  await p.goto(U, { waitUntil: "domcontentloaded", timeout: 60000 });
  ok(await p.locator(".choice").count() === 2, "на первой странице нет выбора strona / panel");
  await p.locator('label.add:has([data-add="flota"])').click();
  ok(/2\s?900/.test(await p.locator("#total").innerText()), "итог конструктора не пересчитался");
  await p.click('.choice[href$="/site"]');
  await p.waitForURL(/\/site$/);
  ok(await p.locator("#flota.addon-off").count() === 1, "тумблер не убрал блок «dla firm» на сайте");
  ok(/^sms:/.test(await p.locator(".hero [data-call]").getAttribute("href")), "на телефоне главное действие не открывает SMS");
  await p.locator("#wycena").scrollIntoViewIfNeeded();
  await p.click('#car [data-part="mk"]'); await p.click('[data-dmg="pdr"]');
  await p.click('#car [data-part="dlp"]'); await p.click('[data-dmg="lak"]');
  ok(/zł do .*zł/.test(await p.locator("#rt").innerText()), "в калькуляторе нет вилки цены");
  ok((await p.locator("#rsms").getAttribute("href")).includes(encodeURIComponent("Maska")), "SMS без выбранных элементов");
  await p.click('#cls [data-cls="s"]');
  const suv = await p.locator("#rt").innerText();
  await p.click('#cls [data-cls="m"]');
  ok(suv !== await p.locator("#rt").innerText(), "класс машины не меняет цену");
  await p.check("#ocx"); ok((await p.locator("#rt").innerText()) === "0 zł", "OC не обнуляет цену для клиента"); await p.uncheck("#ocx");
  await p.fill("#fph", "+48 600 100 200"); await p.click("#fsend");
  ok(await p.locator("#fok").isVisible(), "заявка со схемой не ушла");
  await p.goto(U + "panel#orders");
  await p.waitForSelector("tr[data-r]");
  ok(await p.locator("tbody tr").first().getAttribute("data-r") !== null, "заявка с сайта не первой строкой");
  await p.click("tr[data-r]");
  ok((await p.locator(".pn-card").first().innerText()).includes("Maska"), "в заявке нет схемы");
  await p.click("#accept");
  await p.click('[data-s="2"]');
  await p.selectOption("#role", "desk");
  await p.goto(U + "panel#sum");
  ok((await p.locator(".pn-kpis").innerText()).includes("Recepcja tego nie widzi"), "recepcja видит marżę");
  await p.goto(U + "site#status");
  await p.waitForTimeout(400);
  const id = await p.evaluate(() => JSON.parse(localStorage.getItem("ap-req-1"))[0].id);
  await p.fill("#sq", "AP-" + id); await p.click("#sgo");
  ok((await p.locator("#sres .now").innerText()).includes("Lakiernia"), "статус из панели не виден на сайте");
  ok(await p.locator("#mine.on").count() === 1, "нет «Moja naprawa» в шапке");
  await p.goto(U + "site#termin");
  await p.click("#days [data-d='0']"); await p.click("#slots button:not([disabled])");
  await p.fill("#tph", "Anna 600100200"); await p.click("#tgo");
  ok(await p.locator("#tok").isVisible(), "termin не зарезервирован");
  await p.goto(U + "panel#cal");
  ok(await p.locator(".pn-cal span.site").count() === 1, "termin ze strony нет в календаре панели");
  await ctx.close();
}
/* Меньше движения: всё на месте. */
{
  const ctx = await ctxOf(390, { reducedMotion: "reduce" }), p = await ctx.newPage();
  watch(p, "reduce");
  await p.goto(U + "site", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => [...document.querySelectorAll(".rise,.pop,[data-m]")].every((e) => getComputedStyle(e).opacity === "1")), "при reduce motion блоки невидимы");
  await ctx.close();
}
console.log(bad.length ? bad.join("\n") : "Всё прошло");
await b.close();
process.exit(bad.length ? 1 : 0);
