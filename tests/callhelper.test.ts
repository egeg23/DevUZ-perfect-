import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { analyze, hasWord, objectionIn } from "@/lib/callhelper/engine";
import { EXAMPLE_SCRIPT, cleanScript, formFromScript, scriptFromForm, scriptProblems } from "@/lib/callhelper/script";
import { cleanLines, maskPersonal, phraseProblems, suggest } from "@/lib/callhelper/suggest";
import { SECTIONS } from "@/lib/admin/roles";

/**
 * DevUz CallHelper (владелец, 25.11.2026: «Давай сделаем ИИ суфлёра для
 * колл-центров…», «Делаем, название: DevUz CallHelper»): сценарий звонка,
 * подсказки кодом, фраза модели с проверкой, персональные данные до модели.
 */

test("слово сценария — с начала слова, ё как е, регистр не важен", () => {
  assert.ok(hasWord("Ну это ДОРОГОВАТО для нас", "дорог"));
  assert.ok(!hasWord("Это недорого", "дорог"));
  assert.ok(hasWord("Я за рулем сейчас", "за рулём"));
  assert.ok(!hasWord("что угодно", "а"));
});

test("возражение: сначала своё из сценария, потом общее; одноимённое общее берёт ответ сценария", () => {
  const own = objectionIn("Ой, денег нет сейчас", EXAMPLE_SCRIPT);
  assert.equal(own?.from, "script");
  assert.equal(own?.name, "Дорого");
  const base = objectionIn("Перезвоните, я занят", EXAMPLE_SCRIPT);
  assert.equal(base?.from, "base");
  assert.equal(base?.name, "Нет времени");
  // «дешевле» есть только в общих словах «Дорого», но в сценарии есть своё «Дорого» — ответ его.
  const named = objectionIn("Где-то же дешевле", EXAMPLE_SCRIPT);
  assert.equal(named?.from, "script");
  assert.match(named?.answer ?? "", /рассрочка/);
  assert.equal(objectionIn("Да, слушаю вас", EXAMPLE_SCRIPT), null);
});

test("разбор разговора: этапы, текущий, запрещённые слова, обязательные фразы, запись", () => {
  const start = analyze(EXAMPLE_SCRIPT, []);
  assert.equal(start.current, 0);
  assert.equal(start.next, EXAMPLE_SCRIPT.stages[0].say);
  assert.equal(start.noRecordNotice, false, "оператор ещё не говорил");

  const hint = analyze(EXAMPLE_SCRIPT, [
    { who: "operator", text: "Здравствуйте, меня зовут Анна, клиника Улыбка. Гарантируем результат!" },
    { who: "client", text: "Это дорого наверное" },
  ]);
  assert.deepEqual(hint.stages.map((s) => s.done), [true, false, false, false]);
  assert.equal(hint.current, 1);
  assert.deepEqual(hint.banned, ["гарантируем"]);
  assert.equal(hint.noRecordNotice, true);
  assert.deepEqual(hint.missingMust, ["разговор записывается"]);
  assert.equal(hint.objection?.name, "Дорого");
  assert.equal(hint.next, hint.objection?.answer, "на возражение — сначала ответ");

  const done = analyze(EXAMPLE_SCRIPT, [
    { who: "operator", text: EXAMPLE_SCRIPT.stages.map((s) => s.say).join(" ") },
  ]);
  assert.equal(done.current, null);
  assert.equal(done.noRecordNotice, false);
  assert.deepEqual(done.missingMust, []);
});

test("возражение только в последней реплике клиента: после ответа оператора оно снято", () => {
  const hint = analyze(EXAMPLE_SCRIPT, [
    { who: "client", text: "Подумаю" },
    { who: "operator", text: "Конечно" },
  ]);
  assert.equal(hint.objection, null);
});

test("сценарий из формы и обратно; пустой сценарий не годится", () => {
  const form = formFromScript(EXAMPLE_SCRIPT);
  assert.deepEqual(scriptFromForm(form), EXAMPLE_SCRIPT);
  assert.deepEqual(scriptProblems(EXAMPLE_SCRIPT), []);
  assert.deepEqual(scriptProblems(scriptFromForm({})), ["product", "goal", "stages"]);
  assert.ok(scriptProblems(scriptFromForm({ product: "a", goal: "b", stages: "Этап | фраза" })).includes("stageWords"));
});

