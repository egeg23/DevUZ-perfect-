/**
 * «Место на сервере» — осмотр и безопасная уборка диска по кнопке.
 *
 * 13.10.2026 выкатка упала с «No space left on device». На сервере живут
 * ещё полтора десятка сайтов: уборка не должна трогать чужое и образ
 * devuz:previous, на который откатывается выкатка.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const flow = readFileSync(new URL("../.github/workflows/vps-disk.yml", import.meta.url), "utf8");
const script = flow.slice(flow.indexOf("script: |"));

test("по умолчанию только смотрит", () => {
  assert.match(flow, /clean:\s*\n\s*description: "Убрать безопасное \(иначе — только посмотреть\)"\s*\n\s*type: boolean\s*\n\s*default: false/);
  assert.ok(script.indexOf('if [ "$CLEAN" != "true" ]; then') < script.indexOf("docker builder prune"), "уборка раньше проверки «только посмотреть»");
});

test("не трогает образы с именем, тома и чужие сайты", () => {
  // image prune -a и system prune -a снесли бы devuz:previous и образы соседей.
  assert.doesNotMatch(script, /image prune\s+-a|image prune -af|system prune/);
  assert.doesNotMatch(script, /volume prune|rmi /);
  assert.match(script, /docker image prune -f/);
  // Удаляется только кэш Next в каталоге devuz, не каталог целиком.
  const removals = script.match(/rm -rf [^\n]+/g) ?? [];
  assert.deepEqual(removals, ['rm -rf "$APP_DIR/.next/cache" && echo "  кэш Next: убран"']);
});
