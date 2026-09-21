import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { AuditReport } from "@/lib/audit/checks";
import {
  LOOK_AT,
  OFF_LIMITS,
  PER_SHIFT,
  SHIFT_AT,
  articleProblems,
  cityFrom,
  derivable,
  factPool,
  numbersIn,
  nicheByKey,
  shiftDue,
  unsupportedNumbers,
} from "@/lib/razbor/shift";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// 08:03 по Ташкенту = 03:03 UTC.
const before = new Date("2026-09-18T02:50:00Z");
const after = new Date("2026-09-18T03:10:00Z");

test("смена работает раз в сутки и не раньше своего часа", () => {
  assert.equal(shiftDue(before, null), false, "запустилась раньше времени");
  assert.equal(shiftDue(after, null), true);

  // Свип ходит каждые пять минут: без отметки о прошлом запуске смена
  // повторилась бы триста раз за сутки.
  assert.equal(shiftDue(after, "2026-09-18T03:05:00Z"), false, "запустилась второй раз за день");
  // Вчерашняя отметка не держит сегодняшнюю смену.
  assert.equal(shiftDue(after, "2026-09-17T03:05:00Z"), true);
  assert.equal(SHIFT_AT, "08:03");
});

test("день смены считается по Ташкенту, а не по серверным часам", () => {
  // 2026-09-18T20:00Z — в Ташкенте уже 19-е, час ночи. Смена 19-го ещё не
  // начиналась, но и запускаться в час ночи ей рано.
  assert.equal(shiftDue(new Date("2026-09-18T20:00:00Z"), "2026-09-18T03:05:00Z"), false);
});

test("город берётся со страницы, а не ставится наугад", () => {
  assert.equal(cityFrom("Мебель на заказ в Ташкенте, доставка")?.key, "tashkent");
  assert.equal(cityFrom("Toshkentda mebel")?.key, "tashkent");
  assert.equal(cityFrom("Наш салон в Самарканде")?.key, "samarkand");
  assert.equal(cityFrom("г. БУХАРА, ул. Навои")?.key, "bukhara");
  // Не нашли — сайт пропускаем. Запрос «сайт для мебельного салона» без
  // города не ищет никто, а поставить город наугад значит соврать в
  // заголовке.
  assert.equal(cityFrom("Мебель на заказ, доставка по стране"), null);
});

test("медицину не разбираем, и это не забывается в проверке ниши", () => {
  assert.ok(OFF_LIMITS.has("stomatologiya"));
  assert.ok(OFF_LIMITS.has("medcentr"));
  assert.ok(!OFF_LIMITS.has("mebel"));
  assert.ok(nicheByKey("mebel"));
  assert.equal(nicheByKey("такой-ниши-нет"), null);
  assert.equal(nicheByKey(null), null);

  const run = read("lib/razbor/shift-run.ts");
  // Проверка идёт и по ключу, и по словам. Ключ придуманной ниши может
  // выглядеть безобидно — `finansy`, — а подпись быть «микрокредитная
  // организация»; до появления придуманных ниш хватало одного списка
  // ключей, потому что банк или аптеку классификатор просто не узнавал.
  assert.match(
    run,
    /if \(OFF_LIMITS\.has\(niche\.key\) \|\| forbiddenNiche\(niche\)\) return "нишу не разбираем";/,
  );
});

const REPORT = {
  url: "https://mebel-tashkent.uz/",
  score: 41,
  findings: [
    { code: "no_viewport", severity: "critical", title: "Нет мета-тега viewport", impact: "На телефоне сайт открывается в масштабе большого экрана", fix: "Добавить viewport, полчаса" },
    { code: "slow_ttfb", severity: "major", title: "Сервер отвечает медленно", impact: "Посетитель ждёт", fix: "Перенести хостинг, два дня" },
    { code: "no_form", severity: "major", title: "Нет формы заявки", impact: "Написать некуда", fix: "Поставить форму, день" },
  ],
  facts: { https: true, ttfbMs: 1261, platform: "WordPress", isShop: false, certDaysLeft: 60, niche: "mebel" },
} as unknown as AuditReport;

