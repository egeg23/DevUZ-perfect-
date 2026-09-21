import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { modelTrouble, modelTroubleSays } from "@/lib/model-trouble";
import { diagnose, unreadChats, type ScoutPulse } from "@/lib/scout/health";

/**
 * 21 сентября на ключе кончились деньги, и это узнали не из панели.
 *
 * Менеджер увидел на карточке касания сырой ответ API, а чат на сайте
 * отвечал посетителям «ошибка» — за сутки не пришло ни одного лида.
 * Проверки ниже сторожат ровно эти места: каждая падает на поломке, у
 * которой нет ни одной строки со словом «ошибка» там, где её ищут.
 */
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const apiError = (status: number, message: string) =>
  new Anthropic.APIError(status, { type: "error", error: { type: "invalid_request_error", message } }, message, undefined);

test("пустой баланс отличается от дефекта в коде", () => {
  const billing = modelTrouble(
    apiError(400, "Your credit balance is too low to access the Anthropic API."),
  );
  assert.equal(billing?.kind, "billing");
  assert.match(billing?.says ?? "", /деньги/i, "фраза не говорит про деньги — значит, не говорит ничего");

  // 400 бывает и нашей собственной ошибкой в параметрах. Её прятать нельзя:
  // «модель недоступна» на месте дефекта — это сутки поисков не там.
  assert.equal(modelTrouble(apiError(400, "max_tokens: must be greater than 0")), null);
  assert.equal(modelTrouble(new Error("что угодно")), null);
});

test("перегрузку и отказ ключа отличаем друг от друга", () => {
  assert.equal(modelTrouble(apiError(429, "rate limit"))?.kind, "limit");
  assert.equal(modelTrouble(apiError(401, "invalid x-api-key"))?.kind, "auth");
  assert.equal(modelTrouble(apiError(529, "overloaded"))?.kind, "down");
});

test("сырой ответ API до сотрудника не доходит", () => {
  const raw = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing';
  const says = modelTroubleSays(apiError(400, raw));
  assert.doesNotMatch(says, /credit balance|invalid_request_error|request_id/);

  // А дефект отдаётся как есть: вежливая фраза на его месте лишает
  // единственной зацепки.
  assert.equal(modelTroubleSays(new Error("prospects.walked не заполнен")), "prospects.walked не заполнен");
});

test("чат на сайте при недоступной модели показывает форму, а не ошибку", () => {
  const route = read("app/api/chat/route.ts");
  const panel = read("components/chat/chat-panel.tsx");

  assert.match(route, /modelTrouble\(error\)/, "маршрут не отличает отказ модели от поломки");
  assert.match(route, /type: "unavailable"/, "посетителю снова уедет «ошибка»");
  assert.match(panel, /"unavailable"/, "панель не знает этого события — статус останется «ошибка»");

  // Текст про форму уже есть на четырёх языках: второй заводить незачем.
  assert.match(panel, /prev === "qualified" \|\| prev === "undelivered" \? prev : "disabled"/);
});

test("касание объясняет отказ модели словами", () => {
  const store = read("lib/admin/outreach-store.ts");
  assert.match(store, /modelTroubleSays\(error\)/, "на карточку снова уедет сырой ответ API");
});

const pulse = (over: Partial<ScoutPulse> = {}): ScoutPulse => ({
  at: new Date().toISOString(),
  startedAt: new Date(Date.now() - 3600_000).toISOString(),
  chatsWatched: 29,
  chatsReading: 29,
  seen: 400,
  passedPrefilter: 10,
  classified: 10,
  saved: 3,
  notified: 3,
  dropped: {},
  ...over,
});

test("скаут, читающий половину чатов, перестаёт выглядеть здоровым", () => {
  // 21 сентября пульс показывал 13 из 29, а панель писала «механизм цел»:
  // тревога поднималась только на полном нуле.
  assert.equal(unreadChats(pulse({ chatsReading: 13 })), 16);
  assert.equal(unreadChats(pulse()), 0);
  assert.equal(unreadChats(null), 0);

  const page = read("app/admin/scout/page.tsx");
  assert.match(page, /unreadChats\(pulse\)/, "панель не сверяет заданные чаты с читаемыми");
});

test("«разобрано 0» называет и пустой баланс тоже", () => {
  const verdict = diagnose(pulse({ passedPrefilter: 7, classified: 0 }));
  assert.equal(verdict.state, "model_down");
  assert.match(verdict.says, /деньги/i, "диагноз отправит искать ключ, когда дело в деньгах");
});

/**
 * Выбор модели через .env не должен падать на первом же запросе.
 *
 * При замере переключение скаута на Хайку упало с «400 This model does not
 * support the effort parameter»: параметр стоял в коде жёстко, и узнать об
 * этом можно было только попробовав. То есть переключить узел на модель
 * подешевле было нельзя вовсе.
 */
test("усилие не уезжает модели, которая про него не знает", async () => {
  const { effortFor, supportsEffort } = await import("@/lib/model-limits");

  assert.equal(supportsEffort("claude-opus-5"), true);
  assert.equal(supportsEffort("claude-haiku-4-5"), false);
  assert.deepEqual(effortFor("claude-sonnet-5", "low"), { output_config: { effort: "low" } });
  assert.deepEqual(effortFor("claude-haiku-4-5", "low"), {});

  const scout = read("lib/scout/classify.ts");
  const letters = read("lib/admin/outreach-store.ts");
  for (const [name, source] of [["скаут", scout], ["письма", letters]] as const) {
    assert.doesNotMatch(source, /output_config: \{ effort/, `${name}: усилие снова зашито в вызов`);
    assert.match(source, /effortFor\(MODEL/, `${name}: усилие не выбирается по модели`);
  }
});
