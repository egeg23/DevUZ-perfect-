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
// 12) без движения (prefers-reduced-motion) всё на месте;
// 13) панель: ru, uz, en на 390, 768, 1440 по всем разделам без ошибок и
//     прокрутки вбок; заявка с сайта первой строкой → просмотр → предложение
//     → договор → счёт → оплата → заселение; статус блока и ставка из панели
//     видны на сайте (и без перезагрузки); «Брокер» не видит денег,
//     «Бухгалтер» не видит сделок, «Собственник» видит только свои БЦ.
//     Снимки панели — docs/screens/soffice/panel-*.png.
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
  okIf(s0 === "3440" && s1 === "2560" && /^4[78]:/.test(t1), `${at}: стоимость 3 440 $ → 2 560 $, отсчёт ${t1}`, `${at}: стоимость ${s0} ${s1} ${t1}`);
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

// 13. Панель
const PANEL = ["panel", "uz/panel", "en/panel"];
const SECS = ["dash", "leads", "views", "objects", "objects?bc=platform", "leases", "bills", "service", "owners", "demand", "team"];
for (const path of PANEL) {
  for (const w of [390, 768, 1440]) {
    const { p, ctx, errs } = await open(path, w, w < 800 ? 844 : 900);
    for (const sec of SECS) {
      await p.evaluate((s) => { location.hash = "#" + s; }, sec);
      await p.waitForTimeout(200);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 0) fail(`/${path}#${sec} @${w}: горизонтальная прокрутка ${ov}px`);
    }
    await p.evaluate(() => { location.hash = "#leads"; });
    await p.waitForTimeout(200);
    await p.click("[data-lead]");
    await p.waitForTimeout(200);
    const side = await p.$eval("#side", (e) => !e.hidden && e.getBoundingClientRect().width <= innerWidth);
    if (!side) fail(`/${path} @${w}: карточка заявки не открылась`);
    if (errs.length) fail(`/${path} @${w}: ${errs.join(" | ")}`);
    await ctx.close();
  }
  const html = await (await fetch(B + "/" + path)).text();
  if (path !== "panel") {
    const cyr = html.match(/.{0,30}[А-Яа-яЁё]+.{0,30}/g);
    okIf(!cyr, `/${path}: ни одной кириллической буквы`, `/${path}: кириллица: ${cyr && cyr.slice(0, 3).join(" | ")}`);
  }
}
ok("панель: все разделы на 390, 768, 1440, ru, uz, en без ошибок и прокрутки вбок, если выше нет ✗");

