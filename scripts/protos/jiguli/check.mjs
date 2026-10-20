// Проверка макета «Жигули Рестобар» в Chromium. Сервер: node serve.mjs (порт 4822).
//   node scripts/protos/jiguli/check.mjs
// 1) 390×844, 768×1024, 1440×900, ru и uz: без ошибок в консоли и без
//    горизонтальной прокрутки, у body нет overflow-x:hidden (иначе sticky не
//    держится);
// 2) после видео DevUz — 18+; кино по прокрутке: кадр меняется, пустых кадров
//    нет, экран темнеет к струе, главы появляются, между кадрами мягкая смесь;
// 3) меню «замороженным мгновением»: четыре сцены, время идёт от прокрутки,
//    блик идёт за курсором;
// 4) шапка прячется при прокрутке и возвращается через 3 секунды, не раньше;
// 5) бронь в два нажатия, звонок, «Всё меню», 18+, конструктор цены;
// 6) без движения (prefers-reduced-motion) — спокойные кадры.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4822/proto/${"a".repeat(43)}/`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
const ok = (m) => console.log("✓", m);

async function open(w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_TUNNEL|net::ERR/.test(m.text())) errs.push(m.text()); });
  if (opts.skipIntro) await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); if (!location.hash.includes("ask")) localStorage.setItem("jg-18", "1"); } catch {} });
  await p.goto(B + (opts.path || "") + (opts.hash || ""), { waitUntil: "load" });
  return { p, ctx, errs };
}

for (const path of ["", "uz"]) for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const at = `${path || "ru"} @${w}`;
  const { p, ctx, errs } = await open(w, h, { skipIntro: true, path });
  await p.waitForTimeout(1500);
  const total = await p.evaluate(() => document.getElementById("story").offsetHeight - innerHeight);
  const marks = [];
  for (const k of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.95, 1]) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(total * k));
    await p.waitForTimeout(1300);
    marks.push(await p.evaluate(() => {
      const c = document.getElementById("cv"), x = c.getContext("2d");
      const dd = x.getImageData(c.width / 2 - 30, c.height / 2 - 30, 60, 60).data;
      let s = 0; for (let i = 0; i < dd.length; i += 4) s += dd[i] + dd[i + 1] + dd[i + 2];
      const vis = [...document.querySelectorAll(".ch")].filter((e) => getComputedStyle(e).visibility === "visible" && +getComputedStyle(e).opacity > .5).map((e) => e.id);
      return { s, vis, dark: +getComputedStyle(document.getElementById("stage")).getPropertyValue("--dark") || 0 };
    }));
  }
  const black = marks.filter((m, i) => i !== 4 && i !== 5);
  if (black.every((m) => m.s > 3000)) ok(`${at}: пустых кадров нет`); else fail(`${at}: пустой кадр ${JSON.stringify(marks.map((m) => m.s))}`);
  if (new Set(marks.map((m) => m.s)).size >= 6) ok(`${at}: кадры меняются с прокруткой`); else fail(`${at}: кадр стоит`);
  if (marks[0].dark < .1 && marks[7].dark > .9) ok(`${at}: от плаката к чёрному экрану струи`); else fail(`${at}: темнота ${marks.map((m) => m.dark)}`);
  const seen = new Set(marks.flatMap((m) => m.vis));
  if (seen.size >= 3) ok(`${at}: главы ${[...seen].join(", ")}`); else fail(`${at}: главы ${[...seen]}`);
  /* Меню: сцены, время от прокрутки, блик за курсором */
  const fz = await p.evaluate(() => [...document.querySelectorAll(".fz")].map((e) => e.id));
  if (fz.length === 4) ok(`${at}: четыре сцены меню`); else fail(`${at}: сцен ${fz.length}`);
  await p.evaluate(() => { const e = document.getElementById("fz-sour"); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + e.offsetHeight * .3); });
  await p.waitForTimeout(700);
  const t0 = await p.$eval("#fz-sour .fz-fr", (e) => +e.style.getPropertyValue("--t"));
  await p.mouse.move(w * .7, h * .4); await p.mouse.move(w * .72, h * .42, { steps: 4 }); await p.waitForTimeout(900);
  const gl = await p.$eval("#fz-sour .fz-fr", (e) => +e.style.getPropertyValue("--gl"));
  await p.mouse.wheel(0, 300); await p.waitForTimeout(700);
  const t1 = await p.$eval("#fz-sour .fz-fr", (e) => +e.style.getPropertyValue("--t"));
  const px = await p.evaluate(() => { const c = document.querySelector("#fz-sour .fz-fx"), x = c.getContext("2d"), dd = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < dd.length; i += 16) if (dd[i] > 20) n++; return n; });
  if (t1 > t0 && px > 20) ok(`${at}: сцена движется с прокруткой, капли и лёд кодом (${px})`); else fail(`${at}: сцена t ${t0}→${t1}, частиц ${px}`);
  if (w >= 1024) { if (gl > .3) ok(`${at}: блик за курсором`); else fail(`${at}: блик ${gl}`); }
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bx: getComputedStyle(document.body).overflowX, cyr: document.documentElement.lang === "uz" ? (document.body.innerText.match(/[А-Яа-яЁё]/g) || []).length : 0 }));
  if (r.ov > 0) fail(`${at}: горизонтальная прокрутка ${r.ov}px`); else ok(`${at}: вбок не едет`);
  if (r.bx === "hidden") fail(`${at}: у body overflow-x:hidden`);
  if (r.cyr) fail(`${at}: кириллица на узбекской странице (${r.cyr})`);
  if (errs.length) fail(`${at}: ошибки ${errs.join(" | ")}`); else ok(`${at}: консоль чистая`);
  await ctx.close();
}

