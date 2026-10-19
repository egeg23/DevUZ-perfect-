// Проверка макета Soffice в Chromium. Сервер: node serve.mjs (порт 4823).
//   node scripts/protos/soffice/check.mjs
// 1) ru, uz, en на 360, 390, 768, 1024, 1440: без ошибок в консоли, без
//    горизонтальной прокрутки, у body нет overflow-x:hidden (иначе sticky не
//    держится); в uz и en ни одной кириллической буквы во всём html;
// 2) видео DevUz первым слоем, «Пропустить» на языке страницы;
// 3) шапка прячется при прокрутке вниз и вверх и возвращается через 3 с;
// 4) подбор: площадь, район, бюджет меняют «подходят N» и точки на карте;
// 5) карта: нажатие на точку открывает карточку БЦ с суммой в месяц;
// 6) каталог: фильтр района, сравнение трёх, «На просмотр» с карточки;
// 7) калькулятор: площадь и НДС меняют сумму;
// 8) этаж: свободный блок открывает сумму и запись на этот блок;
// 9) просмотр: день и время → WhatsApp с готовым текстом;
// 10) стоимость: допы меняют итог, отсчёт 48 часов идёт;
// 11) телефон с замедленным в 4 раза процессором: кадры при прокрутке;
// 12) без движения (prefers-reduced-motion) всё на месте.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4823/proto/${"a".repeat(43)}`;
const args = ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="];
if (process.env.HTTPS_PROXY) args.push("--proxy-server=" + process.env.HTTPS_PROXY, "--proxy-bypass-list=localhost;127.0.0.1");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);
const okIf = (c, m, e) => (c ? ok(m) : fail(e || m));

async function open(path, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  if (!opts.intro) await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B + "/" + path, { waitUntil: "load" });
  await p.waitForTimeout(600);
  return { p, ctx, errs };
}
const LANGS = ["", "uz", "en"];

// 1. Ширины и языки
for (const path of LANGS) {
  for (const w of [360, 390, 768, 1024, 1440]) {
    const { p, ctx, errs } = await open(path, w, w < 800 ? 844 : 900);
    for (const k of [0.25, 0.5, 0.75, 1]) {
      await p.evaluate((k) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * k), k);
      await p.waitForTimeout(150);
    }
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bx: getComputedStyle(document.body).overflowX, lang: document.documentElement.lang }));
    if (r.ov > 0) fail(`/${path} @${w}: горизонтальная прокрутка ${r.ov}px`);
    if (r.bx === "hidden") fail(`/${path} @${w}: у body overflow-x:hidden`);
    if (r.lang !== (path || "ru")) fail(`/${path}: <html lang="${r.lang}">`);
    if (errs.length) fail(`/${path} @${w}: ${errs.join(" | ")}`);
    await ctx.close();
  }
  if (path) {
    const html = await (await fetch(B + "/" + path)).text();
    const cyr = html.match(/.{0,30}[А-Яа-яЁё]+.{0,30}/g);
    okIf(!cyr, `/${path}: ни одной кириллической буквы`, `/${path}: кириллица: ${cyr && cyr.slice(0, 3).join(" | ")}`);
  }
}
ok("страницы без ошибок и прокрутки вбок на 360-1440, если выше нет ✗");

// 2. Видео DevUz: в разметке первым в <body>; в Chromium без H.264 видео не
//    играет, и заставка по правилу сразу уходит, поэтому смотрим html.
for (const path of LANGS) {
  const html = await (await fetch(B + "/" + path)).text();
  const body = html.slice(html.indexOf("<body"));
  const first = /^<body[^>]*>\n<div class="dzi" id="dzi" role="presentation"><div class="dz-vid"/.test(body);
  const skip = (body.match(/class="dzi-skip">([^<]+)</) || [])[1];
  okIf(first && /<video muted playsinline/.test(body) && skip === { "": "Пропустить", uz: "O‘tkazib yuborish", en: "Skip" }[path], `/${path}: видео DevUz первым в <body>, «${skip}»`, `/${path}: заставка ${first} ${skip}`);
  const { p, ctx, errs } = await open(path, 390, 844, { intro: true });
  await p.waitForTimeout(1500);
  const gone = await p.evaluate(() => !document.getElementById("dzi"));
  okIf(gone && !errs.length, `/${path}: без видео заставка уходит сама, ошибок нет`, `/${path}: заставка не ушла ${errs}`);
  await ctx.close();
}

