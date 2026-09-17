import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NICHES } from "@/content/razbor/catalog";
import { classify, isKnownNiche } from "@/lib/razbor/classify";

/**
 * Определение ниши по разметке сайта.
 *
 * Работает в аудиторе: человек проверил свой сайт, увидел находки — и
 * сразу под ними разборы его ниши. Момент максимального интереса.
 *
 * Поэтому цена ошибок несимметрична. Не определить — обидно, но честно:
 * блок просто не показывается. Определить неверно — это владельцу
 * стоматологии показать разборы автосервисов, и дальше он не верит ни
 * находкам, ни студии.
 */

const page = (body: string, title = "", url = "https://example.uz/") => ({
  url,
  html: `<html><head><title>${title}</title></head><body>${body}</body></html>`,
  title,
});

test("узнаёт стоматологию", () => {
  const got = classify(
    page(
      "Лечение кариеса, имплантация зубов, брекеты и виниры. Стоматолог принимает ежедневно.",
      "Стоматология в Ташкенте",
    ),
  );
  assert.equal(got?.niche, "stomatologiya");
});

test("узнаёт автосервис по узбекским словам", () => {
  const got = classify(
    page("Avtoservis: shinamontaj, moy almashtirish, diagnostika", "Avtoservis Toshkent"),
  );
  assert.equal(got?.niche, "avtoservis");
});

test("узнаёт нишу по адресу, даже когда текста мало", () => {
  const got = classify(page("Добро пожаловать", "Главная", "https://mebel-tashkent.uz/"));
  assert.equal(got?.niche, "mebel");
});

test("молчит, когда сайт ни о чём не говорит", () => {
  assert.equal(classify(page("Добро пожаловать на наш сайт", "Главная")), null);
  assert.equal(classify(page("", "")), null);
});

test("молчит, когда сайт про две ниши сразу", () => {
  // Каталог или компания «всё для всех»: угадывать нельзя, подстановка
  // наугад хуже пустоты.
  const got = classify(
    page(
      "Ремонт под ключ, отделочные работы, смета. А также мебель на заказ: кухни на заказ, шкаф-купе, диван.",
      "Строительство и мебель",
    ),
  );
  assert.equal(got, null);
});

test("одно слово, повторённое сто раз, нишу не перевешивает", () => {
  // Слово в меню, в подвале и в каждой карточке товара набирает сотню
  // совпадений, ничего не говоря о нише. Без потолка на повторы такая
  // страница определялась бы по самому частому слову, а не по смыслу.
  const body = "мебель ".repeat(100) + " стоматолог кариес имплант";
  const got = classify(page(body, "Стоматология"));

  assert.equal(got?.niche, "stomatologiya", "победило самое частое слово, а не смысл");
  assert.notEqual(got?.niche, "mebel");
});

test("все ниши определителя есть в каталоге", () => {
  // Расходятся — и ссылка на разборы ведёт в никуда.
  for (const niche of NICHES) {
    assert.equal(isKnownNiche(niche.key), true);
  }
  assert.equal(isKnownNiche("такой-ниши-нет"), false);
});

test("определитель знает про каждую нишу каталога", () => {
  // Если в каталоге появилась ниша, а слов для неё не завели, разборы по
  // ней никогда не покажутся — и заметить это без проверки нельзя.
  const source = readClassifier();
  for (const niche of NICHES) {
    assert.ok(
      source.includes(`${niche.key}:`) || source.includes(`"${niche.key}":`),
      `для ниши ${niche.key} не заведено ни одного слова-приметы`,
    );
  }
});

