/**
 * Помощник сотруднику в боте студии (lib/admin/staff-helper.ts).
 *
 * Владелец, 22.10.2026: «Проверяй, если человек утверждает что он наш
 * сотрудник, то он может получать больше информации, которая касается
 * работы, услуг, как подойти к клиенту… не больше 500 символов в одном
 * ответе». Сеть не трогается: модель подменяется функцией.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { LADDER, PROMO } from "@/lib/admin/mockup-offer";
import {
  HELPER_CHUNKS,
  HELPER_DAILY,
  HELPER_MAX_CHARS,
  HELPER_MODEL,
  HELPER_TURNS,
  answerStaff,
  claimsStaff,
  cleanReply,
  clipReply,
  forbiddenAsk,
  helperLang,
  knowledgeFor,
  notStaffText,
  pickChunks,
  resetHelper,
  type AskModel,
} from "@/lib/admin/staff-helper";
import { LONG_DASH } from "@/lib/proto/plain-text";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const manager = { id: "m-1", role: "manager" as const };
const owner = { id: "a-1", role: "admin" as const };

function fakeModel(reply: string) {
  const calls: Parameters<AskModel>[0][] = [];
  const ask: AskModel = async (input) => {
    calls.push(input);
    return reply;
  };
  return { ask, calls };
}

test("«я ваш сотрудник» узнаётся, клиент-менеджер чужой компании — нет", () => {
  for (const text of [
    "Я ваш новый менеджер по продажам",
    "Меня уже взяли к вам, какие у меня обязанности?",
    "я работаю у вас",
    "Sizda menejer bo‘lib ishlayman",
    "men xodimingizman",
  ]) {
    assert.equal(claimsStaff(text), true, text);
  }
  for (const text of [
    "Я менеджер компании Ромашка, нам нужен сайт",
    "Я ваш клиент, где мой макет?",
    "Сколько стоит лендинг?",
    "",
  ]) {
    assert.equal(claimsStaff(text), false, text);
  }
});

test("не-сотруднику — просьба добавить в «Команду», без цен и внутреннего", () => {
  for (const lang of ["ru", "uz", "pl", "en"] as const) {
    const text = notStaffText(lang);
    assert.match(text, /Команд|Jamoa|Zespół|Team/);
    assert.ok(!text.includes(String(PROMO.landing.price)) && !text.includes(String(LADDER.fixes.price)), lang);
    assert.ok(!LONG_DASH.test(text), lang);
  }
  assert.equal(helperLang("Assalomu alaykum, men sizda ishlayman"), "uz");
  assert.equal(helperLang("Здравствуйте"), "ru");
});

test("вебхук: не-сотрудник с «я ваш сотрудник» не доходит до первички и лида", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  const client = route.slice(route.indexOf("async function handleClient("), route.indexOf("async function handleStaffText("));
  // Помощник — после команд и пустого текста, но раньше первички.
  const staffAt = client.indexOf("await handleStaffText(message, text)");
  assert.ok(staffAt > client.indexOf('text.startsWith("/")'), "команды разбираются раньше помощника");
  assert.ok(staffAt > client.indexOf("if (!text) return;"));
  assert.ok(staffAt < client.indexOf("await respond("), "помощник раньше первички");

  const helper = route.slice(route.indexOf("async function handleStaffText("), route.indexOf("Что мы знаем о человеке из публичных чатов"));
  // Сотрудник — только по базе.
  assert.match(helper, /findStaffByTelegram\(from\.id\)/);
  assert.match(helper, /notStaffText/);
  assert.match(helper, /alertStaffClaim/);
  assert.doesNotMatch(helper, /runQualifyTurn|respond\(|sendLead|queueWarm|offerLead/);
  // Модель помощника — только здесь, не на кнопках, кружках и голосовых.
  assert.equal(route.split("answerStaff(").length - 1, 1);
});

test("вебхук: команды, кружки и голосовые разобраны раньше помощника", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  const body = route.slice(route.indexOf("async function route("));
  const client = body.indexOf("await handleClient(update.message)");
  for (const before of [
    "loginCommand(update.message.text)",
    "circleFromMessage(update.message)",
    "voiceFromMessage(update.message)",
    "streamCommand(update.message.text)",
    "learnCommand(update.message.text)",
    "partnerCommand(update.message.text)",
  ]) {
    const at = body.indexOf(before);
    assert.ok(at > 0 && at < client, before);
  }
});

test("сотрудник: недорогая модель, ответ не длиннее 500 знаков, без тире", async () => {
  resetHelper();
  assert.match(HELPER_MODEL, /haiku/);
  const long = `Начните с «Здравствуйте» — и ждите ответа. ${"Потом кружок, потом разбор сайта клиента. ".repeat(40)}`;
  const model = fakeModel(long);
  const answer = await answerStaff({ staff: manager, text: "Как подойти к клиенту, что писать первым?", ask: model.ask });
  assert.equal(answer.by, "model");
  assert.ok(answer.text.length <= HELPER_MAX_CHARS, String(answer.text.length));
  assert.match(answer.text, /[.!?]$/, "обрезано по границе предложения");
  assert.ok(!LONG_DASH.test(answer.text));
  assert.equal(model.calls.length, 1);
  const call = model.calls[0];
  assert.equal(call.model, HELPER_MODEL);
  assert.doesNotMatch(call.model, /opus/);
  assert.ok(call.max_tokens <= 300);
  // В модель — только несколько кусков знаний, а не вся инструкция.
  assert.ok((call.system.match(/^\[/gm) ?? []).length <= HELPER_CHUNKS);
  assert.ok(call.system.length < 6000, String(call.system.length));
});

test("разговор: в модель не больше 6 последних реплик", async () => {
  resetHelper();
  const model = fakeModel("Ответ коротко.");
  for (let i = 0; i < 6; i += 1) {
    await answerStaff({ staff: { id: "m-2", role: "manager" }, text: `Вопрос про касания ${i}`, ask: model.ask });
  }
  for (const call of model.calls) assert.ok(call.messages.length <= HELPER_TURNS);
  assert.equal(model.calls.at(-1)?.messages[0].role, "user");
});

test("дневной предел: после него модель не зовётся", async () => {
  resetHelper();
  const model = fakeModel("Да.");
  const now = Date.parse("2026-10-22T08:00:00Z");
  for (let i = 0; i < HELPER_DAILY; i += 1) await answerStaff({ staff: { id: "m-3", role: "manager" }, text: "Цены?", ask: model.ask, now });
  const over = await answerStaff({ staff: { id: "m-3", role: "manager" }, text: "Цены?", ask: model.ask, now });
  assert.equal(over.by, "limit");
  assert.equal(model.calls.length, HELPER_DAILY);
});

test("деньги студии менеджеру не уходят", async () => {
  resetHelper();
  const model = fakeModel("Доля студии 40 %.");
  const asked = await answerStaff({ staff: manager, text: "Какая доля студии и прибыль за месяц?", ask: model.ask });
  assert.equal(asked.by, "money");
  assert.equal(model.calls.length, 0, "модель не зовётся");
  assert.equal(forbiddenAsk("Какая прибыль студии?", "admin"), null);
  assert.equal(forbiddenAsk("Дай api key", "admin"), "secret");

  // В знаниях менеджера нет ни слова о доле и прибыли студии; у владельца есть.
  const studio = /дол[яеию]\s+студи|прибыл|кот[её]л|котл[аеу]\b|себестоим/iu;
  for (const lang of ["ru", "uz", "pl"] as const) {
    assert.ok(!knowledgeFor(manager, lang).some((c) => studio.test(c.text)), lang);
  }
  assert.ok(knowledgeFor(owner, "ru").some((c) => studio.test(c.text)));

  // Модель всё же сказала о деньгах — предложение у менеджера выпадает.
  const reply = "Лендинг стоит 500 $. Прибыль студии с него 300 $.";
  assert.equal(cleanReply(reply, "manager"), "Лендинг стоит 500 $.");
  assert.equal(cleanReply(reply, "admin"), reply);
});

test("цены в знаниях — из PROMO и LADDER, возражения — готовые ответы", () => {
  const picked = pickChunks("сколько стоит лендинг, клиент говорит дорого", knowledgeFor(manager, "ru"));
  assert.ok(picked.length > 0 && picked.length <= HELPER_CHUNKS);
  const prices = knowledgeFor(manager, "ru").find((c) => c.id === "prices");
  assert.ok(prices?.text.includes(`${PROMO.landing.price} $`) && prices.text.includes(`${LADDER.fixes.price} $`));
  assert.ok(knowledgeFor(manager, "uz").some((c) => c.id === "objection-expensive"));
});

test("обрезка по границе предложения", () => {
  const text = `${"Первое предложение тут. ".repeat(30)}`;
  const out = clipReply(text);
  assert.ok(out.length <= HELPER_MAX_CHARS);
  assert.match(out, /тут\.$/);
  const word = clipReply("слово ".repeat(200));
  assert.ok(word.length <= HELPER_MAX_CHARS && word.endsWith("…"));
});
