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

test("HOP.UZ: конструктор — сайт 1 700 $, все допы не больше 1 300 $, обязательные на месте", async () => {
  const plan = await import("../scripts/protos/hop/plan.mjs");
  // Задание владельца, 08.10.2026: сайт без допов 1 700 $, со всеми допами не больше 3 000 $.
  assert.equal(plan.BASE.price, 1700);
  const all: { id: string; price: number; ru: { t: string; e?: string; why?: string } }[] = [...plan.ADDONS, ...plan.BLOCKS];
  const sum = all.reduce((s, a) => s + a.price, 0);
  assert.ok(sum <= 1300, `все допы вместе ${sum} $, а можно не больше 1 300 $`);
  assert.ok(plan.BASE.price + sum <= 3000, "со всеми допами — не больше 3 000 $");
  for (const id of ["post", "pay", "pwa"]) assert.ok(all.some((a) => a.id === id), `нет обязательного допа ${id}`);
  for (const a of all) assert.ok(a.ru.t && (a.ru.e || a.ru.why), `${a.id}: нет описания`);
});
