import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { handleUpdate } from "@/lib/clients/maximova/bot";
import { open, useDatabase } from "@/lib/clients/maximova/db";
import {
  LOGIN_TTL_MS,
  bookingsOf,
  confirmLogin,
  listBookings,
  pollLogin,
  saveBooking,
  setBookingStatus,
  startLogin,
  validateBooking,
  viewerBySession,
} from "@/lib/clients/maximova/store";
import { botConfig, loginLink } from "@/lib/clients/maximova/telegram";

/**
 * Школа Дарьи: онлайн-запись и вход в кабинет через её Telegram-бота.
 * База — в памяти, сети нет: бот отдаёт ответы списком, а не шлёт их сам.
 */

beforeEach(() => {
  useDatabase(open(":memory:"));
});

const good = {
  language: "Французский",
  age: "5–8 лет",
  format: "В группе",
  parentName: "Анна",
  contact: "+7 999 123-45-67",
  consent: true,
};

const config = { token: "t", username: "maximova_school_bot", secret: "s", admins: [42] };

test("заявка: чистые данные проходят, у каждой ошибки — своё поле", () => {
  assert.equal(validateBooking(good).ok, true);
  assert.equal(validateBooking({ ...good, contact: "@anna_mama" }).ok, true);

  const bad = validateBooking({ language: "Немецкий", age: "3 года", format: "?", parentName: "", contact: "12", consent: false });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.deepEqual(Object.keys(bad.errors).sort(), ["age", "consent", "contact", "format", "language", "parentName"]);
  }
});

test("заявка без согласия на обработку данных не принимается", () => {
  const result = validateBooking({ ...good, consent: false });
  assert.equal(result.ok, false);
});

test("заявка сохраняется, видна Дарье и родителю, статус меняется", () => {
  const checked = validateBooking(good);
  assert.ok(checked.ok);
  const b = saveBooking(checked.value, 7);
  assert.equal(b.status, "new");
  assert.equal(listBookings()[0].id, b.id);
  assert.equal(bookingsOf(7).length, 1);
  assert.equal(bookingsOf(8).length, 0);
  setBookingStatus(b.id, "contacted");
  assert.equal(listBookings()[0].status, "contacted");
});

test("вход: ссылка → «Старт» в боте → этот же браузер получает сессию", () => {
  const now = 1_000_000;
  const { loginToken, nonce } = startLogin(true, now);
  assert.match(loginLink(config.username, loginToken), /^https:\/\/t\.me\/maximova_school_bot\?start=login_/);

  assert.deepEqual(pollLogin(loginToken, nonce, now + 1000), { status: "waiting" });
  assert.equal(confirmLogin(loginToken, { id: 7, first_name: "Анна" }, [42], now + 2000), "ok");

  // Чужой браузер с тем же токеном сессию не получит.
  assert.deepEqual(pollLogin(loginToken, "чужой", now + 3000), { status: "expired" });

  const result = pollLogin(loginToken, nonce, now + 3000);
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  const viewer = viewerBySession(result.session, now + 4000);
  assert.equal(viewer?.telegramId, 7);
  assert.equal(viewer?.role, "parent");

  // Токен одноразовый.
  assert.deepEqual(pollLogin(loginToken, nonce, now + 5000), { status: "expired" });
});

test("вход: устаревшая ссылка не подтверждается", () => {
  const { loginToken } = startLogin(true, 0);
  assert.equal(confirmLogin(loginToken, { id: 7 }, [], LOGIN_TTL_MS + 1), "expired");
});

test("Дарья — администратор по своему Telegram ID", () => {
  const { loginToken, nonce } = startLogin(true, 0);
  confirmLogin(loginToken, { id: 42, first_name: "Дарья" }, [42], 10);
  const result = pollLogin(loginToken, nonce, 20);
  assert.equal(result.status, "ok");
  if (result.status === "ok") assert.equal(viewerBySession(result.session, 30)?.role, "admin");
});

test("бот: /start login_ подтверждает вход, /zayavki — только Дарье, в группах молчит", () => {
  const { loginToken } = startLogin(true, Date.now());
  const private_ = (id: number, text: string) => ({
    message: { chat: { id, type: "private" }, from: { id, first_name: "Анна" }, text },
  });

  const login = handleUpdate(private_(7, `/start login_${loginToken}`), config);
  assert.match(login[0].text, /Вы вошли в личный кабинет/);

  assert.match(handleUpdate(private_(7, "/zayavki"), config)[0].text, /только для преподавателя/);
  assert.match(handleUpdate(private_(42, "/zayavki"), config)[0].text, /Заявок пока нет/);
  assert.match(handleUpdate(private_(7, "/id"), config)[0].text, /<code>7<\/code>/);
  assert.match(handleUpdate(private_(7, "/start"), config)[0].text, /Записаться на пробное/);

  const group = { message: { chat: { id: -1, type: "group" }, from: { id: 7 }, text: "/start" } };
  assert.deepEqual(handleUpdate(group, config), []);
});

test("бот не настроен — вход честно выключен", () => {
  assert.equal(botConfig({}), null);
  const cfg = botConfig({
    MAXIMOVA_BOT_TOKEN: "t",
    MAXIMOVA_BOT_USERNAME: "@school_bot",
    MAXIMOVA_BOT_SECRET: "s",
    MAXIMOVA_ADMIN_TG_IDS: "42, 43,  x",
  });
  assert.deepEqual(cfg, { token: "t", username: "school_bot", secret: "s", admins: [42, 43] });
});

// ─── Дневник ──────────────────────────────────────────────────────────────

