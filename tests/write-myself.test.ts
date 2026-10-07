/**
 * «Напишу сам — не отправлять»: снять письмо с очереди рабочего аккаунта и
 * написать клиенту самому — кнопкой под карточкой в боте и галочками в
 * панели.
 *
 * Владелец, 07.10.2026: «есть n-ое количество людей, которым бот должен
 * отправить письмо, но я хочу отправить им сам, — как отменить отправку
 * ботом?» — и на предложение кнопки: «добавь эту кнопку».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { closeRows } from "@/lib/admin/portion-store";
import { botQueueNote } from "@/lib/admin/queue-eta";
import { banNotices } from "@/lib/admin/account-ban";
import {
  WRITE_MYSELF_BUTTON,
  WRITE_MYSELF_FORM,
  mayWriteMyself,
  writeMyselfCallback,
  writeMyselfLink,
  writeMyselfNote,
} from "@/lib/admin/write-myself";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to?: string) => {
  const start = text.indexOf(from);
  assert.ok(start >= 0, `нет «${from}»`);
  const end = to ? text.indexOf(to, start + from.length) : -1;
  return text.slice(start, end >= 0 ? end : undefined);
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ID = "6cfed1bf-7ab3-4207-92b4-5836a4769f9d";

test("снять с очереди: менеджер — своё письмо, руководитель и владелец — любое", () => {
  const mine = { status: "sending", claimed_by: "m1" };
  const other = { status: "sending", claimed_by: "m2" };
  const auto = { status: "sending", claimed_by: null };
  const manager = { id: "m1", role: "manager" as const };
  assert.equal(mayWriteMyself(mine, manager), true);
  assert.equal(mayWriteMyself(other, manager), false, "чужое письмо стало бы касанием снявшего");
  assert.equal(mayWriteMyself(auto, manager), false, "письмо автопрогона ничьё до ответа клиента");
  for (const role of ["head", "admin"] as const) {
    const lead = { id: "h1", role };
    assert.equal(mayWriteMyself(other, lead), true);
    assert.equal(mayWriteMyself(auto, lead), true);
  }
  // Ушло или не в очереди — снимать нечего.
  for (const status of ["sent", "new", "contacting", "manual", "failed"]) {
    assert.equal(mayWriteMyself({ status, claimed_by: "m1" }, manager), false, status);
  }
});

test("бот: под письмом в очереди — «Напишу сам», после отметки — нет", () => {
  const queued = closeRows(ID, "📤 В очереди · уйдёт завтра около 13:10", true);
  const own = queued.flat().find((b) => b.text === WRITE_MYSELF_BUTTON);
  assert.ok(own && "callback_data" in own);
  assert.equal(own.callback_data, writeMyselfCallback(ID));
  assert.ok(Buffer.byteLength(own.callback_data) <= 64, "предел Telegram на callback_data — 64 байта");
  // Отказался / Игнорирует — на месте.
  assert.ok(queued.flat().some((b) => "callback_data" in b && b.callback_data.startsWith("tc:refused:")));
  assert.ok(!closeRows(ID, "✋ Отмечено: написал сам").flat().some((b) => b.text === WRITE_MYSELF_BUTTON));

  const hook = read("app/api/telegram/webhook/route.ts");
  const portion = between(hook, "async function handlePortionButton(", "async function writeMyselfFromBot(");
  // Не только сегодняшняя порция: вчерашнее письмо может ждать ограниченный аккаунт.
  assert.ok(portion.indexOf('action === "own"') < portion.indexOf("portionSource("), "«Напишу сам» упирается в порцию дня");
  const handler = between(hook, "async function writeMyselfFromBot(", "async function handleCloseButton(");
  assert.match(handler, /mayWriteMyself\(prospect, staff\)/);
  assert.match(handler, /markSelfContacted\(prospectId, staff, WRITE_MYSELF_NOTE, ""\)/);
  assert.match(handler, /result\.code === "bot_sent"/, "опоздавшее нажатие молчит, а кнопка висит");
});

test("бот после нажатия присылает, кому писать, и текст для копирования", () => {
  const note = writeMyselfNote({ target: "@acme_uz", message: "Здравствуйте! <b>сайт</b>" }, esc);
  assert.match(note, /Бот это письмо не отправит/);
  assert.match(note, /Кому: @acme_uz/);
  assert.match(note, /<code>Здравствуйте! &lt;b&gt;сайт&lt;\/b&gt;<\/code>/);
  assert.match(note, /Что ответил клиент/);

  assert.deepEqual(writeMyselfLink({ target: "@acme_uz", message: "x" }), { text: "Открыть @acme_uz в Telegram ↗", url: "https://t.me/acme_uz" });
  assert.match(writeMyselfLink({ target: "+998 90 590-00-02", message: "Привет" })!.url, /^https:\/\/wa\.me\/998905900002\?text=/);
  assert.equal(writeMyselfLink({ target: null, message: "x" }), null);
});

test("подсказки бота зовут новую кнопку, а не панель", () => {
  const now = Date.UTC(2026, 9, 7, 9, 0);
  const held = botQueueNote({ at: now + 3_600_000, ahead: 2, heldUntil: now + 3_000_000 }, now);
  assert.ok(held.note?.includes(`«${WRITE_MYSELF_BUTTON}»`));
  assert.ok(botQueueNote({ at: null, ahead: 0, heldUntil: null }, now).note?.includes(`«${WRITE_MYSELF_BUTTON}»`));
  const { notices } = banNotices({
    bans: [{ key: "men", label: "Рабочий аккаунт для мужчин", until: now + 86_400_000, stuck: 13, people: ["Арсений"] }],
    told: {},
    labels: {},
    now,
    esc,
  });
  assert.ok(notices[0].text.includes(`«${WRITE_MYSELF_BUTTON}»`));
});

test("панель: галочки у писем очереди, одна кнопка над списком", () => {
  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /id=\{WRITE_MYSELF_FORM\}\s*action=\{writeMyselfAction\}/);
  assert.match(list, /<input type="checkbox" name="id" value=\{row\.id\} form=\{WRITE_MYSELF_FORM\}/);
  assert.match(list, /mayWriteMyself\(row, viewer\)/);
  assert.equal(WRITE_MYSELF_FORM, "write-myself");

  const actions = read("app/admin/prospect/actions.ts");
  const action = between(actions, "export async function writeMyselfAction(");
  assert.match(action, /requireStaff\(\)/);
  assert.match(action, /formData\.getAll\("id"\)/);

  // Каждое письмо — тем же markSelfContacted, что и одна карточка, и с той же проверкой права.
  const store = read("lib/admin/outreach-store.ts");
  const bulk = between(store, "export async function writeMyself(", "export function isOwnMessage(");
  assert.match(bulk, /mayWriteMyself\(/);
  assert.match(bulk, /markSelfContacted\(id, staff, WRITE_MYSELF_NOTE, ip\)/);
  assert.match(bulk, /slice\(0, WRITE_MYSELF_MAX\)/);
});
