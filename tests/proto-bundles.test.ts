/**
 * Макет из репозитория (lib/proto/bundles): страницы целиком, с условиями,
 * без чужих слов в разметке и с отпечатком своего зерна.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { bundlePages, stampedBundle } from "@/lib/proto/bundles";
import { stampPages } from "@/lib/proto/stamp";

const SEED = "b1".repeat(16);

test("bloger.agency: 14 страниц, метки сборки заменены, у каждой условия и noindex", () => {
  const site = bundlePages("bloger-agency");
  assert.ok(site);
  const all = { "": site.html, ...site.pages };
  assert.equal(Object.keys(all).length, 14);
  for (const [path, html] of Object.entries(all)) {
    assert.doesNotMatch(html, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(html.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(html, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(html, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(html, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
  }
  assert.match(site.html, /Glyph Portal © 2026 Christian Katzmann\. MIT\./, "пропала строка лицензии влёта в букву");
  assert.match(site.html, /id="dz"/, "нет заставки DevUz");
});

test("отпечаток — тем же зерном, что лежит в базе: признаки совпадают со stampPages", () => {
  const raw = bundlePages("bloger-agency")!;
  const expected = stampPages(raw.html, raw.pages, SEED);
  const site = stampedBundle("bloger-agency", SEED)!;
  assert.equal(site.html, expected.html);
  assert.equal(site.pages["uz/ugc"], expected.pages["uz/ugc"]);
  assert.notEqual(site.html, raw.html, "отпечаток не поставился");
  assert.equal(stampedBundle("нет-такого", SEED), null);
});

test("AUTOMECHANIC: страницы на двух языках, условия, noindex, сайт как приложение", () => {
  const site = bundlePages("automechanic");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const html = ["", "uslugi", "zapis", "kontakty", "plan", "offline"].flatMap((p) => [p, p ? `uz/${p}` : "uz"]);
  for (const path of html) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.match(page, /<link rel="manifest" href="__PROTO_BASE__(\/uz)?\/manifest"/, `${path}: нет манифеста`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.ok(page.includes("AUTOMECHANIC"), `${path}: нет названия компании`);
    if (!path.endsWith("offline")) assert.match(page, /id="dz"[\s\S]*DevUz Studio/, `${path}: нет заставки DevUz Studio`);
  }
  const manifest = JSON.parse(all.manifest);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "__PROTO_BASE__/");
  assert.ok(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"));
  assert.equal(JSON.parse(all["uz/manifest"]).start_url, "__PROTO_BASE__/uz/?app=1");
  assert.match(all.sw, /addEventListener\('fetch'/);
  assert.match(all.sw, /\/offline'/);
});

test("AUTOMECHANIC: цены владельца в конструкторе — сайт 1 000 $, приложение 195 $ (допы +30%)", async () => {
  const plan = await import("../scripts/protos/automechanic/plan.mjs");
  assert.equal(plan.BASE.price, 1000);
  assert.equal(plan.ADDONS.find((a: { id: string }) => a.id === "pwa")?.price, 195);
  const tg = plan.ADDONS.find((a: { id: string }) => a.id === "tg");
  assert.ok(tg && tg.price < 500, "заказы в Telegram дешевле внедрения CRM");
});

test("AUTOMECHANIC: отпечаток ставится, манифест и service worker не меняются", () => {
  const raw = bundlePages("automechanic")!;
  const site = stampedBundle("automechanic", SEED)!;
  assert.notEqual(site.html, raw.html, "отпечаток не поставился");
  assert.equal(site.pages.manifest, raw.pages.manifest);
  assert.equal(site.pages.sw, raw.pages.sw);
});

test("shox.hospital: 6 страниц на ru, uz, en — условия на языке страницы, noindex, без слов отпечатка", () => {
  const site = bundlePages("shox-hospital");
  assert.ok(site);
  const all = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "en", "en/plan", "plan", "uz", "uz/plan"]);
  for (const [path, html] of Object.entries(all)) {
    assert.doesNotMatch(html, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : path.startsWith("en") ? "en" : "ru";
    assert.ok(html.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(html.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(html, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(html, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(html, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(html, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(html, /href="#"/, `${path}: ссылка в никуда`);
  }
  assert.match(site.html, /id="fly"/, "нет пролёта по врачам");
  assert.match(site.html, /id="dsc"/, "нет таймера скидки");
  assert.match(site.html, /data-k="admin" data-p="450"/, "админка — 450 $");
  assert.match(site.html, /data-base="1500"/, "сайт — 1 500 $");
  const stamped = stampedBundle("shox-hospital", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("ShahaR.Uz: 16 страниц на ru и uz — условия, noindex, заставка DevUz, влёт в букву, приложение", () => {
  const site = bundlePages("shahar");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const html = ["", "katalog", "obekt", "novostroyki", "uslugi", "podbor", "plan", "offline"].flatMap((p) => [p, p ? `uz/${p}` : "uz"]);
  for (const path of html) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.match(page, /<link rel="manifest" href="__PROTO_BASE__(\/uz)?\/manifest"/, `${path}: нет манифеста`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("ShahaR.Uz"), `${path}: нет названия компании`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /id="gp-clip"/, `${path}: нет влёта в букву SHAHAR`);
    assert.match(all[path], /Glyph Portal © 2026 Christian Katzmann, MIT/, `${path}: пропала строка лицензии влёта в букву`);
  }
  assert.ok(all["uz"].includes("o‘") || all["uz"].includes("O‘"), "узбекский — латиница с o‘");
  const manifest = JSON.parse(all.manifest);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "__PROTO_BASE__/");
  assert.ok(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"));
  assert.match(all.sw, /addEventListener\('fetch'/);
  assert.match(all.plan, /data-k="admin" data-p="195"/, "админ-панель — 195 $");
  const stamped = stampedBundle("shahar", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.equal(stamped.pages.manifest, site.pages.manifest);
});

test("ShahaR.Uz: конструктор — портал 2 300 $, допы добивают до 3 900 $, обязательные на месте", async () => {
  const plan = await import("../scripts/protos/shahar/plan.mjs");
  // Владелец, 07.10.2026: «базовая цена 2300$, допники должны добить цену до 3900$».
  assert.equal(plan.BASE.price, 2300);
  const addons = [...plan.ADDONS, ...plan.BLOCKS].reduce((s: number, a: { price: number }) => s + a.price, 0);
  assert.equal(addons, 1600, "все допы вместе — 1 600 $");
  assert.equal(plan.BASE.price + addons, 3900, "со всеми допами — 3 900 $");
  const ids = [...plan.ADDONS, ...plan.BLOCKS].map((a: { id: string }) => a.id);
  for (const id of ["pwa", "tg", "admin"]) assert.ok(ids.includes(id), `нет обязательного допа ${id}`);
  const all: { id: string; ru: { t: string; e?: string; why?: string }; uz: { t: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  for (const a of all) assert.ok(a.ru.t && a.uz.t && (a.ru.e || a.ru.why), `${a.id}: нет описания`);
});

test("ПК Веста: 6 страниц на русском — условия, noindex, заставка с воротами, заявка в WhatsApp завода", () => {
  const site = bundlePages("pkvesta");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  for (const path of ["", "katalog", "obekt", "raschet", "zavod", "plan"]) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes('<html lang="ru">'), `${path}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), `${path}: нет условий`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("ПК Веста"), `${path}: нет названия компании`);
    // Главное действие — мессенджер самого завода, номер с их сайта.
    assert.ok(page.includes("https://wa.me/79109434966"), `${path}: нет заявки в WhatsApp завода`);
  }
  assert.match(all[""], /id="intro"[\s\S]*DevUz Studio/, "нет промо DevUz Studio");
  assert.match(all[""], /class="vx-gate"/, "нет ворот с логотипа в заставке");
  // Сборка из деталей рисуется кодом на canvas, без кадров-фото.
  assert.match(all[""], /id="asm"[\s\S]*class="asm-cv"/, "нет сцены «здание собирается из деталей»");
  assert.doesNotMatch(all[""], /asm-\d(-m)?\.webp/, "в сцене сборки снова фото");
  assert.match(all[""], /class="iso"/, "у отраслей нет нарисованных кодом зданий");
  assert.match(all[""], /id="trk"/, "нет ленты объектов");
  for (const id of [213, 203, 199, 204, 217]) assert.match(all.obekt, new RegExp(`data-id="${id}"`), `нет объекта №${id}`);
  const stamped = stampedBundle("pkvesta", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("ПК Веста: конструктор — сайт 2 300 $, допы добивают до 3 900 $, обязательные на месте", async () => {
  const plan = await import("../scripts/protos/pkvesta/plan.mjs");
  assert.equal(plan.BASE.price, 2300);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  assert.equal(all.reduce((s, a) => s + a.price, 0), 1600, "все допы вместе — 1 600 $");
  for (const id of ["wa", "admin"]) assert.ok(all.some((a) => a.id === id), `нет обязательного допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why), `${a.id}: нет описания`);
});

test("Aipply Academy: 8 страниц на uz и ru — условия, noindex, заставка с влётом в знак, история, запись в Telegram академии", () => {
  const site = bundlePages("aipply");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  for (const path of ["", "kurs", "ochiq-dars", "plan"].flatMap((p) => [p, p ? `ru/${p}` : "ru"])) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("ru") ? "ru" : "uz";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi|lenis/i, `${path}: прототип зовёт модель или перехватывает прокрутку`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Aipply Academy"), `${path}: нет названия компании`);
    // Главное действие — Telegram самой академии: бот, который их канал называет «для обращений».
    assert.ok(page.includes('href="https://t.me/aipply_admin_bot"'), `${path}: нет записи в Telegram академии`);
  }
  for (const path of ["", "ru"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="mk-svg"[\s\S]*class="mk-slit"/, `${path}: нет влёта в просвет знака Aipply`);
    assert.match(all[path], /id="story"[\s\S]*class="st-world"/, `${path}: нет истории «Kompyuter noldan»`);
    assert.match(all[path], /class="st-static"/, `${path}: у истории нет списка для тех, у кого движение выключено`);
    assert.match(all[path], /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    assert.match(all[path], /@supports not \(\(backdrop-filter/, `${path}: у стекла нет запасного варианта`);
  }
  assert.ok(all[""].includes("o‘rganing") && all[""].includes("Sun’iy"), "узбекский — латиница с o‘ и ’");
  assert.match(all.kurs, /id="test"/, "нет теста уровня");
  assert.match(all["ochiq-dars"], /id="book"/, "нет записи на открытый урок");
  const stamped = stampedBundle("aipply", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Aipply Academy: конструктор — сайт 1 300 $, все допы не больше 1 700 $, обязательные на месте", async () => {
  const plan = await import("../scripts/protos/aipply/plan.mjs");
  // Задание владельца, 08.10.2026: сайт без допов 1 300 $, со всеми допами не больше 3 000 $.
  assert.equal(plan.BASE.price, 1300);
  const all: { id: string; price: number; uz: { t: string; e?: string; why?: string }; ru: { t: string; e?: string; why?: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.ok(sum <= 1700, `все допы вместе ${sum} $, а можно не больше 1 700 $`);
  assert.ok(plan.BASE.price + sum <= 3000, "со всеми допами — не больше 3 000 $");
  for (const id of ["tg", "admin"]) assert.ok(all.some((a) => a.id === id), `нет обязательного допа ${id}`);
  for (const a of all) assert.ok(a.uz.t && a.ru.t && (a.uz.e || a.uz.why) && (a.ru.e || a.ru.why), `${a.id}: нет описания на обоих языках`);
});

test("HOP.UZ: 5 страниц на русском — условия, noindex, влёт в букву «O», сцена, поиск по каталогу, Telegram HOP.UZ", () => {
  const site = bundlePages("hop");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  for (const path of ["", "razmestit", "sdelka", "biznes", "plan"]) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes('<html lang="ru">'), `${path}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), `${path}: нет условий`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi|lenis/i, `${path}: прототип зовёт модель или перехватывает прокрутку`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("HOP.UZ"), `${path}: нет названия компании`);
    // Главное действие — их же Telegram с hop.uz.
    assert.ok(page.includes('href="https://t.me/hop_uzb"'), `${path}: нет Telegram HOP.UZ`);
    assert.match(page, /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    assert.match(page, /@supports not \(\(backdrop-filter/, `${path}: у стекла нет запасного варианта`);
    // Фраза из их описания, которую не проверить.
    assert.doesNotMatch(page, /крупнейш/i, `${path}: «крупнейшая доска» — не наше утверждение`);
  }
  assert.match(all[""], /id="intro"[\s\S]*DevUz Studio/, "нет промо DevUz Studio");
  assert.match(all[""], /class="mk-svg"[\s\S]*class="mk-slit"/, "нет влёта в букву «O»");
  assert.match(all[""], /id="story"[\s\S]*class="st-world"/, "нет сцены «Как вещь находит покупателя»");
  assert.match(all[""], /class="st-static"/, "у сцены нет списка для тех, у кого движение выключено");
  assert.match(all[""], /id="q"[\s\S]*id="cats"/, "нет поиска по каталогу");
  assert.match(all[""], /id="auc"/, "нет живого аукциона");
  assert.match(all.razmestit, /id="post"/, "нет мастера объявления");
  assert.match(all.biznes, /10 000<\/b> сум/, "цена тарифа «Максимум» с hop.uz");
  const stamped = stampedBundle("hop", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("HOP.UZ: конструктор — сайт 4 500 $, допы добивают до 8 000 $, обязательные на месте", async () => {
  const plan = await import("../scripts/protos/hop/plan.mjs");
  // Владелец, 08.10.2026: «базовая версия без допов: 4500$, допы должны добить стоимость до 8000$».
  assert.equal(plan.BASE.price, 4500);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.equal(sum, 3500, "все допы вместе — 3 500 $");
  assert.equal(plan.BASE.price + sum, 8000, "со всеми допами — 8 000 $");
  for (const id of ["post", "pay", "pwa", "mod"]) assert.ok(all.some((a) => a.id === id), `нет обязательного допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why), `${a.id}: нет описания`);
});

test("Enotmebel: главная и «Что дальше» на ru и uz — условия, noindex, заставка, история, стекло", () => {
  const site = bundlePages("enotmebel");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "plan", "uz", "uz/plan"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Enotmebel"), `${path}: нет названия компании`);
    // Главное действие — их же Telegram с enotmebel.uz.
    assert.ok(page.includes('href="https://t.me/enotmebel"'), `${path}: нет Telegram Enotmebel`);
    assert.match(page, /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    // Чего на их сайте нет, того нет и здесь.
    assert.doesNotMatch(page, /лет на рынке|отзыв|за 15 минут|yil bozorda/i, `${path}: утверждение, которого нет на их сайте`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="en-cv"[^>]*data-paths=/, `${path}: нет влёта в букву «O»`);
    assert.match(all[path], /id="story"[\s\S]*data-beads|data-k="beads"/, `${path}: нет шариков наполнителя`);
    assert.match(all[path], /class="st-static/, `${path}: у истории нет списка для тех, у кого движение выключено`);
    assert.match(all[path], /id="mgrid"/, `${path}: нет каталога`);
    assert.equal((all[path].match(/class="mc /g) || []).length, 15, `${path}: в каталоге не 15 моделей`);
  }
  assert.match(all[""], /450&nbsp;000…800&nbsp;000 сум|450 000…800 000 сум/, "цена Груши MINI с enotmebel.uz");
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  const stamped = stampedBundle("enotmebel", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Enotmebel: конструктор — сайт 1 700 $, все допы вместе 800 $, итог 2 500 $", async () => {
  const plan = await import("../scripts/protos/enotmebel/plan.mjs");
  // Владелец, 11.10.2026: «Стоимость для клиента без допников 1700$, с допами не более 2500$».
  assert.equal(plan.BASE.price, 1700);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.equal(sum, 800, "все допы вместе — 800 $");
  assert.ok(plan.BASE.price + sum <= 2500, "со всеми допами не больше 2 500 $");
  // Владелец, 11.10.2026: админка — отдельной строкой в конструкторе.
  for (const id of ["uz", "cart", "pay", "nasiya", "admin"]) assert.ok(all.some((a) => a.id === id), `нет допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why), `${a.id}: нет описания`);
});

test("Giftora: демо мини-приложения и панель оператора на ru и en — условия, noindex, только игровая валюта, без внешних загрузок", async () => {
  const site = bundlePages("giftora");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "admin", "en", "en/admin"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}"`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark|mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    // Свой бренд: механики копируем, айдентику нет.
    assert.ok(page.includes("Giftora"), `${path}: нет своего названия`);
    assert.doesNotMatch(page, /Epic Gift|epic_gift|giftbackpack|Tonnel|Portals/i, `${path}: чужой бренд в макете`);
    // Всё своё: ни скриптов, ни картинок, ни шрифтов со стороны, ни кошелька.
    assert.doesNotMatch(page, /<script[^>]+src=|<link[^>]+stylesheet|<img[^>]+src="https?:|url\(https?:/i, `${path}: внешняя загрузка`);
    assert.doesNotMatch(page, /tonconnect|telegram-web-app\.js|openInvoice/i, `${path}: настоящий кошелёк или платёж`);
    if (path.endsWith("admin")) {
      // Владелец, 12.10.2026: RTP, депозиты и выводы по дням на одном графике, пользователи, промо, рефералы.
      assert.match(page, /class="chip"/, `${path}: нет пометки «Демо»`);
      for (const tab of ["overview", "rtp", "users", "promo", "refs"]) assert.ok(page.includes(`data-tab="${tab}"`), `${path}: нет вкладки ${tab}`);
      assert.match(page, /b-dep[\s\S]*b-wd[\s\S]*l-net/, `${path}: на графике нет депозитов, выводов и разницы`);
      assert.ok(page.includes("gx-admin-1"), `${path}: настройки не общие с приложением`);
      continue;
    }
    // Владелец, 12.10.2026: на телефоне листается только вверх и вниз, двойной тап не приближает.
    assert.match(page, /maximum-scale=1[^"]*user-scalable=no/, `${path}: страницу можно приблизить`);
    assert.match(page, /touch-action:pan-y/, `${path}: страница ездит вбок`);
    assert.match(page, /gesturestart/, `${path}: щипок на iOS не погашен`);
    // Владелец, 12.10.2026: заметная плашка «Демо закроется через …» до срока пароля.
    assert.match(page, /id="closing" data-until="\d{4}-\d\d-\d\dT[\d:]+Z"/, `${path}: нет плашки о закрытии`);
    assert.match(page, /class="chip demo"/, `${path}: нет пометки «Демо»`);
    assert.ok(page.includes("gx-admin-1") && page.includes("/admin"), `${path}: приложение не читает настройки панели или нет входа в неё`);
    for (const view of ["home", "box", "hub", "rocket", "dice", "upgrade", "pvp", "mines", "plinko", "towers", "wheel", "inv", "top", "tasks", "profile"]) {
      assert.ok(page.includes(`V.${view} = function`), `${path}: нет экрана ${view}`);
    }
    assert.match(page, /TelegramWebviewProxy/, `${path}: нет моста к Telegram`);
  }
  const stamped = stampedBundle("giftora", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.en, site.pages.en, "отпечаток не поставился на английской");
  assert.notEqual(stamped.pages.admin, site.pages.admin, "отпечаток не поставился на панели");
  // Объёмные подарки — два атласа WebP со своего сервера, а не 28 картинок (урок enotmebel: 429 на залп).
  const { statSync } = await import("node:fs");
  for (const f of ["atlas-s.webp", "atlas.webp"]) {
    assert.ok(site.html.includes(`/protos/giftora/${f}`), `нет ссылки на ${f}`);
    assert.ok(statSync(`public/protos/giftora/${f}`).size < 320_000, `${f} тяжелее 320 КБ`);
  }
});

test("LIDER PROF PROEKT: главная, проекты, проект и «Что дальше» на ru и uz — условия, noindex, заставка, история, стекло", () => {
  const site = bundlePages("lider-prof");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "plan", "proekt", "proekty", "uz", "uz/plan", "uz/proekt", "uz/proekty"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("LIDER PROF PROEKT"), `${path}: нет названия студии`);
    // Главное действие — Telegram студии @lppuz из «Контактов» на их сайте, звонок — номер из шапки.
    assert.ok(page.includes('href="https://t.me/lppuz"'), `${path}: нет Telegram студии`);
    assert.ok(page.includes('href="tel:+998993050999"'), `${path}: нет звонка`);
    assert.match(page, /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    // Цен у студии на сайте нет — и здесь только наши, в конструкторе.
    assert.doesNotMatch(page, /сум за м|so‘m\/m|\d\s?(сум|so‘m)\b/i, `${path}: цена, которой нет на их сайте`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="lp-cv"[^>]*data-paths=/, `${path}: нет влёта в «O»`);
    assert.match(all[path], /id="story"[\s\S]*data-k="draft"[\s\S]*data-k="land"/, `${path}: нет глав истории`);
    assert.match(all[path], /class="st-static/, `${path}: у истории нет списка для тех, у кого движение выключено`);
    assert.match(all[path], /id="calc"/, `${path}: нет расчёта проекта`);
  }
  for (const path of ["proekty", "uz/proekty"]) assert.equal((all[path].match(/<a class="pc rv a-[a-z]+" style=/g) || []).length, 61, `${path}: не 61 проект`);
  // Превью — очередью из data-src, а не залпом (урок enotmebel, 429 от nginx).
  assert.doesNotMatch(all.proekty, /class="pc [^"]*"[^>]*>\s*<span[^>]*>\s*<span[^>]*><\/span><img src=/, "превью проектов грузятся залпом");
  assert.ok(all["uz/proekty"].includes("Jamoat binolari"), "узбекские направления");
  assert.doesNotMatch(all["uz/proekty"], /[A-Za-z][А-Яа-я]|[А-Яа-я][A-Za-z]/, "слово из двух алфавитов в узбекской странице");
  const stamped = stampedBundle("lider-prof", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("LIDER PROF PROEKT: конструктор — сайт 1 700 $, все допы вместе 1 300 $, итог не больше 3 000 $", async () => {
  const plan = await import("../scripts/protos/lider-prof/plan.mjs");
  // Владелец, 12.10.2026: «стоимость для клиента без допов 1 700 $, с допами не больше 3 000 $».
  assert.equal(plan.BASE.price, 1700);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string }; uz: { t: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.equal(sum, 1300, "все допы вместе — 1 300 $");
  assert.ok(plan.BASE.price + sum <= 3000, "со всеми допами не больше 3 000 $");
  for (const id of ["filters", "pano", "calc", "en", "trust", "seo", "admin"]) assert.ok(all.some((a) => a.id === id), `нет допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why) && a.uz.t, `${a.id}: нет описания`);
});

test("IntalimStudents: прототип приложения автошколы на ru и uz — условия, noindex, один язык на странице, без внешних загрузок", () => {
  const site = bundlePages("intalim");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "uz"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path === "uz" ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}"`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark|mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /<script[^>]+src=|<link[^>]+stylesheet|<img[^>]+src="https?:|url\(https?:/i, `${path}: внешняя загрузка`);
    assert.ok(page.includes("IntalimStudents"), `${path}: нет названия приложения`);
    assert.match(page, /maximum-scale=1[^"]*user-scalable=no/, `${path}: страницу можно приблизить`);
    // Владелец, 12.10.2026: айфон как у играбельных кейсов, внутри всё нажимается.
    assert.match(page, /class="iphone"[\s\S]*class="island"/, `${path}: нет корпуса айфона`);
    for (const view of ["home", "lessons", "subject", "topic", "tests", "quiz", "result", "signs", "guess", "schedule", "book", "fines", "forecast", "profile", "helper"]) {
      assert.ok(page.includes(`V.${view} = function`), `${path}: нет экрана ${view}`);
    }
    // Один язык на экране: в данных узбекской страницы нет кириллицы, кроме выдуманного «№».
    const data = page.match(/window\.IT=(\{[\s\S]*?\});<\/script>/)?.[1] ?? "";
    assert.ok(data.length > 1000, `${path}: нет данных приложения`);
    if (lang === "uz") assert.doesNotMatch(data, /[А-Яа-яЁё]/, "uz: кириллица в узбекской странице");
    const it = JSON.parse(data);
    assert.equal(it.questions.length >= 20, true, `${path}: меньше 20 вопросов`);
    for (const q of it.questions) assert.ok(q.o[q.a] && q.e && q.simple, `${path}: вопрос ${q.id} без ответа или объяснения`);
  }
  const stamped = stampedBundle("intalim", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.uz, site.pages.uz, "отпечаток не поставился на узбекской");
});

test("шрифты макетов из public не уезжают в языковой редирект", async () => {
  const { config } = await import("@/middleware");
  const re = new RegExp(`^${config.matcher[0]}$`);
  assert.equal(re.test("/protos/intalim/onest-cyr.woff2"), false, "woff2 попадает под языковой редирект");
  assert.equal(re.test("/protos/giftora/atlas.webp"), false);
  assert.equal(re.test("/protos/arhbyuro/gsap.min.js"), false, "скрипт макета уходит в языковой редирект");
  assert.equal(re.test("/protos/arhbyuro/hero-1920.mp4"), false, "видео первого экрана уходит в языковой редирект");
  assert.equal(re.test("/protos/samauto/dmax-m.glb"), false, "3D-модель макета уходит в языковой редирект");
  assert.equal(re.test("/razbory"), true, "страницы сайта по-прежнему идут через языки");
});

test("Asmo Clinic: главная и «Что дальше» на ru и uz — условия, noindex, заставка, история, запись, конструктор лечения", () => {
  const site = bundlePages("asmo");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "plan", "uz", "uz/plan"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Asmo Clinic"), `${path}: нет названия клиники`);
    // Запись — в Telegram клиники из кнопки чата на их сайте, звонок — номер с их сайта.
    assert.ok(page.includes('href="https://t.me/asmo_clinic"'), `${path}: нет Telegram клиники`);
    assert.ok(page.includes('href="tel:+998555018866"'), `${path}: нет звонка`);
    assert.match(page, /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    assert.ok(page.includes('<symbol id="am-logo"'), `${path}: нет логотипа клиники`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="am-cv"[^>]*data-logo=/, `${path}: нет влёта в знак`);
    assert.match(all[path], /id="story"[\s\S]*data-k="lens"[\s\S]*data-k="xs"[\s\S]*data-k="team"/, `${path}: нет глав истории`);
    assert.match(all[path], /class="st-static/, `${path}: у истории нет списка для тех, у кого движение выключено`);
    for (const id of ["zapis", "ceny", "test", "faq", "kontakty"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    // Цены на сайте клиники нет: в конструкторе лечения — ориентир по рынку, и это сказано.
    assert.match(all[path], /Ориентир по рынку Ташкента|Toshkent bozori bo‘yicha mo‘ljal/, `${path}: цены не подписаны как ориентир`);
  }
  assert.doesNotMatch(all.uz, /[A-Za-z][А-Яа-яЁё]|[А-Яа-яЁё][A-Za-z]/, "слово из двух алфавитов в узбекской странице");
  const stamped = stampedBundle("asmo", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Asmo Clinic: конструктор — сайт 1 700 $, все допы вместе 1 300 $, итог не больше 3 000 $", async () => {
  const plan = await import("../scripts/protos/asmo/plan.mjs");
  // Владелец, 13.10.2026: «Стоимость для клиента без допников 1700$, с допами не более 3000$».
  assert.equal(plan.BASE.price, 1700);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string }; uz: { t: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.equal(sum, 1300, "все допы вместе — 1 300 $");
  assert.ok(plan.BASE.price + sum <= 3000, "со всеми допами не больше 3 000 $");
  for (const id of ["booking", "prices", "bot", "mis", "seo", "en", "reviews"]) assert.ok(all.some((a) => a.id === id), `нет допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why) && a.uz.t, `${a.id}: нет описания`);
});

test("GAZMETPROD SERVIS: главная и «Что дальше» на ru и uz — условия, noindex, заставка, история, калькулятор, запись, испытание, фургон", () => {
  const site = bundlePages("europegas");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "plan", "uz", "uz/plan"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    // Владелец: в том, что уходит клиенту, нет слов, по которым находят отпечаток.
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("GAZMETPROD SERVIS"), `${path}: нет названия компании`);
    // Своего Telegram на их сайте нет: пишем на номер руководителя из «Контактов».
    assert.ok(page.includes('href="https://t.me/+998909094949"'), `${path}: нет Telegram компании`);
    assert.ok(page.includes('href="tel:+998909094949"'), `${path}: нет звонка`);
    assert.match(page, /backdrop-filter:url\(#lq\)/, `${path}: нет преломления у стекла`);
    assert.ok(page.includes('<symbol id="eg-logo"'), `${path}: нет логотипа компании`);
    // Цен компании на их сайте нет — и в прототипе их нет.
    assert.doesNotMatch(page, /установк[аи] от \d|o‘rnatish \d/i, `${path}: цена установки, которой нет на их сайте`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="eg-cv"[^>]*data-logo=/, `${path}: нет влёта в пламя`);
    assert.match(all[path], /id="story"[\s\S]*data-k="car"[\s\S]*data-k="cyl"[\s\S]*data-k="van"[\s\S]*data-k="team"/, `${path}: нет глав истории`);
    assert.match(all[path], /class="st-static/, `${path}: у истории нет списка для тех, у кого движение выключено`);
    for (const id of ["uslugi", "ekonomiya", "zapis", "ispytanie", "furgon", "raboty", "dokumenty", "faq", "kontakty"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    // Цены топлива и сроки испытаний — со ссылками на источник.
    assert.ok(all[path].includes("https://www.spot.uz/ru/2026/06/01/cng-up/"), `${path}: цена метана без источника`);
    assert.ok(all[path].includes("https://gov.uz/oz/advice/765/document/4168"), `${path}: сроки испытаний без источника`);
  }
  assert.doesNotMatch(all.uz, /[A-Za-z][А-Яа-яЁё]|[А-Яа-яЁё][A-Za-z]/, "слово из двух алфавитов в узбекской странице");
  assert.doesNotMatch(all.uz.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, "кириллица в узбекской странице");
  const stamped = stampedBundle("europegas", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("GAZMETPROD SERVIS: конструктор — сайт 1 700 $, все допы вместе 1 300 $, итог не больше 3 000 $", async () => {
  const plan = await import("../scripts/protos/europegas/plan.mjs");
  // Владелец, 13.10.2026: «без допов 1 700 $, с допами не больше 3 000 $».
  assert.equal(plan.BASE.price, 1700);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string }; uz: { t: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.equal(sum, 1300, "все допы вместе — 1 300 $");
  assert.ok(plan.BASE.price + sum <= 3000, "со всеми допами не больше 3 000 $");
  for (const id of ["booking", "calc", "test", "van", "bot", "seo", "maps"]) assert.ok(all.some((a) => a.id === id), `нет допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why) && a.uz.t, `${a.id}: нет описания`);
});

test("DomTut: сайт и приложение на ru и uz — условия, noindex, заставка с влётом в сердце, приложение в айфоне без увеличения", () => {
  const site = bundlePages("domtut");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "app", "uz", "uz/app"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("DomTut"), `${path}: нет названия компании`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="dt-cv"[^>]*data-logo="[^"]*heart/, `${path}: нет влёта в сердце знака`);
    assert.match(all[path], new RegExp(`<iframe id="app-frame"[^>]*data-src="__PROTO_BASE__${path ? "/uz" : ""}/app\\?embed=1"`), `${path}: приложение не в айфоне`);
    assert.match(all[path], /id="ap-full"/, `${path}: нет «Во весь экран»`);
    assert.match(all[path], /backdrop-filter/, `${path}: нет жидкого стекла`);
    assert.match(all[path], /data-par=/, `${path}: нет параллакса`);
  }
  for (const path of ["app", "uz/app"]) {
    // Двойной тап и щипок не приближают.
    assert.match(all[path], /<meta name="viewport" content="[^"]*maximum-scale=1,user-scalable=no,viewport-fit=cover"/, `${path}: viewport приближается`);
    assert.match(all[path], /touch-action:pan-x pan-y/, `${path}: нет touch-action`);
    assert.match(all[path], /gesturestart/, `${path}: жесты Safari не гасятся`);
    assert.match(all[path], /safe-area-inset-bottom/, `${path}: не учтены безопасные зоны iOS`);
    for (const v of ["home", "catalog", "zk", "book", "done", "podbor", "mortgage", "map", "fav", "compare", "more", "alerts"]) {
      assert.match(all[path], new RegExp(`V\\.${v} = function`), `${path}: нет экрана ${v}`);
    }
  }
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  assert.doesNotMatch(all["uz/app"].split("window.DT=")[1].split("</script>")[0].replace(/"(zk|addr|dev|name|tg|ig|yt|site|terms|ruUrl|uzUrl|img|photo)":"[^"]*"/g, ""), /[А-Яа-яЁё]{3,}/, "в узбекском приложении русские подписи");
  const stamped = stampedBundle("domtut", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("DomTut: конструктор — сайт 1 000 $ вместо 4 800 $, приложение для iPhone 3 500 $ (−60%), наличными −10%", async () => {
  // Владелец, 14.10.2026: «Цена за сайт 1000$, оставляем. Цена за приложение под iOS со скидкой 60% - 3500$ будет стоить. А если оплата наличными - скидка 10%».
  const plan = await import("../scripts/protos/domtut/plan.mjs");
  assert.equal(plan.BASE.price, 4800);
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.APP.promo, 3500);
  assert.equal(plan.APP.off, 60);
  assert.equal(Math.round(plan.APP.price * (1 - plan.APP.off / 100)), plan.APP.promo, "3 500 $ — это и есть минус 60%");
  assert.equal(plan.CASH_OFF, 10);
  // Владелец, 14.10.2026: отсчёт 48 часов — с 14:00 по Москве (16:00 по Ташкенту), один для всех.
  assert.equal(Date.parse(plan.OFFER_START), Date.parse("2026-10-14T14:00:00+03:00"));
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 6, "допы, которые клиенту реально нужны");
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.ru.t && a.uz.t && a.ru.who && a.uz.who, `${a.id}: цена и откуда доп`);
  assert.equal(plan.ALL, 4800 + plan.APP.price + plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0));
  const site = bundlePages("domtut")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /<s class="num">4 800 \$<\/s><b class="num">1 000 \$<\/b>/, "на макете 1 000 $ вместо 4 800 $ крупно");
    assert.match(html, /<s class="num">8\u202f750\u00a0\$<\/s><b class="num">3\u202f500\u00a0\$<\/b>/, "приложение: 3 500 $ вместо 8 750 $");
    assert.match(html, /"base":4800,"promo":1000,"app":8750,"appPromo":3500,"appName":"[^"]+","cash":10/, "скрипт считает от тех же цен");
    assert.match(html, /id="kit-cash"/, "тумблер «наличными −10%»");
    assert.match(html, new RegExp(`"end":${Date.parse("2026-10-16T16:00:00+05:00")},`), "таймер кончается 16.10 в 16:00 по Ташкенту");
  }
});

test("Турагентство inapp.uz: страница и приложение на ru и uz, условия, noindex, айфон, канбан, все экраны брони", () => {
  const site = bundlePages("inapp");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "app", "uz", "uz/app"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("inapp.uz"), `${path}: нет названия агентства`);
    // Данные туров демо, и это сказано на странице.
    assert.match(page, lang === "ru" ? /демо/ : /demo/, `${path}: не сказано, что туры демо`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], new RegExp(`<iframe id="app-frame"[^>]*data-src="__PROTO_BASE__${path ? "/uz" : ""}/app\\?embed=1"`), `${path}: приложение не в айфоне`);
    assert.match(all[path], /id="ap-full"/, `${path}: нет «Во весь экран»`);
    for (const id of ["put", "prilozhenie", "menedzher", "shema", "otvet", "nuzhno", "keys", "predlozhenie", "konstruktor"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.match(all[path], /id="bx-board"/, `${path}: нет канбана менеджера`);
    // Владелец, 14.10.2026: блок «Мы уже делали для турагентств» — только наш кейс Apollo Travel.
    assert.ok(all[path].includes(`https://devuz.studio/${path || "ru"}/cases/apollo-travel`), `${path}: нет ссылки на кейс Apollo Travel`);
    // Акции 48 часов нет: её цену решает владелец.
    assert.doesNotMatch(all[path], /id="timer"|48 (часов|soat)/, `${path}: таймер акции, которой нет`);
  }
  for (const path of ["app", "uz/app"]) {
    assert.match(all[path], /<meta name="viewport" content="[^"]*maximum-scale=1,user-scalable=no,viewport-fit=cover"/, `${path}: viewport приближается`);
    assert.match(all[path], /touch-action:pan-x pan-y/, `${path}: нет touch-action`);
    assert.match(all[path], /gesturestart/, `${path}: жесты Safari не гасятся`);
    assert.match(all[path], /safe-area-inset-bottom/, `${path}: не учтены безопасные зоны iOS`);
    for (const v of ["home", "results", "hotel", "tour", "check", "book", "booked", "pay", "paid", "trips", "trip", "doc", "chat", "hot", "fav", "more", "tourists", "alerts"]) {
      assert.match(all[path], new RegExp(`V\\.${v} = function`), `${path}: нет экрана ${v}`);
    }
    for (const pay of ["Click", "Payme", "Uzum Bank", "Uzcard / Humo", "Visa / Mastercard"]) assert.ok(all[path].includes(pay), `${path}: нет оплаты ${pay}`);
  }
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  assert.doesNotMatch(all.uz.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, "кириллица в узбекской странице");
  assert.doesNotMatch(all["uz/app"].split("window.TB=")[1].split("</script>")[0], /[А-Яа-яЁё]{3,}/, "в узбекском приложении русские подписи");
  const stamped = stampedBundle("inapp", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Турагентство: «Минимум» 5 900 $ за 8-10 недель, «Максимум» 7 900 $ за 11-13, допы по рынку, наличными −10%, цены в одном месте", async () => {
  // Владелец, 14.10.2026: предварительные цены из разговора; акцию не ставим.
  const plan = await import("../scripts/protos/inapp/plan.mjs");
  const [mn, mx] = plan.TIERS;
  assert.deepEqual([mn.id, mn.price, mn.weeks], ["min", 5900, [8, 10]]);
  assert.deepEqual([mx.id, mx.price, mx.weeks], ["max", 7900, [11, 13]]);
  assert.ok(plan.ADDONS.length >= 6, "допы, которые агентству реально нужны");
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.ru.t && a.ru.e && a.uz.t && a.uz.e, `${a.id}: цена и описание`);
  assert.equal(plan.CASH_OFF, 10);
  assert.equal(plan.ALL, 7900 + plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0));
  const site = bundlePages("inapp")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /data-p="5900" data-w="8-10"/, "«Минимум» на странице");
    assert.match(html, /data-p="7900" data-w="11-13" checked/, "«Максимум» выбран по умолчанию");
    assert.match(html, /"tiers":\[\{"id":"min"[^\]]*"p":5900/, "скрипт считает от тех же цен");
    // Владелец, 14.10.2026: наличными минус 10% от цены.
    assert.match(html, /id="kit-cash"/, "тумблер «наличными −10%»");
    assert.match(html, /"cash":10,/, "скрипт считает скидку за наличные от тех же 10%");
  }
});

test("Компьютерный клуб Invis: страница и кабинеты на ru и uz, условия, noindex, влёт в знак, бронь, колесо", () => {
  const site = bundlePages("invis");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "admin", "kabinet", "uz", "uz/admin", "uz/kabinet"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(/Invis|INVIS/.test(page), `${path}: нет названия клуба`);
    assert.match(page, lang === "ru" ? /демо/ : /demo/, `${path}: не сказано, что данные демо`);
    // Колесо: шансы строго 65 / 25 / 10, выбор до анимации, видны мелким текстом.
    assert.match(page, /"odds":\[\{"id":"none","p":65,"hours":0[^\]]*"id":"h1","p":25,"hours":1[^\]]*"id":"h2","p":10,"hours":2/, `${path}: шансы колеса`);
    assert.match(page, /crypto\.getRandomValues/, `${path}: исход колеса не из криптослучайности`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="iv-cv"/, `${path}: нет влёта в знак Invis`);
    for (const id of ["hero", "setup", "zony", "bron", "koleso", "kabinety", "predlozhenie", "konstruktor"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.match(all[path], /backdrop-filter:url\(#lq\)/, `${path}: нет жидкого стекла`);
    assert.match(all[path], /data-par=/, `${path}: нет параллакса`);
    // Владелец, 15.10.2026: шапка при прокрутке прячется и возвращается через 3 с после остановки.
    assert.match(all[path], /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(all[path], /function onScroll\(\)\{headIdle\(\);/, `${path}: шапка не прячется при прокрутке`);
    assert.doesNotMatch(all[path], /y<lastY-4/, `${path}: шапка снова показывается при прокрутке вверх`);
    // Железо — настоящие фото, вентиляторы видеокарты — отдельные слои, которые крутятся.
    for (const f of ["gear-gpu", "gear-fan0", "gear-fan1", "gear-fan2", "gear-kb", "gear-mouse", "gear-hs", "gear-desk"]) assert.ok(all[path].includes(`/protos/invis/${f}.webp`), `${path}: нет фото ${f}`);
    assert.match(all[path], /class="rg-rot"/, `${path}: вентиляторы не крутятся`);
    assert.doesNotMatch(all[path], /class="gpu"|class="kb"|class="mouse"/, `${path}: осталось железо, нарисованное кодом`);
    assert.match(all[path], new RegExp(`data-src="__PROTO_BASE__${path ? "/uz" : ""}/kabinet\\?embed=1"`), `${path}: кабинет не в айфоне`);
    assert.match(all[path], new RegExp(`data-src="__PROTO_BASE__${path ? "/uz" : ""}/admin\\?embed=1"`), `${path}: пульт не в рамке`);
    for (const s of ["Langame", "SENET", "SmartShell", "iCafeCloud"]) assert.ok(all[path].includes(s), `${path}: нет системы ${s}`);
    // Акции 48 часов нет: её цену решает владелец.
    assert.doesNotMatch(all[path], /id="timer"|48 (часов|soat)/, `${path}: таймер акции, которой нет`);
  }
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  for (const path of ["uz", "uz/kabinet", "uz/admin"]) {
    assert.doesNotMatch(all[path].replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица в узбекской странице`);
    for (const id of ["iv-data", "cab-data", "kit-data"]) {
      const m = all[path].match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`));
      if (m) assert.doesNotMatch(m[1].replace(/"(other|site)":"[^"]*"/g, ""), /[А-Яа-яЁё]{3,}/, `${path}: русские подписи в ${id}`);
    }
  }
  const stamped = stampedBundle("invis", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Invis: конструктор — сайт 1 700 $, все допы вместе 1 300 $, итог не больше 3 000 $, без акции", async () => {
  // Владелец, 15.10.2026: «сайт без допов 1 700 $; с допами не больше 3 000 $ в сумме за всё».
  const plan = await import("../scripts/protos/invis/plan.mjs");
  assert.equal(plan.BASE.price, 1700);
  const sum = plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0);
  assert.equal(plan.ALL, 1700 + sum);
  assert.ok(plan.ALL <= 3000, "со всеми допами не больше 3 000 $");
  for (const id of ["booking", "cabinet", "admin", "pay", "wheel", "bot"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.ru.t && a.ru.e && a.uz.t && a.uz.e, `${a.id}: цена и описание`);
  const site = bundlePages("invis")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /"base":1700,/, "скрипт считает от той же цены сайта");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("Архбюро (RU и EN): главная и 4 проекта, условия, noindex, заставка, пролёт, меню, форма справа", async () => {
  const { statSync, readdirSync } = await import("node:fs");
  const site = bundlePages("arhbyuro");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const slugs = ["dom-s-konsolyu", "gostinaya-vo-dvor", "bashnya-s-rebrami", "pavilon-v-parke"];
  assert.deepEqual(Object.keys(all).sort(), ["", "en", ...slugs.flatMap((s) => [`proekt/${s}`, `en/proekt/${s}`])].sort());
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}"`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark|mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("LINIA"), `${path}: нет рабочего названия бюро`);
    // Скрипты только свои: GSAP лежит у нас, со стороны ничего не грузится, кроме шрифтов.
    for (const m of page.matchAll(/<script[^>]+src="([^"]+)"/g)) assert.equal(m[1], "/protos/arhbyuro/gsap.min.js", `${path}: чужой скрипт ${m[1]}`);
    // Одна форма на весь сайт, выезжает справа; меню с фоном у каждого пункта.
    assert.match(page, /id="panel"[\s\S]*id="pn-form"/, `${path}: нет формы справа`);
    assert.equal((page.match(/class="mn-bg[ "]/g) || []).length, 5, `${path}: у пунктов меню нет фонов`);
    // Шапка прячется при прокрутке и возвращается через 3 секунды (правило владельца, 15.10.2026).
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу`);
    if (lang === "en") assert.doesNotMatch(page.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица в английской странице`);
  }
  for (const home of [all[""], all.en]) {
    assert.match(home, /id="intro"[\s\S]*DevUz/, "нет заставки DevUz Studio");
    assert.match(home, /class="fly" id="prolet"[^>]*data-n="180"/, "нет пролёта на 180 кадров");
    assert.match(home, /class="hero-v"[\s\S]*hero-m\.webp|hero-m\.webp[\s\S]*class="hero-v"/, "нет видео с картинкой для телефона");
    assert.match(home, /class="map"/, "нет карты проектов");
  }
  // Всё, на что ссылаются страницы, лежит в public/ и не тяжелее разумного.
  const pub = "public/protos/arhbyuro";
  for (const page of Object.values(all)) for (const m of page.matchAll(/\/protos\/arhbyuro\/([\w./-]+\.(?:webp|png|mp4|js))/g)) statSync(`${pub}/${m[1]}`);
  for (const set of ["d", "m"]) assert.equal(readdirSync(`${pub}/f/${set}`).filter((f) => f.endsWith(".webp")).length, 180, `пролёт ${set}: не 180 кадров`);
  const total = (dir: string): number => readdirSync(dir, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? total(`${dir}/${e.name}`) : statSync(`${dir}/${e.name}`).size), 0);
  assert.ok(total(pub) < 40_000_000, "кадры и ролики тяжелее 40 МБ");
  const stamped = stampedBundle("arhbyuro", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["en/proekt/pavilon-v-parke"], site.pages["en/proekt/pavilon-v-parke"], "отпечаток не поставился на странице проекта");
});

test("Магазин Greenwell: страница, магазин и панель на ru и uz, условия, noindex, полный цикл заказа, рассрочка, отзывы за баллы", () => {
  const site = bundlePages("greenwell");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "shop", "uz", "uz/panel", "uz/shop"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Greenwell"), `${path}: нет названия магазина`);
    assert.match(page, lang === "ru" ? /демо/ : /demo/, `${path}: не сказано, что данные демо`);
    // Владелец, 15.10.2026: систему посещаемости в макете не называем.
    assert.doesNotMatch(page, /метрик|metrik|metrica/i, `${path}: названа система посещаемости`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], /class="gw-cv"[^>]*data-logo=/, `${path}: нет знака Greenwell в заставке`);
    for (const id of ["hero", "seychas", "put", "rassrochka", "otzyvy", "panel", "cena", "konstruktor", "timer"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.match(all[path], new RegExp(`data-src="__PROTO_BASE__${path ? "/uz" : ""}/shop\\?embed=1`), `${path}: магазин не в айфоне`);
    assert.match(all[path], new RegExp(`data-src="__PROTO_BASE__${path ? "/uz" : ""}/panel\\?embed=1"`), `${path}: панель не в окне`);
    // Владелец, 15.10.2026: шапка при прокрутке прячется и возвращается через 3 с после остановки.
    assert.match(all[path], /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(all[path], /function onScroll\(\)\{headIdle\(\);/, `${path}: шапка не прячется при прокрутке`);
    assert.doesNotMatch(all[path], /y<lastY-4/, `${path}: шапка снова показывается при прокрутке вверх`);
  }
  for (const path of ["shop", "uz/shop"]) {
    for (const v of ["home", "catalog", "product", "cart", "checkout", "nasiya", "order", "review", "me", "orders", "plans", "addrs", "fav", "points"]) assert.match(all[path], new RegExp(`V\\.${v}=function`), `${path}: нет экрана ${v}`);
    for (const pay of ["Click", "Payme", "Uzum Bank", "Uzcard / Humo", "Uzum Nasiya", "Alif Nasiya", "Anorbank"]) assert.ok(all[path].includes(pay), `${path}: нет оплаты ${pay}`);
    assert.match(all[path], /class="tabbar"/, `${path}: нет нижней панели`);
    assert.match(all[path], /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    // Фото — их собственные, из сборки, не хотлинком.
    assert.doesNotMatch(all[path], /images\.uzum\.uz|tildacdn/, `${path}: фото хотлинком`);
    for (const id of ["mgc", "mgb", "sleep", "se", "q10", "om", "multi", "zinc", "glu", "wl", "d3", "vc", "nails"]) assert.ok(all[path].includes(`"id":"${id}"`), `${path}: нет товара ${id}`);
  }
  for (const path of ["panel", "uz/panel"]) {
    for (const v of ["dash", "orders", "reviews", "goods", "logistics", "nasiya", "traffic", "seller", "log"]) assert.match(all[path], new RegExp(`V\\.${v}=function`), `${path}: нет раздела ${v}`);
  }
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  for (const path of ["uz", "uz/shop", "uz/panel"]) {
    assert.doesNotMatch(all[path].replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица в узбекской странице`);
    for (const id of ["gw-data", "gp-data", "kit-data"]) {
      const m = all[path].match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`));
      if (!m) continue;
      const data = JSON.parse(m[1]);
      // Отзывы покупателей — как есть, на их языке; синонимы поиска — на обоих.
      delete data.products; delete data.syn;
      assert.doesNotMatch(JSON.stringify(data), /[А-Яа-яЁё]{3,}/, `${path}: русские подписи в ${id}`);
    }
  }
  const stamped = stampedBundle("greenwell", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Greenwell: магазин 1 000 $ вместо 4 900 $ на 48 часов, 10-20 допов с ценой и пользой, цены в одном месте", async () => {
  // Владелец, 15.10.2026: «Цена такого счастья без допов по акции - 1000$. Допы считаются отдельно, придумай 10-20 допов».
  const plan = await import("../scripts/protos/greenwell/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.ok(plan.BASE.price > plan.BASE.promo);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.ru.t && a.ru.e && a.uz.t && a.uz.e, `${a.id}: цена и описание`);
  assert.equal(plan.ALL, 1000 + plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0));
  const site = bundlePages("greenwell")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /<s>4 900 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 4 900 $ крупно");
    assert.match(html, /"base":1000,"regular":4900,/, "скрипт считает от тех же цен");
    assert.match(html, /"hours":48,/, "отсчёт 48 часов");
    // Владелец, 16.10.2026: «Продли таймер до вторника 17:00 на следующей неделе».
    assert.ok(html.includes(`"until":"${plan.OFFER_UNTIL}"`), "отсчёт до продлённого срока");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("Greenwell: AI Seller — четыре площадки, анимация агентов, 5 000 $ за код или 500 $ в месяц", async () => {
  // Владелец, 16.10.2026: «2 формата: автоматизация одного маркетплейса через их дашборд - 5000$ и код на их стороне, либо подписка 500$ в месяц».
  const plan = await import("../scripts/protos/greenwell/plan.mjs");
  assert.equal(plan.SELLER.code.price, 5000);
  assert.equal(plan.SELLER.sub.month, 500);
  const site = bundlePages("greenwell")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.ok(html.includes('name="ais"'), "выбор Seller AI в конструкторе");
    assert.ok(html.includes('data-p="5000"') && html.includes('data-m="500"'), "цены Seller AI из plan.mjs");
  }
  for (const path of ["panel", "uz/panel"]) {
    const page = site.pages[path];
    for (const mk of ["Uzum", "Wildberries", "Amazon"]) assert.ok(page.includes(mk), `${path}: нет ${mk}`);
    for (const a of ["rivals", "price", "reviews", "supply", "content", "ads"]) assert.ok(page.includes(`"${a}"`), `${path}: нет агента ${a}`);
  }
});

test("SIA: главная и 14 проектов — условия, noindex, только с сайта бюро, чертёж в рендер, WhatsApp бюро", async () => {
  const { existsSync, readFileSync, statSync } = await import("node:fs");
  const site = bundlePages("sia");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const data = JSON.parse(readFileSync("scripts/protos/sia/data.json", "utf8"));
  assert.equal(data.index.length, 65, "в архиве не все проекты бюро");
  assert.equal(Object.keys(all).length, 3 + data.featured.length, "главная, вариант 2, панель и страницы проектов");
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes('<html lang="ru">'), `${path}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), `${path}: нет условий`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    if (path !== "panel") {
      assert.ok(page.includes("IDLE=3000"), `${path}: шапка не по правилу трёх секунд`);
      // Главное действие — WhatsApp и телефон бюро, оба с их сайта.
      assert.ok(page.includes('href="https://wa.me/79150103671?text='), `${path}: нет WhatsApp бюро`);
      assert.ok(page.includes('href="tel:+74950980493"'), `${path}: нет телефона бюро`);
    }
    assert.ok(page.includes("/protos/sia/logo-k.png"), `${path}: нет логотипа бюро`);
    for (const src of page.match(/\/protos\/sia\/[\w./-]+\.(?:webp|png)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
  }
  assert.match(all[""], /id="intro"[\s\S]*DevUz Studio/, "нет промо DevUz Studio");
  // Заставка: фермы логотипа собираются в каркас дома с первого экрана.
  assert.match(all[""], /class="br-cv"/, "нет холста заставки");
  // Панель сайта, как у Greenwell, под архитектурное бюро (владелец, 19.10.2026): пользователи
  // и роли с правами по разделам, проекты, новости, коллектив и фото в каждый раздел сайта.
  const panel = all["panel"];
  const pd = JSON.parse(panel.match(/<script type="application\/json" id="sp-data">([\s\S]*?)<\/script>/)![1]);
  assert.equal(pd.projects.length, data.index.length, "в панели не все проекты архива");
  assert.ok(pd.projects.every((p: { photos: string[] }) => p.photos.length > 0), "у проекта в панели нет фото");
  assert.equal(pd.team.length, 12, "в панели не весь коллектив");
  for (const role of ["Владелец", "Администратор", "Редактор", "Медиа", "Менеджер заявок"]) assert.ok(panel.includes(`n:'${role}'`), `нет роли ${role}`);
  for (const area of ["Проекты", "Разделы сайта", "Новости и выставки", "Коллектив", "Медиатека", "Заявки", "Пользователи и роли", "Журнал", "Настройки"]) assert.ok(panel.includes(`'${area}'`), `нет раздела ${area}`);
  assert.ok(panel.includes("indexedDB.open('sia-media'"), "фото не сохраняются");
  assert.ok(pd.sections.some((x: { canPhotos: boolean }) => x.canPhotos), "в разделы сайта нельзя загрузить фото");
  // Главная подхватывает правки панели и показывает саму панель.
  assert.ok(all[""].includes("localStorage.getItem('sia-panel-1')"), "главная не читает правки панели");
  assert.match(all[""], /id="sia-secs"/, "главная без списка блоков для панели");
  assert.match(all[""], /class="pn-frame"[\s\S]*data-src="[^"]*\/panel\?embed=1"/, "на главной нет блока с панелью");
  // Панель — Strapi (владелец, 22.10.2026): настоящий проект в scripts/protos/sia/strapi,
  // на главной снимки этой панели, наполненной проектами бюро.
  assert.equal((all[""].match(/<img src="\/protos\/sia\/strapi\/[\w-]+-m\.webp"/g) || []).length, 7, "на главной нет снимков панели Strapi");
  const ST = "scripts/protos/sia/strapi/";
  const stPkg = JSON.parse(readFileSync(ST + "package.json", "utf8"));
  assert.match(stPkg.dependencies["@strapi/strapi"], /^5\./, "панель не на Strapi 5");
  for (const t of ["project", "service", "news-item", "team-member", "lead", "log-entry", "home", "contact", "object-type"]) statSync(`${ST}src/api/${t}/content-types/${t}/schema.json`);
  const stIndex = readFileSync(ST + "src/index.js", "utf8");
  for (const role of ["Редактор сайта", "Медиа", "Менеджер заявок"]) assert.ok(stIndex.includes(`name: '${role}'`), `в Strapi нет роли ${role}`);
  assert.match(stIndex, /strapi\.documents\.use\(logMiddleware/, "журнал действий не пишется");
  assert.match(readFileSync(ST + "src/api/lead/controllers/lead.js", "utf8"), /stage: 'Новая'/, "заявка с сайта сама ставит себе статус");
  const stSeed = JSON.parse(readFileSync(ST + "seed/data.json", "utf8"));
  assert.equal(stSeed.projects.length, data.index.length, "в Strapi уходят не все проекты");
  for (const p of stSeed.projects) for (const f of [p.cover, p.drawing, ...p.gallery].filter(Boolean)) assert.ok(existsSync("public/protos/sia/" + f), `нет фото ${f} для Strapi`);
  const lines = JSON.parse(readFileSync("scripts/protos/sia/lines.json", "utf8"));
  assert.ok(lines.logo.length >= 4 * 200 && lines.house.length >= 4 * 400, "мало линий логотипа или дома");
  assert.ok(all[""].includes("var SIA_LINES={"), "линии заставки не попали на страницу");
  // Пролёт по рендерам бюро, барабан, бегущая строка и папки.
  assert.equal((all[""].match(/<figure class="fl" /g) || []).length, 8, "в пролёте не 8 кадров");
  assert.match(all[""], /id="drum"/, "нет барабана");
  // 3D-пролёт Blender в APx180.2606 — подписан как наша интерпретация по рендерам бюро.
  assert.match(all[""], /class="bfl"[^>]*data-n="300"[^>]*data-d="\/protos\/sia\/f\/d\/"/, "нет 3D-пролёта");
  assert.match(all[""], /Интерпретация DevUz Studio по рендерам бюро/, "3D-пролёт не подписан как интерпретация");
  // 300 раскрытых кадров — полтора гигабайта памяти, страница дёргается при прокрутке:
  // кадры держим сжатыми, раскрываем вне главного потока и не больше KEEP за раз.
  const siaJs = readFileSync("scripts/protos/sia/site.js", "utf8");
  assert.match(siaJs, /KEEP=\d+/, "у 3D-пролёта нет предела раскрытых кадров");
  assert.match(siaJs, /createImageBitmap\(src\[i\]\)/, "кадры раскрываются не из сжатого файла");
  assert.match(siaJs, /\.close\(\)/, "лишние кадры не закрываются");
  for (let f = 1; f <= 300; f++) for (const d of ["d", "m"]) statSync(`public/protos/sia/f/${d}/${String(f).padStart(4, "0")}.webp`);
  assert.match(all[""], /class="velo-row"/, "нет бегущей строки");
  assert.equal((all[""].match(/data-gf /g) || []).length, 4, "не 4 папки");
  for (const id of ["prolet", "arhitektura", "interery", "arhiv", "uslugi", "byuro", "kontakty"]) assert.match(all[""], new RegExp(`id="${id}"`), `нет блока ${id}`);
  assert.equal((all[""].match(/class="ix-row"/g) || []).length, 65, "в архиве не 65 строк");
  // Вариант 2 по мотивам textura.agency (владелец, 19.10.2026): тёмный, снимки ч/б и наливаются
  // цветом под курсором или у середины экрана; тумблер вариантов на обеих страницах.
  const v2 = all["v2"];
  assert.ok(v2.startsWith("<!doctype html>") && v2.includes('id="dzi"'), "у варианта 2 нет заставки DevUz");
  assert.match(all[""], /class="vt" [^>]*data-cur="1"[\s\S]*href="[^"]*\/v2" data-v="2"/, "на главной нет тумблера вариантов");
  assert.match(v2, /class="vt" [^>]*data-cur="2"/, "во втором варианте нет тумблера");
  const phs = v2.match(/<span class="ph[ "]/g) || [];
  assert.ok(phs.length >= 30, "мало снимков во втором варианте");
  assert.equal((v2.match(/class="ph-g"/g) || []).length, phs.length, "у снимка нет ч/б слоя");
  assert.match(v2, /\.ph-g\{filter:grayscale\(1\)/, "снимки не ч/б");
  assert.match(v2, /hover: hover/, "цвет не по наведению");
  assert.match(v2, /rootMargin:'-34% 0px -34% 0px'/, "на телефоне цвет не у середины экрана");
  assert.equal((v2.match(/class="pl" /g) || []).length, 8, "во втором варианте не 8 проектов");
  assert.doesNotMatch(v2, /✳/, "звёздочка-эмодзи: на iPhone она зелёная");
  for (const [path, page] of [["", all[""]], ["v2", v2]]) assert.match(page, /html\{[^}]*overflow-x:clip/, `${path}: страница уезжает вбок на телефоне`);
  assert.ok((v2.match(/class="tf-s[ "]/g) || []).length >= 6 && v2.includes("},1000)"), "таблетка не сменяет проекты раз в секунду");
  for (const id of ["proekty", "napravleniya", "byuro", "kontakty"]) assert.match(v2, new RegExp(`id="${id}"`), `вариант 2: нет блока ${id}`);
  for (const p of data.featured) {
    const page = all["proekt/" + p.slug];
    assert.ok(page, `нет страницы ${p.code}`);
    assert.ok(page.includes(`/protos/sia/d/${p.slug}.webp`) && page.includes(`/protos/sia/p/${p.slug}-0.webp`), `${p.code}: нет чертежа и рендера`);
  }
  const stamped = stampedBundle("sia", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Магазин Medikor: страница, магазин и панель, условия, noindex, счёт по ИНН, КП, пульс в знак и сканер", async () => {
  const { statSync } = await import("node:fs");
  const site = bundlePages("medikor");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "shop"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes('<html lang="ru">'), `${path}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), `${path}: нет условий`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Medikor"), `${path}: нет названия магазина`);
    assert.match(page, /демо/, `${path}: не сказано, что данные демо`);
    // Фото — их собственные, из сборки, не хотлинком.
    assert.doesNotMatch(page, /medikor\.ru\/(assets|images)/, `${path}: фото хотлинком`);
    for (const m of page.matchAll(/\/protos\/medikor\/([\w.-]+\.(?:webp|png))/g)) statSync(`public/protos/medikor/${m[1]}`);
  }
  const home = all[""];
  assert.match(home, /id="intro"[\s\S]*DevUz Studio/, "нет промо DevUz Studio");
  assert.match(home, /class="mk-cv"[^>]*data-logo=/, "нет знака Medikor в заставке");
  for (const id of ["hero", "seychas", "skaner", "sc-box", "put", "schet", "panel", "cena", "konstruktor", "timer"]) assert.match(home, new RegExp(`id="${id}"`), `нет блока ${id}`);
  assert.match(home, /data-src="__PROTO_BASE__\/shop\?embed=1/, "магазин не в айфоне");
  assert.match(home, /data-src="__PROTO_BASE__\/panel\?embed=1"/, "панель не в окне");
  // Владелец, 15.10.2026: шапка при прокрутке прячется и возвращается через 3 с после остановки.
  for (const path of ["", "shop"]) {
    assert.match(all[path], /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(all[path], /function onScroll\(\)\{headIdle\(\)/, `${path}: шапка не прячется при прокрутке`);
  }
  // Сканер и знак двигаются только transform: ни left, ни width в анимации.
  assert.match(home, /\.sc-beam\{[^}]*transform:translate3d/, "луч сканера не на transform");
  const shop = all.shop;
  for (const v of ["home", "catalog", "product", "cart", "checkout", "invoice", "order", "orders", "kp", "kps", "kpview", "me", "docs", "fav"]) assert.match(shop, new RegExp(`V\\.${v}=function`), `магазин: нет экрана ${v}`);
  for (const s of ["По счёту", "По QR через СБП", "Картой онлайн", "СДЭК", "ПЭК", "Деловые линии", "Запросить КП", "Счёт на организацию"]) assert.ok(shop.includes(s), `магазин: нет «${s}»`);
  assert.match(shop, /class="tabbar"/, "нет нижней панели");
  for (const v of ["dash", "orders", "kp", "invoices", "clients", "goods", "log"]) assert.match(all.panel, new RegExp(`V\\.${v}=function`), `панель: нет раздела ${v}`);
  // Таблицы в карточках не растягивают страницу: своя прокрутка и спрятанные колонки.
  assert.match(all.panel, /\.tw\{overflow-x:auto/, "таблицы панели без своей прокрутки");
  assert.match(all.panel, /@media \(max-width:719px\)\{\.c-m\{display:none\}\}/, "панель не прячет колонки на телефоне");
  const stamped = stampedBundle("medikor", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.shop, site.pages.shop, "отпечаток не поставился в магазине");
});

test("Medikor: цены в рублях, скидка 30% на магазин и допы на 48 часов с первого открытия, цены в одном месте", async () => {
  // Владелец, 16.10.2026: «скинь таймер до первого открытия + переведи цены в рубли и сделай скидку 30%».
  const plan = await import("../scripts/protos/medikor/plan.mjs");
  assert.equal(plan.DISCOUNT, 30);
  assert.equal(plan.BASE.price, 745000);
  assert.equal(plan.BASE.promo, plan.sale(plan.BASE.price), "акция магазина — минус 30%");
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.price % 1000 === 0 && a.ru.t && a.ru.e, `${a.id}: цена в рублях и описание`);
  assert.equal(plan.ALL, plan.BASE.promo + plan.ADDONS.reduce((s: number, a: { price: number }) => s + plan.sale(a.price), 0));
  const html = bundlePages("medikor")!.html;
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, ""), /\d \$/, "на странице остались доллары");
  assert.match(html, /<s>745 000 ₽<\/s><b>521 500 ₽<\/b>/, "на макете 521 500 ₽ вместо 745 000 ₽ крупно");
  assert.match(html, /"base":521500,"regular":745000,"cur":"₽",/, "скрипт считает от тех же цен в рублях");
  assert.match(html, /"hours":48,/, "отсчёт 48 часов");
  assert.match(html, /mk-offer-2/, "отсчёт заново с первого открытия после смены цен");
  for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${plan.sale(a.price)}"`), `${a.id}: цена со скидкой на странице`);
});

test("Amani: 6 страниц на uz и ru — условия, noindex, заставка DevUz, шёлк, только данные канала", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("amani");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "ru", "ru/panel", "ru/shop", "shop"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("ru") ? "ru" : "uz";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /Greenwell paneli|Панель Greenwell|gw-logo/, `${path}: остался чужой макет`);
    assert.ok(page.includes("AMÁNI"), `${path}: нет названия магазина`);
    for (const src of page.match(/\/protos\/amani\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
  }
  for (const path of ["", "ru"]) {
    const page = all[path];
    assert.match(page, /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.ok(page.includes('id="silk"') && page.includes("IDLE=3000"), `${path}: нет шёлка или шапка не по правилу трёх секунд`);
    assert.ok(page.includes("https://t.me/Amani_uzadmin"), `${path}: заказ не ведёт к их админу`);
    assert.ok(page.includes("ScrollTrigger.min.js"), `${path}: нет ScrollTrigger`);
  }
  const stamped = stampedBundle("amani", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Amani: цены товаров — из канала, магазин 1 000 $ вместо 4 900 $ на 48 часов, допы в одном месте", async () => {
  const { readFileSync } = await import("node:fs");
  const D = await import("../scripts/protos/amani/data.mjs");
  const ch = JSON.parse(readFileSync("scripts/protos/amani/channel.json", "utf8"));
  const byPost = new Map(ch.products.map((p: { post: string; text: string }) => [Number(String(p.post).split("/").pop()), p]));
  // Цена — числом из текста поста: «Narxi:780.000», «1.200.000 1.000.000», «Baza kòylak:580.000».
  const dots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  for (const p of D.PRODUCTS) {
    const c = byPost.get(p.post) as { text: string } | undefined;
    assert.ok(c, `${p.id}: нет поста ${p.post} в разборе канала`);
    const text = c.text.replace(/\s+/g, " ");
    assert.ok(text.includes(dots(p.price)) || text.includes(String(p.price)), `${p.id}: цены ${p.price} нет в посте ${p.post}`);
    if (p.old) assert.ok(text.includes(dots(p.old)), `${p.id}: старой цены нет в посте`);
  }
  const plan = await import("../scripts/protos/amani/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 4900);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  const site = bundlePages("amani")!;
  for (const html of [site.html, site.pages.ru]) {
    assert.match(html, /<s>4 900 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 4 900 $ крупно");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("vTashkente (ru и uz): главная из полноэкранных секций, условия, noindex, заставка, сборка кухни, примерка, заявка справа", async () => {
  const { statSync, readdirSync } = await import("node:fs");
  const site = bundlePages("vtashkente");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "uz"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path === "uz" ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}"`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark|mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /<script[^>]+src=/, `${path}: чужой скрипт`);
    assert.match(page, /id="intro"[\s\S]*DevUz/, `${path}: нет заставки DevUz Studio`);
    // Секции во весь экран, у каждой свой приём.
    for (const id of ["hero", "sborka", "primerka", "raboty", "zakaz", "doverie", "cena", "zamer"]) assert.match(page, new RegExp(`class="hs [a-z]+" id="${id}"`), `${path}: нет секции ${id}`);
    assert.match(page, /class="asm-cv"/, `${path}: нет сборки кухни`);
    assert.equal((page.match(/class="sw[ "]/g) || []).length, 10, `${path}: не все образцы примерки`);
    assert.match(page, /id="panel"[\s\S]*data-form/, `${path}: нет формы справа`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу`);
    // Связь — их Telegram; цены сайта — по общей акции 48 часов (PROMO).
    assert.ok(page.includes("https://t.me/vTashkenteuz_IrinaTsoy"), `${path}: нет их Telegram`);
    assert.match(page, /500 \$[\s\S]*1 700 \$[\s\S]*1 000 \$[\s\S]*2 500 \$/, `${path}: цены не по PROMO`);
    assert.ok(page.includes("vTashkente"), `${path}: нет названия компании`);
    if (lang === "uz") assert.doesNotMatch(page.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица в узбекской странице`);
  }
  const pub = "public/protos/vtashkente";
  for (const page of Object.values(all)) for (const m of page.matchAll(/\/protos\/vtashkente\/([\w./-]+\.(?:webp|png))/g)) statSync(`${pub}/${m[1]}`);
  const total = readdirSync(pub).reduce((s, f) => s + statSync(`${pub}/${f}`).size, 0);
  assert.ok(total < 8_000_000, "снимки тяжелее 8 МБ");
  const stamped = stampedBundle("vtashkente", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.uz, site.pages.uz, "отпечаток не поставился на узбекской странице");
});

test("Dilrabo Travel: переодетый inapp — их знак, туры и машины, страница и приложение на ru и uz, условия, noindex, шапка", () => {
  const site = bundlePages("dilrabo");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "app", "uz", "uz/app"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.ok(page.includes("Dilrabo Travel"), `${path}: нет названия агентства`);
    assert.ok(page.includes("/protos/dilrabo/tilda-700.woff2"), `${path}: не их шрифт Tilda Sans`);
    assert.match(page, /<symbol id="tb-mark" viewBox="0 0 90\.99 90\.9">/, `${path}: не их знак`);
    assert.doesNotMatch(page, /inapp|Lara Sun|Turvizordan barcha|Туры всех туроператоров/, `${path}: остаток inapp`);
    assert.match(page, lang === "ru" ? /демо/ : /demo/, `${path}: не сказано, что цены демо`);
  }
  for (const path of ["", "uz"]) {
    assert.match(all[path], /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(all[path], new RegExp(`<iframe id="app-frame"[^>]*data-src="__PROTO_BASE__${path ? "/uz" : ""}/app\\?embed=1"`), `${path}: приложение не в айфоне`);
    for (const id of ["put", "sayt", "prilozhenie", "menedzher", "shema", "otvet", "nuzhno", "keys", "predlozhenie", "konstruktor"]) assert.match(all[path], new RegExp(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.match(all[path], /id="bx-board"/, `${path}: нет канбана менеджера`);
    assert.ok(all[path].includes(`https://devuz.studio/${path || "ru"}/cases/apollo-travel`), `${path}: нет ссылки на кейс Apollo Travel`);
    // Владелец, 16.10.2026: сайт за 1 000 $ — 48 часов на принятие, таймер на странице.
    assert.match(all[path], /<div class="timer" id="timer">/, `${path}: нет таймера акции`);
    assert.match(all[path], /<b class="num" id="tm">48:00:00<\/b>/, `${path}: таймер не на 48 часов`);
    assert.match(all[path], /localStorage\.getItem\('dt-offer-1'\)/, `${path}: отсчёт не с первого открытия`);
    // «Убери упоминания в ценах за 5900, что они это просили».
    assert.doesNotMatch(all[path], /вы просили|so‘ragan|ТЗ|TZ/, `${path}: «вы просили» в ценах`);
    // Правило владельца, 15.10.2026: шапка прячется при прокрутке и возвращается через 3 секунды.
    assert.match(all[path], /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(all[path], /function onScroll\(\)\{headIdle\(\);/, `${path}: шапка не прячется при прокрутке`);
    assert.match(all[path], /\.top\.hide\{/, `${path}: нет стиля спрятанной шапки`);
  }
  for (const path of ["app", "uz/app"]) {
    assert.match(all[path], /<meta name="viewport" content="[^"]*maximum-scale=1,user-scalable=no,viewport-fit=cover"/, `${path}: viewport приближается`);
    assert.match(all[path], /safe-area-inset-bottom/, `${path}: не учтены безопасные зоны iOS`);
    for (const v of ["home", "results", "hotel", "tour", "check", "book", "booked", "pay", "paid", "trips", "trip", "doc", "chat", "hot", "fav", "more", "tourists", "alerts"]) {
      assert.match(all[path], new RegExp(`V\\.${v} = function`), `${path}: нет экрана ${v}`);
    }
    for (const pay of ["Visa / Mastercard", "Click", "Payme", "Uzum Bank", "Uzcard / Humo"]) assert.ok(all[path].includes(pay), `${path}: нет оплаты ${pay}`);
    // Их машины и цена за день из «Нашего автопарка».
    for (const car of ['"add":50', '"add":100', '"add":120', "Chevrolet Gentra", "Hyundai H1", "Hyundai Staria"]) assert.ok(all[path].includes(car), `${path}: нет машины ${car}`);
  }
  assert.ok(all.uz.includes("o‘") || all.uz.includes("O‘"), "узбекский — латиница с o‘");
  assert.doesNotMatch(all.uz.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, "кириллица в узбекской странице");
  assert.doesNotMatch(all["uz/app"].split("window.TB=")[1].split("</script>")[0], /[А-Яа-яЁё]{3,}/, "в узбекском приложении русские подписи");
  const stamped = stampedBundle("dilrabo", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Dilrabo Travel: сайт 1 000 $ и допы к нему на 2 000 $ в 10-15 позициях; приложение и его допы как у inapp, наличными −10%", async () => {
  const plan = await import("../scripts/protos/dilrabo/plan.mjs");
  const base = await import("../scripts/protos/inapp/plan.mjs");
  assert.deepEqual(plan.TIERS.map((x: { id: string; price: number; weeks: number[] }) => [x.id, x.price, x.weeks]), base.TIERS.map((x: { id: string; price: number; weeks: number[] }) => [x.id, x.price, x.weeks]));
  assert.deepEqual(plan.ADDONS.map((a: { id: string; price: number; weeks: number }) => [a.id, a.price, a.weeks]), base.ADDONS.map((a: { id: string; price: number; weeks: number }) => [a.id, a.price, a.weeks]));
  assert.equal(plan.CASH_OFF, base.CASH_OFF);
  assert.equal(plan.ALL, base.ALL);
  const site = bundlePages("dilrabo")!;
  // Владелец, 16.10.2026: «Сделай ещё сайт за 1000$ и допы на 2000$ раскидай на 10-15 позиций».
  assert.equal(plan.SITE.price, 1000);
  assert.ok(plan.SITE_ADDONS.length >= 10 && plan.SITE_ADDONS.length <= 15, "у сайта 10-15 допов");
  assert.equal(plan.SITE_ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0), 2000, "допы к сайту вместе 2 000 $");
  assert.equal(plan.SITE_ALL, 3000);
  assert.equal(plan.SITE.regular, 2500, "после 48 часов сайт по обычной цене");
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.TIERS[0].ru.items.length >= 10, "приложение: минимум расписано подробно");
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /value="site" data-g="site" data-p="1000" data-w="3-4" checked/, "сайт на странице и выбран по умолчанию");
    assert.match(html, /<s class="tr-was">2 500 \$<\/s> <span class="tr-now">1 000 \$<\/span>/, "сайт 1 000 $ вместо 2 500 $");
    assert.match(html, /"promo":\{"id":"site","price":1000,"regular":2500,"hours":48\}/, "скрипт считает акцию от тех же цен");
    assert.ok(html.includes(">Приложение: минимум<") || html.includes(">Ilova: minimum<"), "приложение называется «Приложение: минимум»");
    assert.match(html, /data-g="app" data-p="5900" data-w="8-10"/, "«Приложение: минимум» на странице");
    assert.match(html, /data-g="app" data-p="7900" data-w="11-13"/, "«Максимум» на странице");
    for (const a of plan.SITE_ADDONS) assert.ok(html.includes(`data-g="site" data-k="${a.id}" data-p="${a.price}"`), `${a.id}: доп к сайту на странице`);
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-g="app" data-k="${a.id}" data-p="${a.price}"`), `${a.id}: доп к приложению на странице`);
    assert.match(html, /<div class="kit-grp" data-g="app" hidden>/, "допы приложения спрятаны, пока выбран сайт");
    assert.match(html, /id="kit-cash"/, "тумблер «наличными −10%»");
    assert.match(html, /"cash":10,/, "скрипт считает скидку за наличные от тех же 10%");
  }
});

test("Karomat: 6 страниц uz и ru — условия, noindex, заставка DevUz, дастархан, шапка по правилу, только их фото", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("karomat");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "menu", "panel", "ru", "ru/menu", "ru/panel"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("ru") ? "ru" : "uz";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, `${path}: overflow-x:hidden у body ломает sticky`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу трёх секунд`);
    assert.ok(page.includes("KAROMAT"), `${path}: нет названия ресторана`);
    for (const src of page.match(/\/protos\/karomat\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
  }
  for (const path of ["", "ru"]) {
    const page = all[path];
    assert.match(page, /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.equal((page.match(/class="pl pl-\d"/g) ?? []).length, 9, `${path}: на столе не девять блюд`);
    assert.ok(page.includes('id="steam"') && page.includes("ScrollTrigger.min.js"), `${path}: нет пара или ScrollTrigger`);
    assert.ok(page.includes("tel:+998712715052"), `${path}: нет звонка в ресторан`);
    assert.ok(page.includes('id="hall"') && page.includes('id="bq-list"'), `${path}: нет брони на схеме или банкета`);
  }
  const stamped = stampedBundle("karomat", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Karomat: блюда и цены — из их меню, сайт 1 000 $ вместо 2 500 $ на 48 часов, допы в одном месте", async () => {
  const { readFileSync } = await import("node:fs");
  const D = await import("../scripts/protos/karomat/data.mjs");
  const src = JSON.parse(readFileSync("scripts/protos/karomat/menu-src.json", "utf8"));
  const byId = new Map(src.items.map((x: { id: number }) => [x.id, x]));
  for (const m of D.MENU) {
    const s = byId.get(m.id) as { price: number; v: [string, number][] } | undefined;
    assert.ok(s, `${m.id}: блюда нет в их меню`);
    const prices = s.v.length ? s.v.map((v) => v[1]) : [s.price];
    assert.ok(prices.includes(m.price), `${m.id}: цены ${m.price} нет в их меню`);
    for (const v of m.v) assert.ok(prices.includes(v.p), `${m.id}: варианта ${v.p} нет в их меню`);
  }
  assert.equal(D.BRAND.service, 15, "обслуживание — как в их системе меню");
  const plan = await import("../scripts/protos/karomat/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  const site = bundlePages("karomat")!;
  for (const html of [site.html, site.pages.ru]) {
    assert.match(html, /<s>2 500 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 2 500 $ крупно");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("tovar.uz: 6 страниц ru и uz — условия, noindex, заставка DevUz, стекло, шапка по правилу, только их товары", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("tovar");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "app", "panel", "uz", "uz/app", "uz/panel"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, `${path}: overflow-x:hidden у body ломает sticky`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу трёх секунд`);
    assert.ok(page.includes("tovar.uz"), `${path}: нет названия площадки`);
    /* Русское слово в «ёлочках» на узбекской странице — пример поиска на двух языках. */
    if (lang === "uz") assert.doesNotMatch((page.split('"ui":')[1] ?? "").replace(/«[^»]*»/g, ""), /"[a-zA-Z]+":"[^"]*[А-Яа-яЁё]{3,}/, `${path}: в узбекских подписях кириллица`);
    for (const src of page.match(/\/protos\/tovar\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
  }
  for (const path of ["", "uz"]) {
    const page = all[path];
    assert.match(page, /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.equal((page.match(/class="pr[ "]/g) ?? []).length, 11, `${path}: в витрине не 11 товаров`);
    assert.ok(page.includes('class="lens"') && page.includes("backdrop-filter") && page.includes("ScrollTrigger.min.js"), `${path}: нет линзы, стекла или ScrollTrigger`);
    for (const id of ["mehaniki", "put", "prodavec", "cena", "rq-go", "bo-go", "ld", "fr-go"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
  }
  const stamped = stampedBundle("tovar", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("tovar.uz: товары и цены — с их сайта, новый облик 1 000 $ вместо 2 500 $ на 48 часов, допы в одном месте", async () => {
  const D = await import("../scripts/protos/tovar/data.mjs");
  /* Снято с tovar.uz 18.10.2026: id → цена, продавец, «Цена обновлена». */
  const SITE: Record<number, [number, string, string]> = {
    113945: [11350000, "elso", "2023-09-18"], 113947: [11350000, "elso", "2023-09-18"], 113844: [3970000, "elso", "2023-09-16"], 127572: [2737900, "shopit", "2025-09-17"],
    113918: [2450000, "elso", "2023-09-18"], 113916: [1850000, "elso", "2023-09-18"], 127578: [1606550, "shopit", "2025-09-17"], 127558: [1282490, "shopit", "2025-09-16"],
    130426: [36410000, "shopit", "2026-06-08"], 129337: [11760000, "shopit", "2025-12-23"], 118414: [10910778, "laptop", "2023-12-23"], 130703: [12650000, "shopit", "2026-07-22"],
    113755: [13910000, "elso", "2023-09-16"], 113670: [5370000, "elso", "2023-09-16"], 130576: [1274000, "shopit", "2026-07-22"], 79478: [2310000, "macbro", "2022-01-08"],
    79476: [1485000, "macbro", "2022-01-08"], 79479: [5500000, "macbro", "2022-01-08"], 119467: [846000, "sandal", "2024-02-10"], 130583: [527800, "shopit", "2026-05-05"], 53664: [1600000, "sayina", "2023-05-12"],
  };
  assert.equal(D.GOODS.length, Object.keys(SITE).length);
  for (const g of D.GOODS) assert.deepEqual([g.p, g.s, g.upd], SITE[g.id], `${g.id}: цена, продавец или дата не как на tovar.uz`);
  const plan = await import("../scripts/protos/tovar/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  // Владелец, 19.10.2026: спец условия до 29 октября, 20:00 по Ташкенту, таймер до этой минуты.
  assert.equal(Date.parse(plan.OFFER_UNTIL), Date.parse("2026-10-29T15:00:00Z"));
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  assert.ok(plan.ADDONS.filter((a: { new?: boolean }) => a.new).length >= 5, "механик, которых нет в УЗ, меньше пяти");
  assert.equal(plan.TURNKEY.price, 30000, "маркетплейс под ключ — 30 000 $, цена владельца");
  /* Цены допов — часы × ставка Ташкента; «Сейчас и станет» продаёт те же допы. */
  for (const a of plan.ADDONS) assert.equal(a.price, a.h * plan.RATE, `${a.id}: цена не по часам`);
  const dm = await import("../scripts/protos/tovar/data.mjs");
  for (const r of dm.NOW) for (const k of r.buy) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === k), `«Сейчас и станет»: нет допа ${k}`);
  const site = bundlePages("tovar")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /<s>2\u00a0500\u00a0\$<\/s><b>1\u00a0000\u00a0\$<\/b>/, "на макете 1 000 $ вместо 2 500 $ крупно");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
    assert.ok(html.includes('id="pod-klyuch"') && html.includes("<b>30\u00a0000\u00a0$</b>"), "нет маркетплейса под ключ за 30 000 $");
    assert.ok(html.includes(`"until":"${plan.OFFER_UNTIL}"`), "отсчёт до 29 октября, 20:00");
    assert.doesNotMatch(html, /48 (часов|soat)/, "срок акции уже не 48 часов");
  }
});

test("Юсем Тау: главная и каталог — условия, noindex, видео DevUz первым, шапка по правилу, только их позиции и фото", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("usemtau");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "katalog"]);
  for (const [path, page] of Object.entries(all)) {
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes('<html lang="ru">'), `${path}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), `${path}: нет условий`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, `${path}: overflow-x:hidden у body ломает sticky`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу трёх секунд`);
    assert.ok(page.includes("ЮСЕМ") && page.includes("Юсем Тау"), `${path}: нет названия компании`);
    assert.ok(page.includes("tel:+77055040023") && page.includes("wa.me/77014015624"), `${path}: нет звонка и WhatsApp компании`);
    assert.ok(page.includes('"@type":"Store"') && page.includes("Бурундайское шоссе"), `${path}: нет разметки магазина с адресом`);
    assert.ok(page.includes("Inter+Tight") && page.includes("JetBrains+Mono"), `${path}: шрифты не те`);
    for (const src of page.match(/\/protos\/usemtau\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
  }
  const home = all[""];
  assert.match(home, /<body class="site">\s*<div class="dzi" id="dzi"/, "видео DevUz не первым в body");
  for (const id of ["hero", "poisk", "find", "kompaniya", "ix", "katalog", "kalk", "snab", "dostavka", "stroyka", "asm-cv", "obekty", "gofro", "paneli", "angar", "sklad", "sosedi", "cena", "konstruktor", "dr"]) assert.ok(home.includes(`id="${id}"`), `нет блока ${id}`);
  assert.ok(home.includes("ScrollTrigger.min.js"), "нет ScrollTrigger");
  /* Вторая редакция (20.10.2026): кадр склада и снимки проката из Blender, подписанные как визуализация. */
  assert.ok(home.includes("/protos/usemtau/sklad-h-1920.webp") && home.includes("/protos/usemtau/sklad-v-1080.webp"), "нет кадра склада");
  assert.match(home, /Визуализация/, "кадр не подписан как визуализация");
  for (const k of ["armatura", "balka", "truba", "profil", "shveller", "ugolok", "list", "krug"]) assert.ok(home.includes(`/protos/usemtau/p-${k}-480.webp`), `нет снимка ${k}`);
  assert.ok(all.katalog.includes('id="kt-list"') && all.katalog.includes('id="dr"'), "в каталоге нет списка или заявки");
  const stamped = stampedBundle("usemtau", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Юсем Тау: позиции и цены за тонну — с usemtau.kz, вес по ГОСТ, сайт 1 000 $ вместо 2 500 $ на 48 часов, допы в одном месте", async () => {
  const { readFileSync } = await import("node:fs");
  const D = await import("../scripts/protos/usemtau/data.mjs");
  const src = JSON.parse(readFileSync("scripts/protos/usemtau/items-src.json", "utf8"));
  assert.equal(D.ITEMS.length, 268);
  const prices = new Map(src.items.map((x: { n: string; p: number }) => [x.n.replace(/\s+/g, " ").replace(/ЛИСТ/, "Лист").replace(/\s*\*\s*/g, "×").replace(/(\d)\s*[хx]\s*(?=\d)/g, "$1×"), x.p]));
  for (const x of D.ITEMS) assert.equal(prices.get(x.n.replace(/\s+/g, " ")), x.p, `${x.n}: цены нет на их сайте`);
  /* Вес метра: справочные значения ГОСТ. */
  const kg = (n: string) => D.ITEMS.find((x: { n: string }) => x.n === n)!;
  assert.equal(kg("Арматура 12").kgm, 0.888);
  assert.equal(kg("Швеллер 16").kgm, 14.2);
  assert.equal(kg("Балка 20Б1").kgm, 22.4);
  assert.equal(kg("Лист г/к 3,0").kgm2, 23.55);
  assert.ok(Math.abs(kg("Уголок 50×5").kgm - 3.77) < 0.05, "уголок 50×5 по ГОСТ 3,77 кг/м");
  for (const x of D.ITEMS) if (!/Электроды|Профнастил|просечно|рифл|Полоса 280/i.test(x.n)) assert.ok(x.kgm || x.kgm2, `${x.n}: нет веса`);
  const plan = await import("../scripts/protos/usemtau/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  for (const r of D.NOW) for (const k of r.buy) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === k), `«Сейчас и станет»: нет допа ${k}`);
  const html = bundlePages("usemtau")!.html;
  assert.match(html, /<s>2\u00a0500\u00a0\$<\/s><b>1\u00a0000\u00a0\$<\/b>/, "на макете 1 000 $ вместо 2 500 $ крупно");
  for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
});

test("заставка DevUz: видео в каждом макете, бывшем и новом, промо кодом осталось запасным", async () => {
  const { readdirSync, existsSync, statSync } = await import("node:fs");
  for (const f of ["dz-intro-16.mp4", "dz-intro-9.mp4", "dz-intro-16.webp", "dz-intro-9.webp"]) {
    assert.ok(existsSync(`public/protos/_dz/${f}`) && statSync(`public/protos/_dz/${f}`).size > 1000, `нет ${f}`);
  }
  /*
   * Владелец, 18.10.2026: видео — в каждом новом макете, само, без
   * согласований; 19.10.2026: «На все бывшие и будущие макеты». Тест
   * берёт все сборки, исключений нет: новая без видео сюда не попадёт.
   */
  const names = readdirSync("content/proto-bundles").map((f) => f.replace(/\.json$/, ""));
  assert.ok(names.length >= 25, "сборок меньше двадцати пяти");
  for (const n of names) {
    if (existsSync(`public/protos/${n}`)) assert.equal(readdirSync(`public/protos/${n}`).filter((f) => /^dz-intro/.test(f)).length, 0, `${n}: видео скопировано в макет, а должно быть одно`);
    const site = bundlePages(n);
    assert.ok(site, `${n}: сборка не подключена в lib/proto/bundles.ts`);
    const all = { "": site.html, ...site.pages };
    /* Видео — на главной: заставка со знаком клиента (#intro) или своя поверх страницы (#dzi). */
    const intros = Object.entries(all).filter(([, html]) => html.includes('id="intro"') || html.includes('id="dzi"'));
    assert.ok(intros.length > 0, `${n}: нет заставки с видео DevUz (lib/proto/dz-video.mjs)`);
    for (const [path, html] of intros) {
      const at = `${n} /${path}`;
      const solo = !html.includes('id="intro"');
      const intro = html.slice(html.indexOf(solo ? 'id="dzi"' : 'id="intro"'));
      if (!solo) assert.match(html, /\(function\(\)\{var s=document\.currentScript,b=s&&s\.parentNode;if\(b&&!document\.documentElement\.classList\.contains\('intro-off'\)\)dzStart\(b\)\}\)\(\)/, `${at}: видео не запускается сразу после разметки`);
      assert.match(intro, /^id="(intro|dzi)"[^>]*>\n?<div class="dz-vid" aria-hidden="true"><picture><source media="\(orientation: portrait\)" srcset="\/protos\/_dz\/dz-intro-9\.webp"><img src="\/protos\/_dz\/dz-intro-16\.webp" alt="" fetchpriority="high"><\/picture><video muted playsinline/, `${at}: видео не первым слоем заставки`);
      assert.ok(html.includes("'/protos/_dz/dz-intro-'+(tall?'9':'16')+'.mp4'"), `${at}: нет видео по ориентации`);
      assert.match(html, /prefers-reduced-motion: reduce\)'\)\.matches\)off=true/, `${at}: видео не уступает reduced motion`);
      assert.match(html, /c&&c\.saveData\)off=true/, `${at}: видео не уступает экономии трафика`);
      assert.match(html, /if\(now-t0>=4500\|\|\(now-t0>=2500&&now-fed>=2500\)\)code\(\)/, `${at}: нет запасного пути, если видео не грузится`);
      assert.match(html, /playbackRate=1\.2/, `${at}: видео не 1.2x`);
      if (solo) {
        assert.match(html, /dzVideo\(b,close\)/, `${at}: заставка не зовёт видео`);
        assert.ok(html.includes('class="dzi-skip"'), `${at}: нет «Пропустить»`);
        continue;
      }
      assert.match(html, /if\(typeof dzVideo==='function'\)dzv=dzVideo\(box,go\);else go\(false\)/, `${at}: intro.js не зовёт видео`);
      assert.match(html, /if\(dzv&&dzv\.on\(\)\)\{dzv\.end\(\);return\}/, `${at}: нажатие во время видео не ведёт дальше`);
      assert.match(html, /start=performance\.now\(\)-\(video\?OPEN-300:0\)/, `${at}: после видео не к знаку клиента`);
      /* Запасное промо кодом на месте: знак, слово, искры, тайминги. */
      assert.match(html, /class="dz-(sign|mark)"/, `${at}: нет знака DevUz для запасного пути`);
      assert.match(html, /class="dz-code"/, `${at}: нет искр кода для запасного пути`);
      assert.match(html, /BURST=2500,OPEN=3050/, `${at}: тайминги промо кодом изменились`);
      assert.ok(html.includes('id="in-skip"'), `${at}: нет «Пропустить»`);
    }
  }
});

