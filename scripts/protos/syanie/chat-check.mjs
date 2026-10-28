// Проверка чата на сайте «Сияние Севера» в Chromium. Сервер: node serve.mjs
// (порт 4821, другой — PORT=4832 и копия serve.mjs на этом порту).
//   node scripts/protos/syanie/chat-check.mjs
// 1) кнопка чата видна после кино, чат открывается, Escape закрывает и
//    возвращает фокус;
// 2) «ИИ-консультант»: «сколько стоит» → ответ с 179 900, запись в чате
//    (имя, телефон по маске, время) → заявка src = chat и статус на сайте;
// 3) «Менеджер в Telegram»: сообщение видно в мини-Telegram, приходит
//    ответ администратора (демо), ответ из панели во второй вкладке
//    появляется сразу; ночью строка «ответим утром»;
// 4) 390, 768, 1440: без горизонтальной прокрутки и ошибок в консоли.
// Снимки: docs/screens/syanie/chat-{ai,tg}-{390,1440}.jpg.
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

async function open(w, h, init) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_TUNNEL|net::ERR|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.getElementById("skipf"); if (s) s.click(); });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const say = async (p, t) => { await p.fill("#cx-in", t); await p.press("#cx-in", "Enter"); };
const lastText = (p, sel) => p.evaluate((s) => { const a = document.querySelectorAll(s); return a.length ? a[a.length - 1].textContent : ""; }, sel);

for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const { ctx, p, errs } = await open(w, h);
  const fabOn = await p.evaluate(() => { const f = document.getElementById("cx-fab"); const r = f.getBoundingClientRect(); return !f.classList.contains("away") && r.width >= 44 && getComputedStyle(f).visibility === "visible"; });
  check(fabOn, `@${w}: кнопка чата видна после кино`);
  if (w < 1024) {
    const clear = await p.evaluate(() => { const f = document.getElementById("cx-fab").getBoundingClientRect(), d = document.getElementById("dock").getBoundingClientRect(); return f.bottom <= d.top || d.height === 0; });
    check(clear, `@${w}: кнопка чата над доком, не закрывает «Записаться»`);
  }
  await p.click("#cx-fab");
  await p.waitForTimeout(400);
  check(await p.isVisible("#cx .cx-win"), `@${w}: чат открылся`);
  const sw = await p.$$eval(".cx-sw button", (b) => b.map((x) => x.textContent));
  check(sw.join("|") === "ИИ-консультант|Менеджер в Telegram", `@${w}: два варианта: ${sw.join(", ")}`);
  check((await p.textContent(".cx-demo")).includes("на сайте останется один"), `@${w}: пометка «для показа»`);
  const fs = await p.$eval("#cx-in", (i) => parseFloat(getComputedStyle(i).fontSize));
  check(fs >= 16, `@${w}: шрифт поля ${fs}px (iOS не увеличивает)`);
  const small = await p.$$eval("#cx button, #cx a[href]", (a) => a.filter((x) => x.offsetParent && !x.closest(".cx-kb") && (x.getBoundingClientRect().height < 44 || x.getBoundingClientRect().width < 44)).map((x) => x.textContent.trim() || x.getAttribute("aria-label")));
  check(!small.length, `@${w}: кнопки не меньше 44 px ${small.join(", ")}`);

  // Вариант A: консультант
  await say(p, "сколько стоит");
  await p.waitForFunction(() => [...document.querySelectorAll(".cx-ai p")].some((x) => x.textContent.includes("179 900")), null, { timeout: 5000 }).then(() => ok(`@${w}: «сколько стоит» → 179 900 ₽`), () => fail(`@${w}: нет цены в ответе`));
  await say(p, "больно ли ставить импланты?");
  await p.waitForFunction(() => [...document.querySelectorAll(".cx-ai p")].some((x) => x.textContent.includes("седаци")), null, { timeout: 5000 }).then(() => ok(`@${w}: «больно» → ответ про обезболивание`), () => fail(`@${w}: нет ответа про боль`));
  await p.waitForTimeout(300);
  const warns = await p.$$eval(".cx-ai p", (a) => a.filter((x) => x.textContent.includes("Имеются противопоказания")).length);
  check(warns === 1, `@${w}: строка про противопоказания один раз (${warns})`);
  await say(p, "Записаться");
  await p.waitForFunction(() => document.querySelector("#cx-log").textContent.includes("Как к вам обращаться"), null, { timeout: 5000 });
  await say(p, "Ольга");
  await p.waitForFunction(() => document.getElementById("cx-in").type === "tel", null, { timeout: 5000 });
  await p.fill("#cx-in", "");
  await p.type("#cx-in", "9131234567");
  const masked = await p.inputValue("#cx-in");
  check(masked === "+7 (913) 123-45-67", `@${w}: маска телефона ${masked}`);
  await p.press("#cx-in", "Enter");
  await p.waitForSelector(".cx-chip:text('Завтра вечером')", { timeout: 5000 });
  await p.click(".cx-chip:text('Завтра вечером')");
  await p.waitForFunction(() => { const l = SY.get().leads[0]; return l && l.src === "chat"; }, null, { timeout: 5000 }).catch(() => {});
  const lead = await p.evaluate(() => SY.get().leads[0] || null);
  check(lead && lead.src === "chat" && lead.phone === "+7 (913) 123-45-67" && lead.name === "Ольга", `@${w}: заявка из чата ${lead ? lead.name + ", " + lead.phone + ", " + lead.when : "нет"}`);
  await p.waitForTimeout(300);
  check(await p.evaluate(() => { const s = document.querySelector(".my-st"); return !!s && !s.hidden; }), `@${w}: статус заявки на сайте (.my-st)`);
  const order = await p.$$eval("#cx-log .cx-m p", (a) => { const t = a.map((x) => x.textContent), f = (re) => t.findIndex((x) => re.test(x)); const q = f(/оставьте номер/), ph = f(/^\+7 \(913\) 123-45-67$/), wh = f(/Когда вам удобно/); return q >= 0 && q < ph && ph < wh; });
  check(order, `@${w}: вопросы записи и ответы идут по порядку`);
  check((await overflow(p)) <= 0, `@${w}: без горизонтальной прокрутки (консультант)`);
  await p.waitForTimeout(1500);
  if (w !== 768) await p.screenshot({ path: `${SHOTS}chat-ai-${w}.jpg`, type: "jpeg", quality: 72 });

  // Вариант B: менеджер в Telegram
  await p.click(".cx-sw button[data-m='tg']");
  await p.waitForTimeout(200);
  check((await p.textContent("#cx-log")).includes("Telegram"), `@${w}: вступление «уйдёт администратору в Telegram»`);
  await say(p, "Здравствуйте, сколько стоит All-on-6?");
  if (w < 1024) await p.click(".cx-tgt");
  await p.waitForTimeout(300);
  check(await p.isVisible(".cx-tb"), `@${w}: сообщение видно в мини-Telegram`);
  check((await lastText(p, ".cx-tb")).includes("сколько стоит All-on-6"), `@${w}: в Telegram те же слова`);
  check((await p.$$eval(".cx-kb button", (b) => b.map((x) => x.textContent).join("|"))).startsWith("Ответить|Взять|Позвонить"), `@${w}: кнопки «Ответить», «Взять», «Позвонить»`);
  check((await lastText(p, ".cx-tick")).includes("Telegram"), `@${w}: под сообщением «ушло в Telegram»`);
  await p.waitForSelector(".cx-manager", { timeout: 8000 }).then(() => ok(`@${w}: пришёл ответ администратора`), () => fail(`@${w}: нет ответа администратора`));
  const rep = await lastText(p, ".cx-manager");
  check(/Анна/.test(rep) && /демо/.test(rep) && /179 900/.test(rep), `@${w}: ответ по теме, с пометкой демо: ${rep.slice(0, 80)}`);
  check(await p.isVisible(".cx-to"), `@${w}: ответ виден и в Telegram`);
  const mode = await p.evaluate(() => SY.chat(localStorage.getItem("sy-chat")).mode);
  check(mode === "tg", `@${w}: переписка записана с mode = tg`);
  // Ответ из панели во второй вкладке того же браузера
  const p2 = await ctx.newPage();
  await p2.goto(B, { waitUntil: "domcontentloaded" });
  await p2.evaluate(() => SY.push(localStorage.getItem("sy-chat"), "manager", "Проверка из панели"));
  await p.waitForFunction(() => document.getElementById("cx-log").textContent.includes("Проверка из панели"), null, { timeout: 4000 }).then(() => ok(`@${w}: ответ из панели появился сразу`), () => fail(`@${w}: ответ из панели не появился`));
  await p2.close();
  await p.waitForTimeout(300);
  check((await overflow(p)) <= 0, `@${w}: без горизонтальной прокрутки (Telegram)`);
  if (w !== 768) await p.screenshot({ path: `${SHOTS}chat-tg-${w}.jpg`, type: "jpeg", quality: 72 });
  // Перезагрузка держит переписку
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const s = document.getElementById("skipf"); if (s) s.click(); });
  await p.waitForTimeout(600);
  await p.click("#cx-fab");
  await p.waitForTimeout(300);
  check((await p.textContent("#cx-log")).includes("Проверка из панели"), `@${w}: после перезагрузки переписка на месте`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
  const closed = await p.evaluate(() => document.getElementById("cx").hidden && document.activeElement && document.activeElement.id === "cx-fab");
  check(closed, `@${w}: Escape закрывает, фокус на кнопке чата`);
  check(!errs.length, `@${w}: без ошибок в консоли ${errs.join(" | ")}`);
  await ctx.close();
}

