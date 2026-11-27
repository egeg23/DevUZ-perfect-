/**
 * «Память сервера» — раз в сутки, только владельцу.
 *
 * Владелец, 28.11.2026: «мониторил состояние памяти сервера каждый день…
 * если мы в критической зоне 5% запаса предлагал оптимизацию», «Только мне,
 * не Александру». Осмотр только смотрит: на сервере полтора десятка сайтов.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const flow = readFileSync(new URL("../.github/workflows/vps-memory.yml", import.meta.url), "utf8");
const script = flow.slice(flow.indexOf("script: |"));

test("каждый день и по кнопке", () => {
  assert.match(flow, /schedule:\s*\n\s*- cron: "41 3 \* \* \*"/);
  assert.match(flow, /workflow_dispatch:/);
});

test("критично — 5% запаса, жёлтое — 10%", () => {
  assert.match(script, /\nCRIT=5\n|\n\s*CRIT=5\n/);
  assert.match(script, /WARN=10/);
  assert.match(script, /Безопасная уборка: GitHub → Actions → «Место на сервере»/);
});

test("только смотрит: ничего не удаляет и не перезапускает", () => {
  assert.doesNotMatch(script, /\brm -rf (?!"\$W")/);
  assert.doesNotMatch(script, /prune|docker rmi|truncate|vacuum|systemctl (restart|stop)|docker (restart|stop|kill)|kill -/);
});

test("только владельцу, не руководителю", () => {
  assert.match(script, /role=eq\.admin/);
  assert.doesNotMatch(script, /role=in\.|role=eq\.head|,head\b/);
});

test("в публичный лог — одна строка, ключ базы не в ps", () => {
  assert.match(script, /exec 3>&1 1>\/dev\/null 2>&1/);
  assert.match(script, /-K -/);
  assert.doesNotMatch(script, /curl[^\n]*-H "apikey/);
});

test("выкатку сайта не запускает", () => {
  const deploy = readFileSync(new URL("../.github/workflows/deploy-vps.yml", import.meta.url), "utf8");
  assert.match(deploy, /- "\.github\/workflows\/vps-memory\.yml"/);
});
