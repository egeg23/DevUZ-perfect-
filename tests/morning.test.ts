/**
 * «Доброе утро» сотрудникам по имени, каждый день в 09:00 по Ташкенту.
 *
 * Владелец, 13.10.2026: «Каждое утро в 09:00 бот должен желать хорошего дня
 * сотрудникам поименно».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  MORNING_ROLES,
  firstName,
  morningGreeting,
  morningKey,
  morningWindow,
} from "@/lib/admin/morning";
import { NOTICES, kindsFor } from "@/lib/admin/notify-prefs";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// 13.10.2026 — вторник. Ташкент = UTC+5.
const at = (iso: string) => new Date(iso);

test("с 09:00 и до полудня по Ташкенту, каждый день — выходные тоже", () => {
  assert.equal(morningWindow(at("2026-10-13T03:59:00Z")), false, "08:59");
  assert.equal(morningWindow(at("2026-10-13T04:00:00Z")), true, "09:00");
  assert.equal(morningWindow(at("2026-10-13T06:59:00Z")), true, "11:59 — дошлём, если в 09:00 молчала связь");
  assert.equal(morningWindow(at("2026-10-13T07:00:00Z")), false, "12:00 — уже не утро");
  assert.equal(morningWindow(at("2026-10-18T04:05:00Z")), true, "воскресенье");
});

test("по имени: первое слово из «Команды», без имени — просто приветствие", () => {
  assert.equal(firstName("Дина"), "Дина");
  assert.equal(firstName("  Александр Иванов "), "Александр");
  assert.equal(firstName(""), null);
  assert.equal(firstName(null), null);

  const tuesday = at("2026-10-13T04:00:00Z");
  assert.match(morningGreeting("Дина", "ru", tuesday), /^Доброе утро, Дина! /);
  assert.match(morningGreeting(null, "ru", tuesday), /^Доброе утро! /);
  assert.match(morningGreeting("Istam", "uz", tuesday), /^Xayrli tong, Istam! /);
  assert.match(morningGreeting("Ewa", "pl", tuesday), /^Dzień dobry, Ewa! /);
});

test("понедельник, пятница и выходные — свои слова; в будни не одно и то же", () => {
  assert.match(morningGreeting("Дина", "ru", at("2026-10-12T04:00:00Z")), /Новая неделя/);
  assert.match(morningGreeting("Дина", "ru", at("2026-10-16T04:00:00Z")), /Пятница/);
  assert.match(morningGreeting("Дина", "ru", at("2026-10-17T04:00:00Z")), /субботы/);
  assert.match(morningGreeting("Дина", "ru", at("2026-10-18T04:00:00Z")), /воскресенья/);
  const tue = morningGreeting("Дина", "ru", at("2026-10-13T04:00:00Z"));
  const wed = morningGreeting("Дина", "ru", at("2026-10-14T04:00:00Z"));
  assert.notEqual(tue, wed);
  // Узбекский и польский — без кириллицы, в каждый день недели.
  for (let d = 12; d <= 18; d += 1) {
    const now = at(`2026-10-${d}T04:00:00Z`);
    assert.doesNotMatch(morningGreeting("Istam", "uz", now), /[А-Яа-яЁё]/);
    assert.doesNotMatch(morningGreeting("Ewa", "pl", now), /[А-Яа-яЁё]/);
  }
});

test("один раз в день на человека: ключ — дата по Ташкенту", () => {
  // 23:30 UTC 12.10 — это уже 04:30 13.10 по Ташкенту.
  assert.equal(morningKey(at("2026-10-12T23:30:00Z")), "morning:2026-10-13");
  assert.equal(morningKey(at("2026-10-13T06:00:00Z")), "morning:2026-10-13");
  const store = read("lib/admin/morning-store.ts");
  assert.match(store, /\.from\("team_news_sent"\)\s*\.upsert\(\{ news_id: key, staff_id: staffId \}, \{ onConflict: "news_id,staff_id", ignoreDuplicates: true \}\)/);
  // Не дошло — отметка снимается, следующий проход попробует снова.
  assert.match(store, /else await db\.from\("team_news_sent"\)\.delete\(\)\.eq\("news_id", key\)\.eq\("staff_id", row\.id\)/);
  // Имя экранируется: сообщения бота идут с разметкой.
  assert.match(store, /morningGreeting\(name \? esc\(name\) : null, locale, now\)/);
});

test("сотрудникам, не владельцу; галочка в «Команде» выключает", () => {
  assert.deepEqual([...MORNING_ROLES].sort(), ["head", "manager"]);
  assert.ok(kindsFor("manager").includes("morning"));
  assert.ok(kindsFor("head").includes("morning"));
  assert.ok(!kindsFor("admin").includes("morning"), "владельцу не пишем — и галочки у него нет");
  assert.equal(NOTICES.morning.title.ru, "Доброе утро в 09:00");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendMorningGreetings\(new Date\(\)\)/);
});
