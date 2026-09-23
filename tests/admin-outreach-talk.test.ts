import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  HANDOVER_TEXT,
  MAX_AI_REPLIES,
  MAX_REPLY_CHARS,
  asTranscript,
  normalizeHandle,
  readInbound,
  replyProblems,
  talkNote,
} from "@/lib/admin/outreach-talk";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("адрес приводится к общему виду: иначе ответ не находит своего разговора", () => {
  assert.equal(normalizeHandle("@Ivan"), "ivan");
  assert.equal(normalizeHandle("Ivan"), "ivan");
  assert.equal(normalizeHandle("https://t.me/Ivan"), "ivan");
  assert.equal(normalizeHandle("http://www.telegram.me/Ivan/"), "ivan");
  assert.equal(normalizeHandle("t.me/Ivan?start=1"), "ivan");
  assert.equal(normalizeHandle(null), "");
  assert.equal(normalizeHandle("  "), "");
});

test("просьбу не писать модель не обсуждает", () => {
  for (const text of [
    "Не пишите мне больше",
    "не пишите сюда",
    "Отстаньте",
    "это спам, я пожалуюсь",
    "заблокирую",
    "отпишите меня",
  ]) {
    assert.equal(readInbound(text), "stop", text);
  }
});

test("просьбу позвать человека модель не перехватывает", () => {
  for (const text of [
    "Позвоните мне",
    "перезвоните завтра",
    "давайте созвонимся",
    "свяжите меня с менеджером",
    "дайте номер телефона",
    "хочу поговорить с человеком",
  ]) {
    assert.equal(readInbound(text), "human", text);
  }
});

test("обычный ответ разбирает модель", () => {
  assert.equal(readInbound("Здравствуйте, а сколько это стоит?"), "talk");
  assert.equal(readInbound("Сайт делали в 2019, давно хотим переделать"), "talk");
  // «Написали» — не «не пишите»: отрицания рядом нет.
  assert.equal(readInbound("Нам уже написали из другой студии"), "talk");
});

test("лента разговора уходит модели в правильных ролях", () => {
  const rows = [
    { direction: "out" as const, body: "наше письмо" },
    { direction: "in" as const, body: "их ответ" },
  ];
  assert.deepEqual(asTranscript(rows), [
    { role: "assistant", content: "наше письмо" },
    { role: "user", content: "их ответ" },
  ]);
});

const FACTS = "Ориентир: от $1500, 3–6 недель. Сайт отвечает за 4.2 секунды. Клиент: бюджет до 2000.";

test("выдуманное число в ответе модели не уходит клиенту", () => {
  const ok = replyProblems("Переделка занимает 3–6 недель, ориентир от $1500.", FACTS);
  assert.deepEqual(ok, []);

  const bad = replyProblems("Обычно поднимаем скорость до 0.8 секунды за 2 недели.", FACTS);
  assert.deepEqual(bad.map((p) => p.code), ["invented"]);
  assert.match(bad[0].text, /0\.8/);
});

test("запреты первого касания действуют и в десятой реплике", () => {
  assert.deepEqual(replyProblems("Выведем вас в топ по вашим запросам.", FACTS).map((p) => p.code), ["banned"]);
  assert.deepEqual(replyProblems("Гарантируем результат.", FACTS).map((p) => p.code), ["banned"]);
  assert.deepEqual(replyProblems("Предлагаем комплексный подход.", FACTS).map((p) => p.code), ["banned"]);
  // Процент — это и число, и запрещённый оборот: ловится обеими проверками.
  assert.ok(replyProblems("Конверсия вырастет на 40 %.", FACTS).some((p) => p.code === "banned"));
});

test("пустой и длинный ответ не отправляются", () => {
  assert.deepEqual(replyProblems("   ", FACTS).map((p) => p.code), ["empty"]);
  const long = "а".repeat(MAX_REPLY_CHARS + 1);
  assert.deepEqual(replyProblems(long, FACTS).map((p) => p.code), ["long"]);
});

test("приписка канала объясняет модели, что первыми написали мы", () => {
  const note = talkNote({
    host: "mebel.uz",
    label: "ООО «Мебель»",
    findings: [{ title: "на телефоне съезжает вёрстка", impact: "половина посетителей уходит" }],
    firstMessage: "Здравствуйте! Мы разобрали сайт mebel.uz…",
    managerName: "Данил",
    repliesSoFar: 3,
  });

  assert.match(note, /Первыми написали мы/);
  assert.match(note, /mebel\.uz/);
  assert.match(note, /на телефоне съезжает вёрстка/);
  assert.match(note, /Здравствуйте! Мы разобрали сайт mebel\.uz/, "модель должна знать, что мы уже сказали");
  assert.match(note, /Данил/, "модель должна знать, чей это лид");
  assert.match(note, new RegExp(`3 из ${MAX_AI_REPLIES}`), "модель должна видеть, сколько уже написала");
  // Благодарность за обращение — самая частая ошибка в ответе на холодное
  // письмо: обращения не было.
  assert.match(note, /Не благодари за обращение/);
});

test("у каждой передачи человеку есть причина словами", () => {
  for (const key of ["stop", "human", "qualified", "turns", "bad_reply", "failed"]) {
    assert.ok(HANDOVER_TEXT[key], key);
  }
});

// ── Инварианты пути, которые не проверить чистой функцией ────────────────

