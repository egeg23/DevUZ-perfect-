import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { renderShiftReport, SHIFT_TITLE } from "@/lib/admin/shift-reports";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("отчёт смены: заголовок по виду смены, текст экранирован для Telegram", () => {
  const text = renderShiftReport({ id: "1", shift: "razbor", body: "Вышло 2 из 3: <third> не нашёлся & это честно", created_at: "2026-09-17T03:30:00Z" });
  assert.equal(text, "<b>Смена разборов</b>\nВышло 2 из 3: &lt;third&gt; не нашёлся &amp; это честно");
  assert.match(renderShiftReport({ id: "2", shift: "unknown", body: "x", created_at: "" }), /^<b>unknown<\/b>/);
  assert.ok(SHIFT_TITLE.experiment);
});

test("свип доносит отчёты смен каждый проход, старые первыми, и помечает только доставленные", () => {
  assert.match(read("app/api/reminders/sweep/route.ts"), /const shifts = await sendShiftReports\(\);/);
  const lib = read("lib/admin/shift-reports.ts");
  assert.match(lib, /\.is\("notified_at", null\)\n\s+\.order\("created_at", \{ ascending: true \}\)/);
  // Недоставленное не помечается: оно уйдёт следующим проходом.
  assert.match(lib, /if \(!ok\) \{\n\s+failed \+= 1;\n\s+continue;\n\s+\}\n\s+await db\.from\("shift_reports"\)\.update/);
});

test("смены знают, куда писать: в shift_reports, а не в Telegram напрямую", () => {
  const skill = read(".claude/skills/razbor-daily/SKILL.md");
  assert.match(skill, /shift_reports/);
  assert.match(skill, /execute_sql/, "как найти инструмент базы, если префикс другой");
});