// Ночь по Томску: строка «ответим утром», сообщение всё равно уходит.
{
  const { ctx, p, errs } = await open(390, 844, () => { window.__cxNight = true; });
  await p.click("#cx-fab");
  await p.click(".cx-sw button[data-m='tg']");
  check((await p.textContent("#cx-st")).includes("ответим утром с 9:00"), "ночью: «Сейчас клиника закрыта, ответим утром с 9:00»");
  await say(p, "Можно в рассрочку?");
  await p.waitForSelector(".cx-manager", { timeout: 8000 }).then(() => ok("ночью сообщение принято, ответ демо пришёл"), () => fail("ночью нет ответа"));
  check(!errs.length, `ночью без ошибок ${errs.join(" | ")}`);
  await ctx.close();
}
// Без движения: чат работает, анимаций нет.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const p = await ctx.newPage();
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.getElementById("skipf"); if (s) s.click(); });
  await p.waitForTimeout(500);
  await p.click("#cx-fab");
  await say(p, "Если мало кости");
  await p.waitForFunction(() => document.getElementById("cx-log").textContent.includes("костной ткани"), null, { timeout: 4000 }).then(() => ok("без движения: ответ пришёл"), () => fail("без движения: нет ответа"));
  const anim = await p.$eval(".cx-m", (m) => getComputedStyle(m).animationName);
  check(anim === "none", `без движения: у сообщений нет анимации (${anim})`);
  await ctx.close();
}
await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nЧат: всё в порядке");
process.exit(bad ? 1 : 0);
