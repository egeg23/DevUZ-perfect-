/**
 * Владелец, 23.10.2026: «Каждый день мне и Александру выводи дополнительную
 * статистику коротко: кто > сколько запросов сделал в боте о помощи».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HELPER_STATS_HOUR, askKey, helperStatsText, statsNewsKey } from "@/lib/admin/helper-stats";
import { QUIET_FROM_HOUR } from "@/lib/admin/tasks";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("сводка: «Имя — N» по убыванию и итог, коротко", () => {
  const text = helperStatsText("2026-10-23", [
    { name: "Давлат", count: 3 },
    { name: "Дина", count: 0 },
    { name: "Александр", count: 5 },
  ]);
  assert.equal(text, "🤖 <b>Помощник в боте · 23.10.2026</b>\nАлександр — 5\nДавлат — 3\nВсего: 8");
  assert.match(helperStatsText("2026-10-23", []), /Вопросов не было/);
  assert.equal(askKey("2026-10-23", "s1"), "helper-asks:2026-10-23:s1");
  assert.equal(statsNewsKey("2026-10-23"), "helper-stats:2026-10-23");
  assert.ok(HELPER_STATS_HOUR < QUIET_FROM_HOUR, "сводка до ночной тишины");
});

test("счёт пишется на каждый вопрос, сводка — владельцу и руководителю раз в день", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  const helper = hook.slice(hook.indexOf("async function handleStaffText("));
  assert.ok(helper.indexOf("noteHelperAsk(staff.id)") > helper.indexOf("answerStaff("));
  const store = read("lib/admin/helper-stats-store.ts");
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/);
  assert.match(store, /"reports"\)/);
  assert.match(store, /hour >= QUIET_FROM_HOUR/);
  // Не журнал: он считает «действия» в отчётах.
  assert.doesNotMatch(store, /audit_events|record\(/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /sendHelperStats\(new Date\(\)\)/);
});
