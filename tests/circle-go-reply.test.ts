/**
 * Ответ на кружок «Летс го» — это «да», а не «коротко и непонятно».
 *
 * orbitagroup.uz, 26.10.2026: на кружок клиент ответил «Летс го», бот отдал
 * разговор человеку («разберитесь сами») и замолчал. Следом клиент написал
 * «Ладно если готовы давайте за дело», «К вам как удобно обращаться?» — и
 * час ждал. Владелец: «Почему ничего не ушло ответом клиенту с рабочего
 * акка?»
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HANDOVER_TEXT, readInbound } from "@/lib/admin/outreach-talk";
import { resumableAfterUnclear } from "@/lib/admin/outreach-talk-store";

const circle = { stage: "circle" } as const;
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("«Летс го», «let's go», «поехали», «за дело» на кружок — разбор, а не человеку", () => {
  for (const body of ["Летс го", "летс го!", "Let's go", "lets go", "Поехали", "Давайте за дело", "Ладно, давайте", "Go", "Ketdik"]) {
    assert.equal(readInbound(body, circle), "breakdown", body);
  }
  // Короткое непонятное по-прежнему человеку: «нет», «позже» — не «да».
  for (const body of ["Нет", "позже", "не сейчас"]) {
    assert.equal(readInbound(body, circle), "unclear", body);
  }
});

test("отпущенный как «непонятно» разговор бот забирает назад, только если после кружка никто не писал", () => {
  assert.equal(resumableAfterUnclear(HANDOVER_TEXT.unclear, "circle"), true);
  // Человек уже ответил или бот что-то отправил после кружка — не трогаем.
  assert.equal(resumableAfterUnclear(HANDOVER_TEXT.unclear, "text"), false);
  assert.equal(resumableAfterUnclear(HANDOVER_TEXT.unclear, null), false);
  // Человек забрал разговор сам или клиент просил человека — тоже не трогаем.
  assert.equal(resumableAfterUnclear("менеджер отвечает сам", "circle"), false);
  assert.equal(resumableAfterUnclear(HANDOVER_TEXT.human, "circle"), false);

  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(store, /const breakdown = read === "breakdown" && \(prospect\.ai_handling !== false \|\| resumed\)/);
  assert.match(store, /ai_handling: true, handover_reason: null/, "разговор возвращается боту");
  assert.match(store, /бот сам отправит обещанный разбор/, "человеку — строка, чтобы не ответили вдвоём");
});
