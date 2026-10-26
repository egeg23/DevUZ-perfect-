/**
 * Модель молчит — бот не теряет клиента.
 *
 * 26.10.2026 прокси proxy6 умер, ProxyAPI остался без денег (402), и
 * клиентка в 12:07 и 12:08 («нам нужен свой интернет-магазин») дважды
 * получила «Напишите ещё раз — обычно со второго всё проходит», а до
 * владельца и руководителя её слова не дошли: обращение уходило только
 * после ответа модели. Владелец: «Разберись»; «У нас proxy6.net
 * закончился. Замени».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { botCopy } from "@/content/bot";
import { modelTrouble } from "@/lib/model-trouble";
import { MODEL_DOWN_LINE, inboxNotice } from "@/lib/qualify/bot-inbox-store";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("402 шлюза — это «кончились деньги», а не дефект: чат на сайте покажет форму, касание повторят", () => {
  const error = new Anthropic.APIError(402, { detail: "Insufficient balance to run this request." }, "402", undefined);
  const trouble = modelTrouble(error);
  assert.equal(trouble?.kind, "billing");
  assert.match(trouble?.says ?? "", /ProxyAPI/);
  assert.doesNotMatch(trouble?.says ?? "", /Insufficient balance/, "сырой ответ шлюза до сотрудника не доходит");
});

test("клиенту — «передали менеджеру» на каждом языке бота, без длинных тире", () => {
  for (const locale of ["ru", "en", "uz", "zh", "uk", "pl"] as const) {
    const later = botCopy(locale).later;
    assert.ok(later.length > 10, locale);
    assert.doesNotMatch(later, /[—–]| - /, `${locale}: длинное тире`);
    assert.doesNotMatch(later, /ещё раз|again|yana yuboring/i, `${locale}: просим написать снова`);
  }
  assert.doesNotMatch(botCopy("uz").later, /[а-яё]/i, "узбекский — латиницей");
});

test("обращение без ответа модели помечено: отвечать человеку", () => {
  const client = { chatId: 1, name: "Аnna", username: "a_zakirova" };
  const notice = inboxNotice({ client, text: "нам нужен свой интернет-магазин", botReply: null, lead: null, human: null, modelDown: true });
  assert.ok(notice.includes(MODEL_DOWN_LINE));
  assert.match(notice, /интернет-магазин/);
  assert.doesNotMatch(notice, /Бот ответил/);
  // Обычное обращение — как было.
  const usual = inboxNotice({ client, text: "привет", botReply: "Здравствуйте!", lead: null, human: null });
  assert.ok(!usual.includes(MODEL_DOWN_LINE));
  assert.match(usual, /Бот ответил/);
});

test("ответ бота: сбой и пустой ответ модели — через modelSilent, обращение уходит с пометкой", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  const respond = route.slice(route.indexOf("async function respond("), route.indexOf("async function modelSilent("));
  assert.doesNotMatch(respond, /copy\.error/, "клиенту снова уйдёт «напишите ещё раз»");
  assert.equal((respond.match(/await modelSilent\(/g) ?? []).length, 2, "и сбой, и пустой ответ");
  const silent = route.slice(route.indexOf("async function modelSilent("), route.indexOf("function channelNote("));
  assert.match(silent, /copy\.later/);
  assert.match(silent, /notifyInbox\(\{[^}]*modelDown: true/);
  assert.match(silent, /tellLeadOwner/, "хозяину взятого лида — тоже");
  assert.match(silent, /saveSession/, "слова клиента не теряются для модели, когда она вернётся");
});

test("замена прокси: пароль — из хранилища на сервере, не из репозитория и не из полей задачи", () => {
  const wf = read(".github/workflows/vps-proxy.yml");
  assert.match(wf, /workflow_dispatch/);
  assert.match(wf, /app\.HTTPS_PROXY/, "список берётся из хранилища");
  assert.doesNotMatch(wf, /inputs\.(proxy|password|login)/, "логин и пароль во входных полях видны всем");
  assert.match(wf, /-K -/, "прокси в curl — через stdin, не аргументом");
  assert.match(wf, /hostof/, "в лог — только адрес");
  assert.doesNotMatch(wf, /echo "[^"]*\$(PICK|LINE|LIST|RAW|NEW)\b/, "прокси с паролем напечатан в лог");
  assert.match(wf, /\.devuz-env-backups/, "прежний .env остаётся копией");
  assert.match(read(".github/workflows/deploy-vps.yml"), /- "\.github\/workflows\/vps-proxy\.yml"/, "ручная задача не запускает выкатку");
});
