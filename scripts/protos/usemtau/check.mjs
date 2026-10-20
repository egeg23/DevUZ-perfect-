// Проверка макета Юсем Тау в Chromium. Сервер: node serve.mjs (порт 4822).
//   node scripts/protos/usemtau/check.mjs
// 1) главная и каталог на 390, 768, 1440: без ошибок в консоли и без
//    горизонтальной прокрутки, у body нет overflow-x:hidden (иначе sticky не держится);
// 2) шапка прячется при любой прокрутке, вверх и вниз, и возвращается через 3 с
//    после последнего события, не раньше;
// 3) на 390: поиск «труба 40×20» → в заявку; калькулятор (метры → тонны и
//    сумма); заявка: резка, город, БИН с проверкой, ссылка в WhatsApp с позициями;
//    доставка выбирает машину; расчёт ангара пишет размеры в ссылку; каталог:
//    раздел, марка стали, поиск, «в заявку»; тумблеры цены и отсчёт;
// 4) сцена сборки идёт плавно: кадры при прокрутке не дольше 50 мс в среднем;
// 5) без движения (prefers-reduced-motion) сцена сразу собрана, блоки видны.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4822/proto/${"a".repeat(43)}`;
const px = process.env.HTTPS_PROXY;
/* Прокси среды — только для https (шрифты Google); макет на localhost идёт мимо него. TLS не выключаем. */
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: [...(px ? [`--proxy-server=https=${px}`, "--proxy-bypass-list=localhost;127.0.0.1"] : []), "--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="] });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);

async function open(path, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  if (!opts.video) await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(600);
  return { p, ctx, errs };
}

// 1. Страницы и ширины
for (const w of [390, 768, 1440]) {
  for (const path of ["", "katalog", "katalog#c=balka", "katalog?q=арматура"]) {
    const { p, ctx, errs } = await open(path, w, w < 800 ? 844 : 900);
    for (const k of [0.25, 0.5, 0.75, 1]) { await p.evaluate((k) => window.scrollTo(0, document.documentElement.scrollHeight * k), k); await p.waitForTimeout(150); }
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bx: getComputedStyle(document.body).overflowX }));
    if (r.ov > 0) fail(`${path || "/"} @${w}: горизонтальная прокрутка ${r.ov}px`);
    if (r.bx === "hidden") fail(`${path || "/"} @${w}: у body overflow-x:hidden`);
    if (errs.length) fail(`${path || "/"} @${w}: ${errs.join(" | ")}`);
    await ctx.close();
  }
}
ok("страницы без ошибок и прокрутки вбок, если выше нет ✗");

// Видео DevUz стоит первым и уходит само или по «Пропустить».
{
  const { p, ctx } = await open("", 390, 844, { video: true });
  const html = await (await fetch(B + "/")).text();
  const first = /<body[^>]*>\s*<div class="dzi" id="dzi"/.test(html) ? "dzi" : "";
  await p.click(".dzi-skip").catch(() => {});
  await p.waitForTimeout(800);
  const gone = await p.evaluate(() => !document.getElementById("dzi"));
  if (first === "dzi" && gone) ok("видео DevUz первым в body, «Пропустить» убирает"); else fail(`видео: первый ${first}, ушло ${gone}`);
  await ctx.close();
}

