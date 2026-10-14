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
    for (const view of ["home", "box", "hub", "rocket", "dice", "upgrade", "pvp", "inv", "top", "tasks", "profile"]) {
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
