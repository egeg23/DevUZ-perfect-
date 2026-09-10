import assert from "node:assert/strict";
import { test } from "node:test";

import { transition, type SweepHealth } from "@/lib/admin/sweep-health";

/**
 * Правило одно: сказать один раз про аварию и один раз про восстановление.
 *
 * Ошибка здесь не видна ни в типах, ни на глаз — она проявляется у
 * владельца либо двенадцатью сообщениями в час, либо тишиной вместо
 * тревоги. Второе хуже: механизм напоминаний существует ровно затем,
 * чтобы о лиде не забыли, и его молчаливая поломка означает остывшие
 * лиды, о которых узнают через неделю.
 */

const START = "2026-09-10T09:00:00.000Z";
const fail = (reason = "прокси не отвечает") => ({ ok: false as const, reason });
const ok = (at = START) => ({ ok: true as const, at });

/** Прогоняет цепочку исходов, собирая всё, о чём сообщили. */
function run(outcomes: Array<ReturnType<typeof fail> | ReturnType<typeof ok>>) {
  let state: SweepHealth | null = null;
  const said: string[] = [];
  for (const outcome of outcomes) {
    const step = transition(state, outcome);
    state = step.next;
    if (step.announce) said.push(step.announce);
  }
  return { state: state as SweepHealth, said };
}

test("о поломке сообщают на третьей неудаче, а не на первой", () => {
  // Одиночный сбой Telegram — обычное дело. Тревога на первой же неудаче
  // приучает её игнорировать, и настоящую аварию тоже не заметят.
  assert.deepEqual(run([fail()]).said, []);
  assert.deepEqual(run([fail(), fail()]).said, []);
  assert.deepEqual(run([fail(), fail(), fail()]).said, ["broken"]);
});

test("о поломке сообщают один раз, сколько бы она ни длилась", () => {
  const { said, state } = run(Array.from({ length: 40 }, () => fail()));
  assert.deepEqual(said, ["broken"], "авария разбудила владельца больше одного раза");
  assert.equal(state.consecutive_failures, 40);
  assert.equal(state.alerted, true);
});

test("восстановление сообщается ровно тогда, когда о поломке говорили", () => {
  assert.deepEqual(run([fail(), fail(), fail(), ok()]).said, ["broken", "recovered"]);

  // А вот пара неудач подряд, о которых не сообщали, восстановления не
  // заслуживает: иначе владелец получает «снова работает» о том, что и не
  // переставало.
  assert.deepEqual(run([fail(), fail(), ok()]).said, []);
  assert.deepEqual(run([ok()]).said, []);
});

test("удачный проход сбрасывает счётчик, и цикл считается заново", () => {
  const { state, said } = run([
    fail(), fail(), fail(),   // авария → сообщили
    ok(),                     // починилось → сообщили
    fail(), fail(),           // снова сбоит, но ещё не порог
  ]);
  assert.deepEqual(said, ["broken", "recovered"]);
  assert.equal(state.consecutive_failures, 2);
  assert.equal(state.alerted, false, "вторая авария не сможет разбудить владельца");

  // Третья неудача в новом цикле снова обязана сообщить.
  const third = transition(state, fail());
  assert.equal(third.announce, "broken");
});

test("последний удачный проход переживает аварию", () => {
  // По нему панель показывает, когда механизм работал в последний раз.
  // Затерев его при неудаче, мы бы лишились единственного признака,
  // отличающего «свип падает» от «свип не запускался вовсе».
  const { state } = run([ok("2026-09-10T09:00:00.000Z"), fail(), fail(), fail()]);
  assert.equal(state.last_ok_at, "2026-09-10T09:00:00.000Z");
  assert.equal(state.last_error, "прокси не отвечает");
});

test("длинную ошибку не тащим в базу целиком", () => {
  const { state } = run([fail("я".repeat(5000))]);
  assert.ok((state.last_error ?? "").length <= 200);
});
