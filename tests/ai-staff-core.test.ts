/**
 * ИИ-сотрудники: чистая часть — тарифы, язык, часы, проверка ответа, движок.
 * docs/ai-staff/design.md.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import type Anthropic from "@anthropic-ai/sdk";

import { inventedNumbers, replyProblems, tidyReply } from "@/lib/ai-staff/checks";
import { disclosure, handedOff } from "@/lib/ai-staff/copy";
import { newRequestNo, openToken, sealToken } from "@/lib/ai-staff/crypto";
import { factsFor, parseHandOff, runSalesTurn, toMessages, type ModelCall, type Turn } from "@/lib/ai-staff/engine";
import { isWorkTime, parseHours } from "@/lib/ai-staff/hours";
import { langOf, talkLang } from "@/lib/ai-staff/lang";
import { PLANS, extendPaid, formatUzs, modelFor, monthKey, stopReason, usageCostUsd, usageSite } from "@/lib/ai-staff/plans";
import { buildSystemPrompt, knowledgeText, type PromptInput } from "@/lib/ai-staff/prompt";

const prompt: PromptInput = {
  company: "Мебель Плюс",
  niche: "мебель на заказ",
  assistantName: "Анна",
  tone: "friendly",
  channel: "widget",
  knowledge: [
    { kind: "price", title: "Кухни", body: "Кухня под заказ от 4 500 000 сум за погонный метр. Замер бесплатно." },
    { kind: "address", title: "Шоурум", body: "Ташкент, Юнусабад, ул. Амира Темура 108. Тел. +998 90 123 45 67" },
    { kind: "hours", title: "", body: "Пн-Сб 9:00-19:00" },
  ],
};

test("тарифы: лимит, срок, пауза", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const trial = { plan: "trial" as const, status: "active" as const, trial_until: "2026-10-20T00:00:00Z", paid_until: null };
  assert.equal(stopReason(trial, 0, now), null);
  assert.equal(stopReason(trial, PLANS.trial.dialogs, now), "limit");
  assert.equal(stopReason({ ...trial, trial_until: "2026-10-01T00:00:00Z" }, 0, now), "trial_over");
  assert.equal(stopReason({ ...trial, plan: "start" }, 0, now), "unpaid");
  assert.equal(stopReason({ ...trial, plan: "start", paid_until: "2026-11-01T00:00:00Z" }, 10, now), null);
  assert.equal(stopReason({ ...trial, status: "paused" }, 0, now), "paused");
  // Оплата заранее не сгорает.
  assert.equal(extendPaid("2026-11-01T00:00:00Z", 1, now).toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(extendPaid(null, 2, now).toISOString(), "2026-12-10T12:00:00.000Z");
  assert.equal(monthKey(new Date("2026-10-31T20:00:00Z")), "2026-11", "месяц — по Ташкенту");
  assert.equal(formatUzs(490000), "490 000");
  assert.equal(usageSite("abc"), "saas-abc");
  assert.match(modelFor("standard"), /sonnet/);
  assert.match(modelFor("premium"), /opus/);
  assert.ok(usageCostUsd([{ model: "claude-sonnet-5", input_tokens: 1_000_000, output_tokens: 0, cache_write_tokens: 0, cache_read_tokens: 0 }]) === 2);
});

test("цены тарифов растут с диалогами, Opus только в «Про»", () => {
  assert.ok(PLANS.start.priceUzs < PLANS.business.priceUzs && PLANS.business.priceUzs < PLANS.pro.priceUzs);
  assert.ok(PLANS.start.dialogs < PLANS.business.dialogs);
  assert.deepEqual(
    Object.values(PLANS).filter((p) => p.tier === "premium").map((p) => p.id),
    ["pro"],
  );
});

test("язык покупателя: русский и узбекский латиницей и кириллицей", () => {
  assert.equal(langOf("Здравствуйте, сколько стоит кухня?"), "ru");
  assert.equal(langOf("Salom, oshxona narxi qancha?"), "uz");
  assert.equal(langOf("Assalomu alaykum"), "uz");
  assert.equal(langOf("Салом, нархи қанча?"), "uz");
  assert.equal(langOf("ok"), null);
  assert.equal(langOf("+998901234567"), null);
  assert.equal(talkLang(["Salom", "123"], "ru"), "uz");
  assert.equal(talkLang(["👍"], "uz"), "uz");
});

test("часы работы по Ташкенту", () => {
  const hours = parseHours({ from: "09:00", to: "18:00", days: [1, 2, 3, 4, 5] });
  assert.equal(isWorkTime(hours, new Date("2026-10-12T06:00:00Z")), true, "понедельник 11:00");
  assert.equal(isWorkTime(hours, new Date("2026-10-12T14:00:00Z")), false, "понедельник 19:00");
  assert.equal(isWorkTime(hours, new Date("2026-10-11T06:00:00Z")), false, "воскресенье");
  const night = parseHours({ from: "20:00", to: "02:00", days: [5] });
  assert.equal(isWorkTime(night, new Date("2026-10-16T16:00:00Z")), true, "пятница 21:00");
  assert.equal(isWorkTime(night, new Date("2026-10-16T20:00:00Z")), true, "ночь на субботу 01:00");
  assert.deepEqual(parseHours("мусор"), parseHours(null));
});

test("числа и цены — только из базы знаний и слов покупателя", () => {
  const facts = factsFor(prompt, [{ role: "customer", text: "Нужна кухня 3 метра" }]);
  assert.deepEqual(inventedNumbers("Кухня от 4 500 000 сум за метр", facts), []);
  assert.deepEqual(inventedNumbers("Кухня от 4500000 сум за метр", facts), [], "разделители тысяч не меняют число");
  assert.deepEqual(inventedNumbers("Кухня от 4.500.000 сум", facts), []);
  assert.deepEqual(inventedNumbers("Кухня от 3 900 000 сум", facts), ["3 900 000"]);
  assert.deepEqual(inventedNumbers("Скидка 5% до пятницы", facts), ["5"]);
  assert.deepEqual(inventedNumbers("Есть 2 варианта фасадов", facts), [], "мелкое число без денег — речь");
  assert.deepEqual(inventedNumbers("Позвоните: +998901234567", facts), [], "тот же телефон в другой записи");
  assert.deepEqual(inventedNumbers("Позвоните: +998 97 000 11 22", facts).length > 0, true);
  assert.deepEqual(inventedNumbers("На 3 метра выйдет дороже", facts), []);
  assert.equal(replyProblems("Мы работаем на Claude", facts)[0]?.code, "self_talk");
  assert.equal(replyProblems("", facts)[0]?.code, "empty");
});

test("ответ под мессенджер: без звёздочек и длинных тире", () => {
  assert.equal(tidyReply("**Кухня** — от 4 500 000 сум"), "Кухня, от 4 500 000 сум");
  assert.ok(tidyReply("а. ".repeat(1000)).length <= 1200);
});

test("промпт: база знаний внутри, без времени и имени покупателя (кэш)", () => {
  const text = buildSystemPrompt(prompt);
  assert.match(text, /4 500 000 сум/);
  assert.match(text, /Мебель Плюс/);
  assert.match(text, /hand_off/);
  assert.equal(buildSystemPrompt(prompt), text, "один и тот же промпт на каждой реплике");
  assert.match(buildSystemPrompt({ ...prompt, knowledge: [] }), /База знаний пока пуста/);
  assert.match(knowledgeText(prompt.knowledge), /### Цены/);
});

test("фразы кодом: ИИ представляется, номер заявки", () => {
  assert.match(disclosure("ru", "Мебель Плюс", "Анна"), /ИИ-помощник компании Мебель Плюс/);
  assert.match(disclosure("uz", "Mebel Plus", ""), /sun'iy intellekt yordamchisi/);
  assert.match(handedOff("uz", "AI-1010-ABCD", true), /AI-1010-ABCD/);
  assert.match(newRequestNo(new Date("2026-10-10T00:00:00Z")), /^AI-1010-[2-9A-HJ-NP-Z]{4}$/);
  for (const text of [disclosure("ru", "X", "Y"), handedOff("ru", "N", false)]) assert.ok(!/[—–]/.test(text), "без длинных тире");
});

test("токен бота шифруется и не открывается чужим ключом", () => {
  const sealed = sealToken("123:ABC", "ключ-1");
  assert.ok(!sealed.includes("123:ABC"));
  assert.equal(openToken(sealed, "ключ-1"), "123:ABC");
  assert.equal(openToken(sealed, "ключ-2"), null);
  assert.equal(openToken("мусор", "ключ-1"), null);
});

test("история для модели: начинается с покупателя, человек клиента — от ассистента", () => {
  const history: Turn[] = [
    { role: "ai", text: "Здравствуйте" },
    { role: "customer", text: "Привет" },
    { role: "human", text: "Сейчас уточню" },
    { role: "customer", text: "Жду" },
    { role: "customer", text: "Ну?" },
  ];
  const messages = toMessages(history);
  assert.equal(messages[0].role, "user");
  assert.equal(messages.length, 3);
  assert.match(String(messages[1].content), /ответил менеджер/);
  assert.match(String(messages[2].content), /Жду\n\nНу\?/);
});

test("контакт в заявку — кодом, если модель его не переписала", () => {
  const lead = parseHandOff({ name: "Олим", contact: "", reason: "странно" }, [{ role: "customer", text: "Мой номер 90 123 45 67" }]);
  assert.equal(lead.contact, "90 123 45 67");
  assert.equal(lead.reason, "contact");
});

function message(content: Anthropic.Beta.BetaContentBlock[], stop: Anthropic.Beta.BetaMessage["stop_reason"] = "end_turn"): Anthropic.Beta.BetaMessage {
  return { id: "m", type: "message", role: "assistant", model: "claude-sonnet-5", content, stop_reason: stop, stop_sequence: null, usage: {} } as unknown as Anthropic.Beta.BetaMessage;
}
const text = (t: string) => ({ type: "text", text: t, citations: null }) as unknown as Anthropic.Beta.BetaContentBlock;
const tool = (input: unknown) => ({ type: "tool_use", id: "t1", name: "hand_off", input }) as unknown as Anthropic.Beta.BetaContentBlock;

function scripted(replies: Anthropic.Beta.BetaMessage[]): { call: ModelCall; seen: Anthropic.Beta.MessageCreateParamsNonStreaming[] } {
  const seen: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  return {
    seen,
    call: async (params) => {
      seen.push(params);
      const next = replies.shift();
      if (!next) throw new Error("лишний вызов");
      return next;
    },
  };
}

const ask: Turn[] = [{ role: "customer", text: "Сколько стоит кухня?" }];

test("движок: честный ответ уходит как есть, промпт кэшируется", async () => {
  const model = scripted([message([text("Кухня под заказ от 4 500 000 сум за погонный метр, замер бесплатно.")])]);
  const out = await runSalesTurn({ prompt, history: ask, lang: "ru", model: "claude-sonnet-5", site: "saas-t", call: model.call });
  assert.equal(out.fallback, false);
  assert.match(out.text, /4 500 000/);
  const system = model.seen[0].system as Array<{ cache_control?: unknown }>;
  assert.ok(system[0].cache_control, "системный промпт с кэшем");
});

test("движок: выдуманная цена — второй заход, потом безопасная фраза", async () => {
  const fixed = scripted([message([text("Кухня от 3 000 000 сум.")]), message([text("Кухня от 4 500 000 сум за метр.")])]);
  const ok = await runSalesTurn({ prompt, history: ask, lang: "ru", model: "claude-sonnet-5", site: "saas-t", call: fixed.call });
  assert.equal(ok.fallback, false);
  assert.match(ok.text, /4 500 000/);
  assert.match(String(fixed.seen[1].messages.at(-1)?.content), /Служебная проверка/);

  const stubborn = scripted([message([text("Кухня от 3 000 000 сум.")]), message([text("Ладно, 2 900 000 сум.")])]);
  const bad = await runSalesTurn({ prompt, history: ask, lang: "uz", model: "claude-sonnet-5", site: "saas-t", call: stubborn.call });
  assert.equal(bad.fallback, true);
  assert.match(bad.text, /menejer/);
  assert.ok(!/000/.test(bad.text), "выдуманная цена покупателю не ушла");
});

test("движок: заявка инструментом, отказ модели — безопасная фраза", async () => {
  const handoff = scripted([message([text("Передаю менеджеру."), tool({ name: "Олим", contact: "+998901112233", need: "кухня 3 м", budget: "", urgency: "", summary: "Хочет кухню", reason: "contact" })], "tool_use")]);
  const out = await runSalesTurn({ prompt, history: ask, lang: "ru", model: "claude-sonnet-5", site: "saas-t", call: handoff.call });
  assert.equal(out.handoff?.name, "Олим");
  assert.equal(out.handoff?.contact, "+998901112233");

  const refused = scripted([message([], "refusal")]);
  const no = await runSalesTurn({ prompt, history: ask, lang: "ru", model: "claude-sonnet-5", site: "saas-t", call: refused.call });
  assert.equal(no.fallback, true);
  assert.match(no.text, /менеджер/);
});

test("узбекский латиницей: русские слова из прайса не уходят покупателю", async () => {
  const { cyrillicInLatin } = await import("@/lib/ai-staff/engine");
  const uzPrompt = { ...prompt, company: "Мебель Плюс", assistantName: "Анна" };
  const history: Turn[] = [{ role: "customer", text: "Salom, shkaf narxi qancha?" }];
  assert.deepEqual(cyrillicInLatin("Shkaf 1 погон metr uchun 2 900 000 so'm", { lang: "uz", history, prompt: uzPrompt }), ["погон"]);
  assert.deepEqual(cyrillicInLatin("Мебель Плюс kompaniyasi, Анна javob beradi", { lang: "uz", history, prompt: uzPrompt }), [], "имя компании и помощника можно");
  assert.deepEqual(cyrillicInLatin("Салом, нархи бор", { lang: "uz", history: [{ role: "customer", text: "Салом" }], prompt: uzPrompt }), [], "покупатель сам пишет кириллицей");
  assert.deepEqual(cyrillicInLatin("Кухня стоит", { lang: "ru", history, prompt: uzPrompt }), []);

  const model = scripted([message([text("Shkaf 1 погон metr uchun 2 900 000 so'm.")]), message([text("Shkaf 1 metr uchun 2 900 000 so'm.")])]);
  const out = await runSalesTurn({ prompt: { ...prompt, knowledge: [{ kind: "price", title: "", body: "Шкаф 2 900 000 сум за погонный метр" }] }, history, lang: "uz", model: "claude-sonnet-5", site: "saas-t", call: model.call });
  assert.equal(out.fallback, false);
  assert.equal(out.text, "Shkaf 1 metr uchun 2 900 000 so'm.");
  assert.match(String(model.seen[1].messages.at(-1)?.content), /кириллицей: погон/);
});
