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

  assert.match(handleUpdate(private_(7, "/zayavki"), config)[0].text, /только для Дарьи/);
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