{
  const SHOTS = new URL("../../../docs/screens/soffice/", import.meta.url).pathname;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  ctx.on("page", (pg) => { pg.on("pageerror", (e) => errs.push(String(e))); });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const site = await ctx.newPage();
  await site.goto(B + "/", { waitUntil: "load" });
  await site.waitForTimeout(500);
  // Заявка с сайта: блок 4.05 Platform, день, время, WhatsApp
  await site.evaluate(() => document.getElementById("etazh").scrollIntoView());
  await site.click('.fl-tabs button[data-fl="1"]');
  await site.click('.fl-u[data-u="05"]', { force: true });
  await site.click("#fl-info [data-view]");
  await site.waitForTimeout(800);
  await site.click("[data-day]:nth-child(2)");
  await site.click('[data-time="15:00"]');
  await site.$eval("#vw-wa", (e) => { e.addEventListener("click", (ev) => ev.preventDefault()); e.click(); });
  const toastTxt = await site.$eval("#toast", (e) => e.textContent);
  const leads = await site.evaluate(() => JSON.parse(localStorage.getItem("so-leads-1") || "[]"));
  okIf(leads.length === 1 && leads[0].bc === "platform" && leads[0].unit === "4.05" && /панел/.test(toastTxt), "сайт: запись на просмотр блока 4.05 ушла заявкой в панель", `сайт: заявки ${JSON.stringify(leads)}`);
  const free0 = await site.$eval('.bc[data-id="platform"] [data-free]', (e) => e.textContent);

  const pn = await ctx.newPage();
  await pn.goto(B + "/panel#leads", { waitUntil: "load" });
  await pn.waitForTimeout(400);
  const first = await pn.$eval(".col.c-new .lc", (e) => ({ site: e.classList.contains("site"), id: e.getAttribute("data-lead"), t: e.textContent }));
  okIf(first.site && /Platform/.test(first.t), "панель: заявка с сайта первой строкой в «Новых», с Platform", `панель: первая ${JSON.stringify(first)}`);
  await pn.screenshot({ path: SHOTS + "panel-leads-1440.png" });
  await pn.click(`.lc[data-lead="${first.id}"]`);
  await pn.waitForTimeout(200);
  await pn.screenshot({ path: SHOTS + "panel-lead-card-1440.png" });
  const stage = async () => pn.evaluate((id) => (JSON.parse(localStorage.getItem("so-panel-1")).leads[id] || {}).st, first.id);
  await pn.click("#side [data-act=next]"); await pn.waitForTimeout(200);
  const s1 = await stage();
  await pn.evaluate(() => { location.hash = "#views"; });
  await pn.waitForTimeout(200);
  const vc = await pn.$$eval(".vc.site", (x) => x.length);
  okIf(s1 === "view" && vc >= 1, "панель: просмотр назначен, в календаре в день и час, выбранные на сайте", `просмотр: ${s1} ${vc}`);
  await pn.screenshot({ path: SHOTS + "panel-views-1440.png" });
  await pn.evaluate(() => { location.hash = "#leads"; });
  await pn.waitForTimeout(200);
  await pn.click(`.lc[data-lead="${first.id}"]`);
  await pn.click("#side [data-act=next]"); await pn.waitForTimeout(200);
  const s2 = await stage(), kp = await pn.evaluate((id) => JSON.parse(localStorage.getItem("so-panel-1")).leads[id].kp, first.id);
  await pn.click("#side [data-act=next]"); await pn.waitForTimeout(200);
  const st3 = await pn.evaluate((id) => { const s = JSON.parse(localStorage.getItem("so-panel-1")); return { st: s.leads[id].st, lease: s.leads[id].lease, bills: s.newBills.length, u: s.u[s.newLeases[0].uk[0]] }; }, first.id);
  okIf(s2 === "offer" && kp.length === 3 && st3.st === "contract" && st3.lease === "D-3101" && st3.bills === 1 && st3.u === "l", "панель: предложение на 3 офиса → договор D-3101, блок сдан, счёт выставлен", `сделка ${s2} ${kp} ${JSON.stringify(st3)}`);
  await pn.evaluate(() => { location.hash = "#leases"; });
  await pn.waitForTimeout(200);
  const ls1 = await pn.$eval(".tb tbody tr", (e) => e.getAttribute("data-ls") + " " + e.classList.contains("site"));
  okIf(ls1 === "D-3101 true", "панель: договор первой строкой в «Договорах»", `договоры: ${ls1}`);
  await pn.click('tr[data-ls="D-3101"]'); await pn.waitForTimeout(200);
  await pn.click('#side [data-act=doc][data-k=doc_lease]'); await pn.waitForTimeout(200);
  const doc = await pn.$eval("#doc", (e) => e.textContent);
  okIf(/D-3101/.test(doc) && /Platform/.test(doc) && /300\s000/.test(doc), "панель: договор из шаблона с блоком, площадью и ставкой", `документ: ${doc.slice(0, 120)}`);
  await pn.screenshot({ path: SHOTS + "panel-lease-doc-1440.png" });
  await pn.keyboard.press("Escape"); await pn.keyboard.press("Escape");
  await pn.evaluate(() => { location.hash = "#bills?st=open"; });
  await pn.waitForTimeout(200);
  const bill = await pn.$eval("tr.site[data-bill]", (e) => e.getAttribute("data-bill"));
  await pn.click(`tr[data-bill="${bill}"]`); await pn.waitForTimeout(200);
  await pn.screenshot({ path: SHOTS + "panel-bill-1440.png" });
  await pn.click("#side [data-act=pay][data-h=click]"); await pn.waitForTimeout(200);
  const paid = await pn.evaluate((b) => JSON.parse(localStorage.getItem("so-panel-1")).pay[b], bill);
  okIf(paid && paid.how === "click", "панель: счёт оплачен через Click", `оплата ${JSON.stringify(paid)}`);
  await pn.keyboard.press("Escape");
  await pn.evaluate(() => { location.hash = "#leads"; });
  await pn.waitForTimeout(200);
  await pn.click(`.lc[data-lead="${first.id}"]`);
  await pn.click("#side [data-act=next]"); await pn.waitForTimeout(200);
  okIf((await stage()) === "moved", "панель: после оплаты клиент заселён, эксплуатации ушёл пропуск");
  await pn.keyboard.press("Escape");

  // Статус блока и ставка из панели — на сайте, без перезагрузки
  await pn.evaluate(() => { location.hash = "#objects?bc=platform"; });
  await pn.waitForTimeout(200);
  await pn.click('.fls [data-fl="2"]');
  await pn.click('g[data-unit="platform:23"]');
  await pn.click('#pv [data-act=ust][data-s="l"]');
  await pn.fill('form[data-rate] input', "320000");
  await pn.click('form[data-rate] button[type=submit]');
  await pn.waitForTimeout(300);
  await pn.screenshot({ path: SHOTS + "panel-objects-1440.png" });
  await site.bringToFront();
  await site.waitForTimeout(400);
  await site.evaluate(() => document.getElementById("etazh").scrollIntoView());
  await site.click('.fl-tabs button[data-fl="1"]');
  const live = await site.evaluate(() => ({ u05: document.querySelector('.fl-u[data-u="05"]').classList.contains("free"), u08: document.querySelector('.fl-u[data-u="08"]').classList.contains("free"), rate: document.querySelector('.bc[data-id="platform"] [data-rate]').textContent, free: document.querySelector('.bc[data-id="platform"] [data-free]').textContent }));
  okIf(!live.u05 && !live.u08 && /320/.test(live.rate) && live.free !== free0, "сайт без перезагрузки: блоки 4.05 и 4.08 больше не свободны, ставка Platform 320 000, свободных меньше", `сайт: ${JSON.stringify(live)} было «${free0}»`);
  await site.reload({ waitUntil: "load" });
  await site.waitForTimeout(400);
  await site.evaluate(() => document.getElementById("etazh").scrollIntoView());
  await site.click('.fl-tabs button[data-fl="1"]');
  const after = await site.evaluate(() => ({ u08: document.querySelector('.fl-u[data-u="08"]').classList.contains("free"), opt: document.querySelector('#cl-bc option[value="platform"]').textContent }));
  okIf(!after.u08 && /320/.test(after.opt), "сайт после перезагрузки: блок занят, ставка в «Сколько в месяц» из панели", `сайт: ${JSON.stringify(after)}`);

  // Роли
  await pn.bringToFront();
  await pn.selectOption("#role", "broker");
  await pn.evaluate(() => { location.hash = "#dash"; });
  await pn.waitForTimeout(200);
  const br = await pn.evaluate(() => ({ money: document.querySelectorAll(".kpi.money").length, bills: document.querySelector('.nav a[href="#bills"]').hidden, owners: document.querySelector('.nav a[href="#owners"]').hidden }));
  await pn.evaluate(() => { location.hash = "#bills"; });
  await pn.waitForTimeout(200);
  const brNo = await pn.$eval("#pv h1", (e) => e.textContent);
  okIf(br.money === 0 && br.bills && br.owners && /Нет доступа/.test(brNo), "роль «Брокер»: денег нет ни в сводке, ни в меню, счета закрыты", `брокер ${JSON.stringify(br)} ${brNo}`);
  await pn.screenshot({ path: SHOTS + "panel-role-broker-1440.png" });
  await pn.selectOption("#role", "acc");
  await pn.waitForTimeout(200);
  const acc = await pn.evaluate(() => ({ leads: document.querySelector('.nav a[href="#leads"]').hidden, bills: document.querySelector('.nav a[href="#bills"]').hidden }));
  okIf(acc.leads && !acc.bills, "роль «Бухгалтер»: счета есть, сделок нет", `бухгалтер ${JSON.stringify(acc)}`);
  await pn.selectOption("#role", "own");
  await pn.selectOption("#own", "arka");
  await pn.evaluate(() => { location.hash = "#objects"; });
  await pn.waitForTimeout(200);
  const own = await pn.$$eval(".bcc b", (x) => x.map((e) => e.textContent).sort().join());
  await pn.evaluate(() => { location.hash = "#owners"; });
  await pn.waitForTimeout(200);
  const rep = await pn.evaluate(() => ({ sel: !!document.getElementById("ro"), rows: [...document.querySelectorAll(".report .tb tbody tr td:first-child b")].map((e) => e.textContent).sort().join() }));
  await pn.evaluate(() => { location.hash = "#objects?bc=forum"; });
  await pn.waitForTimeout(200);
  const forum = await pn.$eval("#pv h1", (e) => e.textContent);
  okIf(own === "Gross Plaza,Panoramic,Platform,Sapphire" && !rep.sel && rep.rows === own && !/Forum/.test(forum), "роль «Собственник БЦ»: только свои 4 здания, отчёт без выбора чужих, Forum не открывается", `собственник ${own} ${JSON.stringify(rep)} ${forum}`);
  await pn.evaluate(() => { location.hash = "#owners"; });
  await pn.waitForTimeout(200);
  await pn.screenshot({ path: SHOTS + "panel-owner-report-1440.png" });
  await pn.selectOption("#role", "owner");
  await pn.evaluate(() => { location.hash = "#dash"; });
  await pn.waitForTimeout(300);
  await pn.screenshot({ path: SHOTS + "panel-dash-1440.png" });
  okIf(!errs.length, "цикл сайт и панель без ошибок в консоли", errs.join(" | "));
  await ctx.close();
}
// Снимки на телефоне
{
  const SHOTS = new URL("../../../docs/screens/soffice/", import.meta.url).pathname;
  for (const [path, sec, name] of [["panel", "dash", "panel-dash-390"], ["panel", "leads", "panel-leads-390"], ["uz/panel", "objects?bc=platform", "panel-objects-uz-390"], ["en/panel", "bills", "panel-bills-en-390"]]) {
    const { p, ctx } = await open(path + "#" + sec, 390, 844);
    await p.screenshot({ path: SHOTS + name + ".png" });
    await ctx.close();
  }
  const { p, ctx } = await open("", 1440, 900);
  await p.evaluate(() => document.getElementById("panel").scrollIntoView());
  await p.waitForTimeout(2500);
  await p.screenshot({ path: SHOTS + "home-panel-1440.png" });
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
