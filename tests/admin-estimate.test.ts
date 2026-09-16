import assert from "node:assert/strict";
import { test } from "node:test";

import { estimateTotal, isParsable, num, parseEstimate } from "@/lib/admin/estimate";

/**
 * Разбор сметы.
 *
 * Смета приходит выгрузкой из Excel с русской локалью, и именно там живут
 * все подвохи: точка с запятой вместо запятой, пробелы в тысячах, запятая в
 * дробной части. Ошибка здесь не портит вёрстку — она меняет сумму
 * договора.
 */

test("числа из русского Excel читаются, а не превращаются в ноль", () => {
  // Number("1 200,50") даёт NaN, и сумма договора молча уехала бы в ноль.
  assert.equal(num("1 200,50"), 1200.5);
  assert.equal(num("1 200,50"), 1200.5, "неразрывный пробел");
  assert.equal(num("2 500"), 2500);
  assert.equal(num("1.200,50"), 1200.5, "точка как разделитель тысяч");
  assert.equal(num("$450"), 450);
  assert.equal(num("450.00"), 450);
  assert.equal(num("—"), 0);
  assert.equal(num(""), 0);
});

test("точка с запятой, запятая и табуляция — все три разделителя", () => {
  const rows = "Дизайн;шт;2;500\nВёрстка;шт;1;800";
  const semi = parseEstimate(rows, "smeta.csv");
  assert.ok(semi.ok);
  assert.equal(semi.items.length, 2);
  assert.equal(semi.items[0].total, 1000);

  const tabs = parseEstimate("Дизайн\tшт\t2\t500", "smeta.tsv");
  assert.ok(tabs.ok && tabs.items[0].total === 1000);

  const comma = parseEstimate("Дизайн,шт,2,500", "smeta.csv");
  assert.ok(comma.ok && comma.items[0].total === 1000);
});

test("заголовок таблицы не становится позицией сметы", () => {
  const text = "Наименование работ;Ед;Кол-во;Цена\nДизайн;шт;2;500";
  const result = parseEstimate(text, "smeta.csv");
  assert.ok(result.ok);
  assert.equal(result.items.length, 1, "заголовок попал в смету");
  assert.equal(result.items[0].title, "Дизайн");
});

test("сумма пересчитывается нами, а не берётся из файла", () => {
  // В файле итог могли посчитать руками и ошибиться — спорить будут с нами.
  const result = parseEstimate("Дизайн;шт;3;500;9999", "smeta.csv");
  assert.ok(result.ok);
  // Последние две числовые — количество и цена; лишняя колонка не ломает.
  assert.equal(result.items[0].total, result.items[0].qty * result.items[0].price);
});

test("строки без цены пропускаются, а не дают нулевые позиции", () => {
  // «Итого» и «Скидка» с нулём — заполненные строки с заголовком и
  // разделителями, они доходят до проверки цены. Первая версия теста брала
  // строки без разделителей, которые отсеивались раньше, и проверку цены
  // не трогала вовсе: мутация, снявшая её, тест не роняла.
  const text = "Дизайн;шт;2;500\nИтого;;;0\nПримечание: сроки уточняются\n;;;\nВёрстка;шт;1;800";
  const result = parseEstimate(text, "smeta.csv");
  assert.ok(result.ok);
  assert.equal(result.items.length, 2);
  assert.equal(estimateTotal(result.items), 1800);
});

test("кавычки с разделителем внутри не разрывают название", () => {
  const text = '"Дизайн, включая мобильную версию";шт;1;900';
  const result = parseEstimate(text, "smeta.csv");
  assert.ok(result.ok);
  assert.equal(result.items[0].title, "Дизайн, включая мобильную версию");
  assert.equal(result.items[0].price, 900);
});

test("xlsx не притворяется разобранным, а честно отказывается", () => {
  // Молча вернуть пустой список нельзя: менеджер решит, что смета пустая,
  // и отправит договор без неё.
  assert.equal(isParsable("smeta.xlsx"), false);
  const result = parseEstimate("любой текст", "smeta.xlsx");
  assert.ok(!result.ok);
  assert.equal(result.why, "unsupported");
  assert.match(result.hint, /CSV/);
  assert.match(result.hint, /руками/, "не сказано, что делать дальше");
});

test("пустой и бесформенный файл различаются подсказкой", () => {
  const empty = parseEstimate("\n\n  \n", "smeta.csv");
  assert.ok(!empty.ok && empty.why === "empty");

  const shapeless = parseEstimate("просто текст без цифр\nи ещё строка", "smeta.csv");
  assert.ok(!shapeless.ok && shapeless.why === "shape");
  assert.match(shapeless.hint, /название/, "не сказано, какие колонки ждём");
});

test("итог сметы складывается без накопления копеек", () => {
  const items = [
    { title: "a", unit: "", qty: 3, price: 33.33, total: 99.99 },
    { title: "b", unit: "", qty: 1, price: 0.01, total: 0.01 },
  ];
  assert.equal(estimateTotal(items), 100);
});
