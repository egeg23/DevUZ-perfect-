/**
 * Длинное сообщение бота уходит частями, а не пропадает.
 *
 * 19.10.2026 владельцу и руководителю не пришёл отчёт «Сотрудники за день»:
 * 13 человек (двое новых с 18.10) и строка ступеней продажи (с 17.10) дали
 * больше 4096 знаков, Telegram отклонил сообщение целиком, и свип до 23:00
 * пробовал отправить его снова тем же куском.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { staffReportText, type StaffDay } from "@/lib/admin/staff-report";
import { MESSAGE_PART_LIMIT, splitHtmlMessage } from "@/lib/qualify/telegram";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const NAMES = ["Александр", "Ибрагим", "Шахзода", "Дильноза", "Мадина", "Жасур", "Азиз", "Нодира", "Тимур", "Сардор", "Камила", "Бехзод", "Руслан"];

function person(i: number): StaffDay {
  const active = i % 3 !== 2;
  return {
    name: NAMES[i],
    role: i === 12 ? "head" : "manager",
    report: { name: NAMES[i], target: 5, done: active ? 3 : 0, skipped: active ? 1 : 0, short: active ? 0 : 5, stream: active ? i % 4 : 0, touches: active ? 6 + i : 0 },
    panel: active
      ? { views: 20 + i * 3, top: ["Касания", "Лиды"], minutes: 40 + i * 7, firstAt: "2026-10-19T05:10:00Z", lastAt: "2026-10-19T12:40:00Z" }
      : { views: 0, top: [], minutes: 0, firstAt: null, lastAt: null },
    actions: active ? 10 + i : 0,
    leadsTaken: active ? i % 2 : 0,
    offersBurned: i % 4 === 0 ? 2 : 0,
    staleLeads: 3 + i * 4,
    sales: { day: { shown: i % 5 === 0 ? 1 : 0, priced: 0, paid: 0 }, week: { shown: i % 5 === 0 ? 1 : 0, priced: 0, paid: 0 } },
  };
}

test("короткое сообщение не трогаем", () => {
  assert.deepEqual(splitHtmlMessage("<b>Привет</b>\nстрока"), ["<b>Привет</b>\nстрока"]);
});

test("отчёт на 13 человек — частями не длиннее предела, ни строки не потеряно", () => {
  const text = staffReportText("2026-10-19", Array.from({ length: 13 }, (_, i) => person(i)));
  assert.ok(text.length > 4096, "отчёт короче предела — тест ничего не проверяет");
  const parts = splitHtmlMessage(text);
  assert.ok(parts.length >= 2);
  for (const part of parts) assert.ok(part.length <= MESSAGE_PART_LIMIT, `часть ${part.length} знаков`);
  // Строки те же и в том же порядке: пустые на стыке частей не в счёт.
  const lines = (s: string) => s.split("\n").filter((l) => l.trim());
  assert.deepEqual(parts.flatMap(lines), lines(text));
  // Человек не разрезан: следующая часть начинается не со строки-продолжения.
  for (const part of parts.slice(1)) assert.doesNotMatch(part, /^[ \t]/);
});

test("тег, который тянется через строки, не разрезается", () => {
  const pre = `<pre>${Array.from({ length: 120 }, (_, i) => `строка кода ${i}`).join("\n")}</pre>`;
  const text = `${"шапка\n".repeat(10)}${pre}\nхвост`;
  for (const part of splitHtmlMessage(text, 1000)) {
    const open = (part.match(/<pre>/g) ?? []).length;
    const close = (part.match(/<\/pre>/g) ?? []).length;
    assert.equal(open, close, "тег <pre> разрезан между частями");
  }
});

test("sendMessage шлёт частями и не повторяет ушедшее при сбое хвоста", () => {
  const src = read("lib/qualify/telegram.ts");
  const body = src.slice(src.indexOf("export async function sendMessage("), src.indexOf("export const MESSAGE_PART_LIMIT"));
  assert.match(body, /const \[first, \.\.\.rest\] = splitHtmlMessage\(text\);/);
  assert.match(body, /if \(!\(await send\(first\)\)\) return false;/);
  assert.match(body, /for \(const part of rest\)/);
  // Отчёт по сотрудникам идёт через sendMessage — значит, тоже частями.
  assert.match(read("lib/admin/staff-report-store.ts"), /await sendMessage\(Number\(reader\.telegram_user_id\), text\)/);
});
