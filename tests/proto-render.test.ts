import assert from "node:assert/strict";
import { test } from "node:test";

import { PROTO_NICHES, protoNicheByKey, trickFor } from "@/content/proto/models";
import { bookingHtml, inCity } from "@/lib/proto/booking";
import { keyframeProperties, protoProblems, visibleText } from "@/lib/proto/check";
import { enoughToBuild, mainAction, wheelProblems, wordmark, type ProtoFacts } from "@/lib/proto/facts";
import { parseServices } from "@/lib/proto/form";
import { MOTIONS, MOTION_KEYS, flingVars, motionCss, motionsFor } from "@/lib/proto/motion";
import { buildProto, sendable } from "@/lib/proto/render";
import { TRICK_KEYS, trick } from "@/lib/proto/tricks";

/**
 * Прототип уходит владельцу живого бизнеса с его именем в шапке. Поэтому
 * проверяется не «красиво ли», а то, за что нам прилетит: выдуманные цифры,
 * мёртвая кнопка, чужой бизнес в выдаче Google и анимация без выключателя.
 */

const base: ProtoFacts = {
  name: "Шина Плюс",
  niche: "shinomontazh",
  locale: "ru",
  city: "Ташкент",
  about: "Шиномонтаж на Чиланзаре.",
  services: [
    { name: "Замена шин", price: "от 40 000 сум" },
    { name: "Балансировка", price: null },
    { name: "Ремонт прокола", price: null },
  ],
  phone: "+998 90 123 45 67",
  telegram: "shinaplus",
  whatsapp: null,
  instagram: null,
  address: null,
  hours: null,
  logo: null,
  wheel: null,
  photos: [],
  source: "shinaplus.uz",
};

const facts = (patch: Partial<ProtoFacts> = {}): ProtoFacts => ({ ...base, ...patch });

const build = (patch: Partial<ProtoFacts> = {}) => {
  const result = buildProto(facts(patch));
  assert.ok(result, "ниша не собралась");
  return result;
};

test("падеж города берётся из словаря, а не сочиняется", () => {
  // «Шиномонтаж в Ташкенте» в заголовке и «Ташкент» плашкой: одна и та же
  // строка фактов, две разные формы, и обе из каталога.
  assert.equal(inCity("Ташкент", "ru"), " в Ташкенте");
  assert.equal(inCity("Фергана", "ru"), " в Фергане");
  assert.equal(inCity("Toshkent", "uz"), " Toshkentda");
  // Незнакомый город в заголовок не попадает: выдумывать падеж мы не будем.
  assert.equal(inCity("Чирчик", "ru"), "");
  assert.equal(inCity(null, "ru"), "");

  const html = build().html;
  assert.ok(html.includes("Шиномонтаж в Ташкенте"), "нет города в надзаголовке");
  assert.ok(html.includes("<li>Ташкент</li>"), "город в плашке не в именительном");
});

test("прототип называет клиента и ведёт в его собственный мессенджер", () => {
  const result = build();
  assert.ok(result.html.includes("Шина Плюс"), "нет названия компании");
  // Кнопка открывает переписку с ним, а не форму: форма, которая ничего не
  // отправляет, — обман, а форма, которая отправляет нам, забирает его
  // обращение себе.
  assert.ok(result.html.includes("https://t.me/shinaplus?text="), "кнопка ведёт не в его телеграм");
  assert.equal(result.html.includes("<form"), false, "на странице есть форма");
  assert.deepEqual(result.problems, []);
  assert.ok(sendable(result));
});

test("порядок мессенджеров: телеграм, ватсап, телефон", () => {
  assert.equal(mainAction(facts()).kind, "telegram");
  assert.equal(mainAction(facts({ telegram: null, whatsapp: "+998901234567" })).kind, "whatsapp");
  assert.ok(mainAction(facts({ telegram: null, whatsapp: "+998 90 123 45 67" })).href.includes("wa.me/998901234567"));
  assert.equal(mainAction(facts({ telegram: null, whatsapp: null })).kind, "phone");
  assert.equal(mainAction(facts({ telegram: null, whatsapp: null, phone: null })).kind, "none");
});

test("без контакта и без трёх услуг прототип не собирается", () => {
  assert.deepEqual(enoughToBuild(facts()), []);
  assert.deepEqual(build({ services: base.services.slice(0, 2) }).missing, ["хотя бы три услуги"]);
  assert.deepEqual(build({ telegram: null, whatsapp: null, phone: null }).missing, [
    "телеграм, ватсап или телефон для кнопки",
  ]);
  // Пустой html при непустом missing: собирать нечего, и отправлять нечего.
  assert.equal(sendable(build({ services: [] })), false);
});

