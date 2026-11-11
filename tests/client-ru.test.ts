/**
 * Слова клиента бота — ещё и по-русски, для команды.
 *
 * Владелец, 11.11.2026: «Если у нас клиент общается с ботом — можно перевод
 * на русский тоже сделать что пишет клиент?»
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { inboxNotice, nightNotice } from "@/lib/qualify/bot-inbox-store";
import { clientRu, ruProblems, wantsRu } from "@/lib/qualify/client-ru";
import { ownerNotice } from "@/lib/qualify/lead-owner-notify";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const client = { chatId: 1, name: "Shahzod", username: "floraedu" };

test("перевод нужен узбекскому и английскому, не нужен русскому, адресу и эмодзи", () => {
  assert.equal(wantsRu("Sayt qancha turadi?"), true);
  assert.equal(wantsRu("Сайт қанча туради?"), true);
  assert.equal(wantsRu("How much does an online store cost?"), true);
  assert.equal(wantsRu("Сколько стоит сайт?"), false);
  assert.equal(wantsRu("https://floraedu.uz"), false);
  assert.equal(wantsRu("floraedu.uz"), false);
  assert.equal(wantsRu("+998 90 123 45 67"), false);
  assert.equal(wantsRu("👍👍"), false);
  assert.equal(wantsRu("ok"), false);
});

test("перевод годится, только если он русский и без новых чисел", () => {
  assert.deepEqual(ruProblems("Сколько стоит сайт?", "Sayt qancha turadi?"), []);
  assert.ok(ruProblems("Sayt qancha turadi?", "Sayt qancha turadi?").includes("не по-русски"));
  assert.ok(ruProblems("Сайт за 500 долларов?", "Sayt qancha?").includes("число, которого не было"));
  assert.deepEqual(ruProblems("Сайт за 500 долларов?", "Sayt 500 dollarmi?"), []);
  assert.ok(ruProblems("Сайт қанча?", "Sayt qancha?").includes("узбекская кириллица"));
});

test("clientRu: модель зовётся только на нерусское, плохой ответ отбрасывается, повтор из памяти", async () => {
  let calls = 0;
  const ask = async (text: string) => {
    calls += 1;
    return text.startsWith("Narxi") ? "«Сколько стоит?»" : "Sayt kerak";
  };
  assert.equal(await clientRu("Сколько стоит?", ask), null);
  assert.equal(calls, 0, "русский текст модели не отдаём");
  assert.equal(await clientRu("Narxi qancha, aka?", ask), "Сколько стоит?", "кавычки модели сняты");
  assert.equal(await clientRu("Narxi  qancha, aka?", ask), "Сколько стоит?");
  assert.equal(calls, 1, "одно и то же сообщение переводим один раз");
  assert.equal(await clientRu("Menga sayt kerak edi", ask), null, "ответ не по-русски — строки нет");
  assert.equal(await clientRu("Yangi sayt kerakmi", async () => null), null, "модель не ответила — строки нет");
  assert.equal(await clientRu("Biz bilan bog'laning", async () => { throw new Error("down"); }), null);
});

test("строка «🇷🇺 Перевод» стоит под словами клиента во всех трёх уведомлениях и экранирована", () => {
  const lead = { id: "L1", requestNo: "DZ-1", label: "FloraEdu" };
  const inbox = inboxNotice({ client, text: "Narxi qancha?", botReply: null, lead, human: null, ru: "Сколько <b>стоит</b>?" });
  assert.match(inbox, /«Narxi qancha\?»\n🇷🇺 Перевод: «Сколько &lt;b&gt;стоит&lt;\/b&gt;\?»/);
  const night = nightNotice({ client, text: "Narxi qancha?", at: "2026-11-10T20:00:00Z", lead, ru: "Сколько стоит?" });
  assert.match(night, /Последнее: «Narxi qancha\?»\n🇷🇺 Перевод: «Сколько стоит\?»/);
  const owner = ownerNotice({ label: "FloraEdu", requestNo: "DZ-1", leadId: "L1", text: "Narxi qancha?", ru: "Сколько стоит?" });
  assert.match(owner, /«Narxi qancha\?»\n🇷🇺 Перевод: «Сколько стоит\?»/);
});

test("без перевода уведомления как раньше", () => {
  const inbox = inboxNotice({ client, text: "Сколько стоит?", botReply: null, lead: null, human: null });
  assert.doesNotMatch(inbox, /Перевод/);
  const owner = ownerNotice({ label: "FloraEdu", requestNo: null, leadId: "L1", text: "Сколько стоит?" });
  assert.doesNotMatch(owner, /Перевод/);
  assert.equal(owner.split("\n")[2], "", "пустая строка перед ссылкой на месте");
});

test("перевод — недорогой моделью, переменная в compose и .env.example, клиенту не уходит", () => {
  const src = read("lib/qualify/client-ru.ts");
  assert.match(src, /CLIENT_RU_MODEL \|\| "claude-haiku-4-5"/);
  assert.match(read("docker-compose.yml"), /CLIENT_RU_MODEL: \$\{CLIENT_RU_MODEL:-\}/);
  assert.match(read(".env.example"), /^CLIENT_RU_MODEL=$/m);
  assert.doesNotMatch(src, /sendMessage|copyMessage/, "модуль только переводит, сам ничего не шлёт");
  const inbox = read("lib/qualify/bot-inbox-store.ts");
  assert.match(inbox, /clientRu\(input\.text\)/, "обращение в бота");
  assert.match(inbox, /clientRu\(String\(u\.last_text\)\)/, "ночная сводка");
  assert.match(read("lib/qualify/lead-owner-notify.ts"), /ru: await clientRu\(input\.text\)/, "хозяину лида");
});
