import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Менеджер, 13.10.2026: «Периодически выходит „This page couldn't load“ в
 * панели… Reload — и всё нормально». У панели свой обработчик сбоя: тихий
 * повтор один раз в минуту, запись сбоя на сервер, понятный текст вместо
 * заглушки Next.
 */
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("у панели свой обработчик сбоя, а не заглушка Next", () => {
  const page = read("app/admin/error.tsx");
  assert.match(page, /^"use client";/);
  assert.match(page, /reset\(\)/);
  assert.match(page, /router\.refresh\(\)/);
  // Без петли: повтор — не чаще раза в минуту, потом кнопка.
  assert.match(page, /RETRY_WINDOW_MS = 60_000/);
  assert.match(page, /if \(again\) \{\s*setGaveUp\(true\);/);
  // Сбой уходит на сервер.
  assert.match(page, /"\/admin\/crash"/);
  assert.match(page, /pick\(crashDict/);
});

test("сбой принимается только от сотрудника и своей страницы", () => {
  const route = read("app/admin/crash/route.ts");
  assert.match(route, /new URL\(origin\)\.host !== host\) return done/);
  assert.match(route, /if \(!staff\) return done/);
  assert.match(read("lib/admin/crash-store.ts"), /\.slice\(0, CRASH_KEEP\)/);
});
