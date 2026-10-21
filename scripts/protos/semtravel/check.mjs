// Проверка макета SEM Travel в Chromium: node check.mjs (сервер: node serve.mjs).
// 390×844, 768×1024, 1440×900, uz и ru: без ошибок в консоли и прокрутки вбок,
// шапка по правилу трёх секунд, поиск → карточка тура → бронь в их Telegram →
// статус, подбор «не знаю куда», карта и календарь, звонок, клуб, конструктор,
// плавность прокрутки, спокойная версия при prefers-reduced-motion.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const B = `http://localhost:4830/proto/${"a".repeat(43)}/`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined });
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("  ✗", m); } else console.log("  ✓", m); };

for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) for (const path of ["", "ru"]) {
  console.log(`— ${w}×${h} ${path || "uz"}`);
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); localStorage.clear(); } catch {} });
  await p.goto(B + path, { waitUntil: "load" });
  await p.waitForTimeout(1200);

  const first = await p.evaluate(() => ({ dzi: !!document.getElementById("dzi") || document.body.innerHTML.indexOf('id="dzi"') >= 0, bodyX: getComputedStyle(document.body).overflowX }));
  ok(first.bodyX !== "hidden", "у body нет overflow-x:hidden");

  // Шапка: прячется при прокрутке, возвращается через 3 секунды тишины
  await p.mouse.wheel(0, 400); await p.waitForTimeout(300);
  const hid = await p.evaluate(() => document.getElementById("top").classList.contains("hide"));
  await p.waitForTimeout(1800);
  const still = await p.evaluate(() => document.getElementById("top").classList.contains("hide"));
  await p.waitForTimeout(1600);
  const back = await p.evaluate(() => !document.getElementById("top").classList.contains("hide"));
  ok(hid && still && back, "шапка прячется при прокрутке и возвращается через 3 с");
  await p.mouse.wheel(0, -400); await p.waitForTimeout(200);
  const hidUp = await p.evaluate(() => document.getElementById("top").classList.contains("hide"));
  ok(hidUp, "шапка прячется и при прокрутке вверх");

  // Звонок и Telegram в одно нажатие с первого экрана
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  const quick = await p.evaluate(() => [...document.querySelectorAll(".quick a")].map((a) => a.getAttribute("href")));
  ok(quick.includes("tel:+998712755555") && quick.includes("https://t.me/prosem_bot"), "звонок и Telegram на первом экране");
  if (w < 1000) ok(await p.isVisible("#dock .btn-call"), "звонок внизу экрана на телефоне");

  // Поиск: Турция, декабрь, трое взрослых
  await p.click('#pn-know .chip[data-dest="turkey"]');
  await p.click('#pn-know .chip[data-m="12"]');
  await p.click('#pn-know .stp[data-step="ad"] button[data-d="1"]');
  await p.click("#go-know");
  await p.waitForTimeout(2400);
  const rez = await p.evaluate(() => ({ n: document.querySelectorAll("#rez-g .tc.in").length, t: document.getElementById("rez-t").textContent }));
  ok(rez.n === 3 && /3/.test(rez.t), `выдача: 3 тура, «${rez.t}»`);
  await p.click("#rez-g [data-tour] >> nth=1");
  await p.waitForTimeout(600);
  const tour = await p.evaluate(() => ({ open: !document.getElementById("tur").hidden, sum: document.getElementById("tu-sum").textContent, vf: document.querySelectorAll("#tu-vf dt").length, days: document.querySelectorAll("#tu-days li").length }));
  ok(tour.open && /^\$\d/.test(tour.sum) && tour.vf === 7 && tour.days === 3, `карточка тура: итог ${tour.sum}, ваучер 7 строк, 3 шага поездки`);
  await p.evaluate(() => { const r = document.getElementById("cx-r2"); r.value = 10; r.dispatchEvent(new Event("input")); });
  ok(await p.evaluate(() => !document.getElementById("cx-t2").classList.contains("ok")), "шкала отмены: 10 дней — не 100%");
  await p.click("#tu-book");
  await p.waitForTimeout(500);
  ok(await p.isVisible("#bf"), "бронь открылась");
  await p.click("#bf button[type=submit]");
  ok(await p.isVisible("#bf-e"), "пустую бронь не отправить");
  await p.fill("#bf-n", "Тест"); await p.fill("#bf-p", "+998 90 123 45 67");
  const [pop] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }).catch(() => null), p.click("#bf button[type=submit]")]);
  const url = pop ? pop.url() : "";
  if (pop) await pop.close();
  ok(/^https:\/\/t\.me\/prosem_bot\?text=/.test(url) && decodeURIComponent(url).includes("+998 90 123 45 67"), "бронь уходит в их Telegram с готовым текстом");
  ok(await p.isVisible("#stat") && await p.isVisible("#mine"), "после брони — статус заявки и «Моя заявка»");
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);

  // Подбор «не знаю куда»
  await p.evaluate(() => document.getElementById("poisk").scrollIntoView());
  await p.click("#tb-pick");
  await p.evaluate(() => { const r = document.getElementById("bud"); r.value = 900; r.dispatchEvent(new Event("input")); });
  await p.click('#pn-pick .chip[data-m="11"]');
  await p.click("#go-pick");
  await p.waitForTimeout(2400);
  const pick = await p.evaluate(() => [...document.querySelectorAll("#rez-g .tc h3")].map((e) => e.textContent));
  ok(pick.length === 3, `подбор: ${pick.join(", ")}`);
  await p.click("#rez-g [data-go] >> nth=0");
  await p.waitForTimeout(2400);
  ok(await p.evaluate(() => document.querySelectorAll("#rez-g [data-tour]").length === 3), "из подбора — в туры страны");

  // Карта: Китай, на двоих, календарь
  await p.evaluate(() => document.getElementById("karta").scrollIntoView());
  await p.waitForTimeout(1200);
  await p.click('.dot[data-dest="china"]', { force: true });
  await p.click('.karta .seg button[data-n="2"]');
  await p.waitForTimeout(800);
  const map = await p.evaluate(() => ({ t: document.getElementById("dc-t").textContent, pr: document.getElementById("dc-pr").textContent, cal: document.querySelectorAll("#cal button").length, low: document.querySelectorAll("#cal button.low").length }));
  ok(map.cal === 14 && map.low === 1 && map.pr === "$1 220", `карта: ${map.t}, на двоих ${map.pr}, календарь 14 дней`);

  // Клуб и конструктор
  await p.evaluate(() => { const r = document.getElementById("cl-sum"); r.value = 2000; r.dispatchEvent(new Event("input")); });
  await p.click('#cl-st button[data-cb="1.5"]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.getElementById("cl-cb").textContent) === "$30", "клуб: 1,5% с $2 000 = $30");
  await p.evaluate(() => document.getElementById("stoimost").scrollIntoView());
  await p.click('#konstruktor .kit-row >> nth=0'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => document.getElementById("kit-sum").textContent) === "1 400 $", "конструктор: +Турвизор = 1 400 $");
  ok(/^\d\d:\d\d:\d\d$/.test(await p.evaluate(() => document.getElementById("tm").textContent)), "отсчёт 48 часов идёт");

  // Плавность: кадры при прокрутке колесом
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push(n - l); l = n; if (window.__f.length < 240) requestAnimationFrame(t); }; requestAnimationFrame(t); });
  for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 180); await p.waitForTimeout(60); }
  const fr = await p.evaluate(() => { const a = window.__f.slice(2).sort((x, y) => x - y); return { p95: a[Math.floor(a.length * .95)], long: a.filter((x) => x > 50).length }; });
  ok(fr.long <= 3, `прокрутка: 95% кадров не дольше ${fr.p95.toFixed(1)} мс, длинных ${fr.long}`);

  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw[0] <= sw[1], `нет прокрутки вбок (${sw.join(" / ")})`);
  const real = errs.filter((e) => !/fonts\.g/.test(e));
  ok(real.length === 0, "консоль чистая" + (real.length ? ": " + real.slice(0, 3).join(" | ") : ""));
  await ctx.close();
}

// Видео DevUz первым, без пропуска
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(B, { waitUntil: "domcontentloaded" });
  ok(await p.evaluate(() => document.body.firstElementChild && document.body.firstElementChild.id === "dzi"), "видео DevUz — первым в body");
  await ctx.close();
}
// Спокойная версия
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(B + "ru", { waitUntil: "load" });
  await p.waitForTimeout(800);
  const calm = await p.evaluate(() => ({ calm: document.documentElement.classList.contains("calm"), op: getComputedStyle(document.querySelector(".gc")).opacity }));
  ok(calm.calm && calm.op === "1" && !errs.length, "prefers-reduced-motion: всё на месте, без движения");
  await ctx.close();
}
await b.close();
console.log(bad ? `ОШИБОК: ${bad}` : "Всё прошло");
process.exit(bad ? 1 : 0);