const GOOD = {
  title: "Сайт мебельного салона в Ташкенте теряет заявки на телефоне",
  description: "Разбор сайта мебельного салона",
  label: "мебельный салон в Ташкенте, сайт на WordPress",
  query: "сайт для мебельного салона в Ташкенте",
  intro: ["Салон продаёт кухни на заказ.", "Сайт сделан давно."],
  findings: [
    { title: "На телефоне страница открывается размером с монитор", impact: "Половина посетителей уходит", fix: "Переверстать под телефон, два дня" },
    { title: "Первый экран ждёт примерно 1,3 секунды", impact: "Человек успевает передумать", fix: "Перенести хостинг, два дня" },
    { title: "Оставить заявку негде", impact: "Звонить готов не каждый", fix: "Поставить форму, день" },
  ],
  outcome: ["Заявки перестанут теряться"],
  price: "от 1500, 3–6 недель",
};

test("выдуманное число в разборе не публикуется", () => {
  assert.deepEqual(articleProblems({ article: GOOD, report: REPORT, title: null }), []);

  const lying = { ...GOOD, intro: ["Сервер отвечает за 0,4 секунды."] };
  assert.deepEqual(
    articleProblems({ article: lying, report: REPORT, title: null }).map((p) => p.code),
    ["invented"],
  );
});

test("округлять можно, врать при округлении — нет", () => {
  // Правило из razbor-master дословно: «1261 мс — это примерно 1,3 секунды,
  // а не примерно 1,2». Проверка, запрещающая округление вовсе, заворачивала
  // бы каждую честную статью, и смена молча выдавала бы ноль.
  assert.deepEqual(unsupportedNumbers("примерно 1,3 секунды", "1261"), []);
  assert.deepEqual(unsupportedNumbers("примерно 1,26 секунды", "1261"), []);
  assert.deepEqual(unsupportedNumbers("примерно 1 секунду", "1261"), []);
  assert.deepEqual(unsupportedNumbers("примерно 1,2 секунды", "1261"), ["1,2"]);
  assert.deepEqual(unsupportedNumbers("около 0,4 секунды", "1261"), ["0,4"]);

  assert.ok(derivable(1.3, [1261]));
  assert.ok(!derivable(1.2, [1261]));
  assert.deepEqual(numbersIn("за 1,3 с и 1261 мс, и снова 1,3"), ["1,3", "1261"]);
});

test("процентов прироста разбор не называет никогда", () => {
  const boasting = { ...GOOD, outcome: ["Конверсия вырастет на 30 %"] };
  const codes = articleProblems({ article: boasting, report: REPORT, title: null }).map((p) => p.code);
  assert.ok(codes.includes("percent"));
});

test("компания в разборе не называется — ни доменом, ни из заголовка", () => {
  const named = { ...GOOD, intro: ["Салон Mebel Tashkent работает с 2010 года."] };
  const codes = articleProblems({ article: named, report: REPORT, title: "Mebel Tashkent — кухни" }).map((p) => p.code);
  assert.ok(codes.includes("named"), "имя компании из домена прошло");
});

test("дословно скопированные строки аудита не проходят", () => {
  // На одной статье незаметно; на второй раздел превращается в набор
  // одинаковых страниц.
  const copied = {
    ...GOOD,
    findings: [{ title: "Нет мета-тега viewport", impact: "x", fix: "y" }, ...GOOD.findings],
  };
  const codes = articleProblems({ article: copied, report: REPORT, title: null }).map((p) => p.code);
  assert.ok(codes.includes("copied"));
});

test("разбор из двух находок — заметка, а не разбор", () => {
  const thin = { ...GOOD, findings: GOOD.findings.slice(0, 2) };
  const codes = articleProblems({ article: thin, report: REPORT, title: null }).map((p) => p.code);
  assert.ok(codes.includes("thin"));
});