test("числа только те, что компания сказала о себе сама", () => {
  const result = build();
  const numbers = visibleText(result.html).match(/\d+/g) ?? [];
  // Всё, что осталось в тексте, — из фактов: цена услуги и телефон.
  for (const number of numbers) {
    assert.ok(
      "от 40 000 сум +998 90 123 45 67".includes(number),
      `в тексте число, которого нет в фактах: ${number}`,
    );
  }

  const invented = protoProblems({
    html: result.html.replace("</main>", "<p>Более 5000 довольных клиентов</p></main>"),
    facts: facts(),
    niche: protoNicheByKey("shinomontazh")!,
  });
  assert.ok(
    invented.some((problem) => problem.code === "invented" && problem.text.includes("5000")),
    "выдуманная цифра прошла проверку",
  );
});

test("похвала ловится, а его собственные слова — нет", () => {
  const niche = protoNicheByKey("shinomontazh")!;
  const bragged = protoProblems({
    html: build().html.replace("</main>", "<p>Гарантия на работы</p></main>"),
    facts: facts(),
    niche,
  });
  assert.ok(bragged.some((problem) => problem.code === "brag"));

  // Если это написано у него на сайте и попало в факты — он так о себе и
  // говорит, и мы ничего не придумали.
  const own = facts({ about: "Гарантия на работы — наша политика." });
  const result = buildProto(own)!;
  assert.deepEqual(result.problems, []);
});

test("подсказки для первички в текст не просачиваются", () => {
  const niche = protoNicheByKey("shinomontazh")!;
  assert.ok(niche.ask.includes("Правка дисков"), "подсказка пропала из ниши");
  const leaked = protoProblems({
    html: build().html.replace("</main>", "<p>Правка дисков</p></main>"),
    facts: facts(),
    niche,
  });
  assert.ok(leaked.some((problem) => problem.code === "guessed"), "услуга, которой нет у клиента, прошла");

  // А если он сам сказал, что делает правку дисков, — это факт, а не догадка.
  const told = facts({ services: [...base.services, { name: "Правка дисков", price: null }] });
  assert.deepEqual(buildProto(told)!.problems, []);
});

test("анимацию есть чем выключить, и она не трогает вёрстку", () => {
  const html = build().html;
  assert.ok(html.includes("prefers-reduced-motion"), "нет выключателя анимации");
  // Ни одного обработчика прокрутки: плавность делает браузер, а не мы.
  assert.equal(/addEventListener/.test(html), false, "на странице слушают события");
  assert.equal(/scroll-behavior\s*:\s*smooth/.test(html), false);

  const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
  assert.deepEqual(keyframeProperties(css).sort(), ["opacity", "transform"]);
  // Анимация трюка привязана к прокрутке самой сцены, а не к таймеру.
  assert.ok(css.includes("animation-timeline:--track"), "трюк не привязан к прокрутке");
});

test("проверка ловит подделки, которые выглядят прилично", () => {
  const niche = protoNicheByKey("shinomontazh")!;
  const good = build().html;
  const broken = (html: string) => protoProblems({ html, facts: facts(), niche }).map((problem) => problem.code);

  assert.ok(broken(good.replace(/@media \(prefers-reduced-motion:reduce\)/, "@media all")).includes("motion"));
  assert.ok(broken(good.replace("@keyframes rise{from{opacity:0", "@keyframes rise{from{top:0;opacity:0")).includes("repaint"));
  assert.ok(broken(good.replace("<script>", '<script>window.addEventListener("scroll",()=>{});')).includes("hijack"));
  assert.ok(broken(good.replace(".wrap{width:100%", ".wrap{width:100vw")).includes("overflow"));
  assert.ok(broken(good.replace(/noindex,nofollow,noarchive/, "index,follow")).includes("index"));
  assert.ok(broken(good.replace('<span class="brand">', '<a class="brand" href="#">')).includes("action"));
  assert.deepEqual(broken(good), []);
});

