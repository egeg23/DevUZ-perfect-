/**
 * Ответ компании без сайта: письмо вместо кружка, разговор — человеку, а не в
 * пустоту (lib/admin/outreach-talk-store.ts).
 *
 * Владелец, 25.10.2026, на переписку с Koshona Premium Mebel: «А почему бот
 * молчит?» Сайта у Koshona нет, касание завели по карточке на картах. На
 * «Здравствуйте» ушёл кружок «посмотрели ваш сайт, нашли ошибки», клиент
 * спросил «Какую сайт открыли? Ну-ка покажите», а бот отдал разговор человеку
 * «проверке сайта больше трёх дней» — проверки без сайта нет вовсе. Касание
 * автопрогона до лида ничьё, и строке человеку идти было некуда: так с
 * 23.10.2026 молча ждали ответа 13 компаний без сайта.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { withoutSite } from "@/lib/admin/outreach-talk-store";

const store = readFileSync(new URL("../lib/admin/outreach-talk-store.ts", import.meta.url), "utf8");
const block = (from: string, to: string) => store.slice(store.indexOf(from), store.indexOf(to, store.indexOf(from)));

test("без сайта — тот же признак, что у письма от ниши (writeLetterLater)", () => {
  assert.equal(withoutSite({ host: null, url: null }), true);
  assert.equal(withoutSite({ host: "koshona.uz", url: null }), true);
  assert.equal(withoutSite({ host: "koshona.uz", url: "https://koshona.uz" }), false);
  assert.match(
    readFileSync(new URL("../lib/admin/outreach-store.ts", import.meta.url), "utf8"),
    /if \(!prospect\.host \|\| !prospect\.url\) \{/,
  );
});

test("на «Здравствуйте» компании без сайта — письмо, а не кружок про сайт", () => {
  const hello = block("async function answerHello(", "async function answerCircle(");
  assert.match(hello, /const circle = withoutSite\(prospect\) \? null : circleLangFor\(lang\);/);
  assert.match(hello, /queueHelloLetter\(prospect, lang, now \+ PITCH_AFTER_MS, body\)/);
});

test("письмо без сайта не ждёт проверки сайта, а нет письма — честная причина", () => {
  const letter = block("async function queueHelloLetter(", "const LANG_LABEL");
  assert.match(letter, /const noSite = withoutSite\(prospect\);/);
  assert.match(letter, /if \(!fresh && !noSite\) return handOverHello\(/);
  assert.match(letter, /noSite \? `\$\{onWhat\}, а сайта у компании нет/);
  // Письмо от ниши пишет свип: отметка letter_wanted стоит после проверки свежести.
  assert.ok(letter.indexOf("if (!fresh && !noSite)") < letter.indexOf("letter_wanted: lang"));
});

test("разговор, который бот отпустил, — человеку: ничьё касание автопрогона становится лидом", () => {
  const human = block("async function toHuman(", "/** Общий хвост");
  assert.ok(human.indexOf("leadOnHandover(") > 0 && human.indexOf("leadOnHandover(") < human.indexOf("tellManager("), "сначала лид, потом строка");
  const letter = block("async function queueHelloLetter(", "const LANG_LABEL");
  assert.match(letter, /await toHuman\(id, `Ответ по \$\{touchName\(prospect\)\}/);
  assert.doesNotMatch(letter, /await tellManager\(/, "строка в обход очереди на тёплые лиды");
  const inbound = block("async function saveInbound(", "async function answerHello(");
  assert.match(inbound, /await toHuman\(String\(prospect\.id\), `\$\{writesAgain\(prospect\.closed_reason\)\}/);
  assert.match(inbound, /await toHuman\(String\(prospect\.id\), `Ответ по \$\{touchName\(prospect\)\}/);
});

test("все пути ответа клиента знают, есть ли сайт: url — в каждом выборе касания", () => {
  assert.match(store, /const PROSPECT_FIELDS =\s*"id, host, url, label,/);
  for (const select of store.matchAll(/\.select\("(id, host[^"]*)"\)/g)) {
    if (/checked_at|ai_handling, closed_reason/.test(select[1])) assert.match(select[1], /\burl\b/, select[1]);
  }
});

test("имя касания без сайта — название компании, а не «null»: в строке человеку и в контактах рабочего аккаунта", () => {
  assert.match(store, /<b>Касание · \$\{esc\(touchName\(p\)\)\}<\/b>/);
  const queue = readFileSync(new URL("../lib/admin/outreach-queue.ts", import.meta.url), "utf8");
  assert.match(queue, /host: String\(data\.host \?\? data\.label \?\? ""\)/);
  assert.match(queue, /QUEUED_COLUMNS = "[^"]*\blabel\b/);
});
