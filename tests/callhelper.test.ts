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

test("раздел пока только у владельца, вкладкой «Холодных касаний»; маршрут проверяет раздел и лимит", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/callhelper");
  assert.ok(section);
  assert.deepEqual([...section.roles], ["admin"], "владелец, 25.11.2026: «доступ к этим раздел пока только у меня»");
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

test("тарифы владельца: цены прежние, минут меньше; менеджеру 20% от прибыли; маржа держится даже на дорогой минуте", async () => {
  const t = await import("@/lib/callhelper/tariffs");
  assert.deepEqual(t.CALLHELPER_TARIFFS.map((x) => [x.rub, x.minutes]), [[4900, 1000], [9900, 2500]]);
  assert.equal(t.CALLHELPER_MANAGER_PERCENT, 20);
  for (const tariff of t.CALLHELPER_TARIFFS) {
    const worst = t.studioNet(tariff.rub, tariff.minutes, t.CALLHELPER_MINUTE_COST.high);
    assert.ok(worst / tariff.rub >= 0.4, `${tariff.name}: чистыми ${worst} из ${tariff.rub}`);
  }
  assert.ok(t.CALLHELPER_OVER_RUB > t.CALLHELPER_MINUTE_COST.high * 1.5);
});

test("пробный: 3 дня и 50 минут на компанию; ИНН, телефон, Telegram — один раз; адрес и браузер — раз в 30 дней", async () => {
  const t = await import("@/lib/callhelper/trial");
  assert.deepEqual({ ...t.TRIAL }, { days: 3, minutes: 50 });
  assert.ok(t.innValid("7707083893"));
  assert.ok(t.innValid("500100732259"));
  assert.ok(!t.innValid("7707083894"), "выдуманный ИНН");
  assert.ok(!t.innValid("0000000000"));
  assert.equal(t.normPhone("8 (912) 345-67-89"), t.normPhone("+79123456789"));
  const now = Date.UTC(2026, 10, 25);
  const ask = { inn: "7707083893", phone: "+79123456789", tg: "111", ipHash: t.ipPrint("1.2.3.4", "s"), device: "d1" };
  assert.deepEqual(t.trialVerdict(ask, [], now), { ok: true });
  assert.deepEqual(t.trialVerdict({ ...ask, inn: "123" }, [], now), { ok: false, reason: "inn" });
  assert.deepEqual(t.trialVerdict({ ...ask, phone: "" }, [], now), { ok: false, reason: "phone" });
  const old = { inn: "7707083893", phone: "70000000000", tg: null, ipHash: "x", device: "z", at: now - 400 * 86_400_000 };
  assert.deepEqual(t.trialVerdict(ask, [old], now), { ok: false, reason: "used" }, "тот же ИНН — никогда");
  const other = { inn: "500100732259", phone: "79123456789", tg: null, ipHash: "x", device: "z", at: now - 400 * 86_400_000 };
  assert.deepEqual(t.trialVerdict(ask, [other], now), { ok: false, reason: "used" }, "тот же телефон с новым ИНН");
  const sameIp = { inn: "500100732259", phone: "70000000001", tg: null, ipHash: ask.ipHash, device: "z", at: now - 86_400_000 };
  assert.deepEqual(t.trialVerdict(ask, [sameIp], now), { ok: false, reason: "ip" });
  assert.deepEqual(t.trialVerdict(ask, [{ ...sameIp, at: now - 31 * 86_400_000 }], now), { ok: true }, "через 30 дней адрес снова можно");
  assert.deepEqual(t.trialVerdict(ask, [{ ...sameIp, ipHash: "y", device: "d1" }], now), { ok: false, reason: "device" });
  assert.ok(!t.ipPrint("1.2.3.4", "s").includes("1.2.3.4"));
  assert.deepEqual(t.trialLeft({ startedAt: now, minutes: 20 }, now + 86_400_000), { minutes: 30, hours: 48, over: false });
  assert.equal(t.trialLeft({ startedAt: now, minutes: 50 }, now).over, true);
  assert.equal(t.trialLeft({ startedAt: now, minutes: 0 }, now + 3 * 86_400_000).over, true);
  assert.equal(t.TRIAL_LIMITS.operators, 1);
});

test("ключ распознавания: форма, ответ Яндекса словом, пишется только после проверки и только владельцем", async () => {
  const { parseSttForm, sttVerdict } = await import("@/lib/callhelper/stt-keys");
  assert.deepEqual(parseSttForm({ key: "AQVN" + "x".repeat(36), folder: "B1G" + "a".repeat(17) }), {
    ok: true,
    key: "AQVN" + "x".repeat(36),
    folder: "b1g" + "a".repeat(17),
  });
  assert.deepEqual(parseSttForm({ key: "с пробелом и кириллицей", folder: "b1g" + "a".repeat(17) }), { ok: false, field: "key" });
  assert.deepEqual(parseSttForm({ key: "A".repeat(40), folder: "b1g" }), { ok: false, field: "folder" });
  assert.equal(sttVerdict(200, ""), "ok");
  assert.equal(sttVerdict(401, ""), "key");
  assert.equal(sttVerdict(403, "Permission denied"), "key");
  assert.equal(sttVerdict(403, "folder not found"), "folder");
  assert.equal(sttVerdict(400, "bad folderId"), "folder");
  assert.equal(sttVerdict(503, ""), "down");
  const actions = readFileSync("app/admin/callhelper/actions.ts", "utf8");
  assert.match(actions, /requireRole\("admin"\)/);
  assert.ok(actions.indexOf("checkStt(") < actions.indexOf("saveAppSecret("), "сначала Яндекс, потом хранилище");
  assert.doesNotMatch(actions, /console\.(log|error)\([^)]*key/, "значение ключа в лог не идёт");
});

test("главная: блок CallHelper только на русской, дата запуска и цены из тарифов", async () => {
  const home = readFileSync("components/home/glass-home.tsx", "utf8");
  assert.match(home, /locale === "ru" \? \([\s\S]*<CallHelperBlock \/>/);
  const { CALLHELPER_LAUNCH, launchText } = await import("@/lib/callhelper/tariffs");
  assert.equal(CALLHELPER_LAUNCH, "2026-12-14");
  assert.equal(launchText(), "14\u00a0декабря 2026");
  const block = readFileSync("components/home/callhelper-block.tsx", "utf8");
  assert.match(block, /CALLHELPER_TARIFFS\.map/);
  assert.match(block, /CALLHELPER_TRIAL/);
  assert.doesNotMatch(block, /4\s?900|9\s?900/, "цены — из тарифов, не строкой");
  assert.doesNotMatch(block, /[—–]/, "без длинных тире");
});

test("лист ожидания: разбор, отпечаток контакта, повтор обновляет строку", async () => {
  const { parseWait, waitKey, mergeWait, readWait, sortWait, WAIT_PREFIX } = await import("@/lib/callhelper/waitlist");
  assert.deepEqual(parseWait(null), { ok: false, error: "invalid_json" });
  assert.deepEqual(parseWait({ contact: "" }), { ok: false, error: "contact_required" });
  assert.deepEqual(parseWait({ contact: "1234567" }), { ok: false, error: "contact_invalid" });
  const ok = parseWait({ name: " Анна ", contact: "+7 (912) 345-67-89", operators: "25 человек", comment: "x".repeat(900) });
  assert.ok(ok.ok);
  if (!ok.ok) return;
  assert.equal(ok.entry.name, "Анна");
  assert.equal(ok.entry.operators, 25);
  assert.equal(ok.entry.comment.length, 600);
  assert.ok(waitKey("+7 (912) 345-67-89").startsWith(WAIT_PREFIX));
  assert.equal(waitKey("+7 (912) 345-67-89"), waitKey("79123456789"), "тот же номер — та же строка");
  assert.equal(waitKey("https://t.me/Anna_Call"), waitKey("@anna_call"));
  const first = mergeWait(null, ok.entry, new Date("2026-11-25T10:00:00Z"));
  assert.equal(first.times, 1);
  const again = mergeWait(first, { ...ok.entry, name: "", operators: 0, comment: "" }, new Date("2026-11-26T10:00:00Z"));
  assert.equal(again.times, 2);
  assert.equal(again.name, "Анна");
  assert.equal(again.operators, 25);
  assert.equal(again.first_at, first.first_at);
  assert.equal(readWait({ foo: 1 }), null);
  assert.deepEqual(sortWait([first, again]).map((r) => r.times), [2, 1]);
});

test("лист ожидания: только владельцу, не лид и не очередь команды", () => {
  const page = readFileSync("app/admin/callhelper/page.tsx", "utf8");
  assert.match(page, /owner \? <CallHelperWaitlist/);
  assert.match(page, /owner \? await Promise\.all\(\[sttState\(\), listWait\(\), listOrgs\(\)\]\)/);
  const route = readFileSync("app/api/callhelper/wait/route.ts", "utf8");
  for (const off of ["saveLead", "routeNewLead", "salesRecipients", "api/lead"]) {
    assert.doesNotMatch(route, new RegExp(off), `${off} — не для листа ожидания`);
  }
  assert.match(route, /rateLimit/);
  const store = readFileSync("lib/callhelper/waitlist-store.ts", "utf8");
  assert.match(store, /\.eq\("role", "admin"\)/, "строка в Telegram — только владельцу");
  assert.doesNotMatch(store, /"head"|"manager"/);
  assert.match(store, /messageWindow\(now\)/, "ночью строки нет");
  const form = readFileSync("components/home/callhelper-wait.tsx", "utf8");
  assert.match(form, /\/api\/callhelper\/wait/);
  assert.doesNotMatch(form, /\/api\/lead/);
  const block = readFileSync("components/home/callhelper-block.tsx", "utf8");
  assert.match(block, /<CallHelperWait /);
});
