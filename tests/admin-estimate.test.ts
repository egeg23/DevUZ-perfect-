import assert from "node:assert/strict";
import { test } from "node:test";

import { deflateRawSync } from "node:zlib";

import { estimateTotal, isParsable, isReadable, num, parseEstimate } from "@/lib/admin/estimate";
import { xlsxRows } from "@/lib/admin/xlsx";

/** Самый простой zip: то, из чего состоит xlsx. CRC не считаем — читатель его не проверяет. */
function zip(files: Record<string, string>): Uint8Array {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, "utf8");
    const data = deflateRawSync(Buffer.from(text, "utf8"));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, dir, end]));
}

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

test("неизвестный формат не притворяется разобранным, а честно отказывается", () => {
  // Молча вернуть пустой список нельзя: менеджер решит, что смета пустая,
  // и отправит договор без неё. xlsx и PDF сюда не попадают сырыми — их
  // сначала превращают в строки (lib/admin/estimate-file.ts).
  assert.equal(isParsable("smeta.docx"), false);
  assert.equal(isReadable("smeta.xlsx"), true);
  assert.equal(isReadable("smeta.pdf"), true);
  const result = parseEstimate("любой текст", "smeta.docx");
  assert.ok(!result.ok);
  assert.equal(result.why, "unsupported");
  assert.match(result.hint, /CSV/);
  assert.match(result.hint, /руками/, "не сказано, что делать дальше");
});

test("шапка со «Суммой»: колонки берутся по названиям, а не по месту", () => {
  // Почти любая смета из Excel кончается колонкой «Сумма». Без шапки она
  // читалась как «количество = цена, цена = сумма», и итог рос в разы.
  const text = "№;Наименование;Ед.;Кол-во;Цена;Сумма\n1;Дизайн;шт;2;500;1000\n2;Вёрстка;стр;6;150;900\n;Итого;;;;1900";
  const result = parseEstimate(text, "smeta.csv");
  assert.ok(result.ok);
  assert.deepEqual(
    result.items.map((i) => [i.title, i.unit, i.qty, i.price, i.total]),
    [
      ["Дизайн", "шт", 2, 500, 1000],
      ["Вёрстка", "стр", 6, 150, 900],
    ],
  );
  assert.equal(estimateTotal(result.items), 1900);

  // Цены нет, есть сумма — цена за единицу выводится из неё.
  const onlyTotal = parseEstimate("Работа\tКол-во\tСумма\nИнтеграция\t2\t800", "x.tsv");
  assert.ok(onlyTotal.ok && onlyTotal.items[0].price === 400 && onlyTotal.items[0].total === 800);
});

test("строки вперемешку: из Excel через табуляцию и руками через «;»", () => {
  const result = parseEstimate("Дизайн главной\t1\t900\nВёрстка страниц; 6; 150\nИтого; ; 1800", "rows.tsv");
  assert.ok(result.ok);
  assert.deepEqual(result.items.map((i) => i.total), [900, 900]);
});

test("Excel: первый лист читается в строки — общие и встроенные строки, числа", () => {
  const sheet =
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>2</v></c><c r="C2"><v>450.5</v></c></row>' +
    '<row r="3"><c r="A3" t="inlineStr"><is><t>SEO &amp; аналитика</t></is></c><c r="C3"><v>300</v></c></row>' +
    "</sheetData></worksheet>";
  const strings =
    "<sst><si><t>Наименование</t></si><si><t>Кол-во</t></si><si><t>Цена</t></si>" +
    "<si><r><t>Дизайн </t></r><r><t>главной</t></r></si></sst>";
  const bytes = zip({ "xl/worksheets/sheet1.xml": sheet, "xl/sharedStrings.xml": strings });

  assert.deepEqual(xlsxRows(bytes), [
    ["Наименование", "Кол-во", "Цена"],
    ["Дизайн главной", "2", "450.5"],
    ["SEO & аналитика", "", "300"],
  ]);
  const parsed = parseEstimate(xlsxRows(bytes).map((r) => r.join("\t")).join("\n"), "estimate.tsv");
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.items.map((i) => i.total), [901, 300]);
});

test("не zip вместо xlsx — ошибка, а не пустая смета", () => {
  assert.throws(() => xlsxRows(new TextEncoder().encode("это не excel")));
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
