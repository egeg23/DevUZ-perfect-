// Проверка макета CZECHFARM в Chromium. Сервер: SCENE_KEY=<64 hex> node serve.mjs (порт 4831).
//   node scripts/protos/chechfarm/check.mjs
// 1) все страницы ru, uz, en на 390, 768, 1440: без ошибок, без прокрутки
//    вбок, шапка прячется при прокрутке и возвращается через 3 с;
// 2) весь путь на каждой ширине: форма партнёра → обращение в панели первой
//    строкой → статус в панели → статус на сайте в «Мои обращения»;
//    новость и продукт из панели → на сайте; заголовок вкладки из панели;
// 3) роли: менеджер не видит инвесторов и SEO; цепочка: импульс идёт сам,
//    нажатие на узел останавливает и показывает шаг.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const BASE = "http://localhost:4831/proto/" + "A".repeat(43);
const PAGES = ["", "about", "products", "partners", "investors", "news", "contacts", "panel"];
const LANGS = ["", "uz/", "en/"];
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } };
const b = await chromium.launch({ args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const w of [390, 768, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); sessionStorage.setItem("cf-intro", "1"); } catch {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
  for (const l of LANGS) for (const p of PAGES) {
    const path = (l + p).replace(/\/$/, "");
    await pg.goto(`${BASE}/${path}`, { waitUntil: "load" });
    const sx = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(sx <= 0, `${w} /${path}: прокрутка вбок ${sx}px`);
  }
  ok(!errs.length, `${w}: ошибки ${errs.join(" | ")}`);

  // Шапка: прокрутили — спряталась, через 3 с вернулась.
  await pg.goto(`${BASE}/about`, { waitUntil: "load" });
  await pg.mouse.wheel(0, 800); await pg.waitForTimeout(400);
  /* На компьютере шапка стоит всегда (владелец, 27.10.2026), на телефоне прячется. */
  ok((await pg.$eval("#top", (e) => e.classList.contains("hide"))) === (w < 1080), `${w}: шапка ведёт себя не по правилу`);
  await pg.waitForTimeout(3300);
  ok(!(await pg.$eval("#top", (e) => e.classList.contains("hide"))), `${w}: шапка не вернулась через 3 с`);

  // Цепочка: идёт сама, нажатие — остановка на шаге.
  await pg.goto(`${BASE}/investors`, { waitUntil: "load" });
  await pg.locator("#model").scrollIntoViewIfNeeded(); await pg.waitForTimeout(3000);
  const lit = await pg.$$eval(".ch-svg", (s) => s.filter((x) => x.getBoundingClientRect().width > 0)[0].querySelectorAll(".ch-n.on").length);
  ok(lit >= 2, `${w}: импульс не идёт по цепочке (${lit})`);
  const node = pg.locator(".ch-svg:visible .ch-n").nth(5).locator("circle.o");
  await node.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await node.click();
  ok((await pg.textContent(".ch-card h3")) === "Денежный поток", `${w}: нажатие на узел не показало шаг`);

  // Путь: форма партнёра → панель → статус → сайт.
  await pg.goto(`${BASE}/partners`, { waitUntil: "load" });
  await pg.locator("#form form button[type=submit]").click();
  ok(await pg.$eval("#form .fl.bad", () => true).catch(() => false), `${w}: пустая форма ушла без проверки`);
  await pg.fill('#form [name="org"]', "Test Pharma"); await pg.fill('#form [name="country"]', "Германия");
  await pg.fill('#form [name="name"]', "Анна"); await pg.fill('#form [name="email"]', "anna@test");
  await pg.fill('#form [name="msg"]', "Хотим обсудить выход на рынок"); await pg.check('#form [name="agree"]');
  await pg.locator("#form form button[type=submit]").click();
  ok(await pg.$eval('#form [name="email"]', (e) => e.closest(".fl").classList.contains("bad")), `${w}: кривая почта прошла`);
  await pg.fill('#form [name="email"]', "anna@test.com");
  await pg.locator("#form form button[type=submit]").click();
  await pg.waitForSelector("#form .sent:not([hidden])");
  const no = await pg.textContent("#form .sent [data-no]");
  ok(/^S[0-9A-Z]{6}$/.test(no), `${w}: нет номера обращения (${no})`);

  await pg.goto(`${BASE}/panel#leads`, { waitUntil: "load" });
  const first = await pg.textContent("#pv tbody tr td b");
  ok(first === no, `${w}: обращение с сайта не первой строкой в панели (${first})`);
  await pg.locator(`tr[data-id="${no}"]`).click();
  await pg.locator('#mdl [data-st="meet"]').click();
  await pg.fill("#mdl #nt", "Созвон в четверг"); await pg.locator("#mdl [data-note]").click();
  await pg.locator("#mdl [data-x]").click();

  // Новость и продукт из панели.
  await pg.goto(`${BASE}/panel#news`, { waitUntil: "load" });
  await pg.locator("#nf button[type=submit]").click();
  ok(await pg.$eval("#nf .bad", () => true).catch(() => false), `${w}: пустая новость сохранилась`);
  await pg.fill('#nf [name="title"]', "Тестовая новость"); await pg.fill('#nf [name="body"]', "Текст новости");
  await pg.locator("#nf button[type=submit]").click();
  await pg.goto(`${BASE}/panel#products`, { waitUntil: "load" });
  await pg.fill('#pf [name="name"]', "Образец карточки"); await pg.fill('#pf [name="form"]', "таблетки");
  await pg.locator("#pf button[type=submit]").click();
  await pg.goto(`${BASE}/panel#seo`, { waitUntil: "load" });
  await pg.fill('[data-seo="news"] [name="t"]', "Новости компании CZECHFARM");
  await pg.locator('[data-seo="news"] button').click();

  // Роли.
  await pg.goto(`${BASE}/panel#leads`, { waitUntil: "load" });
  await pg.selectOption("#role", "manager");
  ok(!(await pg.$('#pv .chips [data-v="investor"]')), `${w}: менеджер видит инвесторов`);
  await pg.goto(`${BASE}/panel#seo`, { waitUntil: "load" });
  ok(!(await pg.$("[data-seo]")), `${w}: менеджеру открыт SEO`);
  await pg.selectOption("#role", "owner");

  // Обратно на сайт.
  await pg.goto(`${BASE}/contacts`, { waitUntil: "load" });
  ok((await pg.textContent("#track")).includes("Назначена встреча"), `${w}: статус из панели не виден на сайте`);
  await pg.goto(`${BASE}/news`, { waitUntil: "load" });
  ok((await pg.textContent("#news-l")).includes("Тестовая новость"), `${w}: новость из панели не на сайте`);
  ok((await pg.title()) === "Новости компании CZECHFARM", `${w}: заголовок из панели не применился`);
  await pg.locator("[data-nid]").first().click();
  ok(await pg.isVisible("#dlg"), `${w}: новость не открылась`);
  await pg.keyboard.press("Escape");
  await pg.goto(`${BASE}/products`, { waitUntil: "load" });
  ok((await pg.textContent("#catalog")).includes("Образец карточки"), `${w}: продукт из панели не в каталоге`);
  await pg.fill("#q", "нет такого"); ok((await pg.textContent("#catalog")).includes("Ничего не нашлось"), `${w}: поиск не фильтрует`);
  await pg.goto(`${BASE}/uz/news`, { waitUntil: "load" });
  ok(await pg.$eval("html", (e) => e.lang === "uz"), `${w}: узбекская страница`);
  // Сцена: на компьютере кадры приходят до 100% и рисуются; на телефоне — смена кадров.
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  if (w >= 900) { await pg.waitForFunction(() => document.querySelector(".hs").classList.contains("cv"), null, { timeout: 20000 }).catch(() => {}); ok(await pg.$eval(".hs", (e) => e.classList.contains("cv")), `${w}: кадры сцены не загрузились`); }
  await pg.evaluate(() => { const h = document.querySelector(".hs"); scrollTo(0, (h.offsetHeight - innerHeight) * 0.8); }); await pg.waitForTimeout(500);
  if (w < 900) ok(+(await pg.$eval(".hs-b", (e) => e.style.opacity)) > 0.5, `${w}: на телефоне капсула не раскрывается`);
  // Аудитория меняет кнопку первого экрана и запоминается.
  await pg.locator("#as-t-investors").evaluate((e) => e.scrollIntoView({ block: "center" })); await pg.locator("#as-t-investors").click();
  ok(await pg.isVisible("#as-p-investors") && !(await pg.isVisible("#as-p-patients")), `${w}: аудитория не переключилась`);
  await pg.reload({ waitUntil: "load" });
  ok((await pg.getAttribute("#hero-cta", "href")).endsWith("/investors"), `${w}: кнопка первого экрана не под аудиторию`);
  // Стоимость: допы за половину, сумма считается.
  await pg.locator("#cena").scrollIntoViewIfNeeded();
  const before = await pg.textContent("#kit-add");
  await pg.locator('#kit-all').click(); await pg.waitForTimeout(600);
  ok((await pg.textContent("#kit-add")) !== before && /\d/.test(await pg.textContent("#kit-save")), `${w}: допы не считаются`);
  ok(/^\d\d:\d\d:\d\d$/.test(await pg.textContent("#tm")), `${w}: нет отсчёта 48 часов`);
  // Стеклянные блоки и глобус: нажатие показывает шаг.
  await pg.goto(`${BASE}/investors`, { waitUntil: "load" });
  await pg.locator(".gb-b").nth(6).evaluate((e) => e.scrollIntoView({ block: "center" })); await pg.locator(".gb-b").nth(6).click({ force: true });
  ok((await pg.textContent(".gb-card h3")) === "Масштабирование", `${w}: блок не показал шаг`);
  await pg.goto(`${BASE}/partners`, { waitUntil: "load" });
  await pg.locator(".gl-r").nth(2).focus();
  ok((await pg.textContent(".gl-card h3")) === "Бренд под рынок", `${w}: маршрут не показал шаг`);
  // Путь бренда: название на коробке, пять этапов, заявка заполняется сама.
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  await pg.locator("#launch").scrollIntoViewIfNeeded();
  await pg.fill("#ln-name", "Vitalix");
  ok((await pg.textContent(".bx-name")) === "Vitalix", `${w}: название не на коробке`);
  await pg.locator('.ln-steps button[data-s="0"]').click();
  for (let i = 0; i < 4; i++) await pg.locator("#ln-next").click({ force: true });
  ok((await pg.getAttribute("#ln", "data-s")) === "4" && (await pg.isVisible("#ln-go")), `${w}: путь бренда не дошёл до «под ключ»`);
  await pg.locator("#ln-go").click(); await pg.waitForLoadState("load");
  ok((await pg.inputValue('#form [name="msg"]')).includes("Vitalix"), `${w}: заявка не заполнилась из пути бренда`);
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  await pg.locator("#vs").scrollIntoViewIfNeeded(); await pg.locator('.vs-sw [data-v="1"]').click();
  ok((await pg.getAttribute("#vs", "data-on")) === "1", `${w}: «Сам или с CZECHFARM» не переключается`);
  console.log(w, "путь пройден");
  await ctx.close();
}

/* Заставка CZECHFARM alliance: доигрывает и отдаёт логотип шапке; «Пропустить» —
   сразу к логотипу. Без видеокарты кадры медленные, поэтому ждём с запасом. */
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dz-intro", "1"); } catch {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  for (const how of ["play", "skip"]) {
    await pg.goto(`${BASE}/?intro=1`, { waitUntil: "domcontentloaded" });
    const on = await pg.waitForFunction(() => window.cfiOn, null, { timeout: 20000 }).then(() => true, () => false);
    ok(on, `${w}: заставка не началась`);
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector("#top .logo")).opacity === "0"), `${w}: логотип шапки виден во время заставки`);
    if (how === "skip") await pg.click(".cfi-skip");
    const gone = await pg.waitForFunction(() => !document.getElementById("cfi") && !document.querySelector(".cfi-fly"), null, { timeout: how === "skip" ? 8000 : 40000 }).then(() => true, () => false);
    ok(gone, `${w} ${how}: заставка не ушла`);
    ok(await pg.evaluate(() => !document.documentElement.classList.contains("cfi") && getComputedStyle(document.querySelector("#top .logo")).opacity === "1"), `${w} ${how}: логотип не встал в шапку`);
  }
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  ok(await pg.evaluate(() => !document.getElementById("cfi")), `${w}: заставка второй раз за визит`);
  ok(!errs.length, `${w}: ошибки заставки ${errs.join(" | ")}`);
  await ctx.close();
}

// Без движения: всё на месте сразу.
const rm = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const rp = await rm.newPage();
await rp.goto(`${BASE}/`, { waitUntil: "load" });
ok(await rp.$eval(".pl", (e) => getComputedStyle(e).opacity === "1"), "reduced motion: блоки не видны");
ok(await rp.evaluate(() => !document.getElementById("cfi")), "reduced motion: заставка не снята");
await b.close();
console.log(bad ? `ПРОБЛЕМ: ${bad}` : "Всё прошло");
process.exit(bad ? 1 : 0);
