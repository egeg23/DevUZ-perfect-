// Проверка макета «Сияние Севера» в Chromium. Сервер: node serve.mjs (порт 4821).
//   node scripts/protos/syanie/check.mjs
// 1) 390×844, 768×1024, 1440×900: без ошибок в консоли и без горизонтальной
//    прокрутки, у body нет overflow-x:hidden (иначе sticky не держится);
// 2) кино идёт после видео DevUz, потом прокрутка ведёт кадры: кадр меняется,
//    пустых кадров нет, главы появляются, счётчик имплантов доходит до 6;
// 3) шапка прячется при прокрутке и возвращается через 3 секунды, не раньше;
// 4) квиз из 4 шагов, запись в два нажатия, звонок, вопросы, сравнение 6/4,
//    конструктор цены кликаются;
// 5) без движения (prefers-reduced-motion) — спокойная версия с кадрами.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4821/proto/${"a".repeat(43)}/`;
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
  if (opts.skipIntro) await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  await p.goto(B, { waitUntil: "load" });
  return { p, ctx, errs };
}

for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const { p, ctx, errs } = await open(w, h, { skipIntro: true });
  await p.waitForTimeout(1500);
  const fv = await p.evaluate(() => { const v = document.getElementById("film"); return { play: !v.paused && v.currentTime > 0, codec: !!v.error && v.error.code === 4, done: document.getElementById("stage").classList.contains("done") }; });
  // В Chromium из Playwright нет H.264 (у Chrome и Safari есть): там видео
  // не играет, и проверяется запасной путь — сразу сцена с первым кадром.
  if (fv.play) ok(`@${w}: кино идёт`);
  else if (fv.codec && fv.done) ok(`@${w}: в этом Chromium нет H.264, кино уступило сцене`);
  else fail(`@${w}: кино не заиграло ${JSON.stringify(fv)}`);
  await p.evaluate(() => document.getElementById("skipf").click());
  await p.waitForTimeout(800);
  const heroOn = await p.$eval("#hero", (e) => e.classList.contains("on"));
  if (heroOn) ok(`@${w}: после кино первый экран с заголовком`); else fail(`@${w}: нет первого экрана после кино`);
  // Прокрутка сцены: кадры, главы, счётчик
  const total = await p.evaluate(() => document.getElementById("story").offsetHeight - innerHeight);
  const marks = [];
  for (const k of [0.12, 0.26, 0.43, 0.6, 0.9, 1]) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(total * k));
    await p.waitForTimeout(1200);
    marks.push(await p.evaluate(() => {
      const c = document.getElementById("cv"), x = c.getContext("2d");
      const d = x.getImageData(c.width / 2 - 20, c.height / 2 - 20, 40, 40).data;
      let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
      const vis = [...document.querySelectorAll(".ch")].filter((e) => getComputedStyle(e).visibility === "visible" && +getComputedStyle(e).opacity > .5).map((e) => e.id);
      return { s, vis, n: document.getElementById("ct-n").textContent };
    }));
  }
  if (marks.every((m) => m.s > 1000)) ok(`@${w}: пустых кадров нет`); else fail(`@${w}: пустой кадр ${JSON.stringify(marks.map((m) => m.s))}`);
  if (new Set(marks.map((m) => m.s)).size >= 5) ok(`@${w}: кадры меняются с прокруткой`); else fail(`@${w}: кадр стоит`);
  const seen = new Set(marks.flatMap((m) => m.vis));
  if (seen.size >= 3) ok(`@${w}: главы ${[...seen].join(", ")}`); else fail(`@${w}: главы не появились ${[...seen]}`);
  if (marks.some((m) => m.n === "6")) ok(`@${w}: счётчик имплантов до 6`); else fail(`@${w}: счётчик ${marks.map((m) => m.n)}`);
  // Вся страница
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bx: getComputedStyle(document.body).overflowX }));
  if (r.ov > 0) fail(`@${w}: горизонтальная прокрутка ${r.ov}px`); else ok(`@${w}: вбок не едет`);
  if (r.bx === "hidden") fail(`@${w}: у body overflow-x:hidden`);
  if (errs.length) fail(`@${w}: ошибки ${errs.join(" | ")}`); else ok(`@${w}: консоль чистая`);
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

