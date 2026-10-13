/**
 * Акция 48 часов после макета: срок, напоминания клиенту, список в боте.
 *
 * Владелец, 13.10.2026: «когда мы отправили прототип, у клиента есть 48
 * часов… лендинг за 500$ по макету с 3 допами на выбор, 1000$ за
 * полноразмерный корпоративный сайт… каждый день в 13:00 по Ташкенту
 * напоминал, сколько времени осталось… дополнительно за 2 часа… не дорогую
 * модель… Александру и мне вывести список в тг боте… „закрыть паролем“,
 * макет утверждён > передать в работу на Егора».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  OFFER_MS,
  PROMO,
  announceDue,
  announceText,
  dailyDue,
  expiredNow,
  fallbackReminder,
  finalAt,
  finalDue,
  leftText,
  mockupLinks,
  reminderProblems,
  untilText,
  type OfferState,
} from "@/lib/admin/mockup-offer";
import { mockupsCommand, offerCard, parseMockupCallback } from "@/lib/admin/mockup-offer-bot";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// Ташкент = UTC+5. 13.10.2026 — вторник.
const at = (iso: string) => new Date(iso);

function offer(over: Partial<OfferState> = {}): OfferState {
  const sent = over.sent_at ?? "2026-10-13T06:00:00.000Z"; // 11:00 по Ташкенту
  return {
    status: "active",
    sent_at: sent,
    expires_at: new Date(Date.parse(sent) + OFFER_MS).toISOString(),
    announced_at: null,
    daily_on: null,
    final_at: null,
    ...over,
  };
}

test("цены и срок акции — те, что решил владелец", () => {
  assert.equal(OFFER_MS, 48 * 3600_000);
  assert.equal(PROMO.landing.price, 500);
  assert.equal(PROMO.landing.addons, 3);
  assert.equal(PROMO.corporate.price, 1000);
  const ru = announceText("ru", "2026-10-15T06:00:00.000Z");
  assert.match(ru, /48 часа, до 15\.10 11:00 по Ташкенту/);
  assert.match(ru, /лендинг по этому макету со всем функционалом и 3 допами на выбор — 500 \$ вместо 1700 \$/);
  assert.match(ru, /корпоративный сайт — 1000 \$ вместо 2500 \$/);
  assert.match(ru, /Потом — обычные цены/);
  const uz = announceText("uz", "2026-10-15T06:00:00.000Z");
  assert.doesNotMatch(uz, /[А-Яа-яЁё]/, "узбекский — латиницей");
  assert.match(uz, /500 \$/);
});

test("ссылка на макет — прототип и проект витрины", () => {
  assert.deepEqual(mockupLinks("Ваш макет: https://devuz.studio/proto/Ab12_cd-34\nПароль: 12345"), [{ kind: "proto", token: "Ab12_cd-34" }]);
  assert.deepEqual(mockupLinks("смотрите https://cases.devuz.studio/engelberg/v2?key=1"), [{ kind: "showcase", path: "engelberg/v2" }]);
  assert.deepEqual(mockupLinks("наша витрина https://cases.devuz.studio/ru"), [], "главная витрины — не макет");
  assert.deepEqual(mockupLinks("Здравствуйте, это DevUz Studio"), []);
  // Одна и та же ссылка дважды — один макет.
  assert.equal(mockupLinks("devuz.studio/proto/abcdef12 и ещё раз devuz.studio/proto/abcdef12").length, 1);
});

test("сколько осталось — по-человечески, на языке клиента", () => {
  const now = at("2026-10-13T08:00:00Z");
  assert.equal(leftText("2026-10-14T13:00:00.000Z", now, "ru"), "1 день 5 часов");
  assert.equal(leftText("2026-10-13T13:00:00.000Z", now, "ru"), "5 часов");
  assert.equal(leftText("2026-10-13T08:40:00.000Z", now, "ru"), "40 минут");
  assert.equal(leftText("2026-10-14T13:00:00.000Z", now, "uz"), "1 kun 5 soat");
  assert.equal(untilText("2026-10-15T06:00:00.000Z"), "15.10 11:00");
});

test("условия — через 3 минуты после макета и только днём", () => {
  const o = offer();
  assert.equal(announceDue(o, at("2026-10-13T06:01:00Z")), false, "сразу — нет, человек ещё открывает ссылку");
  assert.equal(announceDue(o, at("2026-10-13T06:03:00Z")), true);
  assert.equal(announceDue({ ...o, announced_at: "2026-10-13T06:03:00Z" }, at("2026-10-13T06:10:00Z")), false, "один раз");
  // Макет ушёл ночью — условия утром.
  const night = offer({ sent_at: "2026-10-13T19:00:00.000Z" }); // 00:00 по Ташкенту
  assert.equal(announceDue(night, at("2026-10-13T19:05:00Z")), false);
  assert.equal(announceDue(night, at("2026-10-14T03:05:00Z")), true, "08:05 по Ташкенту");
});

test("в 13:00 — сколько осталось, раз в день; не сразу после условий", () => {
  const o = offer({ announced_at: "2026-10-13T06:03:00.000Z" }); // условия в 11:03
  assert.equal(dailyDue(o, at("2026-10-13T08:00:00Z")), false, "13:00 того же дня — условия пришли два часа назад");
  assert.equal(dailyDue(o, at("2026-10-14T08:00:00Z")), true, "13:00 на следующий день");
  assert.equal(dailyDue({ ...o, daily_on: "2026-10-14" }, at("2026-10-14T08:30:00Z")), false, "один раз в день");
  assert.equal(dailyDue(o, at("2026-10-14T07:59:00Z")), false, "12:59 — ещё рано");
  assert.equal(dailyDue(o, at("2026-10-14T11:00:00Z")), false, "16:00 — окно закрыто");
});

test("за 2 часа до конца — последнее напоминание; ночью — накануне в 21:00", () => {
  const o = offer({ announced_at: "2026-10-13T06:03:00.000Z" }); // конец 15.10 11:00
  assert.equal(new Date(finalAt(o.expires_at)).toISOString(), "2026-10-15T04:00:00.000Z", "09:00 по Ташкенту");
  assert.equal(finalDue(o, at("2026-10-15T03:59:00Z")), false);
  assert.equal(finalDue(o, at("2026-10-15T04:00:00Z")), true);
  assert.equal(finalDue({ ...o, final_at: "2026-10-15T04:00:00Z" }, at("2026-10-15T04:30:00Z")), false, "один раз");
  // Конец в 01:00 по Ташкенту → за 2 часа было бы 23:00 → шлём в 21:00.
  const late = offer({ sent_at: "2026-10-13T20:00:00.000Z", announced_at: "2026-10-14T03:00:00.000Z" });
  assert.equal(new Date(finalAt(late.expires_at)).toISOString(), "2026-10-15T16:00:00.000Z");
  // Ежедневное напоминание молчит, когда скоро последнее.
  const soon = offer({ sent_at: "2026-10-12T10:00:00.000Z", announced_at: "2026-10-12T10:05:00.000Z" }); // конец 14.10 15:00
  assert.equal(dailyDue(soon, at("2026-10-14T08:00:00Z")), false, "13:00, а в 13:00 же и последнее");
});

test("срок вышел — акция закрыта", () => {
  const o = offer();
  assert.equal(expiredNow(o, at("2026-10-15T05:59:00Z")), false);
  assert.equal(expiredNow(o, at("2026-10-15T06:00:00Z")), true);
  assert.equal(expiredNow({ ...o, status: "approved" }, at("2026-10-16T06:00:00Z")), false);
});

test("напоминание модели: только числа из фактов, без ссылок; готовый текст проходит", () => {
  const exp = "2026-10-15T06:00:00.000Z";
  const now = at("2026-10-14T08:00:00Z");
  for (const kind of ["daily", "final"] as const) {
    for (const lang of ["ru", "uz"] as const) {
      const text = fallbackReminder(kind, lang, exp, now);
      assert.deepEqual(reminderProblems(text, exp, now, lang), [], `${kind}/${lang}: ${text}`);
    }
  }
  assert.match(reminderProblems("Лендинг всего за 450 $!", exp, now, "ru").join(";"), /чужие числа: 450/);
  assert.match(reminderProblems("Лендинг 500 $, смотрите https://x.uz", exp, now, "ru").join(";"), /ссылка/);
  assert.match(reminderProblems("Можем продлить акцию, лендинг 500 $", exp, now, "ru").join(";"), /продлить/);
  assert.match(reminderProblems("Осталось 22 часа, корпоративный сайт 1000 $", exp, now, "ru").join(";"), /нет цены лендинга/);
});

test("бот: «Макеты клиентов» и кнопки — пароль и «Утверждён → Егору»", () => {
  assert.equal(mockupsCommand("Макеты клиентов"), true);
  assert.equal(mockupsCommand("/mockups"), true);
  assert.equal(mockupsCommand("макеты"), false, "просто слово в разговоре — не команда");
  const id = "0b7f7a52-6a7e-4f43-9b39-0d2c3d4e5f60";
  assert.deepEqual(parseMockupCallback(["mo", "pw", id]), { kind: "password", offerId: id });
  assert.deepEqual(parseMockupCallback(["mo", "ok", id]), { kind: "approve", offerId: id });
  assert.equal(parseMockupCallback(["mo", "xx", id]), null);
  assert.equal(parseMockupCallback(["mo", "pw", "not-an-id"]), null);

  const base = {
    id,
    mockup_ref: "s:engelberg",
    mockup_name: "Engelberg",
    mockup_url: "https://cases.devuz.studio/engelberg",
    prospect_id: null,
    lead_id: null,
    client: "engelberg.uz",
    peer: "@client",
    status: "active",
    sent_at: "2026-10-13T06:00:00.000Z",
    expires_at: "2026-10-15T06:00:00.000Z",
    password_at: null,
  };
  const card = offerCard(base, at("2026-10-13T08:00:00Z"));
  assert.match(card.text, /⏳ engelberg\.uz · акция ещё 1 день 22 часа \(до 15\.10 11:00\)/);
  assert.match(card.text, /Клиент не из касаний — напоминания ему бот не пишет/);
  assert.deepEqual(card.rows[0].map((b) => b.text), ["🔒 Закрыть паролем", "✅ Утверждён → Егору"]);
  assert.equal(offerCard({ ...base, status: "approved" }, at("2026-10-13T08:00:00Z")).rows.length, 0, "утверждённый — без кнопок");
});

test("проводка: скаут, очередь бота, свип, вебхук, база, модель", () => {
  // Ушла ссылка через очередь бота — пошла акция.
  const talk = read("lib/admin/outreach-talk-store.ts");
  const sent = talk.slice(talk.indexOf("export async function markReplySent"), talk.indexOf("export async function markCircleSkipped"));
  assert.match(sent, /hasMockupLink\(String\(sent\.body \?\? ""\)\)/);
  assert.match(sent, /await recordMockupSent\(/);
  // Руками с рабочего аккаунта — скаут видит свои исходящие со ссылкой.
  const scout = read("scout/runner.mjs");
  assert.match(scout, /client\.addEventHandler\(outbound, new NewMessage\(\{ outgoing: true \}\)\)/);
  assert.match(scout, /if \(!hasMockupLink\(text\)\) return;/);
  // Расписание и список.
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /await runMockupOffers\(new Date\(\)\)/);
  assert.match(sweep, /await sendOfferDigest\(new Date\(\)\)/);
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === MOCKUP_CALLBACK/);
  assert.match(hook, /mockupsCommand\(update\.message\.text\)/);
  // Кнопки — только владельцу и руководителю.
  assert.match(read("lib/admin/mockup-offer-bot.ts"), /export const OFFER_ROLES = \["admin", "head"\] as const;/);
  // Один макет у одного клиента — одна акция: повтор срок не продлевает.
  const sql = read("supabase/migrations/0158_mockup_offers.sql");
  assert.match(sql, /unique index if not exists mockup_offers_prospect_ref\s+on public\.mockup_offers \(prospect_id, mockup_ref\)/);
  assert.match(read("lib/admin/mockup-offer-store.ts"), /error\.code !== "23505"/);
  // Напоминания — недорогой моделью, со своей переменной.
  const run = read("lib/admin/mockup-offer-run.ts");
  assert.match(run, /process\.env\.PROMO_MODEL \|\| "claude-haiku-4-5"/);
  assert.match(run, /reminderProblems\(text, o\.expires_at, now, o\.lang\)/);
  // Условия — готовым текстом, не моделью.
  assert.match(run, /await queue\(o, announceText\(o\.lang, o\.expires_at\)\)/);
});
