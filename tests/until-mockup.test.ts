/**
 * Касание автопрогона: до согласия на макет переписку ведёт модель, лид —
 * только на ясный ответ.
 *
 * Владелец, 13.10.2026 (remont-chasov.uz: лид завёлся на «Добрый вечер»):
 * «лид ответил „здравствуйте“ и тут же он становится лидом, без ответа
 * согласен / не согласен? Мы по одному сообщению не можем определить.
 * Пусть ИИ ведёт переписку до макета, дальше мы».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { LEAD_ON } from "@/lib/admin/autopilot-reply";
import { readInbound, talkNote } from "@/lib/admin/outreach-talk";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to: string) => {
  const start = text.indexOf(from);
  return text.slice(start, text.indexOf(to, start + from.length));
};

test("лид — только на ясный ответ: макет, позвоните, пришлите", () => {
  assert.deepEqual([...LEAD_ON].sort(), ["human", "proto", "proto_ready", "send"]);
  // Что именно сегодня завело лид, — и что заведёт теперь.
  assert.equal(readInbound("Добрый вечер", { stage: "circle" }), "unclear");
  assert.equal(readInbound("Какие идеи?", { stage: "letter" }), "talk");
  // Ответ на кружок — разбор, лида ещё нет: он заведётся на «+» к разбору.
  assert.equal(readInbound("+", { stage: "circle" }), "breakdown");
  assert.ok(!LEAD_ON.has("unclear") && !LEAD_ON.has("talk") && !LEAD_ON.has("breakdown"), "приветствие, вопрос и разбор лида не заводят");
  assert.equal(readInbound("+", { stage: "letter" }), "proto");
  assert.equal(readInbound("Давайте", { stage: "letter" }), "proto");
  assert.equal(readInbound("Позвоните мне завтра"), "human");
});

test("до лида ни согласия, ни отказа — касание ничьё, отметки нет", () => {
  const reply = read("lib/admin/autopilot-reply.ts");
  const route = between(reply, "export async function routeAutopilotReply", "/**\n * Модель отпустила");
  // Проверка «ни да, ни нет» — до условной отметки autopilot_replied_at:
  // иначе следующий ответ («+») уже не завёл бы лид.
  assert.ok(route.indexOf('!LEAD_ON.has(verdict)') < route.indexOf('update({ autopilot_replied_at'));
  assert.match(route, /return mine \? \{ kind: "ai" \} : null;/);
  assert.match(route, /verdict === "stop"\) return \{ kind: "refused" \}/, "«не пишите» — по-прежнему не лид");
});

test("короткое «Добрый вечер» до лида — модели, а не человеку", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  const save = between(store, "async function saveInbound", "/**\n * Клиент ответил на «Здравствуйте»");
  assert.match(save, /const aiLeads = untilMockup\(prospect\);/);
  assert.match(save, /aiLeads && read === "unclear" \? "talk" : read/);
  const until = between(store, "export function untilMockup", "\n}\n");
  assert.match(until, /Boolean\(p\.autopilot_at\) && !p\.lead_id && !p\.claimed_by && p\.ai_handling !== false/);
  // Ручной ввод ответа тоже знает, чьё касание.
  assert.match(between(store, "export async function recordManualInbound", "/**"), /lead_id, claimed_by, ai_handling/);
});

test("модель отпустила разговор до лида — лид заводится, а не теряется", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  const hand = between(store, "export async function handOver", "/**\n * Касание автопрогона, по которому");
  assert.ok(hand.indexOf("leadOnHandover(") > 0 && hand.indexOf("leadOnHandover(") < hand.indexOf("tellManager("));
  const reply = read("lib/admin/autopilot-reply.ts");
  const lead = between(reply, "export async function leadOnHandover", "/** Отдать лид");
  assert.match(lead, /\.is\("autopilot_replied_at", null\)/, "один лид на касание");
  assert.match(lead, /\.is\("claimed_by", null\)/, "взятое касание ведёт тот, кто взял");
  assert.match(lead, /await offerLead\(prospectId, leadId, body\)/, "в очередь на тёплые лиды");
});

test("в карточке лида — вся переписка до него", () => {
  const reply = read("lib/admin/autopilot-reply.ts");
  const create = reply.slice(reply.indexOf("async function createLead"));
  assert.match(create, /\.from\("outreach_messages"\)\s*\.select\("direction, body"\)/);
  assert.match(create, /Переписка до лида:/);
  assert.match(create, /^\s+transcript,$/m);
});

test("заметка модели до макета: цель — «+», без цен, без созвона", () => {
  const base = {
    host: "remont-chasov.uz",
    label: "Ремонт часов",
    findings: [{ title: "Нет кнопки записи", impact: "покупатель не может записаться с телефона" }],
    firstMessage: "",
    managerName: "менеджер студии",
    repliesSoFar: 1,
  };
  const note = talkNote({ ...base, untilMockup: true });
  assert.match(note, /довести разговор до согласия на макет/);
  assert.match(note, /отправьте «\+»/);
  assert.match(note, /Цен не называй/);
  assert.match(note, /Нет кнопки записи/);
  // Кружок обещает расписать ошибки (владелец, 22.10.2026): модель знает это
  // и на «какие ошибки?» отвечает находками, а не обещанием макета.
  assert.match(note, /Разбора ещё не было: «Здравствуйте» и видеокружок, где мы обещали расписать ошибки/);
  assert.match(note, /нашли пару ошибок/);
  assert.doesNotMatch(note, /созвон/, "следующий шаг — макет, а не созвон");
  // Обычная заметка менеджерского касания — как раньше.
  assert.match(talkNote(base), /короткий созвон/);

  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /untilMockup: inbound\.untilMockup/);
  assert.match(read("lib/admin/outreach-talk-store.ts"), /untilMockup: untilMockup\(p\)/);
});

test("два сообщения подряд — один ответ модели, на последнее", () => {
  const run = read("lib/admin/outreach-talk-run.ts");
  const answer = run.slice(run.indexOf("async function answerOne"));
  assert.ok(answer.indexOf("laterInbound(") > 0 && answer.indexOf("laterInbound(") < answer.indexOf("runQualifyTurn("));
  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(between(store, "export async function laterInbound", "\n}\n"), /\.gt\("created_at", createdAt\)/);
});
