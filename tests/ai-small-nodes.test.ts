/**
 * Разведка «ИИ → код», пункт 4: мелкие узлы, где модель решала то, что
 * решает код.
 *
 * - Разбор короткой переписки: урок из одной реплики клиента cleanReview
 *   всё равно стирает — модель не зовём, «где сломалось» видно по ленте.
 * - Дневная рекомендация владельцу и руководителям: данные у всех одни, и
 *   вызов модели — один на всех, а не на каждого.
 * - Последняя фраза первички после qualify_lead: исход доставки и номер
 *   заявки задаёт код — готовым текстом, без второго запроса.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { locales } from "@/lib/i18n";
import { closingText, type ClosingOutcome } from "@/lib/qualify/closing";
import { ENOUGH_TURNS, cleanReview, shortReview } from "@/lib/talk/review";

const read = (path: string) => readFileSync(path, "utf8");

test("короткая переписка разбирается без модели", () => {
  const review = shortReview([
    { direction: "out", body: "Здравствуйте" },
    { direction: "in", body: "да?" },
    { direction: "out", body: "Посмотрели ваш сайт:\n  заявка с телефона не отправляется." },
  ]);
  assert.equal(review.lesson, "", "урок из одной реплики — шум");
  assert.equal(review.confidence, "low");
  assert.match(review.failed, /^Клиент не ответил на: «Посмотрели ваш сайт: заявка с телефона не отправляется\.»$/);

  // Последним написал клиент — «где сломалось» не выдумываем.
  assert.equal(shortReview([{ direction: "out", body: "Здравствуйте" }, { direction: "in", body: "кто это?" }]).failed, "");

  // Тот же итог, что дала бы модель после cleanReview: урок стёрт.
  assert.equal(cleanReview({ lesson: "Писать короче", confidence: "high" }, ENOUGH_TURNS - 1).lesson, "");

  const run = read("lib/talk/review-run.ts");
  assert.match(run, /if \(turns < ENOUGH_TURNS\) \{[\s\S]{0,300}shortReview\(item\.thread\)[\s\S]{0,120}continue;/);
  assert.ok(run.indexOf("shortReview(item.thread)") < run.indexOf("await ask("), "короткая ветка — до вызова модели");
});

test("дневная рекомендация — один вызов модели на всех читателей", () => {
  const coach = read("lib/admin/coach-store.ts");
  const daily = coach.slice(coach.indexOf("Дневные: владельцу и руководителям"));
  assert.equal(daily.match(/askCoach\("daily"/g)?.length, 1);
  assert.doesNotMatch(daily, /for \(const reader of [\s\S]{0,200}askCoach\("daily"/, "вызов модели снова в цикле по читателям");
  assert.match(daily, /waiting\.length \? await askCoach\("daily"/, "все прочитали — модель не зовём");
});

test("последняя фраза первички — готовым текстом, на каждом языке", () => {
  const outcomes: ClosingOutcome[] = ["delivered", "saved", "lost"];
  for (const locale of locales) {
    for (const outcome of outcomes) {
      const text = closingText({ locale, source: "chat", outcome, requestNo: "DU-1010-AB12", telegram: "devuz" });
      assert.doesNotMatch(text, /\{no\}|\{tg\}/, `${locale}/${outcome}: подстановка не сработала`);
      if (outcome === "lost") assert.doesNotMatch(text, /DU-1010-AB12/, `${locale}: номер незаписанной заявки`);
      else assert.match(text, /DU-1010-AB12/, `${locale}/${outcome}: нет номера заявки`);
      if (outcome === "delivered") assert.doesNotMatch(text, /@devuz/, `${locale}: дошедшую заявку не шлём в Telegram`);
      else assert.match(text, /@devuz/, `${locale}/${outcome}: не дали, куда писать`);
      if (locale !== "ru" && locale !== "uk") assert.doesNotMatch(text, /[а-яё]/i, `${locale}/${outcome}: кириллица`);
    }
  }
});

test("в касании — без номера заявки и без «напишите нам»: разговор продолжает человек", () => {
  for (const locale of locales) {
    for (const outcome of ["delivered", "saved", "lost"] as const) {
      const text = closingText({ locale, source: "outreach", outcome, requestNo: "DU-1010-AB12", telegram: "devuz" });
      assert.doesNotMatch(text, /DU-1010|@devuz|\d/, `${locale}/${outcome}`);
    }
  }
});

test("движок не зовёт модель ради прощальной фразы", () => {
  const engine = read("lib/qualify/engine.ts");
  assert.match(engine, /continuation\(\)\(closingText\(\{ locale, source, outcome, requestNo, telegram: SUPPORT_TELEGRAM \}\)\)/);
  assert.equal(engine.match(/await secondPass\(/g)?.length, 1, "второй проход остаётся только для повторного вызова");
  assert.match(engine, /const outcome: ClosingOutcome = lost \? "lost" : delivered \? "delivered" : "saved";/);
  assert.doesNotMatch(read("lib/qualify/prompt.ts"), /После вызова инструмента напиши/, "промпт всё ещё просит прощаться после вызова");
});