// Шапка: правило трёх секунд
{
  const { p, ctx } = await open(390, 844, { skipIntro: true });
  await p.waitForTimeout(600);
  await p.mouse.wheel(0, 900); await p.waitForTimeout(300);
  await p.mouse.wheel(0, 400); await p.waitForTimeout(400);
  const hid = await p.$eval("#top", (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1800);
  const still = await p.$eval("#top", (e) => e.classList.contains("hide"));
  await p.waitForTimeout(1500);
  const back = await p.$eval("#top", (e) => !e.classList.contains("hide"));
  if (hid && still && back) ok("шапка прячется и возвращается через 3 с"); else fail(`шапка ${hid} ${still} ${back}`);
  await ctx.close();
}

// 18+, бронь, звонок, всё меню, конструктор на телефоне
for (const path of ["", "uz"]) {
  const { p, ctx, errs } = await open(390, 844, { skipIntro: true, path, hash: "#ask" });
  await p.waitForTimeout(900);
  const shown = await p.$eval("#age", (e) => !e.hidden);
  await p.locator("#age-yes").click(); await p.waitForTimeout(300);
  const gone = await p.$eval("#age", (e) => e.hidden);
  const kept = await p.evaluate(() => localStorage.getItem("jg-18"));
  if (shown && gone && kept === "1") ok(`${path || "ru"}: 18+ спрашивает и запоминает`); else fail(`${path || "ru"}: 18+ ${shown} ${gone} ${kept}`);
  await p.locator(".dock [data-book]").click(); await p.waitForTimeout(500);
  const day = path ? "Ertaga" : "Завтра";
  await p.locator(`#zapis .chip[data-day="${day}"]`).click(); await p.locator('#zapis .chip[data-g="6"]').click();
  const bk = await p.$eval("#bk-go-m", (a) => [a.textContent, decodeURIComponent(a.getAttribute("href"))]);
  if (new RegExp(day.toLowerCase()).test(bk[0]) && /^sms:\+998998271003\?&body=/.test(bk[1]) && /: 6\.$/.test(bk[1]) ) ok(`${path || "ru"}: бронь в два нажатия → ${bk[1].slice(30, 110)}`); else fail("бронь: " + bk);
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  if ((await p.locator('a[href="tel:+998998271003"]').count()) >= 3) ok("звонок в одно нажатие"); else fail("нет звонка");
  await p.evaluate(() => document.getElementById("full-open").scrollIntoView({ block: "center" }));
  await p.locator("#full-open").click(); await p.waitForTimeout(500);
  const n1 = await p.locator("#pn-eat li").count();
  await p.locator("#tb-drink").click(); await p.waitForTimeout(200);
  const vis = await p.$eval("#pn-drink", (e) => !e.hidden);
  const n2 = await p.locator("#pn-drink li").count();
  if (n1 > 200 && n2 > 150 && vis) ok(`«Всё меню»: поесть ${n1}, попить ${n2}`); else fail(`всё меню ${n1} ${n2} ${vis}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await p.evaluate(() => document.getElementById("stoimost").scrollIntoView());
  await p.locator("#kit-all").click(); await p.waitForTimeout(800);
  const sum = await p.$eval("#kit-sum", (e) => e.textContent);
  if (/3 075 \$/.test(sum)) ok("конструктор: всё вместе 3 075 $"); else fail("конструктор " + sum);
  if (errs.length) fail("ошибки: " + errs.join(" | "));
  await ctx.close();
}

// «Нет 18» — бар не показывает себя дальше
{
  const { p, ctx } = await open(390, 844, { skipIntro: true, hash: "#ask" });
  await p.waitForTimeout(800);
  await p.locator("#age-no").click(); await p.waitForTimeout(200);
  const r = await p.evaluate(() => [!document.getElementById("age").hidden, document.getElementById("age-p").textContent]);
  if (r[0] && /лимонад/.test(r[1])) ok("«Мне нет 18»: остаётся на подставке, предлагает лимонад"); else fail("нет 18: " + r);
  await ctx.close();
}

// Без движения
{
  const { p, ctx } = await open(390, 844, { reduced: true, skipIntro: true });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ calm: document.documentElement.classList.contains("calm"), poster: getComputedStyle(document.querySelector(".st-calm")).display, cv: getComputedStyle(document.getElementById("cv")).display, fx: getComputedStyle(document.querySelector(".fz-fx")).display }));
  if (r.calm && r.poster !== "none" && r.cv === "none" && r.fx === "none") ok("reduced motion: плакат и кадры без движения"); else fail("reduced " + JSON.stringify(r));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