test("квалификация по касанию дописывается в существующий лид, а не заводит второй", () => {
  const engine = read("lib/qualify/engine.ts");
  // Лид касания уже за кем-то закреплён; новый на его месте оказался бы
  // ничей — а владелец просил обратного: «лид фиксируется за тем, кто нажал».
  assert.match(engine, /if \(options\.existing\) \{\s*\n[\s\S]{0,400}?leadId = await updateLead\(options\.existing\.requestNo/);
  assert.match(engine, /\} else if \(!leadId\) \{\s*\n\s+leadId = await saveLead/, "saveLead должен быть в ветке else");
  // Бриф уходит тому, за кем лид, а не в общий чат отдела.
  assert.match(engine, /to: options\.existing\.notify/);
});

test("номер заявки рождается при отправке первого письма — иначе дописывать некуда", () => {
  const store = read("lib/admin/outreach-store.ts");
  assert.match(store, /const requestNo = newRequestNo\(\);/);
  assert.match(store, /request_no: requestNo/);
  assert.match(store, /createOutreachLead\(prospect, staff, text, requestNo, route\)/);
});

test("лид касания не переназначается нигде, кроме момента создания", () => {
  // Владелец: «лид фиксируется за тем, кто нажал кнопку с отправкой».
  // Проверяем весь путь переписки: ни одна запись в базу не трогает
  // закрепление. Иначе модель, закончив первичку, могла бы увести лид.
  for (const file of [
    "lib/admin/outreach-talk.ts",
    "lib/admin/outreach-talk-store.ts",
    "lib/admin/outreach-talk-run.ts",
    "lib/admin/outreach-queue.ts",
  ]) {
    // Комментарии вычёркиваем: они про это правило и говорят, и проверка,
    // спотыкающаяся о собственное объяснение, ничего не стережёт.
    const code = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /assigned_staff_id|assigned_to|claimed_by:/, file);
  }
});

test("ответ, не прошедший проверку, не отправляется — разговор отдаётся человеку", () => {
  const run = read("lib/admin/outreach-talk-run.ts");
  const problems = run.indexOf("const problems = replyProblems(");
  const handover = run.indexOf('handOver(\n      inbound.prospectId,\n      "bad_reply"');
  const queue = run.indexOf("await queueReply(");
  assert.ok(problems > 0 && handover > problems, "плохой ответ должен вести к передаче человеку");
  assert.ok(queue > handover, "отправка должна стоять после проверки, а не до неё");
});

test("вердикт по входящему не остаётся в чистой функции: он останавливает модель", () => {
  // Правило можно верно посчитать и не применить — тогда модель ответит
  // тому, кто попросил не писать, и аккаунт студии отправится в блокировку.
  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(store, /const verdict = readInbound\(body\);/);
  assert.match(store, /if \(verdict !== "talk" && prospect\.ai_handling\) \{[\s\S]{0,200}?ai_handling = false/);
  // И человек об этом узнаёт: разговор, тихо оставленный без ответа, для
  // клиента неотличим от «нами перестали заниматься».
  assert.match(store, /if \(verdict !== "talk"\) \{\s*\n\s+await tellManager\(/);
});

test("после «Отвечать самому» каждое сообщение клиента уходит тому, кто перехватил", () => {
  // Модель в таком разговоре молчит. Раньше обычный ответ клиента ложился в
  // переписку, и никто о нём не знал, пока не открывал карточку.
  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(store, /\} else if \(!prospect\.ai_handling\) \{[\s\S]{0,400}?await tellManager\(/);
  // Перехватить может руководитель или владелец — писать надо ему, а не
  // менеджеру касания.
  assert.match(store, /handover_reason: "менеджер отвечает сам", handled_by: staffId/);
  assert.match(store, /const to = p\?\.handled_by \?\? p\?\.claimed_by;/);
  assert.match(read("app/admin/leads/[id]/actions.ts"), /await takeOverTalk\(prospectId, staff\.id\);/);
  // Новое касание начинается с модели и без прежнего «отвечает сам».
  const outreach = read("lib/admin/outreach-store.ts");
  assert.equal((outreach.match(/ai_handling: true,\s*handover_reason: null,\s*handled_by: null,/g) ?? []).length, 2);
  assert.match(read("supabase/migrations/0058_prospect_handled_by.sql"), /add column if not exists handled_by uuid references public\.staff\(id\) on delete set null/);
});

test("свип думает, скаут носит: разделение обязанностей не размыто", () => {
  // На сайте — модель. У скаута пять зависимостей, и SDK модели среди них
  // быть не должно: он умеет только принять входящее и отдать исходящее.
  const runner = read("scout/runner.mjs");
  assert.doesNotMatch(runner, /@anthropic-ai\/sdk|runQualifyTurn/);
  assert.match(runner, /recordInbound/, "скаут должен записывать входящее");
  assert.match(runner, /nextReply/, "скаут должен отдавать ответы");
  assert.match(runner, /new NewMessage\(\{ incoming: true \}\)/, "личку надо слушать отдельно от чатов");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runTalks\(\)/);
});

test("ответ в своей переписке не расходует часовой предел холодных касаний", () => {
  // Ограничивают за первые письма незнакомым, а не за ответы тем, кто сам
  // написал. Считать их вместе значило бы молчать в ответ на вопрос клиента.
  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.doesNotMatch(talk, /HOURLY_CAP|sentLastHour/);
});