test("сценарий из чужих данных: лишнее отброшено, длина и число ограничены", () => {
  const script = cleanScript({
    product: "x".repeat(5000),
    goal: "цель",
    stages: Array.from({ length: 50 }, (_, i) => ({ name: `э${i}`, say: "s", words: "а1, б2" })),
    objections: [{ name: "без ответа", words: "x", answer: "" }],
    banned: "один, один, два",
    evil: "<script>",
  });
  assert.equal(script.product.length, 400);
  assert.equal(script.stages.length, 12);
  assert.equal(script.objections.length, 0);
  assert.deepEqual(script.banned, ["один", "два"]);
  assert.ok(!("evil" in script));
});

test("персональные данные вырезаются до модели", () => {
  const masked = maskPersonal("Мой номер +7 (912) 345-67-89, почта ivan.petrov@mail.ru, карта 4276 1234 5678 9012, паспорт 4510 123456");
  assert.ok(!/\d{3}/.test(masked), masked);
  assert.ok(!masked.includes("@"));
  assert.match(masked, /\[номер\]/);
  assert.match(masked, /\[почта\]/);
  assert.equal(maskPersonal("Приду в 18:30 в субботу"), "Приду в 18:30 в субботу");
});

test("фраза модели: запрещённые слова, придуманные числа, длина — не пропускаются", () => {
  const lines = [{ who: "client" as const, text: "А сколько стоит?" }];
  assert.deepEqual(phraseProblems("Давайте запишу вас на бесплатную консультацию в субботу?", EXAMPLE_SCRIPT, lines), []);
  assert.ok(phraseProblems("Гарантируем, что всё пройдёт отлично", EXAMPLE_SCRIPT, lines).some((p) => p.startsWith("запрещённое")));
  assert.ok(phraseProblems("Стоит всего 30000 рублей", EXAMPLE_SCRIPT, lines).includes("число, которого нет в сценарии"));
  assert.ok(phraseProblems("Да. ".repeat(100), EXAMPLE_SCRIPT, lines).includes("длинно"));
});

test("подсказка: фраза модели прошла — от модели; не прошла или модели нет — из сценария", async () => {
  const lines = [{ who: "client" as const, text: "Дорого" }];
  const good = await suggest(EXAMPLE_SCRIPT, lines, async () => "«Понимаю вас. Давайте врач сначала посчитает точно, это бесплатно. Удобно в субботу?»");
  assert.equal(good.source, "model");
  assert.ok(!good.phrase.startsWith("«"));

  const bad = await suggest(EXAMPLE_SCRIPT, lines, async () => "Гарантируем скидку 50%");
  assert.equal(bad.source, "code");
  assert.equal(bad.phrase, EXAMPLE_SCRIPT.objections[0].answer);

  const silent = await suggest(EXAMPLE_SCRIPT, lines, async () => null);
  assert.equal(silent.source, "code");

  let prompt = "";
  await suggest(EXAMPLE_SCRIPT, [{ who: "client", text: "Звоните на 89123456789" }], async (_s, p) => ((prompt = p), null));
  assert.ok(!prompt.includes("89123456789"), "номер не уходит модели");
  assert.match(prompt, /<script>[\s\S]*<\/script>/);
});

test("реплики из запроса: только два вида, длина и число ограничены", () => {
  const lines = cleanLines([{ who: "hacker", text: "a" }, { who: "operator", text: "  b  " }, null, { who: "client", text: "" }, ...Array(100).fill({ who: "client", text: "x".repeat(2000) })]);
  assert.equal(lines.length, 60);
  assert.equal(lines.at(-1)?.text.length, 800);
  assert.equal(cleanLines("nope").length, 0);
  assert.deepEqual(cleanLines([{ who: "hacker", text: "a" }]), [{ who: "client", text: "a" }]);
});

test("раздел в панели всем, вкладкой «Холодных касаний»; маршрут проверяет раздел и лимит", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/callhelper");
  assert.ok(section);
  assert.deepEqual([...section.roles].sort(), ["admin", "head", "manager"]);
  assert.equal(section.parent, "/admin/prospect");
  const route = readFileSync("app/admin/callhelper/suggest/route.ts", "utf8");
  assert.match(route, /opens\(staff, "\/admin\/callhelper"\)/);
  assert.match(route, /rateLimit\(/);
  const page = readFileSync("app/admin/callhelper/page.tsx", "utf8");
  assert.match(page, /requireSection\("\/admin\/callhelper"\)/);
});

test("модель недорогая и без размышлений: подсказка нужна за секунду", () => {
  const src = readFileSync("lib/callhelper/suggest.ts", "utf8");
  assert.match(src, /CALLHELPER_MODEL \|\| "claude-haiku-/);
  assert.match(src, /thinking: \{ type: "disabled" \}/);
});