// 3. Шапка
for (const path of LANGS) {
  for (const dir of [1, -1]) {
    const { p, ctx } = await open(path, 390, 844);
    if (dir < 0) { await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(3400); }
    await p.mouse.wheel(0, 500 * dir); await p.waitForTimeout(300);
    await p.mouse.wheel(0, 300 * dir); await p.waitForTimeout(400);
    const hid = await p.$eval("#top", (e) => e.classList.contains("hide"));
    await p.waitForTimeout(1900);
    const still = await p.$eval("#top", (e) => e.classList.contains("hide"));
    await p.waitForTimeout(1200);
    const back = await p.$eval("#top", (e) => !e.classList.contains("hide"));
    okIf(hid && still && back, `/${path}: шапка прячется при прокрутке ${dir > 0 ? "вниз" : "вверх"} и возвращается через 3 с`, `/${path} ${dir}: шапка ${hid} ${still} ${back}`);
    await ctx.close();
  }
}

// 4-10. Механики на 390 и 1440
for (const [path, w, h] of [["", 390, 844], ["uz", 390, 844], ["en", 390, 844], ["", 1440, 900]]) {
  const at = `/${path} @${w}`;
  const { p, ctx, errs } = await open(path, w, h);
  // 4. Подбор
  const n0 = await p.$eval("#fd-n", (e) => +e.textContent);
  await p.$eval("#fd-budget", (e) => { e.value = 100; e.dispatchEvent(new Event("input")); });
  const n1 = await p.$eval("#fd-n", (e) => +e.textContent);
  await p.selectOption("#fd-where", "d:yunusabad");
  const n2 = await p.$eval("#fd-n", (e) => +e.textContent);
  await p.click('.chip-s[data-area="500"]');
  const area = await p.$eval("#fd-area-o", (e) => e.textContent);
  const dim = await p.$$eval(".pin.dim", (x) => x.length);
  okIf(n0 === 9 && n1 === 17 && n2 === 4 && area === "500" && dim >= 14, `${at}: подбор 9 → 17 (Infinity от 130 м²) → 4 в Юнусабаде, площадь 500, точки на карте гаснут`, `${at}: подбор ${n0} ${n1} ${n2} ${area} ${dim}`);
  await p.selectOption("#fd-where", "");
  await p.$eval("#fd-budget", (e) => { e.value = 45; e.dispatchEvent(new Event("input")); });
  await p.click('.chip-s[data-area="100"]');
  // «Подобрать офис» ведёт к каталогу
  await p.click(w < 1000 ? ".fd-go" : ".fd-go");
  await p.waitForTimeout(900);
  const atCat = await p.evaluate(() => { const r = document.getElementById("katalog").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  okIf(atCat, `${at}: «Подобрать офис» ведёт к каталогу`);
  // 5. Карта
  await p.evaluate(() => document.getElementById("karta").scrollIntoView());
  await p.waitForTimeout(700);
  await p.click('.pin[data-id="trilliant"]', { force: true });
  const mc = await p.$eval("#mp-card", (e) => e.textContent);
  okIf(/Trilliant/.test(mc) && /54/.test(mc), `${at}: точка на карте открывает Trilliant с суммой в месяц`, `${at}: карточка «${mc.slice(0, 80)}»`);
  await p.click('.mp-chip[data-id="kayan"]');
  okIf(/Kayan/.test(await p.$eval("#mp-card", (e) => e.textContent)), `${at}: список под картой открывает Kayan`);
  // 6. Каталог
  await p.evaluate(() => document.getElementById("katalog").scrollIntoView());
  await p.uncheck("#flt-fit", { force: true });
  await p.click('.chip[data-f="d"][data-v="yakkasaray"]');
  const yk = await p.$$eval(".bc:not([hidden])", (x) => x.map((e) => e.getAttribute("data-d")));
  okIf(yk.length === 5 && yk.every((x) => x === "yakkasaray"), `${at}: фильтр района: 5 в Яккасарае`, `${at}: фильтр ${yk}`);
  await p.click('.chip[data-f="d"][data-v=""]');
  await p.click('.chip[data-f="t"][data-v="cowork"]');
  const cw = await p.$$eval(".bc:not([hidden])", (x) => x.map((e) => e.getAttribute("data-id")).sort().join());
  okIf(cw === "kayan,modera", `${at}: коворкинг — Kayan и Modera`, `${at}: коворкинг ${cw}`);
  await p.click('.chip[data-f="t"][data-v=""]');
  for (const id of ["platform", "forum", "nestone", "sapphire"]) await p.click(`.bc[data-id="${id}"] .bc-cmp span`);
  const sel = await p.$$eval("[data-cmp]:checked", (x) => x.length);
  await p.click("#cmp-open");
  const cc = await p.$$eval("#cmp .cc", (x) => x.length);
  okIf(sel === 3 && cc === 3, `${at}: сравнение — не больше трёх, три рядом`, `${at}: сравнение ${sel} ${cc}`);
  await p.click('#cmp .cc button[data-view="forum"]');
  await p.waitForTimeout(900);
  const vbc = await p.$eval("#vw-bc", (e) => e.value);
  okIf(vbc === "forum", `${at}: «На просмотр» из сравнения ставит Forum в запись`);
  // 7. Калькулятор
  await p.evaluate(() => document.getElementById("raschet").scrollIntoView());
  await p.selectOption("#cl-bc", "forum");
  await p.$eval("#cl-area", (e) => { e.value = 200; e.dispatchEvent(new Event("input")); });
  const m1 = await p.$eval("#cl-m", (e) => e.textContent.replace(/\D/g, ""));
  await p.check('input[name="cl-vat"][value="1"]', { force: true });
  const vat = await p.$eval("#cl-novat", (e) => e.textContent.replace(/\D/g, ""));
  okIf(m1 === "96000000" && vat === String(Math.round(96000000 / 1.12)), `${at}: калькулятор Forum 200 м² = 96 млн, с НДС и без`, `${at}: калькулятор ${m1} ${vat}`);
  await p.check('input[name="cl-vat"][value="0"]', { force: true });
  // 8. Этаж
  await p.evaluate(() => document.getElementById("etazh").scrollIntoView());
  await p.waitForTimeout(400);
  await p.click('.fl-tabs button[data-fl="1"]');
  await p.click('.fl-u[data-u="05"]', { force: true });
  const fi = await p.$eval("#fl-info", (e) => e.textContent);
  okIf(/4\.05/.test(fi) && /45/.test(fi), `${at}: этаж 4, блок 4.05: 150 м² за 45 млн`, `${at}: этаж «${fi.slice(0, 80)}»`);
  await p.click("#fl-info [data-view]");
  await p.waitForTimeout(900);
  // 9. Просмотр
  await p.click("[data-day]:nth-child(2)");
  await p.click('[data-time="15:00"]');
  const wa = await p.$eval("#vw-wa", (e) => decodeURIComponent(e.href));
  okIf(/wa\.me\/998997307007\?text=/.test(wa) && /Platform/.test(wa) && /4\.05/.test(wa) && /150/.test(wa) && /15:00/.test(wa), `${at}: просмотр в два нажатия: WhatsApp с Platform, блоком 4.05, 150 м² и 15:00`, `${at}: ${wa.slice(0, 160)}`);
  // 10. Стоимость
  const s0 = await p.$eval("#kit-sum", (e) => e.textContent.replace(/\D/g, ""));
  await p.click("#kit-new");
  await p.waitForTimeout(700);
  const s1 = await p.$eval("#kit-sum", (e) => e.textContent.replace(/\D/g, ""));
  const t1 = await p.$eval("#tm", (e) => e.textContent);
  okIf(s0 === "3040" && s1 === "2560" && /^4[78]:/.test(t1), `${at}: стоимость 3 040 $ → 2 560 $, отсчёт ${t1}`, `${at}: стоимость ${s0} ${s1} ${t1}`);
  if (errs.length) fail(`${at}: ${errs.join(" | ")}`);
  await ctx.close();
}

// 11. Кадры при прокрутке на медленном телефоне
{
  const { p, ctx } = await open("", 390, 844);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const r = await p.evaluate(async () => {
    const ts = []; let on = true;
    const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
    const H = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y < H; y += 60) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 16)); }
    on = false;
    const dt = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
    return { frames: dt.length, med: dt[Math.floor(dt.length / 2)], p95: dt[Math.floor(dt.length * 0.95)] };
  });
  okIf(r.med < 40, `телефон, процессор ×4: кадр при прокрутке ${r.med.toFixed(0)} мс (95% ≤ ${r.p95.toFixed(0)} мс)`, `кадры ${JSON.stringify(r)}`);
  await ctx.close();
}

// 12. Без движения
{
  const { p, ctx, errs } = await open("", 390, 844, { reduced: true });
  await p.evaluate(() => window.scrollTo(0, document.getElementById("katalog").offsetTop));
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => ({ op: getComputedStyle(document.querySelector(".bc")).opacity, pin: getComputedStyle(document.querySelector(".pin")).opacity, img: document.querySelectorAll(".hr-img.on").length }));
  okIf(r.op === "1" && r.img === 1 && !errs.length, "без движения: всё видно сразу, первый кадр стоит", `без движения ${JSON.stringify(r)} ${errs}`);
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