test("право назвать число даёт аудит и прайс, а не память модели", () => {
  const pool = factPool(REPORT);
  assert.match(pool, /1261/, "время ответа из аудита");
  assert.match(pool, /41/, "балл из аудита");
  // Цена — из того же файла, что и сайт: клиент мог посчитать её сам.
  assert.match(pool, /\d{3,}/);
});

test("смена не берёт сайты, которым уже написали", () => {
  // Человек, получивший от нас письмо, узнает свой сайт в разборе — и
  // касание превращается в публичную критику того, с кем мы знакомимся.
  const run = read("lib/razbor/shift-run.ts");
  assert.match(run, /\.in\("status", \["new", "skipped"\]\)/);
  assert.doesNotMatch(run, /"sent"|"contacting"/);
});

test("смена отчитывается при любом исходе, включая пустой", () => {
  const run = read("lib/razbor/shift-run.ts");
  // Пустая смена со строкой — честный результат. Пустая смена без строки
  // неотличима от поломки, и за это уже заплачено тремя днями тишины.
  assert.match(run, /await report\(run\);/);
  assert.match(run, /Ни одного разбора\./);
  assert.match(run, /shift: "razbor"/);
  assert.ok(PER_SHIFT === 3 && LOOK_AT >= PER_SHIFT);
});

test("статья, не прошедшая проверку, не становится черновиком", () => {
  const run = read("lib/razbor/shift-run.ts");
  const check = run.indexOf("const problems = articleProblems(");
  // Строка отказа живёт в константе CHECK_FAILED — по ней же вторая
  // попытка отличает провал проверки от «модель не собрала статью».
  const ret = run.indexOf("if (problems.length) return");
  const save = run.indexOf("await saveDraft(");
  assert.ok(check > 0 && ret > check, "проверка ни на что не влияет");
  assert.ok(save < check || run.indexOf("if (typeof ru === \"string\") return ru;") < save, "черновик ложится до проверки");
});

test("свип зовёт смену, а смена сама решает, пора ли", () => {
  const route = read("app/api/reminders/sweep/route.ts");
  assert.match(route, /const razbor = await runRazborShift\(new Date\(\)\);/);
  // Расписание живёт в смене, а не в свипе: свип ходит каждые пять минут и
  // про Ташкент ничего не знает.
  assert.doesNotMatch(route, /SHIFT_AT|08:03/);
});

/**
 * Ниша ищется по всему обходу, а не по одной главной.
 *
 * 21 сентября смена потеряла шесть сайтов из двенадцати на «ниша не
 * определилась», а по базе из пятнадцати касаний ниша нашлась у четырёх.
 * Причина видна на mcbro.uz: главная называется «Магазин Apple в
 * Ташкенте», а слово «интернет-магазин» стоит в заголовках каталога —
 * то есть на страницах, которые обход и так проходит.
 */
test("ниша определяется по заголовкам пройденных страниц", async () => {
  const { classify } = await import("@/lib/razbor/classify");

  const home = "<html><title>Магазин Apple в Ташкенте</title><body>Смартфоны и ноутбуки</body></html>";
  assert.equal(classify({ url: "https://mcbro.uz", html: home, title: "Магазин Apple в Ташкенте" }), null);

  const withHints = classify({
    url: "https://mcbro.uz",
    html: home,
    title: "Магазин Apple в Ташкенте",
    hints: ["Каталог электроники — смартфоны и ноутбуки в интернет-магазине Mcbro.uz"],
  });
  assert.equal(withHints?.niche, "internet-magazin", "обход не помог определить нишу");
});

test("смена ходит тем же обходом, что и касание", () => {
  const shift = read("lib/razbor/shift-run.ts");
  // Быстрый разбор одной главной здесь стоил половины сайтов: ниша
  // живёт на внутренних страницах, а находок с главной хватает не всегда.
  assert.match(shift, /auditDeep\(/, "смена снова смотрит только главную");
  assert.doesNotMatch(shift, /await enrich\(await probe\(/, "остался второй проход по сайту");
});
