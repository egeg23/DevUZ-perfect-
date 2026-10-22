/**
 * ИИ-сотрудники: доводка к пилоту по аудиту 22.10.2026 — штампы и тире в
 * ответе, заявка, которая ушла без контакта, Instagram до проверки Meta,
 * готовность сервиса в панели.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { replyProblems, tidyReply } from "@/lib/ai-staff/checks";
import { igOpenFor } from "@/lib/ai-staff/instagram";
import { readiness } from "@/lib/ai-staff/readiness";

const facts = "Кухня от 4 500 000 сум. Мы делаем уникальный дизайн каждой кухни.";

test("штамп ИИ в ответе — второй заход, слова самой компании — можно", () => {
  assert.equal(replyProblems("У нас индивидуальный подход к каждому клиенту.", facts)[0]?.code, "ai_stamp");
  assert.deepEqual(replyProblems("Кухня от 4 500 000 сум.", facts), []);
  // «уникальный» есть в базе знаний клиента — это его слова.
  assert.deepEqual(replyProblems("Делаем уникальный дизайн каждой кухни.", facts), []);
});

test("тире дефисом с пробелами чинится, как длинное", () => {
  assert.equal(tidyReply("Работаем 9:00 - 19:00"), "Работаем 9:00-19:00");
  assert.equal(tidyReply("Доставка - бесплатно"), "Доставка, бесплатно");
  assert.equal(tidyReply("Шкаф-купе от 2 900 000 сум"), "Шкаф-купе от 2 900 000 сум");
  assert.equal(tidyReply("- первый пункт"), "- первый пункт");
});

test("заявка без контакта дописывается, а не теряет телефон", () => {
  const service = readFileSync(new URL("../lib/ai-staff/service.ts", import.meta.url), "utf8");
  assert.match(service, /!existing\.contact\.trim\(\) && result\.handoff\.contact/);
  assert.match(service, /updateLeadContact\(tenant\.id, existing\.id/);
  const store = readFileSync(new URL("../lib/ai-staff/store.ts", import.meta.url), "utf8");
  const fn = store.slice(store.indexOf("export async function updateLeadContact"), store.indexOf("export async function markLeadDelivered"));
  assert.match(fn, /\.eq\("tenant_id", tenantId\)/, "чужую заявку не поправить");
});

test("Instagram до проверки Meta — только кабинетам-тестерам", () => {
  assert.equal(igOpenFor("a", { public: null, testers: null }), false);
  assert.equal(igOpenFor("a", { public: null, testers: "b, a" }), true);
  assert.equal(igOpenFor("a", { public: "1", testers: null }), true);
  const page = readFileSync(new URL("../app/cabinet/channels/page.tsx", import.meta.url), "utf8");
  const start = readFileSync(new URL("../app/cabinet/instagram/start/route.ts", import.meta.url), "utf8");
  assert.match(page, /igConfigFor\(tenant\.id\)/);
  assert.match(start, /igConfigFor\(cabinet\.tenant\.id\)/);
});

test("готовность к пилоту: чего не хватает, видно без нажатий", () => {
  const rows = readiness({ botToken: false, webhookSecret: true, cipherKey: true, igKeys: true, igPublic: false, cards: false, undelivered: 3 });
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.equal(by.botToken.state, "missing");
  assert.equal(by.webhookSecret.state, "ok");
  assert.equal(by.instagram.state, "waiting");
  assert.equal(by.cards.state, "waiting");
  assert.equal(by.delivery.state, "missing");
  assert.equal(by.delivery.count, 3);
  const all = readiness({ botToken: true, webhookSecret: true, cipherKey: true, igKeys: true, igPublic: true, cards: true, undelivered: 0 });
  assert.ok(all.every((r) => r.state === "ok"));
});