test("самое прямое слово ниши входит в приметы", () => {
  // Выстрелило ровно так: в списке для интернет-магазина были «корзина» и
  // «оформить заказ», а самого слова «интернет-магазин» не было — и сайт с
  // ним прямо в заголовке определитель не узнавал. Перестраховка от общих
  // слов выкинула нужное.
  const cases: [string, string][] = [
    ["internet-magazin", "интернет-магазин"],
    ["stomatologiya", "стоматолог"],
    ["avtoservis", "автосервис"],
    ["restoran", "ресторан"],
    ["mebel", "мебель"],
    ["fitnes", "фитнес"],
    ["turagentstvo", "турагент"],
    ["salon-krasoty", "салон красоты"],
    ["uchebnyy-centr", "учебный центр"],
    ["logistika", "грузоперевоз"],
    ["medcentr", "медицинский центр"],
  ];
  const source = readClassifier();
  for (const [niche, word] of cases) {
    const at = source.indexOf(`${niche.includes("-") ? `"${niche}"` : niche}:`);
    assert.ok(at > 0, `ниша ${niche} пропала из определителя`);
    const list = source.slice(at, source.indexOf("],", at));
    assert.ok(list.includes(word), `в приметах ${niche} нет слова «${word}»`);
  }
});

test("узнаёт нишу по одному заголовку", () => {
  // Сайт на JavaScript отдаёт почти пустое тело, и заголовок — всё, что у
  // нас есть. Если по нему не определяется, определитель бесполезен на
  // половине современных сайтов.
  const got = classify({
    url: "https://shop.example.uz/",
    html: "<html><head><title>Интернет-магазин техники</title></head><body></body></html>",
    title: "Интернет-магазин техники",
  });
  assert.equal(got?.niche, "internet-magazin");
});

function readClassifier(): string {
  return readFileSync(new URL("../lib/razbor/classify.ts", import.meta.url), "utf8");
}

/* ── Связка с аудитором ─────────────────────────────────────────────────── */

test("разборы ниши показываются под отчётом, а не где придётся", () => {
  const widget = readFileSync(
    new URL("../components/audit/site-audit.tsx", import.meta.url),
    "utf8",
  );

  // Блок берёт разборы по определённой нише и молчит, когда её нет:
  // подставить владельцу стоматологии разборы автосервисов хуже, чем не
  // показать ничего.
  assert.match(widget, /razbors\[report\.facts\.niche\]/);
  assert.match(widget, /near\.length > 0 && \(/);

  // Карта приходит с сервера. Класть в браузер тексты всех разборов
  // значило бы грузить каждому посетителю статьи, которые он не откроет.
  const page = readFileSync(
    new URL("../app/[locale]/audit/page.tsx", import.meta.url),
    "utf8",
  );
  // Ожидание здесь не украшение: карта собирается из базы, куда её кладёт
  // ночная смена, а не из файла, который меняется только выкаткой.
  assert.match(page, /razbors=\{await razborsForNiche\(locale\)\}/);
  assert.match(page, /isRazborLocale\(locale\) \? razborsByNiche\(locale\) : \{\}/);
});

test("ниша попадает в отчёт аудитора", () => {
  const checks = readFileSync(new URL("../lib/audit/checks.ts", import.meta.url), "utf8");
  assert.match(checks, /niche: classify\(/);
  // Отдельного запроса ради ниши не делаем: слова уже прочитаны.
  assert.ok(!/await classify/.test(checks), "определение ниши стало асинхронным");
});

test("ежедневная задача делает три разбора", () => {
  const skill = readFileSync(
    new URL("../.claude/skills/razbor-daily/SKILL.md", import.meta.url),
    "utf8",
  );
  assert.match(skill, /Три разбора за запуск/);
  // Три — потолок, а не норма: добирать третий разбором нормального сайта
  // нельзя.
  assert.match(skill, /Три — потолок, а не норма/);
  assert.match(skill, /один PR[^.]{0,80}на все\s*\n?три разбора/);
  // Смена идёт в своей ветке от main: в общей она однажды встала, потому что её
  // PR утащил бы чужую незаконченную работу.
  assert.match(skill, /checkout -B claude\/razbor-daily origin\/main/);
});