// Квиз, запись, звонок, вопросы, сравнение, конструктор на телефоне
{
  const { p, ctx, errs } = await open(390, 844, { skipIntro: true });
  await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById("kviz").scrollIntoView());
  for (let i = 0; i < 4; i++) { await p.locator(`.qz-s[data-s="${i}"] .qz-o`).last().click(); await p.waitForTimeout(700); }
  const href = await p.$eval("#qz-sms", (a) => a.getAttribute("href"));
  if (/^sms:\+73822270077\?&body=.*All-on-6/.test(decodeURIComponent(href)) && (await p.locator("#qz-sum li").count()) === 4) ok("квиз: 4 шага, расчёт в SMS клинике"); else fail("квиз не дошёл до расчёта");
  await p.locator(".dock [data-book]").click(); await p.waitForTimeout(500);
  await p.locator('.chip[data-day="Сегодня"]').click(); await p.locator('.chip[data-part="Утром"]').click();
  const bk = await p.$eval("#bk-go", (a) => [a.textContent, decodeURIComponent(a.getAttribute("href"))]);
  if (/сегодня утром/.test(bk[0]) && /Удобно: сегодня, утром/.test(bk[1])) ok("запись в два нажатия"); else fail("запись: " + bk);
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  if ((await p.locator('a[href="tel:+73822270077"]').count()) >= 3) ok("звонок в одно нажатие"); else fail("нет звонка");
  await p.evaluate(() => document.getElementById("voprosy").scrollIntoView());
  await p.locator(".fq-q").first().click(); await p.waitForTimeout(700);
  const fq = await p.evaluate(() => { const i = document.querySelector(".fq-i"); return [i.classList.contains("open"), i.querySelector(".fq-a").getBoundingClientRect().height]; });
  await p.locator(".fq-q").nth(1).focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
  const kb = await p.$eval(".fq-q >> nth=1", (b) => b.getAttribute("aria-expanded"));
  if (fq[0] && fq[1] > 40 && kb === "true") ok(`вопросы раскрываются, высота ${Math.round(fq[1])}px, с клавиатуры тоже`); else fail("вопросы " + fq + " " + kb);
  await p.evaluate(() => document.getElementById("all-on-6").scrollIntoView());
  await p.locator('.vs-tg button[data-n="4"]').click(); await p.waitForTimeout(300);
  if ((await p.$eval("#vs-n", (e) => e.textContent)) === "4") ok("сравнение 6 / 4 переключается"); else fail("сравнение");
  await p.evaluate(() => document.getElementById("stoimost").scrollIntoView());
  await p.locator("#kit-all").click(); await p.waitForTimeout(800);
  const sum = await p.$eval("#kit-sum", (e) => e.textContent);
  if (/5 010 \$/.test(sum)) ok("конструктор: все допы 5 010 $"); else fail("конструктор " + sum);
  if (errs.length) fail("ошибки: " + errs.join(" | "));
  await ctx.close();
}

// Без движения
{
  const { p, ctx } = await open(390, 844, { reduced: true });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ calm: document.documentElement.classList.contains("calm"), figs: document.querySelectorAll(".calm-f").length, vis: getComputedStyle(document.querySelector(".calm-list")).display, film: getComputedStyle(document.getElementById("film")).display }));
  if (r.calm && r.figs === 4 && r.vis !== "none" && r.film === "none") ok("reduced motion: спокойная версия, 4 кадра с текстом"); else fail("reduced " + JSON.stringify(r));
  await ctx.close();
}

await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