test("сцена берёт шесть услуг, остальные уходят списком", () => {
  const many = Array.from({ length: 9 }, (_, index) => ({ name: `Услуга ${index}`, price: null }));
  // Числа в названиях услуг — из фактов, поэтому проверку они не ломают.
  const result = build({ services: many });
  assert.equal((result.html.match(/class="fly c\d"/g) ?? []).length, 6, "в сцене не шесть карточек");
  assert.equal((result.html.match(/class="tile mo m-/g) ?? []).length, 3 + 3, "остаток и шаги записи разошлись");
  assert.deepEqual(result.problems, []);
});

test("каждая ниша собирается и проходит проверку", () => {
  for (const niche of PROTO_NICHES) {
    const result = buildProto(facts({ niche: niche.key }));
    assert.ok(result, `${niche.key}: не собралась`);
    assert.deepEqual(result.problems, [], `${niche.key}: ${result.problems.map((p) => p.text).join("; ")}`);
    assert.ok(result.html.includes(niche.ru), `${niche.key}: нет рода занятий на странице`);
    // Трюк у ниши либо свой, либо модельный — но он есть всегда.
    assert.ok(TRICK_KEYS.includes(trickFor(niche)), `${niche.key}: трюк ${trickFor(niche)} не нарисован`);
  }
});

test("рисунок трюка крутится и не тащит за собой стороннюю картинку", () => {
  for (const key of TRICK_KEYS) {
    const art = trick(key, PROTO_NICHES[0].palette);
    assert.equal(art.key, key);
    assert.equal(art.photo, false);
    assert.ok(art.html.includes('class="spin"'), `${key}: нечему крутиться`);
    assert.ok(art.spinDeg >= 360, `${key}: за всю сцену меньше оборота`);
    // Всё нарисовано кодом: ни одной внешней ссылки, ни одного мегабайта.
    assert.equal(/<image|https?:/.test(art.html), false, `${key}: в рисунке чужая картинка`);
    assert.ok(art.html.length < 12000, `${key}: рисунок тяжелее двенадцати килобайт`);
  }
  // Шиномонтаж перебивает трюк модели — это и есть уровень «ниша».
  assert.equal(trickFor(protoNicheByKey("shinomontazh")!), "wheel");
  assert.equal(trickFor(protoNicheByKey("barbershop")!), "clock");
});

test("неизвестного не печатаем: нет адреса — нет блока адреса", () => {
  const bare = build().html;
  assert.equal(bare.includes("Открыть на карте"), false, "карта на месте без адреса");
  assert.equal(bare.includes("Все услуги"), false, "список остатка без остатка");

  const full = build({ address: "Ташкент, Чиланзар 5", hours: "Пн–Сб 9:00–19:00" }).html;
  assert.ok(full.includes("Открыть на карте"));
  assert.ok(full.includes("google.com/maps"), "адрес не открывается на карте");
  assert.ok(full.includes("Пн–Сб 9:00–19:00"));
});

test("страница не индексируется и знает, откуда взяты данные", () => {
  const html = build().html;
  assert.ok(/<meta name="robots" content="noindex,nofollow,noarchive">/.test(html));
  assert.ok(html.includes("shinaplus.uz"), "в подвале нет источника данных");
  assert.ok(html.includes("DevUz Studio"), "непонятно, кто прислал прототип");
});

test("широкий логотип ставится надписью, квадратный — значком с названием", () => {
  // У малого бизнеса логотип почти всегда надпись: 1300×330 в квадрате 34×34
  // читается как пятно, а название рядом с ней — это имя компании дважды.
  const wide = build({ logo: { url: "https://shinaplus.uz/logo.png", width: 1300, height: 330 } }).html;
  assert.ok(wide.includes('class="word"'), "широкий логотип втиснут в значок");
  assert.equal((wide.match(/Шина Плюс<\/span>/g) ?? []).length, 1, "название компании в шапке дважды");
  assert.ok(wordmark({ url: "x", width: 1300, height: 330 }));

  const square = build({ logo: { url: "https://shinaplus.uz/icon.png", width: 512, height: 512 } }).html;
  assert.ok(square.includes('class="mark"'), "квадратный логотип потерялся");
  assert.ok(square.includes("Шина Плюс</span>"), "у значка нет названия рядом");
  assert.equal(wordmark({ url: "x", width: 512, height: 512 }), false);
  assert.equal(wordmark(null), false);
});

test("узбекская версия собирается той же сборкой", () => {
  const uz = build({ locale: "uz" });
  assert.ok(uz.html.startsWith('<!doctype html>\n<html lang="uz">'));
  assert.ok(uz.html.includes("Yozilish"), "кнопка осталась русской");
  assert.deepEqual(uz.problems, []);
});

test("bookingHtml не падает на пустых необязательных полях", () => {
  const html = bookingHtml({
    facts: facts({ about: null, city: null, instagram: null }),
    niche: protoNicheByKey("shinomontazh")!,
  });
  assert.ok(html.includes("Шина Плюс"));
  assert.equal(html.includes("undefined"), false, "в страницу попало undefined");
  assert.equal(html.includes("null"), false, "в страницу попало null");
});

test("услуги из формы: цена после тире, дефис в названии не трогаем", () => {
  const parsed = parseServices(
    [
      "Замена шин — от 40 000 сум",
      "Балансировка колеса | 25 000",
      "Ремонт прокола - 15 000 сум",
      "Шиномонтаж R16-R18",
      "   ",
      "Сезонное хранение",
    ].join("\n"),
  );
  assert.deepEqual(parsed, [
    { name: "Замена шин", price: "от 40 000 сум" },
    { name: "Балансировка колеса", price: "25 000" },
    { name: "Ремонт прокола", price: "15 000 сум" },
    // Дефис без пробелов — часть названия: «R16-R18» это размер, а не цена.
    { name: "Шиномонтаж R16-R18", price: null },
    { name: "Сезонное хранение", price: null },
  ]);
  assert.deepEqual(parseServices(""), []);
  assert.equal(parseServices(Array.from({ length: 30 }, (_, i) => `Услуга ${i}`).join("\n")).length, 12);
});

test("услуги из формы доезжают до страницы как есть", () => {
  const result = build({ services: parseServices("Замена шин — от 40 000 сум\nБалансировка\nРемонт прокола") });
  assert.ok(result.html.includes("от 40 000 сум"), "цена не доехала до карточки");
  assert.deepEqual(result.problems, []);
});


test("у каждого блока своё движение, у соседей — разные", () => {
  // Владелец: «для каждого блока сделать свою анимацию появления».
  // Одинаковое всплытие у восьми карточек подряд читается как шаблон.
  const names = ["Кузовной ремонт", "Замена фильтров", "Регулярное ТО", "Замена масла", "Балансировка"];
  const picked = motionsFor(names);
  assert.deepEqual(picked, ["panel", "slide", "snap", "unfold", "zoom"], "смысл названия не подобрал движение");

  // Два одинаковых названия подряд не дают двух одинаковых движений.
  const same = motionsFor(["Кузовной ремонт", "Кузовные работы", "Кузов после ДТП"]);
  assert.equal(same[0], "panel");
  assert.notEqual(same[1], same[0]);
  assert.notEqual(same[2], same[1]);

  // Незнакомое название всё равно получает движение — страница без анимации
  // у половины блоков выглядит недоделанной, а не сдержанной.
  for (const key of motionsFor(["Что-то своё", "И ещё", "И третье"])) {
    assert.ok(MOTION_KEYS.includes(key), `${key}: такого движения нет`);
  }
});

test("в стили попадают только использованные движения", () => {
  const css = motionCss(["rise", "panel", "rise"]);
  assert.ok(css.includes("@keyframes rise"));
  assert.ok(css.includes("@keyframes panel"));
  assert.equal(css.includes("@keyframes tilt"), false, "в страницу попали неиспользованные кадры");
  assert.equal(motionCss([]), "");
  assert.equal(motionCss(["такого-нет"]), "");
});

test("каждое движение трогает только transform и opacity", () => {
  // Это и есть та проверка, ради которой движения лежат в одном месте:
  // новое, добавленное в Claude design, пройдёт здесь до первого клиента.
  for (const key of MOTION_KEYS) {
    const properties = keyframeProperties(MOTIONS[key].css).sort();
    assert.ok(properties.length, `${key}: в движении нет ни одного кадра`);
    assert.deepEqual(
      properties.filter((property) => property !== "transform" && property !== "opacity"),
      [],
      `${key}: движение пересчитывает вёрстку`,
    );
    assert.ok(MOTIONS[key].css.includes(`@keyframes ${key}`), `${key}: кадры названы не как ключ`);
    assert.ok(MOTIONS[key].note.length > 20, `${key}: не сказано, зачем она`);
  }
});

test("проверка ловит движение, которого нет", () => {
  const broken = protoProblems({
    html: build().html.replace('class="tile mo m-', 'class="tile mo m-risee m-'),
    facts: facts(),
    niche: protoNicheByKey("shinomontazh")!,
  });
  assert.ok(broken.some((problem) => problem.code === "motion"), "опечатка в имени анимации прошла");
});

test("слои параллакса не ловят нажатия и не читаются вслух", () => {
  const html = build().html;
  // Параллакс поверх кнопки — не украшение, а поломка: на телефоне это
  // выглядит как «сайт не работает».
  assert.ok(html.includes('class="par" aria-hidden="true"'), "слой параллакса читается вслух");
  assert.ok(/\.par\{[^}]*pointer-events:none/.test(html), "слой параллакса ловит нажатия");
  // Слои едут с разной скоростью и в разные стороны — иначе это не параллакс,
  // а один сдвинутый фон.
  const depths = [...html.matchAll(/--a:(-?\d+)px;--b:(-?\d+)px/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.ok(depths.length >= 3, "слоёв меньше трёх");
  assert.ok(new Set(depths.map(String)).size >= 3, "все слои едут одинаково");
  assert.ok(depths.some(([a]) => a > 0) && depths.some(([a]) => a < 0), "слои едут в одну сторону");

  const broken = protoProblems({
    html: html.replace("pointer-events:none;z-index:0", "z-index:0"),
    facts: facts(),
    niche: protoNicheByKey("shinomontazh")!,
  });
  assert.ok(broken.some((problem) => problem.code === "motion"));
});

test("настоящий снимок вместо рисунка — и требования к нему", () => {
  // Владелец: «шину бы с диском я взял реальную, просто анимирую её».
  const ok = { url: "https://devuz.studio/wheels/alpina.png", width: 1600, height: 1600 };
  assert.deepEqual(wheelProblems(ok), []);
  assert.deepEqual(wheelProblems(null), []);

  const result = build({ wheel: ok });
  assert.ok(result.html.includes('class="spin shot"'), "снимок не крутится тем же классом");
  assert.ok(result.html.includes(ok.url));
  assert.equal(result.html.includes("<svg"), false, "рисунок остался рядом со снимком");
  assert.deepEqual(result.problems, []);

  // Не квадратный пойдёт по орбите, как несбалансированное колесо.
  assert.ok(wheelProblems({ ...ok, width: 1600, height: 900 })[0].includes("эллипс"));
  // Мелкий на телефоне с тройной плотностью растянется вдвое.
  assert.ok(wheelProblems({ ...ok, width: 600, height: 600 })[0].includes("1200"));
  // У JPEG нет прозрачности: вокруг колеса поедет белый квадрат.
  assert.ok(wheelProblems({ ...ok, url: "https://devuz.studio/w.jpg" })[0].includes("PNG"));
  // Кривой снимок виден в панели, а не выясняется на клиенте.
  assert.ok(build({ wheel: { ...ok, url: "https://devuz.studio/w.jpg" } }).problems.some((p) => p.code === "wheel"));
});

test("без снимка крутится рисунок — запасной путь не пропал", () => {
  const html = build().html;
  assert.ok(html.includes("<svg"), "нечего крутить без снимка");
  assert.ok(html.includes('class="spin"'));
  assert.equal(html.includes('class="spin shot"'), false);
});

test("текст страницы совпадает с тем, что делает кнопка", () => {
  // Кнопка, которая набирает номер, рядом с подписью «пишете в один клик» —
  // это ошибка, которую посетитель заметит ровно в момент записи.
  const chat = build().html;
  assert.ok(chat.includes("Пишете в один клик"));
  assert.ok(chat.includes("Время подтверждают в ответном сообщении"));

  const call = build({ telegram: null, whatsapp: null }).html;
  assert.equal(mainAction(facts({ telegram: null, whatsapp: null })).kind, "phone");
  assert.ok(call.includes("Звоните в один клик"), "шаги остались про переписку");
  assert.equal(call.includes("Пишете в один клик"), false);
  assert.equal(call.includes("Запись в Telegram"), false, "плашка обещает телеграм, которого нет");

  // Подзаголовок первого экрана — оттуда же, но только когда своих слов у
  // компании нет: её собственный текст мы не переписываем.
  const bare = build({ telegram: null, whatsapp: null, about: null }).html;
  assert.ok(bare.includes("Запись по телефону"), "подзаголовок обещает переписку");
  assert.ok(build({ about: null }).html.includes("Запись через переписку"));
});

test("карточки в сцене вылетают по-разному, а не все одинаково", () => {
  // В сцене как раз те шесть услуг, ради которых человек и листает: своё
  // движение нужно им не меньше, чем списку внизу страницы.
  const result = build({
    services: [
      { name: "Кузовные работы", price: null },
      { name: "Замена фильтров", price: null },
      { name: "Регулярное ТО", price: null },
      { name: "Замена масла", price: null },
    ],
  });
  const flown = [...result.html.matchAll(/class="fly c\d" style="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(flown.length, 4);
  assert.equal(new Set(flown).size, 4, "две карточки вылетают одинаково");
  // Кузовная панель приезжает сбоку с наклоном, масло льётся сверху.
  assert.deepEqual(flown[0], flingVars("panel"));
  assert.ok(flown[0].includes("--fr:2deg"));
  assert.ok(flingVars("unfold").includes("--fy:-38px"));
  assert.deepEqual(flown[3], flingVars("unfold"));
  // Незнакомое имя движения не роняет карточку в пустоту.
  assert.equal(flingVars("такого-нет"), flingVars("rise"));
  assert.deepEqual(result.problems, []);
});
