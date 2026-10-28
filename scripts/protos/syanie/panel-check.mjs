// Проверка панели клиники «Сияние Севера» в Chromium. Сервер: node serve.mjs
// (порт 4821, другой — PORT=4831 node scripts/protos/syanie/panel-check.mjs).
// 1) на сайте запись через шторку → в панели заявка первой строкой «с сайта»;
// 2) «Подтвердить запись» → на сайте пациент видит «подтверждена»;
// 3) запись с сайта стоит в расписании;
// 4) amoCRM: «Проверить» → «Подключено», «Отправить заявку в amoCRM» →
//    «сделка №…», вебхук этапа меняет статус;
// 5) администратор не видит выручку; чат с менеджером отвечает из панели;
// 6) 390, 768, 1440: без горизонтальной прокрутки, консоль чистая; снимки.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const PORT = process.env.PORT || 4821;
const B = `http://localhost:${PORT}/proto/${"a".repeat(43)}/`;
const SHOTS = new URL("../../../docs/screens/syanie/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);
const check = (c, m) => (c ? ok(m) : fail(m));

async function ctxAt(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const errs = [];
  ctx.on("page", (p) => {
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_TUNNEL|net::ERR|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  });
  return { ctx, errs };
}
const calm = (p) => p.evaluate(() => { const t = document.getElementById("toast"); if (t) t.hidden = true; });
const noOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

/* ── Полный цикл на телефоне: сайт → панель → сайт ─────────────────── */
{
  const { ctx, errs } = await ctxAt(390, 844);
  const site = await ctx.newPage();
  await site.goto(B, { waitUntil: "load" });
  await site.waitForTimeout(800);
  // Ссылка на SMS не открывается в Chromium: гасим переход, обработчик сайта всё равно пишет заявку.
  await site.evaluate(() => document.getElementById("bk-go").addEventListener("click", (e) => e.preventDefault(), true));
  await site.evaluate(() => document.querySelector("[data-book]").click());
  await site.waitForTimeout(500);
  await site.click('.chip[data-day="Сегодня"]');
  await site.click('.chip[data-part="Вечером"]');
  await site.click("#bk-go");
  await site.waitForTimeout(300);
  const n = await site.evaluate(() => window.SY.get().leads.length);
  check(n === 1, "на сайте заявка записалась в общее состояние");

  const pn = await ctx.newPage();
  await pn.goto(B + "panel#zayavki", { waitUntil: "load" });
  await pn.waitForTimeout(400);
  const first = await pn.$eval(".lst li:first-child .lr", (e) => ({ site: e.classList.contains("site"), t: e.textContent }));
  check(first.site && /с сайта, только что/.test(first.t), "в панели заявка с сайта первой строкой «с сайта, только что»");
  await pn.click(".lst li:first-child .lr");
  await pn.waitForTimeout(300);
  check(await pn.isVisible(".lc"), "карточка заявки открылась");
  const slot = await pn.$eval(".lc .kv", (e) => e.textContent);
  check(/В расписании/.test(slot), "запись с сайта встала в расписание: " + (slot.match(/В расписании(.{0,40})/) || [""])[0]);
  await pn.click('.lc [data-act="status"][data-v="confirmed"]');
  await pn.waitForTimeout(300);
  check(/Подтверждена/.test(await pn.$eval(".lc-top", (e) => e.textContent)), "статус в панели: подтверждена");
  await site.bringToFront();
  await site.waitForTimeout(500);
  const chipTxt = await site.evaluate(() => (document.querySelector(".my-st") || {}).textContent || "");
  check(/подтверждена/.test(chipTxt), "на сайте пациент видит: " + chipTxt);

  await pn.bringToFront();
  await pn.goto(B + "panel#raspisanie", { waitUntil: "load" });
  await pn.waitForTimeout(300);
  check((await pn.$$(".slot.site")).length >= 1, "в расписании ячейка «с сайта»");
  check(await noOverflow(pn) <= 0, "@390 расписание: вбок не едет");

  // amoCRM: без подключения кнопка ведёт на экран amo, затем подключение и сделка.
  await pn.goto(B + "panel#amo", { waitUntil: "load" });
  await pn.fill("#amo-sub", "siyanie");
  await pn.fill("#amo-tok", "x".repeat(40) + "AB12");
  await pn.click("#amo-go");
  await pn.waitForTimeout(1200);
  check(/Подключено: аккаунт siyanie\.amocrm\.ru, воронка «Пациенты»/.test(await pn.textContent("#view")), "amoCRM: «Подключено: аккаунт siyanie.amocrm.ru, воронка „Пациенты“»");
  const code = await pn.$eval(".code", (e) => e.textContent);
  let body = null; try { body = JSON.parse(code); } catch {}
  check(body && body[0]._embedded.contacts[0].custom_fields_values[0].field_code === "PHONE" && body[0].pipeline_id, "тело leads/complex: сделка с контактом и телефоном");
  await pn.goto(B + "panel#zayavki", { waitUntil: "load" });
  await pn.click(".lst li:first-child .lr");
  await pn.waitForTimeout(200);
  await pn.click('.lc [data-act="amo-send"]');
  await pn.waitForTimeout(400);
  const amo = await pn.$eval(".amo-b", (e) => e.textContent);
  check(/сделка №\d{8}/.test(amo), "в карточке: " + (amo.match(/В amoCRM: сделка №\d+/) || [amo])[0]);
  const href = await pn.$eval(".amo-b a", (e) => e.href);
  check(/^https:\/\/siyanie\.amocrm\.ru\/leads\/detail\/\d{8}$/.test(href), "ссылка на сделку " + href);
  check(await site.evaluate(() => !!window.SY.get().leads[0].amo), "номер сделки записан в общее состояние");
  await pn.goto(B + "panel#amo", { waitUntil: "load" });
  await pn.selectOption("#hk-s", "s3");
  await pn.click('[data-act="amo-hook"]');
  await pn.waitForTimeout(300);
  const st = await site.evaluate(() => window.SY.get().leads[0].status);
  check(st === "came", "вебхук этапа «Пришёл на консультацию» сменил статус: " + st);
  check(await noOverflow(pn) <= 0, "@390 amoCRM: вбок не едет");
  await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-amo-390.jpg", type: "jpeg", quality: 72, fullPage: false });

  // Роль: администратор не видит выручку.
  await pn.goto(B + "panel#svodka", { waitUntil: "load" });
  check(/Выручка/.test(await pn.textContent("#view")), "главный врач видит выручку");
  await pn.click('.role [data-role="admin"]');
  await pn.waitForTimeout(200);
  const adm = await pn.textContent("#view");
  check(!/Выручка|Средний чек|₽/.test(adm.replace(/Администратор не видит выручку и средний чек[^.]*\./, "")), "администратор не видит денег");
  await pn.click('.role [data-role="owner"]');
  await pn.waitForTimeout(200);
  await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-svodka-390.jpg", type: "jpeg", quality: 72, fullPage: false });

  // Чат: менеджер отвечает из панели, ответ в общем состоянии.
  const cid = await site.evaluate(() => { const id = window.SY.addChat({ mode: "tg", name: "Посетитель сайта" }); window.SY.push(id, "user", "Можно записаться на субботу?"); return id; });
  await pn.goto(B + "panel#chaty/" + cid, { waitUntil: "load" });
  await pn.fill("#rp", "Да, в субботу работаем 9:00-21:00. Во сколько удобно?");
  await pn.click(".reply .btn");
  await pn.waitForTimeout(300);
  const last = await site.evaluate((id) => { const c = window.SY.chat(id); return c.msgs[c.msgs.length - 1]; }, cid);
  check(last && last.from === "manager", "ответ из панели ушёл в чат сайта");
  const hist = await pn.goto(B + "panel#istoriya", { waitUntil: "load" }).then(() => pn.textContent("#view"));
  check(/Подтвердил запись/.test(hist) && /Сделка №\d{8} создана в amoCRM/.test(hist), "история: подтверждение и сделка записаны");

  // Каждый раздел на телефоне: без прокрутки вбок.
  for (const t of ["svodka", "zayavki", "raspisanie", "amo", "chaty", "napominaniya", "istoriya"]) {
    await pn.goto(B + "panel#" + t, { waitUntil: "load" });
    await pn.waitForTimeout(150);
    const ov = await noOverflow(pn);
    if (ov > 0) fail(`@390 ${t}: вбок ${ov}px`);
  }
  ok("@390: все разделы проверены на прокрутку вбок");
  await pn.goto(B + "panel#napominaniya", { waitUntil: "load" });
  await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-tg-390.jpg", type: "jpeg", quality: 72, fullPage: false });
  check(!errs.length, "@390: консоль чистая" + (errs.length ? " " + errs.join(" | ") : ""));
  await ctx.close();
}

/* ── 768 и 1440 ────────────────────────────────────────────────────── */
for (const [w, h] of [[768, 1024], [1440, 900]]) {
  const { ctx, errs } = await ctxAt(w, h);
  const site = await ctx.newPage();
  await site.goto(B, { waitUntil: "load" });
  await site.evaluate(() => window.SY.addLead({ src: "quiz", name: "Ольга", what: "Расчёт All-on-6: Верхнюю, Нет, Под седацией, во сне, Да, нужна", when: "" }));
  const pn = await ctx.newPage();
  for (const t of ["svodka", "zayavki", "raspisanie", "amo", "chaty", "napominaniya", "istoriya"]) {
    await pn.goto(B + "panel#" + t, { waitUntil: "load" });
    await pn.waitForTimeout(150);
    const ov = await noOverflow(pn);
    if (ov > 0) fail(`@${w} ${t}: вбок ${ov}px`);
  }
  ok(`@${w}: все разделы проверены на прокрутку вбок`);
  if (w === 1440) {
    await pn.goto(B + "panel#svodka", { waitUntil: "load" });
    await pn.waitForTimeout(800);
    await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-svodka-1440.jpg", type: "jpeg", quality: 72 });
    await pn.goto(B + "panel#zayavki", { waitUntil: "load" });
    await pn.click(".lst li:first-child .lr");
    await pn.waitForTimeout(300);
    check(await pn.isVisible(".lst") && await pn.isVisible(".lc"), "@1440: список и карточка рядом");
    await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-zayavki-1440.jpg", type: "jpeg", quality: 72 });
    await pn.goto(B + "panel#raspisanie", { waitUntil: "load" });
    await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-raspisanie-1440.jpg", type: "jpeg", quality: 72 });
    await pn.goto(B + "panel#amo", { waitUntil: "load" });
    await calm(pn);
  await pn.screenshot({ path: SHOTS + "panel-amo-1440.jpg", type: "jpeg", quality: 72 });
    check(await pn.isVisible(".side") && !(await pn.isVisible(".dock")), "@1440: меню слева, нижней панели нет");
  } else check(await pn.isVisible(".dock"), `@${w}: нижняя панель`);
  check(!errs.length, `@${w}: консоль чистая` + (errs.length ? " " + errs.join(" | ") : ""));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё в порядке.");
process.exit(bad ? 1 : 0);
