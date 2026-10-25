/**
 * Наши ссылки в сообщении клиенту — проверка до отправки (lib/admin/our-links.ts).
 *
 * Владелец, 25.10.2026, на cases.devuz.studio/enotmebel: «А почему 404?»
 * Ссылки набрали руками в ответе из карточки лида: Comfort Mebel живёт на
 * витрине, а Enotmebel там нет — это прототип, его кейс на devuz.studio.
 * YANGI KUN mebel получил пустую страницу.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { SHOWCASE_HOST, showcaseCases } from "@/lib/admin/mockups";
import { badOurLinks } from "@/lib/admin/our-links";
import { replyEditProblem } from "@/lib/admin/outreach-edit-request";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("письмо YANGI KUN mebel: Comfort на витрине есть, Enotmebel — нет, верная ссылка — кейс", () => {
  const letter =
    "• Comfort Mebel (300+ моделей): cases.devuz.studio/comfort\n• Enotmebel, 242 образца обивки: cases.devuz.studio/enotmebel\nПодскажите";
  assert.deepEqual(badOurLinks(letter), [{ link: "cases.devuz.studio/enotmebel", fix: "devuz.studio/ru/cases/enotmebel" }]);
});

test("каждый проект витрины и каждый кейс открываются: их ссылки не битые", () => {
  for (const item of showcaseCases()) assert.deepEqual(badOurLinks(`смотрите ${item.url}.`), [], item.url);
  for (const item of cases) assert.deepEqual(badOurLinks(`https://devuz.studio/uz/cases/${item.slug}, `), [], item.slug);
  // Главная витрины, страница пароля и подстраницы проекта — тоже её.
  assert.deepEqual(badOurLinks("cases.devuz.studio/ru cases.devuz.studio/engelberg www.cases.devuz.studio/mavera/access?next=1"), []);
  assert.ok(showcaseCases().every((c) => c.url!.startsWith(SHOWCASE_HOST)));
});

test("битая ссылка подсказывает верный адрес, когда проект узнаётся, иначе — только что её нет", () => {
  assert.deepEqual(badOurLinks("cases.devuz.studio/comfort-mebel"), [{ link: "cases.devuz.studio/comfort-mebel", fix: "cases.devuz.studio/comfort" }]);
  assert.deepEqual(badOurLinks("devuz.studio/ru/cases/enot!"), [{ link: "devuz.studio/ru/cases/enot", fix: "devuz.studio/ru/cases/enotmebel" }]);
  assert.deepEqual(badOurLinks("https://cases.devuz.studio/xyzzy)"), [{ link: "cases.devuz.studio/xyzzy", fix: null }]);
  // Чужой адрес, который только кончается на devuz.studio, и прототипы — не про это.
  assert.deepEqual(badOurLinks("mydevuz.studio/ru/cases/zzz devuz.studio/proto/abcdef123"), []);
});

test("проверка стоит до очереди: ответ из карточки, «Исправить» и «Написать клиенту в бот»", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const reply = talk.slice(talk.indexOf("export async function queueStaffReply("));
  assert.ok(reply.indexOf("badOurLinks(body)") > 0 && reply.indexOf("badOurLinks(body)") < reply.indexOf("serviceClient()"));
  assert.equal(replyEditProblem("cases.devuz.studio/enotmebel"), "bad_link");
  assert.equal(replyEditProblem("cases.devuz.studio/comfort"), null);
  const bot = read("lib/qualify/bot-inbox-store.ts");
  const write = bot.slice(bot.indexOf("export async function writeToClient("));
  assert.ok(write.indexOf('return "bot_bad_link"') > 0 && write.indexOf('return "bot_bad_link"') < write.indexOf("sendMessage("));
  assert.match(read("components/admin/talk-chat.tsx"), /t\.badLinkFix\(b\.link, b\.fix\)/);
});
