/**
 * Касание в два шага: первым — только «Здравствуйте», дальше — тем, кто ответил.
 *
 * Владелец, 07.10.2026: «Сначала мы пишем просто — „Здравствуйте“. Если
 * ответ есть — тут уже пишем сообщение. Короткое. Либо кружок отправляем,
 * который ранее записали… Потому что отлетают по спаму аккаунты». Без
 * ответа — «ничего не шлём».
 *
 * Владелец, 08.10.2026: «если после „Здравствуйте“ нам ответили на русском
 * — „Здравствуйте“ или аналогично на русском, — то уходит кружок. Если
 * ответили на другом языке — мы отвечаем на этом языке, как обычно пишем».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CIRCLE_AFTER_MS,
  CIRCLE_BODY,
  CIRCLE_LANG,
  HELLO_TEXT,
  PITCH_AFTER_MS,
  circleFailText,
  helloFor,
  letterLang,
  pitchAfter,
  replyLang,
  waitsForPitch,
  withoutGreeting,
} from "@/lib/admin/hello-first";
import { circleDue } from "@/lib/admin/circle-store";
import { circleProblem } from "@/lib/admin/circle-rules";
import { translationProblems } from "@/lib/admin/letter-translate";
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

test("на любой ответ на приветствие — кружок или письмо; на отказ и просьбу позвать человека — нет", () => {
  for (const reply of ["Да", "Здравствуйте", "Кто это?", "Assalomu alaykum", "Слушаю вас", "Va alaykum assalom"]) {
    assert.ok(pitchAfter(readInbound(reply)), reply);
  }
  assert.equal(pitchAfter("stop"), false);
  assert.equal(pitchAfter("human"), false);
  assert.equal(pitchAfter(readInbound("Не пишите мне больше")), false);
  assert.ok(CIRCLE_AFTER_MS <= PITCH_AFTER_MS, "кружок не позже письма");
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

test("язык ответа: по-русски — кружок, на другом языке — письмо, без слов — язык приветствия", () => {
  assert.equal(CIRCLE_LANG, "ru");
  for (const reply of ["Здравствуйте", "Да?", "Кто это?", "Слушаю вас", "Добрый день"]) assert.equal(replyLang(reply, "ru"), "ru", reply);
  for (const reply of ["Assalomu alaykum", "Va alaykum assalom", "Ha", "Ассалому алайкум", "Салом"]) assert.equal(replyLang(reply, "ru"), "uz", reply);
  assert.equal(replyLang("Hello, who is this?", "ru"), "en");
  // Стикер, «+», «?» — отвечают на то, что им написали.
  assert.equal(replyLang("+", "ru"), "ru");
  assert.equal(replyLang("👍", "uz"), "uz");
  assert.equal(replyLang("?", "ru"), "ru");
  // Язык письма — тот же, что решает «Здравствуйте».
  assert.equal(letterLang("Пишу из DevUz Studio", "uz"), "uz");
  assert.equal(letterLang("Пишу из DevUz Studio — открыл ваш сайт almazmed.uz."), "ru");
});

test("«+» и «да» на кружок — согласие на макет, «макет не нужен» — отказ", () => {
  for (const reply of ["+", "++", "+ ", "➕", "Плюс"]) assert.equal(readInbound(reply), "proto", reply);
  for (const reply of ["Да", "Давайте", "Ha", "Хочу", "Интересно, давайте"]) {
    assert.equal(readInbound(reply, { afterCircle: true }), "proto", reply);
  }
  // Без кружка короткое «да» по-прежнему разбирает человек, вопрос — модель.
  assert.equal(readInbound("Да"), "unclear");
  assert.equal(readInbound("да?", { afterCircle: true }), "talk");
  assert.equal(readInbound("Хочу макет"), "proto");
  assert.equal(readInbound("Макет не нужен"), "stop");
  assert.equal(readInbound("Нам не нужен сайт"), "stop");
  // Номер телефона с «+» — не согласие.
  assert.notEqual(readInbound("+998901234567"), "proto");
  // Модель знает, что было в кружке: видео она не видит.
  assert.match(CIRCLE_BODY, /бесплатно за 12 часов/);
  assert.match(CIRCLE_BODY, /«\+»/);
});

test("ответ на приветствие: по-русски — кружок без письма, иначе — письмо на языке ответа", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const save = between(talk, "async function saveInbound(", "/** Входящие, на которые ещё не отвечали");
  assert.match(save, /if \(hello && pitchAfter\(readInbound\(body\)\)\) return answerHello\(prospect, body\);/);
  assert.match(save, /const afterCircle = prospect\.pitch_at \? await circleWasPitch\(/);
  const hello = between(talk, "async function answerHello(", "/** Письмо после «Здравствуйте» ещё ждёт отправки. */");
  // Входящее сразу отвечено — pendingTalks его не возьмёт.
  assert.match(hello, /answered_at: at/);
  // Два быстрых ответа подряд не ставят ничего дважды.
  assert.match(hello, /\.update\(\{ replied_at: at, pitch_at: at \}\)\s*\.eq\("id", id\)\s*\.is\("pitch_at", null\)/);
  assert.match(hello, /const lang = replyLang\(body, sentLang\);/);
  // Русский ответ — только кружок, и сразу выход: письма за ним нет.
  const ru = between(hello, "if (lang === CIRCLE_LANG) {", "const queued = await queueHelloLetter(");
  assert.match(ru, /kind: "circle"/);
  assert.match(ru, /send_after: new Date\(now \+ CIRCLE_AFTER_MS\)/);
  assert.match(ru, /return \{ matched: true, host, verdict: "hello" \};/);
  assert.doesNotMatch(ru, /kind: "text"/);
  assert.match(hello, /await queueHelloLetter\(prospect, lang, now \+ PITCH_AFTER_MS, body\)/);
  // Письмо — после проверки по факту и на языке ответа.
  const letter = between(hello, "async function queueHelloLetter(", "const LANG_LABEL");
  assert.match(letter, /checkFresh\(/);
  assert.match(letter, /if \(!fresh\) return handOverHello\(/);
  assert.match(letter, /if \(lang !== sentLang\) \{[\s\S]{0,300}?translateLetter\(letter, lang, host\)/);
  assert.match(letter, /kind: "text"/);
  // Лид автопрогона — на ответ на кружок или письмо, не на «да?».
  assert.doesNotMatch(hello, /routeAutopilotReply/);
});

test("кружок не ушёл — вместо него письмо на языке ответа", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const skipped = between(talk, "export async function markCircleSkipped(", "/**\n * Ответ не ушёл.");
  // Письмо уже стоит или ушло (старые касания: кружок перед письмом) — второго нет.
  assert.match(skipped, /\.eq\("kind", "text"\)\s*\.in\("status", \["queued", "sent"\]\)/);
  // Владелец, 09.10.2026: «У кого запрещены голосовые и кружки, пишем на
  // языке ответа» — язык берётся из последнего ответа клиента.
  assert.match(skipped, /\.eq\("direction", "in"\)\s*\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(skipped, /const lang = inbound \? replyLang\(String\(inbound\.body \?\? ""\), sentLang\) : CIRCLE_LANG;/);
  assert.match(skipped, /await queueHelloLetter\(prospect, lang, Date\.now\(\)/);
  assert.match(skipped, /const why = circleFailText\(reason\);/);
  // Дослали кружок тем, кому уже ушло письмо, — счёт писем с ответа на
  // «Здравствуйте» (pitch_at), иначе при неудачном кружке ушёл бы дубль.
  assert.match(skipped, /select\("pitch_at"\)/);
  assert.match(skipped, /\.gte\("created_at", since\)/);
});

test("перевод письма не добавляет фактов", () => {
  const source = "Посмотрели almazmed.uz: с телефона сайт открывается в масштабе монитора, из 100 посетителей теряется 20–35. Собрать вам прототип за 12 часов?";
  assert.deepEqual(translationProblems("almazmed.uz saytini ko‘rdik: telefonda sayt monitor masshtabida ochiladi, 100 tashrifchidan 20–35 tasi yo‘qoladi. 12 soatda prototip yig‘ib beraylikmi?", source, "almazmed.uz"), []);
  assert.ok(translationProblems("almazmed.uz saytini ko‘rdik: 100 tashrifchidan 50 tasi yo‘qoladi, 12 soatda prototip yig‘ib beraylikmi? Bu juda muhim masala.", source, "almazmed.uz").some((p) => p.startsWith("числа")));
});

test("кружок загружают в «Аккаунтах», в «Избранное» его кладёт скаут", () => {
  assert.equal(circleProblem({ mime: "video/mp4", bytes: 6_000_000, duration: 45.3, width: 400, height: 400 }), null);
  assert.equal(circleProblem({ mime: "video/quicktime", bytes: 6_000_000, duration: 45, width: 400, height: 400 }), "type");
  assert.equal(circleProblem({ mime: "video/mp4", bytes: 6_000_000, duration: 75, width: 400, height: 400 }), "long");
  assert.equal(circleProblem({ mime: "video/mp4", bytes: 6_000_000, duration: 45, width: 1920, height: 1080 }), "shape");
  assert.equal(circleProblem({ mime: "video/mp4", bytes: 6_000_000, duration: null, width: null, height: null }), "meta");

  const file = { path: "x.mp4", bytes: 1, duration: 45, width: 400, height: 400, uploadedAt: 1_000, by: null };
  assert.equal(circleDue(file, null), true, "кружка нет — кладём");
  assert.equal(circleDue(file, 500), true, "в «Избранном» старый — кладём");
  assert.equal(circleDue(file, 2_000), false, "в «Избранном» новее — его не перебиваем");
  assert.equal(circleDue(null, null), false);

  const runner = read("scout/runner.mjs");
  const place = between(runner, "const placeCircle = async", "const checkCircle = async");
  assert.match(place, /client\.sendFile\("me", \{/);
  assert.match(place, /new Api\.DocumentAttributeVideo\(\{\s*roundMessage: true/);
  // Флаг videoNote в teleproto добавляет «голосовое» — кружок стал бы аудио.
  assert.doesNotMatch(place, /videoNote/);
  assert.match(read("app/admin/accounts/page.tsx"), /<CircleUpload have=/);
});

test("очередь ответов: пауза, кружок раньше письма, кружок без пересылки", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const next = between(talk, "export async function nextReply(", "export async function markReplySent(");
  assert.match(next, /row\.send_after && Date\.parse\(String\(row\.send_after\)\) > now/);
  assert.match(next, /kind: row\.kind === "circle" \? "circle" : "text"/);

  const runner = read("scout/runner.mjs");
  assert.match(runner, /filter: new Api\.InputMessagesFilterRoundVideo\(\)/);
  assert.match(runner, /client\.getMessages\("me"/);
  assert.match(runner, /await toPeer\(reply, \(to\) => client\.sendFile\(to, \{ file: circle\.media \}\)\)/);
  assert.match(runner, /await toPeer\(reply, \(to\) => client\.sendMessage\(to, \{ message: reply\.body \}\)\)/);
  // Нет кружка или он не ушёл — вместо него письмо, разговор человеку не передаётся.
  assert.match(runner, /await markCircleSkipped\(reply\.id, NO_CIRCLE\)/);
  assert.match(runner, /if \(reply\.kind === "circle"\) await markCircleSkipped\(reply\.id, `Кружок не ушёл: \$\{why\}`\);/);
  // Панель видит, есть ли кружок в «Избранном».
  assert.match(runner, /await recordCircle\(key, circle \? Number\(circle\.date\) \* 1000 : null\)/);
  assert.match(read("app/admin/accounts/page.tsx"), /circleStates\(\)/);
});

test("собеседника нет в кэше после перезапуска — диалоги, потом @адрес", () => {
  // 08.10.2026 после выкатки четыре кружка и письмо упали с «Could not find
  // the input entity»: номер пользователя Telegram находит только по кэшу
  // сессии, а он живёт в памяти скаута.
  const runner = read("scout/runner.mjs");
  const peer = between(runner, "const toPeer = async", "const placeCircle = async");
  assert.ok(peer.indexOf("client.getDialogs(") > 0, "сначала грузим диалоги");
  assert.ok(peer.indexOf("client.getDialogs(") < peer.indexOf("send(reply.fallback)"), "@адрес — последним");
  assert.match(peer, /if \(!lostPeer\(error\)\) throw error;/, "другие ошибки не глушим");
  assert.match(runner, /function lostPeer\(error\) \{\s*return \/input entity\/i\.test/);

  const next = between(read("lib/admin/outreach-talk-store.ts"), "export async function nextReply(", "export async function markReplySent(");
  assert.match(next, /fallback: handle !== to && handle\.startsWith\("@"\) \? handle : undefined/);
});

test("запрет голосовых — понятная причина в ленте, а не код Telegram", () => {
  const text = circleFailText("VOICE_MESSAGES_FORBIDDEN");
  assert.match(text, /запретил голосовые и видеосообщения/);
  assert.match(text, /на языке ответа/);
  assert.doesNotMatch(text, /VOICE_MESSAGES_FORBIDDEN/);
  // Остальные причины — как есть.
  assert.equal(circleFailText("Кружок не ушёл: FLOOD_WAIT"), "Кружок не ушёл: FLOOD_WAIT");
  // Ответ по-узбекски — письмо по-узбекски, стикер — на языке приветствия.
  assert.equal(replyLang("Assalomu alaykum, kim bu?", "ru"), "uz");
  assert.equal(replyLang("👍", "ru"), "ru");
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