test("Soffice: главная и панель на ru, uz, en — условия, noindex, видео DevUz, шапка, uz и en без кириллицы, 18 БЦ с их сайта", async () => {
  const { existsSync, readdirSync, statSync } = await import("node:fs");
  const site = bundlePages("soffice");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "en", "en/panel", "panel", "uz", "uz/panel"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt: ${img.slice(0, 80)}`);
    for (const src of page.match(/\/protos\/soffice\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    if (lang !== "ru") assert.doesNotMatch(page, /[А-Яа-яЁё]/, `${path}: кириллица на странице ${lang}`);
    if (path.endsWith("panel")) continue;
    assert.ok(page.includes('id="dzi"') && page.includes("dzVideo(b,close)"), `${path}: нет видео DevUz`);
    // Владелец, 19.10.2026: на компьютере шапка стоит всегда, на телефоне возвращается через 2 с.
    assert.ok(page.includes("IDLE=2000") && page.includes("matchMedia('(min-width: 1000px)')") && /DESK\.matches\)\{top\.classList\.remove\('hide'\);return\}/.test(page), `${path}: шапка не по правилу Soffice`);
    assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${path}: шапка на телефоне не прячется`);
    assert.doesNotMatch(page, /overflow-x:hidden/, `${path}: overflow-x:hidden ломает sticky`);
    assert.ok(page.includes("https://t.me/Soffice_cc") && page.includes("wa.me/998997307007") && page.includes("tel:+998997307007"), `${path}: нет менеджера в Telegram, WhatsApp или звонка`);
    assert.ok(page.includes('"@type":"LocalBusiness"') && page.includes('"@type":"Organization"'), `${path}: нет разметки компании и БЦ`);
    for (const id of ["finder", "karta", "katalog", "raschet", "etazh", "prosmotr", "otzyvy", "seychas", "cena"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.equal((page.match(/<article class="bc /g) ?? []).length, 18, `${path}: в каталоге не 18 БЦ`);
    // Панель в окне браузера и вход для управляющей компании.
    assert.match(page, new RegExp(`id="panel"[\\s\\S]*data-src="__PROTO_BASE__/${path ? path + "/" : ""}panel\\?embed=1"`), `${path}: нет панели в окне`);
    assert.ok(page.includes(`href="__PROTO_BASE__/${path ? path + "/" : ""}panel"`), `${path}: нет входа в панель`);
    assert.ok(page.includes("localStorage.getItem(k)") && page.includes("'so-panel-1'") && page.includes("'so-leads-1'"), `${path}: сайт не связан с панелью`);
  }
  const pub = "public/protos/soffice";
  assert.ok(readdirSync(pub).reduce((s, f) => s + statSync(`${pub}/${f}`).size, 0) < 8_000_000, "снимки тяжелее 8 МБ");
  const stamped = stampedBundle("soffice", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.en, site.pages.en, "отпечаток не поставился на английской странице");
});

test("Soffice: ставки 18 БЦ как на soffice.uz, сайт 1 000 $ вместо 2 500 $ на 48 часов, допы по часам", async () => {
  const D = await import("../scripts/protos/soffice/data.mjs");
  /* Снято с soffice.uz 19.10.2026: «от … сум/м²» на карточке и класс. */
  const SITE: Record<string, [number, string]> = {
    grossplaza: [420000, "A"], sapphire: [420000, "A"], forum: [480000, "A+"], trilliant: [540000, "A+"], dream: [430000, "B"], nestone: [490000, "A+"],
    modera: [456000, "A+"], infinity: [420000, "A"], orient: [360000, "A"], platform: [300000, "A"], kayan: [360000, "A"], novaplaza: [360000, "A"],
    businesspark: [240000, "B+"], solidpremium: [420000, "B+"], newera: [360000, "A"], panoramic: [240000, "B"], ventumplaza: [300000, "B"], novaminor: [300000, "B"],
  };
  assert.equal(D.BC.length, 18);
  for (const b of D.BC) assert.deepEqual([b.rate, b.cls], SITE[b.id], `${b.id}: ставка или класс не как на soffice.uz`);
  assert.equal(D.F.tg, "https://t.me/Soffice_cc", "Telegram — менеджер, а не канал новостей");
  const plan = await import("../scripts/protos/soffice/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  for (const a of plan.ADDONS) assert.equal(a.price, a.h * plan.RATE, `${a.id}: цена не по часам`);
  for (const id of ["catalog", "floors", "booking", "crm", "tgbot", "tours", "panel", "en", "maps"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  const site = bundlePages("soffice")!;
  for (const html of [site.html, site.pages.uz, site.pages.en]) {
    assert.match(html, /<s>2 500 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 2 500 $");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("Soffice: панель — разделы, роли, связь с сайтом, подписи на трёх языках, пакет допов", async () => {
  const site = bundlePages("soffice")!;
  for (const path of ["panel", "uz/panel", "en/panel"]) {
    const page = site.pages[path];
    for (const v of ["dash", "leads", "views", "objects", "leases", "bills", "service", "owners", "demand", "team"]) assert.match(page, new RegExp(`V\\.${v}=function`), `${path}: нет раздела ${v}`);
    for (const r of ["owner", "head", "broker", "acc", "ops", "own"]) assert.ok(page.includes(`<option value="${r}">`), `${path}: нет роли ${r}`);
    assert.ok(page.includes("'so-panel-1'") && page.includes("'so-leads-1'") && page.includes("'so-demand-1'"), `${path}: панель не связана с сайтом`);
    assert.match(page, /\.tw\{overflow-x:auto/, `${path}: таблицы без своей прокрутки`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    const data = JSON.parse(page.match(/<script type="application\/json" id="sp-data">([\s\S]*?)<\/script>/)![1]);
    assert.equal(data.bc.length, 18);
    assert.equal(Object.keys(data.inv).length, 18);
    assert.ok(Object.values(data.ui).every((v) => v !== "" && v != null), `${path}: пустая подпись`);
  }
  // Инвентарь один на сайт и панель: Platform 3 и 4 этаж — как на схеме этажа сайта.
  const inv = (p: string) => JSON.parse(p.match(/"inv":(\{[^]*?\}\}),/)![1]);
  assert.deepEqual(inv(site.html), inv(site.pages.panel));
  const ui = (await import("../scripts/protos/soffice/panel-ui.mjs")).PANEL_UI as Record<string, unknown[]>;
  for (const [k, v] of Object.entries(ui)) {
    assert.equal(v.length, 3, `${k}: не три языка`);
    assert.doesNotMatch(JSON.stringify(v.slice(1)), /[А-Яа-яЁё]/, `${k}: кириллица в uz или en`);
  }
  const plan = await import("../scripts/protos/soffice/plan.mjs");
  const pkg = plan.ADDONS.filter((a: { grp?: string }) => a.grp === "panel");
  assert.deepEqual(pkg.map((a: { id: string }) => a.id), ["panel", "leases", "billing", "service", "owners", "demand"]);
  assert.equal(plan.PANEL_ALL, pkg.reduce((s: number, a: { price: number }) => s + a.price, 0));
  for (const html of [site.html, site.pages.uz, site.pages.en]) assert.ok(html.includes('id="kit-panel"'), "нет пакета «Панель» в стоимости");
});

test("Магазин Baldinini Tashkent: страница, магазин и панель на ru, uz, en — условия, noindex, видео DevUz, знак, шапка, полный цикл, только их фото", async () => {
  const { existsSync, readdirSync, statSync } = await import("node:fs");
  const site = bundlePages("baldinini");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "en", "en/panel", "en/shop", "panel", "shop", "uz", "uz/panel", "uz/shop"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /overflow-x:hidden/, `${path}: overflow-x:hidden ломает sticky`);
    assert.ok(page.includes("Baldinini"), `${path}: нет названия бренда`);
    assert.match(page, /демо|demo/, `${path}: не сказано, что данные демо`);
    // Владелец, 15.10.2026: систему посещаемости в макете не называем.
    assert.doesNotMatch(page, /метрик|metrik|metrica/i, `${path}: названа система посещаемости`);
    // Шрифт: Futura PT у бренда платный, файла в репозитории нет; на макете свободный Jost.
    assert.ok(page.includes("family=Jost:wght@400;500"), `${path}: нет шрифта Jost`);
    assert.doesNotMatch(page, /FuturaPT|Futura-PT|futura.*\.(woff2?|ttf|otf)/i, `${path}: платный шрифт бренда в макете`);
    assert.ok(page.includes('<symbol id="bd-logo" viewBox="0 0 153 30">'), `${path}: нет знака Baldinini`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt: ${img.slice(0, 80)}`);
    for (const src of page.match(/\/protos\/baldinini\/[\w./-]+\.webp/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    // Фото — локально в сборке, не хотлинком с сайта бренда.
    assert.doesNotMatch(page, /commercetools|bloomreach|baldinini-shop\.com\/[^"]*\.(jpe?g|png|webp)/i, `${path}: фото хотлинком`);
    if (lang !== "ru") assert.doesNotMatch(page.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица на странице ${lang}`);
  }
  for (const path of ["", "uz", "en"]) {
    const page = all[path], p = path ? path + "/" : "";
    assert.match(page, /id="intro"[\s\S]*DevUz Studio/, `${path}: нет промо DevUz Studio`);
    assert.match(page, /class="bd-cv"[^>]*data-logo=/, `${path}: нет знака Baldinini в заставке`);
    for (const id of ["hero", "seychas", "pokupatel", "put", "lyuks", "italiya", "panel", "cena", "konstruktor", "kit-panel", "timer"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.ok(page.includes(`data-src="__PROTO_BASE__/${p}shop?embed=1#/"`), `${path}: магазин не в айфоне`);
    assert.ok(page.includes(`data-src="__PROTO_BASE__/${p}panel?embed=1"`), `${path}: панель не в окне браузера`);
    // Владелец, 15.10.2026: шапка при любой прокрутке прячется и возвращается через 3 с.
    assert.match(page, /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(page, /function onScroll\(\)\{headIdle\(\);/, `${path}: шапка не прячется при прокрутке`);
    // Владелец: «не переборщи с параллаксами» — один слой на странице.
    assert.equal((page.match(/<picture data-par>/g) ?? []).length, 1, `${path}: параллакс не в одном месте`);
  }
  for (const path of ["shop", "uz/shop", "en/shop"]) {
    const page = all[path];
    for (const v of ["home", "catalog", "product", "cart", "checkout", "order", "me", "private", "boutique"]) assert.match(page, new RegExp(`V\\.${v}=function`), `${path}: нет экрана ${v}`);
    for (const pay of ["Click", "Payme", "Uzum Bank", "Uzcard / Humo", "Visa / Mastercard", "Uzum Nasiya", "Alif Nasiya"]) assert.ok(page.includes(pay), `${path}: нет оплаты ${pay}`);
    assert.ok(page.includes("'bd-demo-1'"), `${path}: состояние демо не общее с панелью`);
    assert.match(page, /var top=\$\('#top'\),IDLE=3000,idleT=0;/, `${path}: шапка магазина не по правилу трёх секунд`);
    assert.ok(page.includes("https://ig.me/m/baldininitashkent"), `${path}: консультант не ведёт в Instagram бутика`);
    assert.ok(page.includes('"hours":["10:00-23:00","10:00-00:00"]'), `${path}: часы бутика не как на tcmall.uz`);
  }
  for (const path of ["panel", "uz/panel", "en/panel"]) {
    const page = all[path];
    for (const v of ["dash", "orders", "tryon", "goods", "clients", "gifts", "returns", "team", "traffic", "vip", "private", "restock", "sellers"]) assert.match(page, new RegExp(`V\\.${v}=function`), `${path}: нет раздела ${v}`);
    for (const r of ["owner", "head", "seller"]) assert.ok(page.includes(`<option value="${r}">`), `${path}: нет роли ${r}`);
    assert.ok(page.includes('data-tier="std"') && page.includes('data-tier="pro"'), `${path}: нет переключателя «Панель / Расширенная»`);
    assert.ok(page.includes("'bd-demo-1'") && page.includes("'bd-panel-1'"), `${path}: панель не связана с магазином`);
    assert.match(page, /\.tw\{overflow-x:auto/, `${path}: таблицы без своей прокрутки`);
    const data = JSON.parse(page.match(/<script type="application\/json" id="bp-data">([\s\S]*?)<\/script>/)![1]);
    assert.ok(Object.values(data.ui).every((v) => v !== "" && v != null), `${path}: пустая подпись`);
  }
  const ui = await import("../scripts/protos/baldinini/ui.mjs");
  for (const dict of [ui.SHOP_UI, ui.PANEL_UI] as Record<string, unknown[]>[]) for (const [k, v] of Object.entries(dict)) {
    assert.equal(v.length, 3, `${k}: не три языка`);
    assert.doesNotMatch(JSON.stringify(v.slice(1)), /[А-Яа-яЁё]/, `${k}: кириллица в uz или en`);
  }
  const pub = "public/protos/baldinini";
  assert.ok(readdirSync(pub).reduce((s, f) => s + statSync(`${pub}/${f}`).size, 0) < 8_000_000, "фото тяжелее 8 МБ");
  const stamped = stampedBundle("baldinini", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["en/shop"], site.pages["en/shop"], "отпечаток не поставился на английском магазине");
});

test("Baldinini: товары с официального сайта, магазин 1 000 $ без админки, админка +300 $ или +500 $, допы на 40% дешевле", async () => {
  // Владелец, 19.10.2026: «Допов добавь на 4-6 тысяч $, база 1000$ без админки, админка +300$, расширенная админка 500$»; затем: «Цены на допы порежь на 40%».
  const D = await import("../scripts/protos/baldinini/data.mjs");
  assert.ok(D.PRODUCTS.length >= 24, "меньше 24 моделей");
  for (const p of D.PRODUCTS) {
    assert.match(p.art, /^[A-Z0-9]{16}$/, `${p.id}: артикул не как у бренда`);
    assert.ok(p.eur || p.rub, `${p.id}: нет цены с официального сайта`);
    for (let i = 0; i < (p.im ?? 3); i++) for (const w of [600, 1000]) assert.ok((await import("node:fs")).existsSync(`public/protos/baldinini/p-${p.id}-${i}-${w}.webp`), `${p.id}: нет фото ${i} ${w}`);
  }
  for (const c of ["w", "m", "bag", "acc"]) assert.ok(D.PRODUCTS.some((p: { cat: string }) => p.cat === c), `нет раздела ${c}`);
  /* Цвета — с CSS baldinini-shop.com (docs/research/baldinini.md). */
  assert.deepEqual([D.COLORS.ink, D.COLORS.mute, D.COLORS.mist, D.COLORS.sand], ["#000000", "#858585", "#f8f8f8", "#d8aa8a"]);
  const plan = await import("../scripts/protos/baldinini/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.ok(plan.BASE.price > plan.BASE.promo);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.equal(plan.PANELS.std.price, 300);
  assert.equal(plan.PANELS.pro.price, 500);
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 18, "от 10 до 18 допов");
  for (const a of plan.ADDONS) assert.ok(a.price > 0 && a.ru.t && a.ru.e && a.uz.t && a.uz.e && a.en.t && a.en.e, `${a.id}: цена и описание на трёх языках`);
  assert.equal(plan.ADDONS_SUM, plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0));
  assert.equal(plan.ADDON_CUT, 0.4);
  for (const a of plan.ADDONS) assert.equal(a.price, Math.round((a.full * 0.6) / 10) * 10, `${a.id}: цена не на 40% ниже обычной`);
  assert.equal(plan.ADDONS_SUM, 3450, "все допы: 5 750 $ минус 40%");
  /* У каждого раздела панели — один уровень, и он совпадает с panel.js. */
  const secs = [...plan.PANELS.std.sections, ...plan.PANELS.pro.sections];
  assert.equal(new Set(secs).size, secs.length, "раздел в двух уровнях");
  const site = bundlePages("baldinini")!;
  for (const html of [site.html, site.pages.uz, site.pages.en]) {
    assert.ok(html.includes(`<s>${String(plan.BASE.price).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $</s><b>1 000 $</b>`), "на макете 1 000 $ вместо обычной цены");
    assert.ok(html.includes('name="pnl" value="std" checked data-p="300"') && html.includes('name="pnl" value="pro" data-p="500"'), "админка не одним выбором 300 / 500 $");
    assert.match(html, /"hours":48,/, "отсчёт 48 часов");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
  for (const path of ["panel", "uz/panel", "en/panel"]) {
    const data = JSON.parse(site.pages[path].match(/id="bp-data">([\s\S]*?)<\/script>/)![1]);
    assert.deepEqual(data.tiers, { std: plan.PANELS.std.sections, pro: plan.PANELS.pro.sections }, `${path}: уровни разделов не как в plan.mjs`);
  }
});

test("Хаб Instagram → Telegram: ru и uz — условия, noindex, видео DevUz, шапка, два телефона, три схемы, uz без кириллицы", () => {
  const site = bundlePages("ighub");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "uz"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path === "uz" ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}"`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /<script[^>]+src=|<link[^>]+stylesheet|<img[^>]+src="https?:|url\(https?:/i, `${path}: внешняя загрузка`);
    assert.ok(page.includes('id="dzi"'), `${path}: нет видео DevUz`);
    // Владелец, 15.10.2026: шапка при прокрутке прячется и возвращается через 3 с после остановки.
    assert.match(page, /var IDLE=3000,idleT=0;/, `${path}: нет правила шапки`);
    assert.match(page, /function onScroll\(\)\{headIdle\(\);/, `${path}: шапка не прячется при прокрутке`);
    // Задание 20.10.2026: Instagram клиента и Telegram менеджера рядом, схемы А, Б, В, вид руководителя.
    assert.match(page, /class="iphone"[\s\S]*id="ig"[\s\S]*class="android"[\s\S]*id="tg"/, `${path}: нет двух телефонов`);
    for (const a of ["A", "B", "C"]) assert.ok(page.includes(`data-act="scheme" data-a="${a}"`), `${path}: нет схемы ${a}`);
    assert.ok(page.includes('data-act="role" data-a="head"'), `${path}: нет вида руководителя`);
    for (const k of ["ff10", "ff22", "igManual", "play"]) assert.ok(page.includes(`data-act="${k}"`), `${path}: нет «${k}»`);
    const data = page.match(/window\.HB=(\{[\s\S]*?\});<\/script>/)?.[1] ?? "";
    assert.ok(data.length > 1000, `${path}: нет данных хаба`);
    const hb = JSON.parse(data);
    // Демо-компания одним фактом; имён из присланного видео нет.
    assert.equal(hb.company.name, "Usta Mebel");
    assert.doesNotMatch(page, /jamco|Захро|Zahro|Abdulaziz/i, `${path}: имя из присланного видео`);
    if (lang === "uz") {
      assert.doesNotMatch(data, /[А-Яа-яЁё]/, "uz: кириллица в данных");
      const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
      assert.doesNotMatch(text, /[А-Яа-яЁё]/, "uz: кириллица в тексте страницы");
    }
    // Ответ на языке клиента: каждый готовый ответ есть на каждом языке клиента.
    for (const q of hb.quick) for (const l of hb.langs) assert.ok(q[l], `${path}: готовый ответ ${q.id} без ${l}`);
  }
  const stamped = stampedBundle("ighub", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Хаб: 500 $ вместо 1 800 $ (владелец, 20.10.2026), допы вдвое дешевле, на 48 часов, допы в одном месте и на странице", async () => {
  const plan = await import("../scripts/protos/ighub/plan.mjs");
  assert.equal(plan.BASE.promo, 500);
  assert.equal(plan.BASE.price, 1800);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 8 && plan.ADDONS.length <= 15, "от 8 до 15 допов");
  assert.equal(plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0), 1200, "допы со скидкой 50%: вместе 1 200 $ вместо 2 400 $");
  for (const id of ["crm", "head", "ads", "multi", "wa", "fb"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  const site = bundlePages("ighub")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /<s id="preg">1 800 \$<\/s><b id="pbase">500 \$<\/b>/, "на макете 500 $ вместо 1 800 $");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-add="${a.id}" data-price="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("Сияние Севера: страница на русском — условия, noindex, видео DevUz, кино и сцены по прокрутке, предупреждение, шапка по правилу", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("syanie");
  assert.ok(site);
  const page = site.html;
  assert.deepEqual(Object.keys(site.pages), ["panel"], "сайт и панель клиники");
  assert.doesNotMatch(page, /@@[A-Z]+@@/, "метка сборки осталась");
  assert.ok(page.includes('<html lang="ru">'), "язык страницы");
  assert.ok(page.includes("https://devuz.studio/ru/mockup-terms"), "нет условий");
  assert.match(page, /<meta name="robots" content="noindex/, "нет noindex");
  assert.match(page, /prefers-reduced-motion/, "анимацию нечем выключить");
  assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, "слово, по которому находят отпечаток");
  assert.doesNotMatch(page, /proto-ai|proxyapi/i, "прототип не зовёт модель");
  assert.doesNotMatch(page, /href="#"/, "ссылка в никуда");
  assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, "overflow-x:hidden у body ломает sticky");
  assert.match(page, /IDLE=3000/, "шапка не по правилу трёх секунд");
  assert.ok(page.includes("Сияние Севера"), "нет названия клиники");
  assert.ok(page.includes("ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА"), "нет предупреждения");
  assert.ok(page.includes("Л041-01043-70/03947806"), "нет лицензии");
  assert.ok(page.includes("tel:+73822270077"), "нет звонка в клинику");
  assert.ok(page.includes('id="film"') && page.includes('id="cv"') && page.includes("ScrollTrigger.min.js"), "нет кино или сцен по прокрутке");
  assert.ok(page.includes('"@type":["Dentist","MedicalClinic"]'), "нет разметки клиники");
  assert.ok((page.match(/class="fq-i/g) ?? []).length >= 12, "вопросов меньше двенадцати");
  for (const src of page.match(/\/protos\/syanie\/[\w./-]+\.(?:webp|png|js|mp4)/g) ?? []) assert.ok(existsSync("public" + src), `нет файла ${src}`);
  const media = JSON.parse((await import("node:fs")).readFileSync("scripts/protos/syanie/media.json", "utf8"));
  for (const f of ["16", "9"]) assert.ok(existsSync(`public/protos/syanie/s${f}/${String(media["s" + f] - 1).padStart(3, "0")}.webp`), `кадров s${f} меньше, чем в media.json`);
  const stamped = stampedBundle("syanie", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Сияние Севера: цены клиники — с их сайта, сайт 100 000 ₽ на 48 часов, админка 25 000 ₽, всё вместе не больше 200 000 ₽", async () => {
  const D = await import("../scripts/protos/syanie/data.mjs");
  assert.deepEqual(D.PRICES.map((p: { price: number }) => p.price), [179900, 259900]);
  assert.equal(D.IMPLANT.brand, "", "марку имплантов не выдумываем");
  const plan = await import("../scripts/protos/syanie/plan.mjs");
  /* Владелец, 20.10.2026: «Базовая версия 100000 + админка 25000 … совокупно не больше 200000 рублей». */
  assert.equal(plan.CUR, "₽");
  assert.equal(plan.BASE.promo, 100000);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.equal(plan.ADDONS.find((a: { id: string }) => a.id === "admin")?.price, 25000, "админка 25 000 ₽");
  assert.ok(plan.ALL <= 200000, "всё вместе больше 200 000 ₽");
  assert.ok(plan.ADDONS.length >= 10 && plan.ADDONS.length <= 20, "от 10 до 20 допов");
  const html = bundlePages("syanie")!.html;
  assert.match(html, /<s>250 000 ₽<\/s><b>100 000 ₽<\/b>/, "на макете 100 000 ₽ вместо 250 000 ₽ крупно");
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, ""), /\d \$/, "на макете остались доллары");
  for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
});

test("Сияние Севера: панель клиники — условия, noindex, общее состояние с сайтом, amoCRM через API v4, роли, без моделей и запросов в amo", () => {
  const panel = bundlePages("syanie")!.pages.panel;
  assert.ok(panel, "нет страницы panel");
  assert.doesNotMatch(panel, /@@[A-Z]+@@/, "метка сборки осталась");
  assert.ok(panel.includes('<html lang="ru">'), "язык страницы");
  assert.ok(panel.includes("https://devuz.studio/ru/mockup-terms"), "нет условий");
  assert.match(panel, /<meta name="robots" content="noindex/, "нет noindex");
  assert.match(panel, /prefers-reduced-motion/, "анимацию нечем выключить");
  assert.doesNotMatch(panel, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, "слово, по которому находят отпечаток");
  assert.doesNotMatch(panel, /proto-ai|proxyapi/i, "панель не зовёт модель");
  assert.doesNotMatch(panel, /href="#"/, "ссылка в никуда");
  assert.ok(panel.includes("window.SY={"), "панель не видит общее состояние сайта (store.js)");
  assert.ok(panel.includes('href="__PROTO_BASE__"'), "нет ссылки на сайт клиники");
  assert.ok(panel.includes("демо-данные"), "нет пометки «демо-данные»");
  for (const v of ["svodka", "zayavki", "raspisanie", "amo", "chaty", "napominaniya", "istoriya"]) assert.match(panel, new RegExp(`V\\.${v}=function`), `панель: нет раздела ${v}`);
  for (const role of ["Главный врач", "Администратор"]) assert.ok(panel.includes(`>${role}</button>`), `нет роли ${role}`);
  assert.ok(panel.includes("/api/v4/leads/complex") && panel.includes("field_code:'PHONE'"), "amoCRM: нет сделки с контактом одним запросом");
  assert.ok(panel.includes("/leads/detail/"), "amoCRM: нет ссылки на сделку");
  assert.ok(panel.includes("В макете запросы в amoCRM не уходят"), "amoCRM: нет честной пометки");
  assert.doesNotMatch(panel, /fetch\(|XMLHttpRequest|sendBeacon/, "панель не ходит в сеть");
  for (const p of ["179900", "259900"]) assert.ok(panel.includes(p), `цена ${p} не из data.mjs`);
  assert.ok(panel.includes("Реутов") && panel.includes("Савин"), "врачи не из data.mjs");
  assert.ok(panel.includes(":root{--ink:"), "панель без токенов цвета сайта");
});

test("Сияние Севера: чат на сайте — «ИИ-консультант» и «Менеджер в Telegram» для показа, ответы фактами клиники, без модели", async () => {
  const { readFileSync } = await import("node:fs");
  /* Владелец, 28.10.2026: «Чат на базе ИИ и второй вариант: чтобы человек писал на сайте, а менеджер отвечал через телеграм бота». */
  const html = bundlePages("syanie")!.html;
  for (const s of ["ИИ-консультант", "Менеджер в Telegram", "на сайте останется один", "Сияние Севера · заявки", "Так это видит администратор", "В макете ответы из вопросов клиники", "по сценарию (демо)", "ответим утром с 9:00"]) assert.ok(html.includes(s), `в чате нет «${s}»`);
  const D = await import("../scripts/protos/syanie/data.mjs");
  const data = JSON.parse(html.match(/<script type="application\/json" id="sy-site">([\s\S]*?)<\/script>/)![1]);
  assert.equal(data.chat.faq.length, D.FAQ.length, "консультант отвечает вопросами клиники");
  assert.deepEqual(data.chat.prices.map((p: { p: number }) => p.p), [179900, 259900], "цены в чате с их сайта");
  assert.equal(data.chat.warn, D.BRAND.warn, "предупреждение о противопоказаниях");
  const js = readFileSync("scripts/protos/syanie/chat.js", "utf8");
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|WebSocket|anthropic|openai|proxyapi/i, "чат в макете не зовёт модель и не ходит в сеть");
  assert.match(js, /SY\.addChat\(\{mode:mode/, "переписка в общем состоянии с вариантом ai | tg");
  assert.match(js, /src:'chat'/, "запись из чата — заявка src = chat");
  assert.match(readFileSync("scripts/protos/syanie/chat.css", "utf8"), /\.cx-f input\{[^}]*font:400 16px/, "поле ввода 16 px: iPhone не увеличивает страницу");
});

test("Сияние Севера: палитры тумблерами на сайте и в панели, кнопки ровного цвета без эффектов", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  /* Владелец, 29.10.2026: «Сделай прям на сайте переключения тумблерами по этим цветовым палитрам, кнопки верни и убери эффекты с них». */
  const { html, pages } = bundlePages("syanie")!;
  const { PALETTES } = await import("../scripts/protos/syanie/palettes.mjs");
  assert.equal(PALETTES.length, 6, "пять палитр из PDF и прежний графит");
  for (const p of PALETTES) {
    assert.ok(html.includes(`data-p="${p.id}"`) && html.includes(p.name), `в переключателе нет «${p.name}»`);
    if (p.id !== "4") { assert.ok(html.includes(`:root[data-pal="${p.id}"]{`), `нет цветов палитры ${p.id}`); assert.ok(pages.panel.includes(`:root[data-pal="${p.id}"]{`), `панель без палитры ${p.id}`); }
  }
  assert.match(html, /role="radiogroup"/, "палитры — группа переключателей");
  assert.match(html, /localStorage\.getItem\('sy-pal'\)/, "палитра ставится в <head> до отрисовки");
  const css = readFileSync("scripts/protos/syanie/site.css", "utf8");
  assert.match(css, /\.btn-onyx\{background:var\(--onyx\);color:var\(--onyx-ink\)\}/, "кнопка — ровный цвет палитры");
  assert.doesNotMatch(css, /@keyframes liquid|gold-live|\.gl\{|backdrop-filter:blur\(2\.5px\)/, "эффекты кнопок вернулись");
  assert.doesNotMatch(css.replace(/:root\{[\s\S]*?\}/, ""), /rgb\((14 59 51|247 244 234|19 71 62|233 178 60) /, "цвет мимо переменных: палитра его не поменяет");
  assert.ok(!existsSync("scripts/protos/syanie/gold.js") && !html.includes("gold.webp"), "жидкое золото на кнопках убрано");
});

test("Жигули Рестобар: ru и uz — условия, noindex, видео DevUz, кино по прокрутке, их буквы, 18+, шапка по правилу, uz без кириллицы", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  const site = bundlePages("jiguli");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "uz"]);
  const media = JSON.parse(readFileSync("scripts/protos/jiguli/media.json", "utf8"));
  assert.ok(existsSync(`public/protos/jiguli/s/${String(media.s - 1).padStart(3, "0")}.webp`), "кадров меньше, чем в media.json");
  for (const [path, page] of Object.entries(all)) {
    const lang = path === "uz" ? "uz" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, `${path}: overflow-x:hidden у body ломает sticky`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу трёх секунд`);
    assert.ok(page.includes('id="dzi"'), `${path}: нет видео DevUz`);
    assert.ok(page.includes('<symbol id="jg-word"'), `${path}: нет их букв «Жигули» вектором`);
    assert.ok(page.includes('id="cv"') && page.includes("ScrollTrigger.min.js"), `${path}: нет кино по прокрутке`);
    assert.equal((page.match(/<article class="fz /g) ?? []).length, 4, `${path}: не два напитка и два блюда`);
    assert.ok(page.includes('id="age"') && page.includes('id="full"') && page.includes('id="zapis"'), `${path}: нет 18+, всего меню или брони`);
    assert.ok(page.includes("tel:+998998271003") && page.includes("sms:+998998271003"), `${path}: нет звонка и брони в бар`);
    assert.ok(page.includes('"@type":["BarOrPub","Restaurant"]'), `${path}: нет разметки бара`);
    for (const src of page.match(/\/protos\/jiguli\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    if (lang === "uz") {
      const text = page.replace(/<path[^>]*>/g, "");
      assert.doesNotMatch(text, /[А-Яа-яЁё]/, "uz: кириллица на узбекской странице");
    }
  }
  const stamped = stampedBundle("jiguli", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("Жигули: напитки и блюда — из их меню, сайт 1 000 $ вместо 2 500 $ на 48 часов, допы в одном месте", async () => {
  const { readFileSync } = await import("node:fs");
  const D = await import("../scripts/protos/jiguli/data.mjs");
  const menu = JSON.parse(readFileSync("scripts/protos/jiguli/menu-src.json", "utf8"));
  const items = [...menu.food, ...menu.drinks].flatMap((c: { items: { ru: string; p: number[] }[] }) => c.items);
  const want: Record<string, string> = { beer: "Жатецкое живое", sour: "Sarti Sour", raki: "Раки к пиву", lamb: "Баранья лопатка" };
  for (const h of D.HEROES) {
    const it = items.find((x: { ru: string }) => x.ru.startsWith(want[h.id]));
    assert.ok(it, `${h.id}: позиции нет в их меню`);
    assert.ok(it.p.includes(Number(h.price.replace(/\s/g, ""))), `${h.id}: цены ${h.price} нет в их меню`);
  }
  const plan = await import("../scripts/protos/jiguli/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 8 && plan.ADDONS.length <= 20, "от 8 до 20 допов");
  for (const id of ["booking", "qr", "delivery", "loyalty", "tgbot", "afisha", "en", "maps"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  const site = bundlePages("jiguli")!;
  for (const html of [site.html, site.pages.uz]) {
    assert.match(html, /<s>2 500 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 2 500 $ крупно");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("SEM Travel: uz и ru — условия, noindex, видео DevUz первым, шапка по правилу, поиск, подбор, карта, ваучер, бронь в их Telegram, uz без кириллицы", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("semtravel");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "ru"]);
  for (const [path, page] of Object.entries(all)) {
    const lang = path === "ru" ? "ru" : "uz";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, `${path}: overflow-x:hidden у body ломает sticky`);
    assert.match(page, /IDLE=3000/, `${path}: шапка не по правилу трёх секунд`);
    assert.ok(page.indexOf('id="dzi"') > 0 && page.indexOf('id="dzi"') < page.indexOf('id="top"'), `${path}: видео DevUz не первым`);
    for (const id of ["poisk", "pn-pick", "rez", "karta", "cal", "garantii", "tur", "tu-vf", "bron", "stat", "club", "otzyvy", "kontakty", "seychas", "stoimost"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
    assert.ok(page.includes("tel:+998712755555") && page.includes("https://t.me/prosem_bot") && page.includes("https://t.me/semtravel"), `${path}: нет звонка и их Telegram`);
    assert.ok(page.includes('"@type":"TravelAgency"') && page.includes("Katta Xirmontepa") === (lang === "uz"), `${path}: нет разметки агентства с адресом`);
    for (const src of page.match(/\/protos\/semtravel\/[\w./-]+\.(?:webp|png|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    if (lang === "uz") {
      const text = page.replace(/<path[^>]*>/g, "");
      assert.doesNotMatch(text, /[А-Яа-яЁё]/, "uz: кириллица на узбекской странице");
    }
  }
  const stamped = stampedBundle("semtravel", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("SEM Travel: цены направлений — с их сайта на 21.10.2026, фото на месте, сайт 1 000 $ вместо 2 500 $ на 48 часов, допы в одном месте", async () => {
  const { existsSync } = await import("node:fs");
  const D = await import("../scripts/protos/semtravel/data.mjs");
  // Блок «Куда сейчас дешевле?» на semtravel.uz, 21.10.2026: от $ за одного.
  const theirs: Record<string, number> = { dubai: 461, azer: 467, georgia: 576, china: 608, lanka: 617, egypt: 618, vietnam: 626, turkey: 658, qatar: 689, thai: 730 };
  assert.deepEqual(Object.fromEntries(D.DEST.map((d: { id: string; price: number }) => [d.id, d.price])), theirs);
  for (const d of D.DEST) assert.ok(existsSync(`public/protos/semtravel/${d.img}-s.webp`), `${d.id}: нет фото`);
  for (const h of ["h-pool", "h-room", "h-sea"]) assert.ok(existsSync(`public/protos/semtravel/${h}-s.webp`), `${h}: нет фото`);
  const plan = await import("../scripts/protos/semtravel/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  assert.ok(plan.ADDONS.length >= 8 && plan.ADDONS.length <= 20, "от 8 до 20 допов");
  for (const id of ["tourvisor", "pick", "cabinet", "crm", "tgbot", "pay", "app", "en", "maps"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  const site = bundlePages("semtravel")!;
  for (const html of [site.html, site.pages.ru]) {
    assert.match(html, /<s>2 500 \$<\/s><b>1 000 \$<\/b>/, "на макете 1 000 $ вместо 2 500 $ крупно");
    for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цена на странице`);
  }
});

test("SamAuto: D-MAX из-под покрывала, разлёт, фара, проезд — кадры по прокрутке, загрузка до 100%, условия, noindex, видео DevUz, шапка, узбекский, только цифры с их сайта, запасной путь", async () => {
  const { existsSync, readFileSync, readdirSync, statSync } = await import("node:fs");
  const site = bundlePages("samauto");
  assert.ok(site);
  assert.deepEqual(Object.keys(site.pages), [], "у макета одна страница");
  const page = site.html;
  assert.doesNotMatch(page, /@@[A-Z]+@@/, "метка сборки осталась в странице");
  assert.ok(page.includes('<html lang="uz">'), "страница не на узбекском");
  assert.doesNotMatch(page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ""), /[А-Яа-яЁё]/, "в узбекской странице кириллица");
  assert.ok(page.includes("https://devuz.studio/uz/mockup-terms"), "нет условий");
  assert.match(page, /<meta name="robots" content="noindex/, "нет noindex");
  assert.match(page, /<body class="site">\s*<div class="dzi" id="dzi"/, "видео DevUz не первым в body");
  assert.match(page, /IDLE=3000/, "шапка не по правилу трёх секунд");
  assert.match(page, /prefers-reduced-motion/, "анимацию нечем выключить");
  assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, "слово, по которому находят отпечаток");
  assert.doesNotMatch(page, /href="#"/, "ссылка в никуда");
  assert.doesNotMatch(page, /body\{[^}]*overflow-x:hidden/, "overflow-x:hidden у body ломает sticky");
  assert.ok(page.includes("tel:+998781408000"), "главное действие не ведёт на их телефон");
  /* Цифры — только с samauto.uz (docs/research/samauto.md). */
  for (const n of ["4JJ3", "2 999", "190", "140 kVt", "4x4", "670", "2 800", "5 285", "1 870", "1 790"]) assert.ok(page.includes(n), `нет цифры ${n}`);
  const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<[^>]+>/g, " ");
  /* Модели, характеристики и дилеры — их открытый каталог (catalog.py →
     catalog.json, samauto.uz, 21.10.2026); сверх него — то, что сказано
     рядом: LE60 с 2012 года, 24 месяца рассрочки, 360°, Automechanic CV 13
     лет, поездка клуба 2025, демо-строки кабинета (12, 3, 20). */
  const catalogNums: string[] = readFileSync("scripts/protos/samauto/catalog.json", "utf8").match(/\d+/g) ?? [];
  const allowed = new Set(["4", "3", "2", "999", "190", "140", "670", "800", "5", "285", "1", "870", "790", "998", "78", "80", "00", "21", "10", "2026", "66", "6", "0", "9", "34", "60",
    "2012", "2025", "24", "360", "13", "12", "20", ...catalogNums]);
  for (const n of text.match(/\d+/g) ?? []) assert.ok(allowed.has(n) || /^\d,\d$/.test(n), `число ${n} не из фактов`);
  /* Сцена: кадры для компьютера и телефона, по одному счёту, все на месте. */
  const seq = JSON.parse(readFileSync("scripts/protos/samauto/seq.json", "utf8")) as Record<"d" | "m", [string, number][]> & { order: string[] };
  assert.deepEqual(seq.d, seq.m, "у телефона и компьютера разный счёт кадров");
  const frames = JSON.parse(page.match(/<script type="application\/json" id="sa-site">([\s\S]*?)<\/script>/)![1]).frames as string[];
  for (const set of ["d", "m"] as const) {
    const files = readdirSync(`public/protos/samauto/seq/${set}`);
    assert.equal(files.length, seq[set].reduce((n, [, k]) => n + k, 0), `${set}: лишние или потерянные кадры`);
    for (const f of new Set(frames)) assert.ok(files.includes(`${f}.bin`) || (f === "t1-00" && files.includes("t1-00.webp")), `${set}: нет кадра ${f}`);
    /* Защита (владелец, 21.10.2026: «защити его… чтобы через консоль никто не
       смог вытащить»): открытым лежит только первый кадр — постер. */
    assert.deepEqual(files.filter((f) => !f.endsWith(".bin")), ["t1-00.webp"], `${set}: кадры сцены лежат незашифрованными`);
    const mb = files.reduce((n, f) => n + statSync(`public/protos/samauto/seq/${set}/${f}`).size, 0) / 1048576;
    assert.ok(mb < 32, `${set}: кадры весят ${mb.toFixed(1)} МБ, больше 32`);
  }
  /* Порядок: покрывало, разлёт, пауза, сборка — тот же разлёт задом наперёд, фара, борт, проезд. */
  assert.equal(frames[0], "t1-00", "сцена начинается не с покрывала");
  assert.equal(frames[frames.length - 1], `t8-${String(seq.d.at(-1)![1] - 1).padStart(2, "0")}`, "сцена кончается не пустыней");
  const ex = frames.slice(frames.indexOf("t3-00"), frames.indexOf("t5-00")).filter((f, i, a) => f !== a[i - 1]);
  assert.ok(ex.length > 2, "нет разлёта");
  assert.deepEqual(ex.slice().reverse(), ex, "сборка — не разлёт задом наперёд");
  for (const f of ["poster-a-16.webp", "poster-a-9.webp", "poster-e-16.webp", "poster-e-9.webp", "logo.webp"]) assert.ok(existsSync(`public/protos/samauto/${f}`), `нет ${f}`);
  assert.ok(!existsSync("public/protos/samauto/dmax.glb"), "3D-модель осталась в public — её никто не грузит");
  /* Загрузка до 100%: прокрутка ждёт все кадры, но не вечно. */
  assert.match(page, /id="boot-n"/, "нет счёта загрузки");
  assert.match(page, /root\.classList\.add\('lock'\)/, "прокрутка не ждёт загрузки");
  assert.match(page, /LIMIT=\d+/, "загрузка без предела — сайт может встать");
  /* iPhone: 300 распакованных кадров по ~8 МБ Safari не держит и встаёт на ~38%
     (владелец, 21.10.2026). Качаем сжатыми, файл — один раз, с таймаутом;
     распакованных — не больше MAXB. */
  assert.match(page, /MAXB=(?:portrait\?\d+:)?\d+/, "распакованные кадры копятся без предела — iPhone встанет");
  assert.match(page, /\.close\(\)/, "выброшенные кадры не освобождают память");
  assert.match(page, /WAIT=\d+/, "молчащий файл держит загрузку вечно");
  assert.doesNotMatch(page, /new Image\(\);im\.decoding/, "кадры снова грузятся картинками целиком в память");
  /* Телефон — одно видео, каждый кадр ключевой: кадры по одному iPhone на
     разлёте не успевал распаковывать (владелец, 21.10.2026). */
  assert.ok(existsSync("public/protos/samauto/seq/m.bin"), "нет видео сцены для телефона");
  assert.ok(!existsSync("public/protos/samauto/seq/m.mp4"), "видео сцены лежит незашифрованным");
  assert.ok(statSync("public/protos/samauto/seq/m.bin").size < 25 * 1048576, "видео сцены для телефона тяжелее 25 МБ");
  /* Кадры и видео — AES-GCM, ключ спрашивается у маршрута макета и
     расшифровывается в браузере; в репозитории и в разметке ключа нет. */
  assert.match(page, /'\/promo\/scene'/, "сцена не спрашивает ключ у макета");
  assert.match(page, /crypto\.subtle\.decrypt\(\{name:'AES-GCM'/, "сцена не расшифровывает кадры");
  assert.match(page, /"base":"__PROTO_BASE__"/, "сцене неоткуда взять адрес своего макета");
  assert.doesNotMatch(page, /[0-9a-f]{64}/, "в разметке похоже на ключ сцены");
  assert.match(page, /<video id="vd" muted playsinline/, "видео сцены без muted playsinline — iPhone его не покажет");
  assert.match(page, /codecs="avc1/, "телефон не проверяет, умеет ли он H.264");
  assert.match(page, /'seeked'/, "перемотка не ждёт прошлую — Safari отстаёт");
  assert.deepEqual(seq.order, frames, "порядок кадров на странице и в видео разный");
  /* Финал: D-MAX уходит в пустыню, дальше линейка на одном подиуме (владелец,
     21.10.2026: «возьми кадр где все их машины стоят в ряд… после нажатия
     уже открывается инфа о них»): четыре раздела их сайта, по нажатию —
     живая сцена, цифры полосками и все модели раздела из их каталога. */
  const cat = JSON.parse(page.match(/<script type="application\/json" id="sa-cat">([\s\S]*?)<\/script>/)![1]) as { items: { cat: string; title: string }[]; kinds: { cat: string; key: string; bars: [string, number, number, string][] }[]; dealers: { name?: string }[] };
  assert.deepEqual(cat.kinds.map((k) => k.cat), ["pikap", "yuk", "avtobus", "maxsus"], "не четыре вида техники");
  assert.ok(cat.items.length >= 40, "каталог моделей не перенесён с их сайта");
  assert.ok(cat.dealers.filter((x) => x.name).length >= 20, "дилеры не перенесены с их сайта");
  for (const k of cat.kinds) {
    assert.ok(page.includes(`class="ln-hs`) && page.includes(`data-k="${k.cat}"`), `${k.cat}: машину на линейке не нажать`);
    assert.ok(cat.items.some((i) => i.cat === k.cat), `${k.cat}: нет моделей`);
    for (const b of k.bars) assert.ok(catalogNums.includes(String(b[1])) || ["2999", "7790", "9300", "5000"].includes(String(b[1])), `${k.cat}: цифра ${b[1]} не с их сайта`);
    for (const ext of ["16.webp", "9.webp", "16.bin", "9.bin"]) assert.ok(existsSync(`public/protos/samauto/fleet/${k.key}-${ext}`), `${k.key}: нет ${ext}`);
    for (const ext of ["16.mp4", "9.mp4"]) assert.ok(!existsSync(`public/protos/samauto/fleet/${k.key}-${ext}`), `${k.key}: живая сцена лежит незашифрованной`);
    assert.ok(statSync(`public/protos/samauto/fleet/${k.key}-16.bin`).size < 8 * 1048576, `${k.key}: живая сцена тяжелее 8 МБ`);
  }
  for (const it of cat.items) assert.ok(existsSync(`public/protos/samauto/cat/${(it as unknown as { n: number }).n}.webp`), `нет фото ${it.title}`);
  assert.doesNotMatch(page, /narx[^<]{0,20}\d|\d[\d ]*\s?so‘m/i, "цены в макете: на их сайте цены скрыты");
  /* Полезное с их сайта (22.10.2026): калькулятор MKBANK — цену вводит сам
     клиент; гарантия, вопросы, новости; сравнение моделей с PDF. */
  for (const id of ["calc", "kafolat", "savollar", "yangiliklar", "cmp-d"]) assert.match(page, new RegExp(`id="${id}"`), `нет блока #${id}`);
  assert.ok(cat.items.filter((i) => (i as unknown as { pdf?: string }).pdf?.startsWith("https://ncdn.samauto.uz/")).length >= 30, "нет PDF характеристик");
  for (const k of ["pikap", "yuk", "avtobus", "maxsus"]) assert.ok(existsSync(`public/protos/samauto/s/hd-${k}.webp`), `нет чёткого кадра ${k}`);
  /* D-MAX 360°: стенд листается пальцем, цвет и диски — шейдером, подсказка
     с рукой до первого касания (владелец, 21.10.2026). */
  const tt = JSON.parse(readFileSync("scripts/protos/samauto/tt.json", "utf8")) as { n: number; wheel: Record<"d" | "m", unknown[]> };
  for (const set of ["d", "m"] as const) {
    const files = readdirSync(`public/protos/samauto/tt/${set}`);
    assert.equal(files.filter((f) => f.endsWith(".bin")).length, tt.n, `стенд ${set}: не все кадры`);
    assert.deepEqual(files.filter((f) => !f.endsWith(".bin")), [], `стенд ${set}: кадры лежат незашифрованными`);
    assert.equal(tt.wheel[set].length, tt.n, `стенд ${set}: нет колёс для приближения`);
  }
  assert.match(page, /id="dm-hint"/, "нет подсказки, что D-MAX можно крутить");
  assert.match(page, /touch-action:pan-y/, "стенд перехватывает прокрутку страницы пальцем");
  assert.match(page, /setPointerCapture/, "стенд не крутится перетаскиванием");
  assert.match(page, /data-paint="white"/, "нет выбора цвета");
  assert.match(page, /data-rim="silver"/, "нет выбора дисков");
  assert.match(page, /tw=tw\.filter/, "цвет меняется скачком, а не плавно");
  /* Красные линии с волной — бегут только на экране и стоят при reduced motion. */
  assert.match(page, /\.rl\.run::after\{animation:rl-wave/, "волны по красной линии нет");
  assert.match(page, /prefers-reduced-motion: reduce\)\{\s*\.rl::after/, "волна не стоит при reduced motion");
  /* Ариза не отправляет форму ни им, ни нам: телефон или их бот с готовым текстом. */
  assert.doesNotMatch(page, /<form[^>]*action=/, "форма куда-то отправляет");
  assert.ok(page.includes("https://t.me/samautobot"), "ариза не ведёт в их Telegram");
  assert.match(page, /<video class="fv-v" id="fv-v" muted playsinline loop preload="none"/, "живая сцена грузится до нажатия или не играет на iPhone");
  assert.match(page, /aria-modal="true"/, "окно техники без aria-modal");
  assert.match(page, /key==='Escape'/, "окно техники не закрывается с клавиатуры");
  assert.match(page, /class="still"/, "нет запасного пути кадрами");
  const stamped = stampedBundle("samauto", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
});

test("CZECHFARM: 7 страниц и панель на ru, uz, en — условия, noindex, видео DevUz, шапка 3 с, цепочка, формы в панель, только факты из ТЗ", async () => {
  const { existsSync, readdirSync, statSync } = await import("node:fs");
  const site = bundlePages("chechfarm");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const PAGES = ["", "about", "products", "partners", "investors", "news", "contacts", "panel"];
  const keys = ["ru", "uz", "en"].flatMap((l) => PAGES.map((p) => [l === "ru" ? "" : l, p].filter(Boolean).join("/")));
  assert.deepEqual(Object.keys(all).sort(), keys.sort());
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt`);
    for (const src of page.match(/\/protos\/chechfarm\/[\w./-]+\.(?:webp|png|svg)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    if (lang !== "ru") assert.doesNotMatch(page, /[А-Яа-яЁё]/, `${path}: кириллица на странице ${lang}`);
    /* Фарма строго: ни телефонов, ни адресов, ни цен, ни процентов на сайте — их даёт компания. */
    if (!path.endsWith("panel")) {
      /* Цены — только в «Стоимости» (plan.mjs), остальное — без чисел, которых нет в ТЗ. */
      const body = page.replace(/<section class="sec dark offer" id="cena"[\s\S]*?<\/section>/, "").replace(/"offer":\{[\s\S]*?\}\]/, "");
      assert.doesNotMatch(body, /href="tel:|wa\.me|\+998\s?\d|\d\s?(\$|сум|so‘m|UZS)/, `${path}: контакт или цена, которых нет в ТЗ`);
      assert.match(page, /\bIDLE=3000\b/, `${path}: шапка не по правилу 3 секунд`);
      /* Владелец, 27.10.2026: на компьютере шапка стоит всегда. */
      assert.ok(page.includes("matchMedia('(min-width: 1080px)')") && /DESK\.matches\)\{top\.classList\.remove\('hide'\);return\}/.test(page), `${path}: на компьютере шапка прячется`);
      assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${path}: шапка не прячется`);
      assert.ok(page.includes("'cf-leads-1'") && page.includes("'cf-panel-1'"), `${path}: сайт не связан с панелью`);
      assert.doesNotMatch(page, /scroll-behavior|preventDefault\(\);?\s*\}\s*,\s*\{\s*passive:\s*false/, `${path}: перехват прокрутки`);
    }
    const p = path.replace(/^(uz|en)\/?/, "");
    if (p === "") {
      assert.ok(page.includes('id="dzi"') && page.includes("dzVideo(b,close)"), `${path}: нет видео DevUz`);
      assert.ok(page.includes("Health.") && page.includes("Trust.") && page.includes("Value."), `${path}: нет формулы бренда`);
      for (const id of ["hero", "launch", "compare", "mission", "formula", "model", "audience", "portfolio", "contact", "cena"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
      assert.ok(page.includes('class="hs-cv"') && page.includes("/promo/scene"), `${path}: нет сцены первого экрана`);
      assert.equal((page.match(/role="tab" id="as-t-/g) ?? []).length, 5, `${path}: не пять аудиторий`);
      /* Заставка CZECHFARM alliance (владелец, 27.10.2026): после видео DevUz, логотип встаёт в шапку. */
      assert.ok(page.indexOf('id="dzi"') < page.indexOf('id="cfi"') && page.includes('/protos/chechfarm/intro3d.js" defer'), `${path}: нет заставки после видео DevUz`);
      assert.ok(page.includes("sessionStorage.setItem('cf-intro','1')") && page.includes("r.classList.contains('rm')"), `${path}: заставка не раз за визит или идёт при «меньше движения»`);
    } else assert.ok(!page.includes('id="cfi"'), `${path}: заставка не на главной`);
    if (!path.endsWith("panel")) assert.ok(page.includes('aria-label="CZECHFARM alliance"') && page.includes("<i>A</i><i>L</i><i>L</i><i>I</i><i>A</i><i>N</i><i>C</i><i>E</i>"), `${path}: в логотипе нет ALLIANCE`);
    assert.doesNotMatch(page, /CHECHFARM/, `${path}: старое имя CHECHFARM на странице`);
    if (p === "" || p === "about" || p === "investors") assert.equal((page.match(/class="ch-n"/g) ?? []).length, 14, `${path}: в цепочке не 7 шагов на двух схемах`);
    if (p === "investors") assert.equal((page.match(/class="gb-b"/g) ?? []).length, 7, `${path}: не семь стеклянных блоков`);
    if (p === "partners") assert.equal((page.match(/class="gl-r"/g) ?? []).length, 5, `${path}: не пять маршрутов на глобусе`);
    /* Главный смысл со слов клиента (26.10.2026): запуск фарм-брендов под ключ. */
    if (p === "partners") assert.ok(page.includes('name="scale"'), `${path}: в заявке нет масштаба запуска`);
    if (p === "") assert.equal((page.match(/<button type="button" data-s="\d">/g) ?? []).length, 5, `${path}: в «Пути бренда» не пять этапов`);
    if (p === "about") assert.ok(page.includes('id="needs"'), `${path}: нет «Что нужно от CZECHFARM»`);
    if (["", "partners", "investors", "contacts"].includes(p)) assert.match(page, /data-lead="(partner|investor)"/, `${path}: нет формы обращения`);
    if (p === "panel") {
      for (const v of ["dash", "leads", "news", "products", "seo", "log", "team"]) assert.match(page, new RegExp(`V\\.${v}=function`), `${path}: нет раздела ${v}`);
      for (const r of ["owner", "head", "manager"]) assert.ok(page.includes(`<option value="${r}">`), `${path}: нет роли ${r}`);
      assert.match(page, /\.tw\{overflow-x:auto/, `${path}: таблицы без своей прокрутки`);
    }
  }
  const pub = "public/protos/chechfarm";
  assert.ok(readdirSync(pub).filter((f) => f !== "seq").reduce((s, f) => s + statSync(`${pub}/${f}`).size, 0) < 4_000_000, "картинки тяжелее 4 МБ");
  /* Заставка: three.js собран в один файл, отражения — студия Higgsfield. */
  assert.ok(statSync(`${pub}/intro3d.js`).size < 600_000, "заставка тяжелее 600 КБ");
  assert.ok(existsSync(`${pub}/studio-2048.webp`), "нет студии для отражений заставки");
  /* Кадры сцены — только шифром, ключ в хранилище (lib/proto/promo SCENES). */
  const seq = readdirSync(`${pub}/seq`);
  assert.equal(seq.length, 48, "в сцене не 48 кадров");
  assert.ok(seq.every((f) => /^f\d\d\.bin$/.test(f)), "кадры сцены лежат незашифрованными");
  const { SCENES } = await import("@/lib/proto/promo");
  assert.equal(SCENES.chechfarm, "SCENE_KEY_CHECHFARM");
  /* Допы — за половину цены (владелец, 26.10.2026), основа — PROMO корпоративного сайта. */
  const plan = await import("../scripts/protos/chechfarm/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 2500);
  assert.equal(plan.OFFER_HOURS, 48);
  for (const a of plan.ADDONS) assert.equal(a.price, Math.round(a.h * plan.RATE * 0.5), `${a.id}: доп не за половину`);
  for (const html of [site.html, site.pages.uz, site.pages.en]) for (const a of plan.ADDONS) assert.ok(html.includes(`data-k="${a.id}" data-p="${a.price}"`), `${a.id}: цены нет на странице`);
  const data = await import("../scripts/protos/chechfarm/data.mjs");
  assert.deepEqual(data.CHAIN.map((c: { ru: string[] }) => c.ru[0]), ["Здоровье", "Доверие", "Продукты", "Рынок", "Продажи", "Денежный поток", "Масштабирование"], "цепочка не как в ТЗ");
  const stamped = stampedBundle("chechfarm", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["en/investors"], site.pages["en/investors"], "отпечаток не поставился на внутренней странице");
});

test("FinTax: 5 страниц и панель на ru, uz, en — условия, noindex, видео DevUz, шапка 3 с, интерактив, заявки в панель, только факты с их сайта", async () => {
  const { existsSync, readdirSync, statSync } = await import("node:fs");
  const site = bundlePages("fintax");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const PAGES = ["", "services", "prices", "about", "contacts", "panel"];
  const keys = ["ru", "uz", "en"].flatMap((l) => PAGES.map((p) => [l === "ru" ? "" : l, p].filter(Boolean).join("/")));
  assert.deepEqual(Object.keys(all).sort(), keys.sort());
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : path.startsWith("en") ? "en" : "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt`);
    for (const src of page.match(/\/protos\/fintax\/[\w./-]+\.(?:webp|png|svg)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    if (lang !== "ru") assert.doesNotMatch(page, /[А-Яа-яЁё]/, `${path}: кириллица на странице ${lang}`);
    /* Год основания на их сайте расходится (2019 и 2016): на макете года нет. */
    assert.doesNotMatch(page, /20(16|19) год|since 20|yildan/i, `${path}: год основания, который не сходится у них самих`);
    if (!path.endsWith("panel")) {
      assert.ok(page.includes("t.me/fintax_admin") && page.includes("tel:+998978900770"), `${path}: главное действие не ведёт в их Telegram и телефон`);
      assert.match(page, /\bIDLE=3000\b/, `${path}: шапка не по правилу 3 секунд`);
      assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${path}: шапка не прячется`);
      assert.ok(page.includes("'ft-leads-1'") && page.includes("'ft-panel-1'"), `${path}: сайт не связан с панелью`);
      assert.doesNotMatch(page, /scroll-behavior|preventDefault\(\);?\s*\}\s*,\s*\{\s*passive:\s*false/, `${path}: перехват прокрутки`);
      /* Цены — только их: «от 1 500 000» и четыре тарифа сайта. */
      for (const m of page.match(/\d[\d ,.]*\s?(?:млн|mln|million)/g) ?? []) assert.match(m, /^(1,5|1\.5|4|6|10|100|300) ?/, `${path}: цена не с их сайта: ${m}`);
    }
    const p = path.replace(/^(uz|en)\/?/, "");
    if (p === "") {
      assert.ok(page.includes('id="dzi"') && page.includes("dzVideo(b,close)"), `${path}: нет видео DevUz`);
      for (const id of ["hero", "order", "picker", "scheme", "desk", "reviews", "consult"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока ${id}`);
      assert.equal((page.match(/class="doc"/g) ?? []).length, 12, `${path}: в «хаос → порядок» не 12 документов`);
      assert.equal((page.match(/class="nd"/g) ?? []).length, 10, `${path}: на схеме не 10 услуг`);
      assert.equal((page.match(/data-w="/g) ?? []).length, 7, `${path}: на столе не 7 пунктов «почему»`);
    }
    if (["", "prices"].includes(p)) assert.ok(page.includes("data-picker"), `${path}: нет подбора тарифа`);
    if (["", "contacts"].includes(p)) assert.match(page, /<form class="form" data-lead/, `${path}: нет заявки`);
    if (p === "panel") {
      for (const v of ["dash", "leads", "clients", "tariffs", "log", "team"]) assert.match(page, new RegExp(`V\\.${v}=function`), `${path}: нет раздела ${v}`);
      for (const r of ["owner", "head", "manager"]) assert.ok(page.includes(`<option value="${r}">`), `${path}: нет роли ${r}`);
      assert.match(page, /\.tw\{overflow-x:auto/, `${path}: таблицы без своей прокрутки`);
      assert.match(page, /function money\(\)\{return R\.role!=='manager'\}/, `${path}: менеджер видит деньги`);
    }
  }
  const pub = "public/protos/fintax";
  assert.ok(readdirSync(pub).reduce((s, f) => s + statSync(`${pub}/${f}`).size, 0) < 3_000_000, "картинки тяжелее 3 МБ");
  const data = await import("../scripts/protos/fintax/data.mjs");
  assert.deepEqual(data.TARIFFS.map((t) => t.ru[3]), ["от 1,5 до 4 млн сум/мес", "от 4 до 6 млн сум/мес", "от 6 до 10 млн сум/мес", "от 10 млн сум/мес"], "тарифы не как на их сайте");
  assert.equal(data.SERVICES.length, 10, "услуг не десять, как на сайте");
  assert.equal(data.TEAM.length, 9, "команда не как на сайте");
  const stamped = stampedBundle("fintax", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["en/prices"], site.pages["en/prices"], "отпечаток не поставился на внутренней странице");
});

test("Cosmo World: главная на ru, uz, en — условия, noindex, видео DevUz, шапка 3 с, сцена шифром, 10 брендов, 14 регионов, только факты с их сайта", async () => {
  const { existsSync, readdirSync, readFileSync } = await import("node:fs");
  const site = bundlePages("cosmoworld");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "en", "uz"]);
  const data = await import("../scripts/protos/cosmoworld/data.mjs");
  for (const [path, page] of Object.entries(all)) {
    const lang = path || "ru";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${lang}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${lang}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${lang}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${lang}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${lang}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${lang}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${lang}: макет не зовёт модель`);
    assert.doesNotMatch(page, /href="#"/, `${lang}: ссылка в никуда`);
    assert.doesNotMatch(page, /scroll-behavior|passive:\s*false/, `${lang}: перехват прокрутки`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${lang}: картинка без alt`);
    for (const src of page.match(/\/protos\/cosmoworld\/[\w./-]+\.(?:webp|png|svg)/g) ?? []) assert.ok(existsSync("public" + src), `${lang}: нет файла ${src}`);
    if (lang !== "ru") assert.doesNotMatch(page.replace(/<script type="application\/json" id="cw-data">[\s\S]*?<\/script>/, ""), /[А-Яа-яЁё]/, `${lang}: кириллица на странице`);
    if (lang !== "ru") assert.doesNotMatch(JSON.stringify(JSON.parse(/id="cw-data">([\s\S]*?)<\/script>/.exec(page)![1]).brands.map((b: { name: string; text: string }) => [b.name, b.text])), /[А-Яа-яЁё]/, `${lang}: кириллица в окне бренда`);
    /* Видео DevUz первым, шапка прячется и возвращается через 3 с. */
    assert.ok(page.indexOf('id="dzi"') > 0 && page.indexOf('id="dzi"') < page.indexOf('class="top"') && page.includes("dzVideo(b,close)"), `${lang}: нет видео DevUz первым`);
    assert.match(page, /\bIDLE=3000\b/, `${lang}: шапка не по правилу 3 секунд`);
    assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${lang}: шапка не прячется`);
    /* Сцена: кадры шифром, ключ по ссылке макета, счёт до 100%. */
    assert.ok(page.includes('class="sc-cv"') && page.includes("/promo/scene") && page.includes('class="sc-load"'), `${lang}: нет сцены первого экрана`);
    assert.equal((page.match(/class="sc-cap /g) ?? []).length, 4, `${lang}: не четыре подписи пролёта`);
    /* Владелец, 28.10.2026: облака, параллакс, папки поверх темнеющей страны. */
    assert.equal((page.match(/class="cl cl\d"/g) ?? []).length, 3, `${lang}: нет трёх слоёв облаков`);
    assert.ok(page.indexOf('class="sc-run"') < page.indexOf('id="brands"') && page.indexOf('id="brands"') < page.indexOf('id="about"'), `${lang}: папки брендов не внутри сцены`);
    assert.ok(page.includes('class="velo"') && (page.match(/class="mq( rev)?"/g) ?? []).length === 2 && page.includes("data-reveal"), `${lang}: нет ленты фактов, бегущих строк или текста по словам`);
    /* Цен нет: их нет и у них. Контакты — только их. */
    assert.doesNotMatch(page.replace(/<script[\s\S]*?<\/script>/g, ""), /\d\s?(\$|сум|so‘m|UZS|USD)/, `${lang}: цена на странице`);
    assert.ok(page.includes("wa.me/998773507025") && page.includes("tel:+998773507025") && page.includes("info@cosmoworld.uz"), `${lang}: нет их контактов`);
    for (const n of data.NUMBERS) assert.ok(page.includes(n[lang === "ru" ? "v" : lang === "uz" ? "vuz" : "ven"] ?? n.v), `${lang}: нет цифры ${n.v}`);
    /* Стеклянные папки брендов (владелец, 28.10.2026): логотип на стекле, товары выпадают. */
    assert.equal((page.match(/class="gf" data-gf/g) ?? []).length, 10, `${lang}: не десять папок брендов`);
    assert.equal((page.match(/class="gf-logo"/g) ?? []).length, 10, `${lang}: не у каждой папки логотип`);
    assert.equal((page.match(/class="gf-pc p-[lmr]"/g) ?? []).length, 30, `${lang}: товары в папке не тремя частями`);
    assert.ok(page.includes("if(FINE||g.hasAttribute('data-open'))openB("), `${lang}: на телефоне первое нажатие не роняет товары`);
    for (const src of page.match(/\/protos\/cosmoworld\/(?:cut|logo)\/[\w.-]+\.(?:webp|png)/g) ?? []) assert.ok(existsSync("public" + src), `${lang}: нет файла ${src}`);
    assert.equal((page.match(/class="rg-g"/g) ?? []).length, 14, `${lang}: не 14 регионов на карте`);
    assert.equal((page.match(/role="tab" data-k=/g) ?? []).length, 3, `${lang}: не три вкладки заявки`);
  }
  assert.deepEqual(data.BRANDS.map((b: { name: string }) => b.name), ["Арнест", "Весна", "Dr. Rashel Estelin", "Peros", "Forest Clean", "Bily", "Parachute", "Brandfree", "MIXIT", "Nefis"], "бренды не как на их сайте");
  assert.deepEqual(data.NUMBERS.map((n: { v: string }) => n.v), ["10", "10+", "500 м²", "3 000", "2 000 м²", "150+"], "цифры не как на их сайте");
  for (const b of data.BRANDS) assert.match(b.pdf, /^https:\/\/(docs|disk)\.yandex\.ru\//, `${b.name}: каталог не их ссылкой`);
  /* Кадры сцены — только шифром, ключ в хранилище (lib/proto/promo SCENES). */
  const seq = JSON.parse(readFileSync("scripts/protos/cosmoworld/seq.json", "utf8"));
  const files = readdirSync("public/protos/cosmoworld/seq");
  /* Кадры пачками (scene.py): с телефона в Telegram 286 отдельных файлов не успевали прийти. */
  assert.equal(files.length, Math.ceil(seq.d / seq.pack) + Math.ceil(seq.p / seq.pack), "пачек сцены не столько, сколько в seq.json");
  assert.ok(files.every((f) => /^[dp]\d{2}\.bin$/.test(f)), "кадры сцены лежат незашифрованными");
  /* Владелец, 28.10.2026: «будто кадров анимации в скролле мало» — плотно, и телефону свои 9:16. */
  assert.ok(seq.d >= 250 && seq.p >= 250, "кадров пролёта меньше 250 компьютеру или телефону");
  const { SCENES } = await import("@/lib/proto/promo");
  assert.equal(SCENES.cosmoworld, "SCENE_KEY_COSMOWORLD");
  const stamped = stampedBundle("cosmoworld", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages.en, site.pages.en, "отпечаток не поставился на английской странице");
});

test("Neoline: выбор, сайт и панель на ru и uz — условия, noindex, видео DevUz и залёт на выборе, шапка 3 с, товары и цены с их сайта, uz без кириллицы", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("neoline");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "site", "uz", "uz/panel", "uz/site"]);
  const data = await import("../scripts/protos/neoline/data.mjs");
  const plan = await import("../scripts/protos/neoline/plan.mjs");
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    const kind = path.replace(/^uz\/?/, "") || "land";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi|higgsfield|firecrawl/i, `${path}: макет не зовёт модель и чужие сервисы`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /scroll-behavior|passive:\s*false/, `${path}: перехват прокрутки`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt`);
    for (const src of page.match(/\/protos\/neoline\/[\w./-]+\.(?:webp|png|svg|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    for (const id of (page.match(/href="#([\w-]+)"/g) ?? []).map((h) => h.slice(7, -1))) assert.ok(page.includes(`id="${id}"`), `${path}: ссылка на #${id}, а блока нет`);
    if (lang === "uz") assert.doesNotMatch(page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица на узбекской странице`);
    if (kind === "panel") continue;
    assert.match(page, /\bIDLE=3000\b/, `${path}: шапка не по правилу 3 секунд`);
    assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${path}: шапка не прячется`);
    /* Админка — кнопкой в шапке (владелец, 29.10.2026). */
    assert.match(page.slice(page.indexOf('class="top"'), page.indexOf("</header>")), new RegExp(`href="__PROTO_BASE__${lang === "uz" ? "/uz" : ""}/panel"`), `${path}: нет кнопки админки в шапке`);
    if (kind === "land") {
      /* Первая страница — выбор, как у Greenwell: видео DevUz, залёт, «Сайт» и «Админка», конструктор. */
      assert.ok(page.indexOf('id="dzi"') > 0 && page.indexOf('id="dzi"') < page.indexOf('id="nli"') && page.indexOf('id="nli"') < page.indexOf('class="top"'), `${path}: нет видео DevUz и залёта первыми`);
      assert.ok(page.includes('/protos/neoline/intro3d.js" defer'), `${path}: нет заставки`);
      assert.equal((page.match(/class="choice rise"/g) ?? []).length, 2, `${path}: не два выбора, сайт и админка`);
      for (const a of plan.ADDONS) assert.ok(page.includes(`data-add="${a.id}"`), `${path}: нет тумблера ${a.id}`);
      assert.ok(page.includes("2 000 $") || page.includes("3 000 $"), `${path}: нет итога конструктора`);
      continue;
    }
    assert.ok(page.includes("tel:+998948887943") && page.includes("t.me/neolinesupport"), `${path}: нет их контактов`);
    for (const p of data.CATALOG) {
      assert.ok(page.includes(`data-id="${p.id}"`), `${path}: нет товара ${p.name.ru}`);
      assert.ok(page.includes(String(p.price).replace(/\B(?=(\d{3})+(?!\d))/g, " ")), `${path}: нет цены ${p.name.ru}`);
    }
    for (const id of ["radar", "cats", "stand", "catalog", "pick", "upd", "why", "service", "bot", "uzum", "seo", "admin"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока #${id}`);
    assert.equal((page.match(/class="gf pop"/g) ?? []).length, 4, `${path}: не четыре стеклянные папки`);
    assert.ok(page.includes('class="velo"') && page.includes("data-reveal") && page.includes("data-par="), `${path}: нет бегущей строки, текста по словам или параллакса`);
    /* Тумблер конструктора включает и выключает настоящий блок на сайте. */
    for (const a of plan.ADDONS) assert.ok(page.includes(`data-addon="${a.id}"`), `${path}: тумблер ${a.id} не ведёт к блоку на сайте`);
  }
  const stamped = stampedBundle("neoline", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["uz/site"], site.pages["uz/site"], "отпечаток не поставился на узбекском сайте");
});

test("Neoline: сайт 1 000 $ вместо 4 900 $, все допы вместе 2 000 $, с сайтом не больше 3 000 $, цены в одном месте", async () => {
  const plan = await import("../scripts/protos/neoline/plan.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 4900);
  const adds = plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0);
  assert.ok(adds <= 2000, "допы дороже 2 000 $ (владелец, 29.10.2026)");
  assert.ok(plan.ALL <= 3000, "сайт с допами дороже 3 000 $");
  for (const id of ["pay", "erp", "uzum", "bot", "compare", "pick", "upd", "seo", "admin"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  for (const a of plan.ADDONS) for (const l of ["ru", "uz"] as const) assert.ok(a[l].t && a[l].e && a[l].who, `${a.id}: нет текста на ${l}`);
  for (const a of plan.ADDONS) assert.doesNotMatch(a.uz.t + a.uz.e + a.uz.who, /[А-Яа-яЁё]/, `${a.id}: кириллица в узбекском`);
  const site = bundlePages("neoline")!;
  assert.ok(site.html.includes("4 900 $") && site.html.includes("1 000 $"), "на первой странице не та цена магазина");
});

test("AutoPepe: wybór, strona i panel po polsku — warunki, noindex, wideo DevUz i wjazd w znak, szapka 3 s, usługi i ceny z autopepe.pl, bez długich kresek", async () => {
  const { existsSync } = await import("node:fs");
  const site = bundlePages("autopepe");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "site"]);
  const data = await import("../scripts/protos/autopepe/data.mjs");
  const plan = await import("../scripts/protos/autopepe/plan.mjs");
  for (const [path, page] of Object.entries(all)) {
    const kind = path || "land";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${kind}: метка сборки осталась`);
    assert.ok(page.includes('<html lang="pl">'), `${kind}: язык страницы`);
    assert.ok(page.includes("https://devuz.studio/pl/mockup-terms"), `${kind}: нет условий на польском`);
    assert.match(page, /<meta name="robots" content="noindex/, `${kind}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${kind}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${kind}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi|higgsfield|firecrawl/i, `${kind}: макет зовёт модель или чужие сервисы`);
    assert.doesNotMatch(page, /href="#"/, `${kind}: ссылка в никуда`);
    assert.doesNotMatch(page, /scroll-behavior|passive:\s*false/, `${kind}: перехват прокрутки`);
    assert.doesNotMatch(page, /[—–]/, `${kind}: длинное тире`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${kind}: картинка без alt`);
    for (const src of page.match(/\/protos\/autopepe\/[\w./-]+\.(?:webp|png|svg|js)/g) ?? []) assert.ok(existsSync("public" + src), `${kind}: нет файла ${src}`);
    for (const id of (page.match(/href="#([\w-]+)"/g) ?? []).map((h) => h.slice(7, -1))) assert.ok(page.includes(`id="${id}"`), `${kind}: ссылка на #${id}, а блока нет`);
    if (kind === "panel") continue;
    assert.match(page, /\bIDLE=3000\b/, `${kind}: шапка не по правилу 3 секунд`);
    assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${kind}: шапка не прячется`);
    assert.ok(page.includes("Lak.make") && page.includes("gl_FragColor"), `${kind}: нет живого лака (WebGL)`);
    if (kind === "land") {
      assert.ok(page.indexOf('id="dzi"') > 0 && page.indexOf('id="dzi"') < page.indexOf('id="api"') && page.indexOf('id="api"') < page.indexOf('class="top"'), "нет видео DevUz и залёта первыми");
      assert.ok(page.includes('/protos/autopepe/intro3d.js" defer'), "нет заставки");
      assert.equal((page.match(/class="choice rise"/g) ?? []).length, 2, "не два выбора, сайт и панель");
      for (const a of plan.ADDONS) assert.ok(page.includes(`data-add="${a.id}"`), `нет тумблера ${a.id}`);
      continue;
    }
    assert.ok(page.includes(`tel:${data.COMPANY.tel}`) && page.includes(data.COMPANY.mail) && page.includes("Lebiodowa 19"), "нет их контактов");
    for (const s of data.SERVICES) assert.ok(page.includes(s.t), `нет услуги ${s.t}`);
    for (const [n, p] of data.PRICES as [string, number][]) assert.ok(page.includes(n) && page.includes(`od ${p} zł`), `нет цены ${n}`);
    for (const id of ["lustro", "uslugi", "przedpo", "wycena", "oc", "kontakt", "car"]) assert.ok(page.includes(`id="${id}"`), `нет блока #${id}`);
    assert.equal((page.match(/data-part="/g) ?? []).length, data.PARTS.length, "схема машины не на все элементы");
    assert.ok(page.includes('class="velo"') && page.includes("data-par=") && page.includes("data-cmp"), "нет бегущей строки, параллакса или «przed i po»");
    for (const a of plan.ADDONS) assert.ok(page.includes(`data-addon="${a.id}"`), `тумблер ${a.id} не ведёт к блоку на сайте`);
  }
  const stamped = stampedBundle("autopepe", SEED)!;
  assert.notEqual(stamped.pages.site, site.pages.site, "отпечаток не поставился");
});

test("AutoPepe: ceny w złotych — strona 3 900 zł zamiast 9 900 zł, dodatki −60% od rynku polskiego, razem nie więcej niż 3 000 $", async () => {
  const plan = await import("../scripts/protos/autopepe/plan.mjs");
  assert.equal(plan.CUR, "zł");
  assert.equal(plan.BASE.promo, 3900);
  assert.equal(plan.BASE.price, 9900);
  for (const a of plan.ADDONS) {
    assert.ok(a.t && a.e && a.who && a.market > 0, `${a.id}: нет текста или цены рынка`);
    assert.equal(a.price, Math.round(a.market * 0.4 / 10) * 10, `${a.id}: не −60% от рынка`);
  }
  assert.ok(!plan.ADDONS.some((a: { id: string }) => a.id === "lang"), "сайт только по-польски: допа с другими языками нет");
  /* 1 000 $ и 3 000 $ по курсу NBP за октябрь 2026 (3,88 zł). */
  assert.ok(plan.BASE.promo / 3.88 <= 1010, "сайт дороже 1 000 $");
  assert.ok(plan.ALL / 3.88 <= 3000, "сайт с допами дороже 3 000 $");
  const site = bundlePages("autopepe")!;
  assert.ok(site.html.includes("9\u00a0900\u00a0zł") && site.html.includes("3\u00a0900\u00a0zł"), "на первой странице не та цена");
  for (const page of [site.html, ...Object.values(site.pages)]) assert.doesNotMatch(page, /[А-Яа-яЁёІіЇїЄєҐґ]/, "на странице кириллица, а сайт только по-польски");
});

test("Oson Apteka: выбор, сайт и панель на ru и uz — условия, noindex, видео DevUz и залёт в бренд, шапка 3 с, лекарства и цены с их сайта, uz без кириллицы", async () => {
  const { existsSync, readdirSync } = await import("node:fs");
  const { SCENES } = await import("@/lib/proto/promo");
  const site = bundlePages("osonapteka");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  assert.deepEqual(Object.keys(all).sort(), ["", "panel", "site", "uz", "uz/panel", "uz/site"]);
  const data = await import("../scripts/protos/osonapteka/data.mjs");
  const plan = await import("../scripts/protos/osonapteka/plan.mjs");
  for (const [path, page] of Object.entries(all)) {
    const lang = path.startsWith("uz") ? "uz" : "ru";
    const kind = path.replace(/^uz\/?/, "") || "land";
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    assert.ok(page.includes(`<html lang="${lang}">`), `${path}: язык страницы`);
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi|higgsfield\.ai|firecrawl/i, `${path}: макет не зовёт модель и чужие сервисы`);
    assert.doesNotMatch(page, /href="#"/, `${path}: ссылка в никуда`);
    assert.doesNotMatch(page, /scroll-behavior|passive:\s*false/, `${path}: перехват прокрутки`);
    assert.doesNotMatch(page.replace(/<script[\s\S]*?<\/script>/g, ""), /[—–]/, `${path}: длинное тире`);
    for (const img of page.match(/<img [^>]+>/g) ?? []) assert.match(img, /alt="/, `${path}: картинка без alt`);
    for (const src of page.match(/\/protos\/osonapteka\/[\w./-]+\.(?:webp|png|svg|js)/g) ?? []) assert.ok(existsSync("public" + src), `${path}: нет файла ${src}`);
    for (const id of (page.match(/href="#([\w-]+)"/g) ?? []).map((h) => h.slice(7, -1))) assert.ok(page.includes(`id="${id}"`), `${path}: ссылка на #${id}, а блока нет`);
    if (lang === "uz") assert.doesNotMatch(page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, ""), /[А-Яа-яЁё]/, `${path}: кириллица на узбекской странице`);
    if (kind === "panel") continue;
    assert.match(page, /\bIDLE=3000\b/, `${path}: шапка не по правилу 3 секунд`);
    assert.match(page, /classList\.add\('hide'\)[\s\S]*IDLE\)/, `${path}: шапка не прячется`);
    assert.match(page.slice(page.indexOf('class="top"'), page.indexOf("</header>")), new RegExp(`href="__PROTO_BASE__${lang === "uz" ? "/uz" : ""}/panel"`), `${path}: нет кнопки админки в шапке`);
    if (kind === "land") {
      /* Видео DevUz первым, сразу за ним — залёт камерой в бренд (кадры шифром). */
      assert.ok(page.indexOf('id="dzi"') > 0 && page.indexOf('id="dzi"') < page.indexOf('id="fly"'), `${path}: нет видео DevUz перед залётом`);
      assert.ok(page.includes("/promo/scene") && page.includes("AES-GCM"), `${path}: кадры залёта не по ключу`);
      assert.equal((page.match(/class="choice rise"/g) ?? []).length, 2, `${path}: не два выбора, сайт и админка`);
      for (const a of plan.ADDONS) assert.ok(page.includes(`data-add="${a.id}"`), `${path}: нет тумблера ${a.id}`);
      continue;
    }
    assert.ok(page.includes(`tel:${data.COMPANY.tel}`) && page.includes(`t.me/${data.COMPANY.bot}`), `${path}: нет их контактов`);
    for (const p of data.CATALOG) {
      assert.ok(page.includes(`data-id="${p.id}"`), `${path}: нет лекарства ${p.name.ru}`);
      assert.ok(page.includes(String(p.price).replace(/\B(?=(\d{3})+(?!\d))/g, " ")), `${path}: нет цены ${p.name.ru}`);
    }
    for (const id of ["search", "how", "list", "map", "tarif", "remind", "bot", "cab", "erp", "pharm", "reviews", "admin"]) assert.ok(page.includes(`id="${id}"`), `${path}: нет блока #${id}`);
    assert.ok(page.includes("проконсультируйтесь с врачом") || page.includes("shifokor bilan maslahatlashing"), `${path}: нет напоминания про врача`);
    assert.doesNotMatch(page, /вылечит|лучшее средство|davolaydi/i, `${path}: обещание лечения`);
    assert.ok(page.includes('class="velo"') && page.includes("data-par="), `${path}: нет бегущей строки или параллакса`);
    for (const a of plan.ADDONS) assert.ok(page.includes(`data-addon="${a.id}"`), `${path}: тумблер ${a.id} не ведёт к блоку на сайте`);
  }
  /* Кадры Higgsfield — только шифром, открыт лишь первый кадр-постер. */
  assert.equal(SCENES.osonapteka, "SCENE_KEY_OSONAPTEKA");
  for (const set of ["d", "m"]) {
    const files = readdirSync(`public/protos/osonapteka/seq/${set}`);
    assert.equal(files.length, 60, `${set}: не 60 кадров`);
    assert.ok(files.every((f) => f.endsWith(".bin")), `${set}: кадр лежит открытым`);
  }
  assert.deepEqual(readdirSync("public/protos/osonapteka").filter((f) => /\.(mp4|png|jpe?g)$/.test(f)), [], "открытый ролик или кадр в public");
  const stamped = stampedBundle("osonapteka", SEED)!;
  assert.notEqual(stamped.html, site.html, "отпечаток не поставился");
  assert.notEqual(stamped.pages["uz/site"], site.pages["uz/site"], "отпечаток не поставился на узбекском сайте");
});

test("Oson Apteka: сайт 1 000 $ вместо 4 900 $, допы вместе 2 000 $, с сайтом не больше 3 000 $; тарифы по середине рынка", async () => {
  const plan = await import("../scripts/protos/osonapteka/plan.mjs");
  const tf = await import("../scripts/protos/osonapteka/tariffs.mjs");
  assert.equal(plan.BASE.promo, 1000);
  assert.equal(plan.BASE.price, 4900);
  assert.ok(plan.ADDONS.reduce((s: number, a: { price: number }) => s + a.price, 0) <= 2000, "допы дороже 2 000 $");
  assert.ok(plan.ALL <= 3000, "сайт с допами дороже 3 000 $");
  for (const id of ["bron", "admin", "erp", "deliv", "pay", "bot", "remind"]) assert.ok(plan.ADDONS.some((a: { id: string }) => a.id === id), `нет допа ${id}`);
  for (const a of plan.ADDONS) for (const l of ["ru", "uz"] as const) assert.ok(a[l].t && a[l].e && a[l].who, `${a.id}: нет текста на ${l}`);
  for (const a of plan.ADDONS) assert.doesNotMatch(a.uz.t + a.uz.e + a.uz.who, /[А-Яа-яЁё]/, `${a.id}: кириллица в узбекском`);
  /* Бронь бесплатна, ближняя доставка — рядом с PharmaClick (от 8 000 сум), комиссия брони как у tabletki.ua (2%). */
  assert.equal(tf.BUYER.bron, 0);
  assert.ok(tf.BUYER.zones[0].price >= 8000 && tf.BUYER.zones[0].price <= 12000);
  assert.equal(tf.PHARMACY.opts.find((o: { id: string }) => o.id === "bron")?.fee, 2);
  const site = bundlePages("osonapteka")!;
  assert.ok(site.html.includes("4 900 $") && site.html.includes("1 000 $"), "на первой странице не та цена");
});