// 2. Шапка: прячется при прокрутке вниз и вверх, возвращается через 3 с
for (const [path, w] of [["", 390], ["", 1440], ["katalog", 390]]) {
  const { p, ctx } = await open(path, w, w < 800 ? 844 : 900);
  await p.mouse.wheel(0, 900); await p.waitForTimeout(300);
  const hid = await p.$eval("#top", (e) => e.classList.contains("hide"));
  await p.mouse.wheel(0, -400); await p.waitForTimeout(400);
  const up = await p.$eval("#top", (e) => e.classList.contains("hide"));
  await p.waitForTimeout(2000);
  const still = await p.$eval("#top", (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1200);
  const back = await p.$eval("#top", (e) => !e.classList.contains("hide"));
  if (hid && up && still && back) ok(`${path || "/"} @${w}: шапка прячется вниз и вверх, возвращается через 3 с`); else fail(`${path || "/"} @${w}: шапка ${hid} ${up} ${still} ${back}`);
  await ctx.close();
}

// 3. Путь покупателя на 390
{
  const { p, ctx, errs } = await open("", 390, 844);
  await p.fill("#q", "труба 40×20");
  await p.waitForTimeout(200);
  const found = await p.$$eval("#find-res .fr", (l) => l.map((x) => x.textContent));
  if (found.length === 2 && found.every((t) => /40×20/.test(t))) ok("поиск «труба 40×20»: две профильные трубы"); else fail(`поиск: ${found.join(" | ")}`);
  await p.click("#find-res [data-add]");
  await p.fill("#q", "арматура 12"); await p.waitForTimeout(200);
  const a12 = await p.$$eval("#find-res .fr b", (l) => l.map((x) => x.textContent));
  if (a12.length === 1 && a12[0] === "Арматура 12") ok("поиск «арматура 12»: ровно Арматура 12"); else fail(`арматура 12: ${a12.join(" | ")}`);
  await p.click("#find-res [data-add]");

  // калькулятор: арматура 12, 1 000 м = 0,888 т, сумма по 212 000 ₸/т
  await p.evaluate(() => document.getElementById("kalk").scrollIntoView());
  await p.fill("#cc-q", "1000"); await p.waitForTimeout(700);
  const cc = await p.evaluate(() => [document.getElementById("cc-sec").textContent, document.getElementById("cc-w").textContent, document.getElementById("cc-sum").textContent]);
  if (/Арматура 12/.test(cc[0]) && /888\s?кг/.test(cc[1]) && /188\s?256/.test(cc[2])) ok(`калькулятор: ${cc[1]}, ${cc[2]}`); else fail(`калькулятор: ${cc.join(" / ")}`);
  await p.click('#cc-mode [data-u="t"]'); await p.waitForTimeout(600);
  const qt = await p.inputValue("#cc-q");
  if (Math.abs(+qt - 0.89) < 0.011) ok("калькулятор: метры → тонны, количество пересчиталось"); else fail(`метры → тонны: ${qt}`);
  await p.click("#cc-add");

  // доставка: 15 т длиной 11,7 м в Астану — длинномер
  await p.evaluate(() => document.getElementById("dostavka").scrollIntoView());
  await p.selectOption("#dv-city", "10");
  await p.$eval("#dv-t", (e) => { e.value = "15"; e.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click('#dv-len [data-l="11.7"]'); await p.waitForTimeout(700);
  const dv = await p.evaluate(() => [document.getElementById("dv-tn").textContent, document.getElementById("dv-cost").textContent]);
  if (/Длинномер/.test(dv[0]) && /₸/.test(dv[1])) ok(`доставка: ${dv.join(", ")}`); else fail(`доставка: ${dv.join(", ")}`);

  // ангар: 24 × 48, арочный → ссылка WhatsApp с размерами
  await p.evaluate(() => document.getElementById("angar").scrollIntoView());
  await p.click('#hg-type [data-v="arch"]');
  for (const [id, v] of [["hg-w", "24"], ["hg-l", "48"]]) await p.$eval("#" + id, (e, v) => { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }, v);
  await p.waitForTimeout(600);
  const hg = decodeURIComponent(await p.getAttribute("#hg-go", "href"));
  const area = await p.textContent("#hg-a");
  if (/арочный/.test(hg) && /24 × 48/.test(hg) && /1\s?152/.test(area)) ok("ангар: арочный 24 × 48, 1 152 м², в WhatsApp с размерами"); else fail(`ангар: ${area} ${hg.slice(0, 120)}`);

  // заявка: три позиции, резка, город, БИН
  await p.click("#dock [data-cart]");
  await p.waitForTimeout(400);
  const n = await p.$$eval("#dr-list .dl-row", (l) => l.length);
  if (n === 3) ok("заявка: три позиции из поиска и калькулятора"); else fail(`заявка: ${n} позиций`);
  await p.$$eval("#dr-list .dl-row [data-cutt]", (l) => l[1].click()); await p.waitForTimeout(200);
  const rowB = (await p.$$("#dr-list .dl-row"))[1];
  await (await rowB.$("[data-cut]")).fill("3.8"); await p.waitForTimeout(200);
  const cut = await (await (await p.$$("#dr-list .dl-row"))[1].$(".dl-cutr")).textContent();
  if (/3 куска по 3,8 м, обрезок 0,3 м/.test(cut)) ok(`резка: ${cut}`); else fail(`резка: ${cut}`);
  await p.selectOption("#dr-city", "10");
  await p.fill("#dr-bin", "123456789012"); await p.waitForTimeout(100);
  const badBin = await p.textContent("#dr-binok");
  await p.fill("#dr-bin", "060540000008"); await p.waitForTimeout(100);
  const goodBin = await p.textContent("#dr-binok");
  if (/не сходится/.test(badBin) && /верный/.test(goodBin)) ok("БИН: неверный ловится, верный принят"); else fail(`БИН: «${badBin}» / «${goodBin}»`);
  await p.fill("#dr-org", "ТОО Пример"); await p.waitForTimeout(100);
  const wa = decodeURIComponent(await p.getAttribute("#dr-wa", "href"));
  if (/^https:\/\/wa\.me\/77014015624\?text=/.test(wa) && /Арматура 12/.test(wa) && /резать по 3,8 м/.test(wa) && /Астана/.test(wa) && /БИН 060540000008/.test(wa)) ok("заявка уходит в их WhatsApp: позиции, резка, город, БИН"); else fail(`ссылка заявки: ${wa.slice(0, 200)}`);
  const mail = await p.getAttribute("#dr-mail", "href");
  if (/^mailto:usemtau@mail\.ru\?subject=/.test(mail)) ok("и на их почту"); else fail(`почта: ${mail}`);
  /* Нажатие «Счёт в WhatsApp» без ухода на wa.me: переход гасим, заявка запоминается. */
  await p.evaluate(() => { const a = document.getElementById("dr-wa"); a.addEventListener("click", (e) => e.preventDefault()); a.click(); });
  await p.waitForTimeout(300);
  const past = await p.evaluate(() => JSON.parse(localStorage.getItem("um-z-1")).past.length);
  if (past === 1) ok("прошлая заявка запомнена для «Повторить»"); else fail(`прошлых заявок: ${past}`);
  if (errs.length) fail("путь покупателя: " + errs.join(" | "));
  await ctx.close();
}

// Каталог
{
  const { p, ctx, errs } = await open("katalog", 390, 844);
  const all = await p.textContent("#kt-cnt");
  await p.click('#kt-cats [data-c="list"]'); await p.waitForTimeout(150);
  await p.click('#kt-mark [data-v="09Г2С"]'); await p.waitForTimeout(150);
  const lst = await p.textContent("#kt-cnt");
  const names = await p.$$eval(".it-n b", (l) => l.map((x) => x.textContent));
  if (/268/.test(all) && /17/.test(lst) && names.every((n) => /09Г2С/.test(n))) ok(`каталог: ${all.trim()} → лист 09Г2С: ${lst.trim()}`); else fail(`каталог: ${all} / ${lst} / ${names.slice(0, 3)}`);
  await p.click('#kt-cats [data-c=""]'); await p.click('#kt-mark [data-v=""]');
  await p.fill("#kq", "балка 20"); await p.waitForTimeout(200);
  const bl = await p.$$eval(".it-n b", (l) => l.map((x) => x.textContent));
  if (bl.length >= 3 && bl.every((n) => /^Балка 20/.test(n))) ok(`поиск в каталоге «балка 20»: ${bl.join(", ")}`); else fail(`балка 20: ${bl.join(", ")}`);
  const first = await p.$(".it");
  await (await first.$("input")).fill("2"); await (await first.$("select")).selectOption("t"); await p.waitForTimeout(100);
  const s = await (await first.$(".it-s")).textContent();
  await (await first.$("[data-add]")).click(); await p.waitForTimeout(200);
  const badge = await p.$eval("#dock [data-badge]", (e) => e.textContent);
  if (/= 2\s?т/.test(s) && badge === "1") ok(`каталог: 2 т в заявку (${s.trim()})`); else fail(`каталог в заявку: ${s} / ${badge}`);
  if (errs.length) fail("каталог: " + errs.join(" | "));
  await ctx.close();
}

// Цена и отсчёт
{
  const { p, ctx } = await open("", 1440, 900);
  await p.evaluate(() => document.getElementById("cena").scrollIntoView());
  await p.click("#kit-all"); await p.waitForTimeout(700);
  const tot = await p.textContent("#kit-total-sum");
  const tm = await p.textContent("#tm");
  if (/5\s?200\s?\$/.test(tot) && /^4[78]:\d\d:\d\d$/.test(tm)) ok(`цена: все допы ${tot}, отсчёт ${tm}`); else fail(`цена: ${tot} ${tm}`);
  await ctx.close();
}

// 4. Плавность сцены: кадры при прокрутке
for (const w of [390, 1440]) {
  const { p, ctx } = await open("", w, w < 800 ? 844 : 900);
  const top = await p.evaluate(() => document.getElementById("stroyka").offsetTop);
  await p.evaluate((y) => window.scrollTo(0, y), top);
  await p.waitForTimeout(300);
  const ms = await p.evaluate(async () => {
    const a = document.getElementById("stroyka"), h = a.offsetHeight - innerHeight, t = [];
    let prev = performance.now();
    for (let i = 0; i <= 90; i++) { window.scrollTo(0, a.offsetTop + h * i / 90); await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); t.push(n - prev); prev = n; }
    return t.reduce((s, x) => s + x, 0) / t.length;
  });
  const steps = await p.$$eval(".asm-steps li.on", (l) => l.map((x) => x.textContent));
  if (ms < 50 && /Сэндвич/.test(steps[0] || "")) ok(`сцена @${w}: кадр ${ms.toFixed(1)} мс в среднем, дошла до панелей`); else fail(`сцена @${w}: ${ms.toFixed(1)} мс, шаг ${steps}`);
  await ctx.close();
}

// 5. Без движения
{
  const { p, ctx, errs } = await open("", 390, 844, { reduced: true });
  const r = await p.evaluate(() => ({ hidden: [...document.querySelectorAll(".rv")].filter((e) => getComputedStyle(e).opacity !== "1").length, t: document.getElementById("asm-t").textContent }));
  if (!r.hidden && /12,46/.test(r.t)) ok("без движения: блоки на месте, сцена собрана сразу"); else fail(`без движения: скрыто ${r.hidden}, сцена ${r.t}`);
  if (errs.length) fail("без движения: " + errs.join(" | "));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё прошло.");
process.exit(bad ? 1 : 0);
