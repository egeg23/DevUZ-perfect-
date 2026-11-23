import { test } from "node:test";
import assert from "node:assert/strict";

import { CF_OIDC, CF_TRANSLATE_UNTIL, cfProblem, cfRequestOf, cfToken, cfTranslateOpen } from "@/lib/czechfarm/translate";

test("перевод CZECHFARM нашим ключом: два месяца, до 19.01.2027, дальше сервер сам отказывает", () => {
  /* Владелец, 19.11.2026: «Бери наш ключ пока что, через 2 месяца убери его. 2 месяца пусть пользуются нашими хайку». */
  assert.equal(CF_TRANSLATE_UNTIL, "2027-01-19T00:00:00+05:00");
  assert.equal(cfTranslateOpen(Date.parse("2026-11-19T12:00:00+05:00")), true);
  assert.equal(cfTranslateOpen(Date.parse("2027-01-18T23:59:00+05:00")), true);
  assert.equal(cfTranslateOpen(Date.parse("2027-01-19T00:00:00+05:00")), false);
  /* Пропуск — только задаче выкатки CZECHFARM с main. */
  assert.match(CF_OIDC.workflowRef, /czechfarm-app\.yml@refs\/heads\/main$/);
  assert.equal(cfToken(""), null);
  assert.equal(cfToken("a"), cfToken("a"));
  assert.notEqual(cfToken("a"), cfToken("b"));
});

test("перевод CZECHFARM: запрос панели проверяется, перевод — алфавит, числа, без тире", () => {
  assert.equal(cfRequestOf({ from: "xx", to: ["uz"], items: { a: "x" } }), "from");
  assert.equal(cfRequestOf({ from: "ru", to: ["ru"], items: { a: "x" } }), "to");
  assert.equal(cfRequestOf({ from: "ru", to: ["uz"], items: { a: "  " } }), "empty");
  assert.equal(cfRequestOf({ from: "ru", to: ["uz"], items: { "a b": "x" } }), "items");
  assert.equal(cfRequestOf({ from: "ru", to: ["uz"], items: { a: "x".repeat(17_000) } }), "too_big");
  assert.deepEqual(cfRequestOf({ from: "ru", to: ["uz", "en", "zz"], items: { title: " Привет " } }), { from: "ru", to: ["uz", "en"], items: { title: "Привет" } });
  assert.equal(cfProblem("Таблетки, 10 мг", "Tabletkalar, 10 mg", "uz"), null);
  assert.equal(cfProblem("Таблетки, 10 мг", "Таблеткалар, 10 мг", "uz"), "кириллица");
  assert.equal(cfProblem("Таблетки, 10 мг", "Tablets, 20 mg", "en"), "числа");
  assert.equal(cfProblem("Таблетки", "Tablets", "ar"), "не по-арабски");
  assert.equal(cfProblem("Таблетки", "أقراص", "ar"), null);
  assert.equal(cfProblem("Качество и доверие", "Quality — trust", "en"), "тире");
});

test("czechfarm: столбцы таблицы партнёров — Haiku видит только заголовки и несколько строк, ответ проверяет код", async () => {
  const { cfColumnsRequestOf, cfMapOf, CF_SAMPLE_MAX } = await import("@/lib/czechfarm/columns");
  assert.equal(cfColumnsRequestOf({}), "headers");
  assert.equal(cfColumnsRequestOf({ headers: Array(41).fill("x") }), "headers");
  const req = cfColumnsRequestOf({ headers: ["ФИО", "Тел"], sample: Array(20).fill(["Али", "+998", "лишнее"]) });
  assert.ok(typeof req !== "string");
  if (typeof req !== "string") { assert.equal(req.sample.length, CF_SAMPLE_MAX); assert.deepEqual(req.sample[0], ["Али", "+998"]); }
  /* Чужой номер столбца, повтор и не число — «нет». */
  assert.deepEqual(cfMapOf({ name: 0, phone: 1, org: 1, email: 7, tg: "x" }, 2), { name: 0, org: 1, phone: -1, email: -1, country: -1, city: -1, tg: -1, group: -1, note: -1 });
});
