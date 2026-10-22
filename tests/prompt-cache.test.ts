/**
 * Кэш промпта первички — на общей части, а не на приписке разговора.
 *
 * 22–23.10.2026 переписка касаний на дорогой модели стоила $6,19 за сутки,
 * из них $5,74 — запись кэша, который ни разу не прочитали: приписка с
 * данными клиента шла в одном блоке с общим промптом, и у каждого
 * разговора «одинаковое начало» было своим.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildSystemPrompt } from "@/lib/qualify/prompt";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("кэш — на общем промпте, приписка разговора — отдельным блоком без кэша", () => {
  const engine = read("lib/qualify/engine.ts");
  assert.match(engine, /const baseText = buildSystemPrompt\(locale\);/);
  assert.match(
    engine,
    /system: \[\s*\{\s*type: "text" as const,\s*text: baseText,\s*cache_control: \{ type: "ephemeral" as const \},\s*\},\s*\.\.\.\(noteText \? \[\{ type: "text" as const, text: noteText \}\] : \[\]\),\s*\]/,
  );
  assert.doesNotMatch(engine, /systemText/);
});

test("общий промпт одинаков от вызова к вызову — иначе кэш не читается", () => {
  for (const locale of ["ru", "uz", "en"] as const) {
    assert.equal(buildSystemPrompt(locale), buildSystemPrompt(locale));
  }
  assert.doesNotMatch(read("lib/qualify/prompt.ts"), /new Date\(|Date\.now\(|Math\.random\(/);
});
