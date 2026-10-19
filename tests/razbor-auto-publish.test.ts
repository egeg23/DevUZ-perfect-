import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { AUTO_PUBLISH } from "@/lib/razbor/store";

/**
 * Разборы выходят сами (владелец, 19.10.2026: «Раздел „Разборы“
 * автоматизируй, сам выкладывай без утверждения моего»).
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("разбор смены ложится сразу опубликованным, с датой выхода", () => {
  assert.equal(AUTO_PUBLISH, true);
  const store = read("lib/razbor/store.ts");
  const save = store.slice(store.indexOf("export async function saveDraft("));
  assert.match(save, /status: AUTO_PUBLISH \? "published" : "review",/);
  assert.match(save, /published_at: AUTO_PUBLISH \? new Date\(\)\.toISOString\(\) : null,/);
});

test("проверка кодом стоит до записи: не прошедшая статья не выходит", () => {
  const run = read("lib/razbor/shift-run.ts");
  // Обе статьи пишутся через writeArticle, где articleProblems возвращает
  // отказ строкой; строка до saveDraft не доходит.
  assert.ok(run.indexOf('if (typeof uz === "string") return uz;') < run.indexOf("await saveDraft("));
  assert.match(run, /if \(problems\.length\) return `\$\{CHECK_FAILED\}/);

  const tender = read("lib/razbor/tender-run.ts");
  assert.match(tender, /if \(typeof ru === "string" \|\| typeof uz === "string"\) \{[\s\S]{0,200}?\} else \{\s*const id = await saveDraft\(/);
});

test("после выхода — сигнал Bing и Яндексу и ссылки в отчёте владельцу", () => {
  const run = read("lib/razbor/shift-run.ts");
  assert.match(run, /if \(AUTO_PUBLISH && run\.drafted > 0\) \{\s*const sent = await announceRazbors\(\)/);
  assert.ok(run.indexOf("announceRazbors()") < run.indexOf("await report(run);"), "отчёт уходит раньше сигнала");
  assert.match(run, /Уже на сайте: \$\{run\.pages\.map\(\(page\) => siteUrl \+ page\)/);
  assert.match(run, /return id \? \{ page: `\/ru\/razbor\/\$\{slugFor\(niche, city, "ru"\)\}` \}/);

  const tender = read("lib/razbor/tender-run.ts");
  assert.match(tender, /if \(id && AUTO_PUBLISH\) \{[\s\S]{0,200}?await announceRazbors\(\)/);
  assert.match(tender, /уже на сайте: \$\{siteUrl\}\/ru\/razbor\/\$\{topic\.ru\.slug\}/);
});

test("снятый владельцем разбор смена обратно не выкладывает", () => {
  // Публикует смена только то, что сама только что записала: прохода,
  // который поднимал бы строки «review» на сайт, нет. Снятое лежит там.
  const store = read("lib/razbor/store.ts");
  assert.match(store, /await db\.from\("razbors"\)\.update\(\{ status: "review", published_at: null \}\)/);
  for (const file of ["lib/razbor/shift-run.ts", "lib/razbor/tender-run.ts", "lib/razbor/foreign-run.ts", "app/api/reminders/sweep/route.ts"]) {
    assert.doesNotMatch(read(file), /\bpublish\(/, `${file} публикует чужие строки`);
  }
});

test("смена берёт касания с запасом: разобранные отсеиваются по отпечатку", () => {
  const run = read("lib/razbor/shift-run.ts");
  // При запасе LOOK_AT * 4 к 19.10 разобранными были 44 строки из 48, и
  // смена смотрела четыре сайта вместо двенадцати.
  assert.match(run, /\.limit\(LOOK_AT \* 50\);/);
});

test("панель и инструкция говорят, что разборы выходят сами", () => {
  const dict = read("content/admin-panel/razbor.ts");
  assert.match(dict, /и сразу публикует статьи: проверяет их код, а не человек/);
  assert.match(dict, /Разборы выходят сами; сюда попадает только то, что вы сняли с публикации\./);

  const ru = read("content/admin-help-ru.ts");
  assert.match(ru, /сразу публикует — без вашего утверждения/);
  assert.doesNotMatch(ru, /оставляет вам на проверку/);
  assert.match(read("content/admin-help-uz.ts"), /darhol e’lon qiladi — sizning tasdig‘ingizsiz/);
  assert.match(read("content/admin-help-pl/more.ts"), /od razu publikuje — bez Twojej akceptacji/);
});
