/**
 * Разбор резюме: на чём он стоит и на чём стоять не должен.
 *
 * Владелец: «хочу новую вкладку — анализ кандидатов… это для оценки
 * пригодности сотрудника для работы у нас. Доступен руководителям и мне, не
 * менеджерам».
 *
 * Инструмент найма, который опёрся на возраст или пол, — это уже не оценка, а
 * предрассудок с уверенным лицом, и вдобавок отказ по таким основаниям
 * противоречит трудовому кодексу. Поэтому запрет стоит и в промпте, и здесь.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { canSee } from "@/lib/admin/roles";
import { tooThin } from "@/lib/hiring/pdf";
import { cleanReport, forbiddenGrounds, reportProblems } from "@/lib/hiring/resume";

const full = {
  name: "Иванов Иван",
  wants: "менеджер, 9 000 000 сум",
  verdict: "conditional" as const,
  headline: "Сильный сервис, но продаж нет",
  why: "Почти двадцать лет на входящей линии.",
  strengths: "Опыт входящей линии — четырнадцать лет у оператора связи\nУзбекский C2 — рынок закрывается на двух языках",
  stops: "Ни одной цифры — за девятнадцать лет ни плана, ни конверсии",
  facts: "Общий стаж: 19 лет 8 месяцев\nОбразование: ТУИТ, 2023",
  questions: "Назовите свою лучшую цифру — продавец отвечает за секунду",
  trial: "Тридцать холодных контактов и полдня\nТри заявки с рекламы",
};

test("списки приходят чем угодно, а разбираются одинаково", () => {
  // Живые прогоны выдали три формы подряд. Массив объектов развалил ответ на
  // пятнадцать блоков. Массив строк пришёл одной строкой. И только третья
  // попытка дала то, что просили. Разбор принимает все три.
  const asString = cleanReport(full);
  assert.equal(asString?.strengths.length, 2);
  assert.equal(asString?.strengths[0].title, "Опыт входящей линии");
  assert.match(asString?.strengths[0].text ?? "", /четырнадцать лет/);
  assert.equal(asString?.facts[0].label, "Общий стаж");
  assert.equal(asString?.trial.length, 2);

  const asArray = cleanReport({ ...full, strengths: ["Опыт — четырнадцать лет", "Языки — два"] });
  assert.equal(asArray?.strengths.length, 2);

  const asObjects = cleanReport({
    ...full,
    strengths: [{ title: "Опыт", text: "четырнадцать лет" }] as never,
  });
  assert.equal(asObjects?.strengths.length, 1);
  assert.equal(asObjects?.strengths[0].title, "Опыт");
});

test("заголовок не режется по тире в середине фразы", () => {
  // Живой прогон: «Целится на руководителя отдела, вакансия — рядовой
  // менеджер» разрезалось по этому тире, и в заголовок ушла половина мысли.
  // Примета — запятая перед разделителем: в настоящем заголовке её не бывает.
  const comma = "Целится на руководителя отдела, вакансия — рядовой менеджер";
  const whole = cleanReport({ ...full, stops: comma });
  assert.equal(whole?.stops[0].title, comma, "строка разрезана по тире внутри предложения");
  assert.equal(whole?.stops[0].text, "");

  // И длинное начало тоже не заголовок.
  const long = "Целится на руководителя отдела а вакансия у нас совсем другая — рядовой менеджер";
  assert.equal(cleanReport({ ...full, stops: long })?.stops[0].text, "");

  // А чистый заголовок делится как задумано.
  const clean = cleanReport({ ...full, stops: "Ни одной цифры — за девятнадцать лет ни плана, ни конверсии" });
  assert.equal(clean?.stops[0].title, "Ни одной цифры");
  assert.match(clean?.stops[0].text ?? "", /девятнадцать лет/);
});

test("пустые списки — это несделанная работа, а не «нечего сказать»", () => {
  const empty = cleanReport({ ...full, strengths: "", stops: "", facts: "", questions: "", trial: "" });
  assert.ok(empty);
  const codes = reportProblems(empty).map((p) => p.code);
  assert.deepEqual(codes, ["no_strengths", "no_stops", "no_facts", "no_questions", "no_trial"]);

  // Заполненный разбор претензий не вызывает.
  assert.deepEqual(reportProblems(cleanReport(full)!), []);
});

test("возраст, пол и семейное положение отбиваются машиной", () => {
  const base = cleanReport(full)!;
  for (const bad of [
    "Возраст кандидата настораживает",
    "Женщина без опыта холодных продаж",
    "Ей 41 год, это поздний старт",
    "41-летняя соискательница",
    "1985 года рождения",
  ]) {
    assert.ok(forbiddenGrounds({ ...base, headline: bad }).length, `«${bad}» прошло фильтр`);
  }

  // А стаж теми же словами измеряется — и проходить обязан. Первая версия
  // фильтра ловила «\d{2} лет» и отбила живой разбор на «14 лет оператором».
  for (const good of [
    "Четырнадцать лет на одной позиции",
    "14 лет у интернет-провайдера, дальше три места за четыре года",
    "Стаж 19 лет 8 месяцев",
    "Перерыв в стаже: декабрь 2019 — февраль 2022",
  ]) {
    assert.deepEqual(forbiddenGrounds({ ...base, why: good }), [], `«${good}» отбито зря`);
  }
});

test("скан без текста не идёт к модели", () => {
  // Модель, получив пустой текст, напишет «опыт не указан» — то есть соврёт о
  // живом человеке, и нанимающий примет решение по выдумке.
  assert.equal(tooThin("  "), true);
  assert.equal(tooThin("Кабирова Гулмира Рустамовна\nТашкент"), true);
  assert.equal(tooThin(Array.from({ length: 60 }, (_, i) => `слово${i}`).join(" ")), false);
});

test("вкладка закрыта от менеджеров — и меню, и действием", () => {
  // Владелец: «доступен руководителям и мне, не менеджерам».
  assert.equal(canSee("admin", "/admin/candidates"), true);
  assert.equal(canSee("head", "/admin/candidates"), true);
  assert.equal(canSee("manager", "/admin/candidates"), false);

  // Меню такую вкладку менеджеру не покажет, но адрес можно набрать руками, а
  // действие вызвать и вовсе без страницы. Право проверяется в обоих местах.
  const page = readFileSync(new URL("../app/admin/candidates/page.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/admin/candidates/actions.ts", import.meta.url), "utf8");
  assert.match(page, /canSee\(staff\.role, "\/admin\/candidates"\)/, "страница не проверяет право");
  assert.match(actions, /canSee\(staff\.role, "\/admin\/candidates"\)/, "действие не проверяет право");
});

test("файл резюме нигде не сохраняется", () => {
  // Резюме — чужие персональные данные. Для решения нужен разбор, а не PDF на
  // нашем диске.
  const store = readFileSync(new URL("../lib/hiring/store.ts", import.meta.url), "utf8");
  assert.ok(!/storage|upload|\.from\("[a-z_]*files/.test(store), "файл куда-то кладётся");
  const migration = readFileSync(new URL("../supabase/migrations/0037_candidate_reviews.sql", import.meta.url), "utf8");
  assert.ok(!/bytea|file_path|storage/.test(migration), "в таблице завёлся файл");
});