import {
  addGroup,
  addHomework,
  addPayment,
  addRemark,
  addStudent,
  bindInvite,
  homeworkFor,
  inviteByCode,
  learnersOf,
  openPayments,
  praiseOf,
  studentsOfLearner,
  parentsOf,
  paymentMessage,
  remarksOf,
  setPaymentStatus,
  studentsOfParent,
  updateStudent,
} from "@/lib/clients/maximova/school";

test("дневник: группа, ученик, приглашение родителю — чужой ребёнок не перепривязывается", () => {
  const group = addGroup({ title: "English 5–8", language: "Английский", age: "5–8 лет", schedule: "Вт, чт 17:00" });
  const kid = addStudent({ name: "Миша", language: "Английский", age: "5–8 лет", groupId: group.id });
  assert.equal(kid.groupTitle, "English 5–8");
  assert.equal(kid.parentTelegramId, null);

  assert.equal(bindInvite(kid.inviteCode, 7), "ok");
  assert.equal(bindInvite(kid.inviteCode, 8), "taken");
  assert.equal(bindInvite("нет-такого", 7), "unknown");
  assert.deepEqual(studentsOfParent(7).map((s) => s.name), ["Миша"]);
  assert.equal(studentsOfParent(8).length, 0);
});

test("дневник: вход по приглашению сразу привязывает ребёнка", () => {
  const kid = addStudent({ name: "Аня", language: "Французский", age: "8–17 лет" });
  const { loginToken, nonce } = startLogin(true, 0, kid.inviteCode);
  confirmLogin(loginToken, { id: 9, first_name: "Ольга" }, [], 10);
  assert.equal(pollLogin(loginToken, nonce, 20).status, "ok");
  assert.deepEqual(studentsOfParent(9).map((s) => s.name), ["Аня"]);
});

test("ученик: своя ссылка, свой вход — родительская ссылка его не заменяет", () => {
  const kid = addStudent({ name: "Лиза", language: "Английский", age: "8–17 лет" });
  assert.notEqual(kid.studentCode, kid.inviteCode);
  assert.equal(inviteByCode(kid.inviteCode)?.kind, "parent");
  assert.equal(inviteByCode(kid.studentCode)?.kind, "student");

  const { loginToken, nonce } = startLogin(true, 0, kid.studentCode);
  confirmLogin(loginToken, { id: 41, first_name: "Лиза" }, [], 10);
  assert.equal(pollLogin(loginToken, nonce, 20).status, "ok");
  assert.deepEqual(studentsOfLearner(41).map((s) => s.name), ["Лиза"]);
  // Вошла как ученица — родителем не стала.
  assert.equal(studentsOfParent(41).length, 0);
  assert.equal(bindInvite(kid.studentCode, 42), "taken");

  assert.deepEqual(learnersOf({ studentId: kid.id }), [{ chatId: 41, name: "Лиза" }]);
  addRemark({ studentId: kid.id, kind: "remark", text: "Опоздала" });
  addRemark({ studentId: kid.id, kind: "praise", text: "Молодец" });
  assert.deepEqual(praiseOf(kid.id).map((r) => r.text), ["Молодец"]);
});

test("дневник: задание группе видно всем её ученикам и уходит их родителям", () => {
  const group = addGroup({ title: "Группа", language: "Английский", age: "5–8 лет" });
  const a = addStudent({ name: "А", language: "Английский", age: "5–8 лет", groupId: group.id });
  const b = addStudent({ name: "Б", language: "Английский", age: "5–8 лет", groupId: group.id });
  const c = addStudent({ name: "В", language: "Английский", age: "5–8 лет" });
  bindInvite(a.inviteCode, 1);
  bindInvite(c.inviteCode, 3);

  const hw = addHomework({ groupId: group.id, text: "Выучить цвета", due: "к четвергу" });
  assert.equal(homeworkFor(a)[0].id, hw.id);
  assert.equal(homeworkFor(b)[0].id, hw.id);
  assert.equal(homeworkFor(c).length, 0);
  // Б ещё без родителя — сообщение уйдёт только родителю А.
  assert.deepEqual(parentsOf({ groupId: group.id }), [{ chatId: 1, name: "А" }]);

  const personal = addHomework({ studentId: c.id, text: "Прочитать сказку" });
  assert.deepEqual(homeworkFor(c).map((h) => h.id), [personal.id]);
  assert.deepEqual(parentsOf({ studentId: c.id }), [{ chatId: 3, name: "В" }]);
});

test("дневник: замечания, уровень, оплата и её статус", () => {
  const kid = addStudent({ name: "Петя", language: "Английский", age: "8–17 лет" });
  addRemark({ studentId: kid.id, kind: "praise", text: "Отлично читал" });
  assert.equal(remarksOf(kid.id)[0].kind, "praise");

  assert.equal(updateStudent({ id: kid.id, level: "A2" }).level, "A2");

  const pay = addPayment({ studentId: kid.id, title: "Абонемент на 3 месяца", amount: "2 465 ₽ × 24", due: "5 октября" });
  assert.match(paymentMessage(pay, "Петя"), /Оплатить до: 5 октября/);
  assert.equal(openPayments().length, 1);
  setPaymentStatus(pay.id, "paid");
  assert.equal(openPayments().length, 0);
});

test("дневник: пустые поля и чужой язык не принимаются", () => {
  assert.throws(() => addStudent({ name: "", language: "Английский", age: "5–8 лет" }), /Как зовут/);
  assert.throws(() => addGroup({ title: "X", language: "Немецкий", age: "5–8 лет" }), /язык/);
  assert.throws(() => addHomework({ groupId: "", text: "x" }), /Не найдено/);
});
