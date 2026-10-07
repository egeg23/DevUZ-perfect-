/**
 * Касание в два шага: первым — только «Здравствуйте», письмо — тем, кто ответил.
 *
 * Владелец, 07.10.2026: «Сначала мы пишем просто — „Здравствуйте“. Если
 * ответ есть — тут уже пишем сообщение. Короткое. Либо кружок отправляем,
 * который ранее записали… Потому что отлетают по спаму аккаунты». После
 * ответа — «кружок + короткий текст»; без ответа — «ничего не шлём».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CIRCLE_AFTER_MS,
  HELLO_TEXT,
  PITCH_AFTER_MS,
  helloFor,
  pitchAfter,
  waitsForPitch,
  withoutGreeting,
} from "@/lib/admin/hello-first";
import { readInbound } from "@/lib/admin/outreach-talk";
import { OUTREACH_SYSTEM, outreachPrompt } from "@/lib/admin/outreach";
import { NOSITE_SYSTEM } from "@/lib/admin/outreach-nosite";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to?: string) => {
  const start = text.indexOf(from);
  assert.ok(start >= 0, `нет «${from}»`);
  const end = to ? text.indexOf(to, start + from.length) : -1;
  return text.slice(start, end >= 0 ? end : undefined);
};

test("первое сообщение — приветствие на языке письма", () => {
  assert.equal(helloFor("Пишу из DevUz Studio — открыл ваш сайт almazmed.uz."), HELLO_TEXT.ru);
  assert.equal(helloFor("Men DevUz Studio’danman. Saytingizni ochib ko‘rdim — u telefonda ochilmayapti, mijozlar ketib qolyapti."), HELLO_TEXT.uz);
  // Язык обхода сайта — главнее текста.
  assert.equal(helloFor("Пишу из DevUz Studio", "uz"), HELLO_TEXT.uz);
  assert.equal(helloFor("Men DevUz Studio’danman", "ru"), HELLO_TEXT.ru);
  assert.equal(HELLO_TEXT.ru, "Здравствуйте");
  assert.equal(HELLO_TEXT.uz, "Assalomu alaykum");
});

test("письмо после ответа — без второго приветствия", () => {
  assert.equal(withoutGreeting("Здравствуйте! Пишу из DevUz Studio."), "Пишу из DevUz Studio.");
  assert.equal(withoutGreeting("Здравствуйте.\n\nПишу из DevUz Studio."), "Пишу из DevUz Studio.");
  assert.equal(withoutGreeting("Добрый день, пишу из DevUz Studio."), "Пишу из DevUz Studio.");
  assert.equal(withoutGreeting("Assalomu alaykum! Men DevUz Studio’danman."), "Men DevUz Studio’danman.");
  // Не приветствие — не трогаем: «Hilton» начинается с «hi».
  assert.equal(withoutGreeting("Hilton Tashkent — открыл ваш сайт."), "Hilton Tashkent — открыл ваш сайт.");
  assert.equal(withoutGreeting("Пишу из DevUz Studio."), "Пишу из DevUz Studio.");
  // Письмо из одного приветствия не превращается в пустое.
  assert.equal(withoutGreeting("Здравствуйте!"), "Здравствуйте!");
});

test("на любой ответ на приветствие — письмо; на отказ и просьбу позвать человека — нет", () => {
  for (const reply of ["Да", "Здравствуйте", "Кто это?", "Assalomu alaykum", "Слушаю вас", "Va alaykum assalom"]) {
    assert.ok(pitchAfter(readInbound(reply)), reply);
  }
  assert.equal(pitchAfter("stop"), false);
  assert.equal(pitchAfter("human"), false);
  assert.equal(pitchAfter(readInbound("Не пишите мне больше")), false);
  assert.ok(CIRCLE_AFTER_MS < PITCH_AFTER_MS, "кружок раньше письма");
  assert.ok(CIRCLE_AFTER_MS >= 60_000, "мгновенный ответ выглядит как робот");

  assert.equal(waitsForPitch({ hello_at: "2026-10-07T10:00:00Z", pitch_at: null }), true);
  assert.equal(waitsForPitch({ hello_at: "2026-10-07T10:00:00Z", pitch_at: "2026-10-07T11:00:00Z" }), false);
  // Касания, где письмо ушло сразу (до правила), второго письма не получат.
  assert.equal(waitsForPitch({ hello_at: null, pitch_at: null }), false);
});

test("скаут из очереди пишет только приветствие и отмечает hello_at", () => {
  const runner = read("scout/runner.mjs");
  assert.match(runner, /await client\.sendMessage\(userId, \{ message: job\.hello \}\)/);
  assert.doesNotMatch(runner, /sendMessage\(userId, \{ message: job\.message \}\)/);
  const queue = read("lib/admin/outreach-queue.ts");
  assert.match(queue, /hello: helloFor\(String\(data\.message\), \(data\.walked as \{ lang\?: string \} \| null\)\?\.lang\)/);
  const sent = between(queue, "export async function markSent(", "export async function markDelivered(");
  assert.match(sent, /hello_at: new Date\(\)\.toISOString\(\)/);
  // В ленту — то, что ушло: приветствие, а не письмо.
  assert.match(sent, /body: helloFor\(String\(data\.message\), \(data\.walked/);
});

test("ответ на приветствие ставит кружок и письмо, модель в эту минуту молчит", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const save = between(talk, "async function saveInbound(", "/** Входящие, на которые ещё не отвечали");
  assert.match(save, /if \(hello && pitchAfter\(readInbound\(body\)\)\) return answerHello\(prospect, body\);/);
  const hello = between(talk, "async function answerHello(", "async function pitchQueued(");
  // Входящее сразу отвечено — pendingTalks его не возьмёт.
  assert.match(hello, /answered_at: at/);
  // Два быстрых ответа подряд не ставят письмо дважды.
  assert.match(hello, /\.update\(\{ replied_at: at, pitch_at: at \}\)\s*\.eq\("id", id\)\s*\.is\("pitch_at", null\)/);
  // Проверка по факту старше трёх дней — письмо не уходит, разговор человеку.
  assert.match(hello, /checkFresh\(/);
  assert.match(hello, /if \(!letter \|\| !fresh\)/);
  assert.match(hello, /kind: "circle"/);
  assert.match(hello, /send_after: new Date\(now \+ CIRCLE_AFTER_MS\)/);
  assert.match(hello, /send_after: new Date\(now \+ PITCH_AFTER_MS\)/);
  // Лид автопрогона — на ответ на письмо, не на «да?».
  assert.doesNotMatch(hello, /routeAutopilotReply/);
});

test("очередь ответов: пауза, кружок раньше письма, кружок без пересылки", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const next = between(talk, "export async function nextReply(", "export async function markReplySent(");
  assert.match(next, /row\.send_after && Date\.parse\(String\(row\.send_after\)\) > now/);
  assert.match(next, /kind: row\.kind === "circle" \? "circle" : "text"/);

  const runner = read("scout/runner.mjs");
  assert.match(runner, /filter: new Api\.InputMessagesFilterRoundVideo\(\)/);
  assert.match(runner, /client\.getMessages\("me"/);
  assert.match(runner, /await client\.sendFile\(reply\.target, \{ file: circle\.media \}\)/);
  // Нет кружка или он не ушёл — письмо уходит само, разговор человеку не передаётся.
  assert.match(runner, /await markCircleSkipped\(reply\.id, NO_CIRCLE\)/);
  assert.match(runner, /if \(reply\.kind === "circle"\) await markCircleSkipped\(reply\.id, `Кружок не ушёл: \$\{why\}`\);/);
  // Панель видит, есть ли кружок в «Избранном».
  assert.match(runner, /await recordCircle\(key, circle \? Number\(circle\.date\) \* 1000 : null\)/);
  assert.match(read("app/admin/accounts/page.tsx"), /circleStates\(\)/);
});

test("без ответа на приветствие — ничего: дожима нет", () => {
  const followup = read("lib/admin/outreach-followup.ts");
  assert.match(followup, /\.is\("replied_at", null\)\s*\/\/[\s\S]{0,300}?\.is\("hello_at", null\)/);
  // Правка письма, пока ушло только приветствие, правит само письмо, а не «Здравствуйте» в Telegram.
  const edit = read("lib/admin/outreach-edit.ts");
  assert.match(edit, /if \(p && waitsForPitch\(p\)\) \{/);
});

test("письмо короткое и не здоровается второй раз", () => {
  assert.match(OUTREACH_SYSTEM, /Не здоровайся второй раз/);
  assert.match(OUTREACH_SYSTEM, /от 45 до 70 слов/);
  assert.match(NOSITE_SYSTEM, /Не здоровайся второй раз/);
  const prompt = outreachPrompt({ host: "acme.uz", label: null, niche: null, findings: [], draft: null, sender: "Эльдар" });
  assert.match(prompt, /Не здоровайся: «Здравствуйте» уже ушло отдельным сообщением/);
  assert.doesNotMatch(prompt, /здоровайся без имени/);
});
