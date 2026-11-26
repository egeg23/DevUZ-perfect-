import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CALLHELPER_OFFER } from "@/content/callhelper-offer";
import { CALLHELPER_CABINET, CALLHELPER_PAGE } from "@/content/callhelper-page";
import { SIGNUP_BOT, SIGNUP_START, SIGNUP_TTL_MS, newSignupToken, parseSignup, pendingAlive, readPending, signupTokenOf } from "@/lib/callhelper/signup";
import { CALLHELPER_OVER_RUB, CALLHELPER_TARIFFS, CALLHELPER_TRIAL } from "@/lib/callhelper/tariffs";
import { trialVerdict } from "@/lib/callhelper/trial";

/**
 * Регистрация колл-центра в CallHelper без владельца, страница продукта,
 * кабинет и оферта (владелец, 26.11.2026: «Делай пока все остальное»).
 */

const INN = "7707083893"; // ИНН с верной контрольной суммой (Сбербанк, открытые данные).

test("форма регистрации: компания, ИНН с верной суммой и согласие, которое не подставить", () => {
  assert.deepEqual(parseSignup({ company: " ООО  Ромашка ", inn: "77 07 083893", name: "Анна", consent: true }), {
    ok: true,
    form: { company: "ООО Ромашка", inn: INN, name: "Анна" },
  });
  assert.deepEqual(parseSignup({ company: "О", inn: INN, consent: true }), { ok: false, error: "company" });
  assert.deepEqual(parseSignup({ company: "ООО Ромашка", inn: "7707083894", consent: true }), { ok: false, error: "inn" });
  assert.deepEqual(parseSignup({ company: "ООО Ромашка", inn: INN }), { ok: false, error: "consent" });
  assert.deepEqual(parseSignup({ company: "ООО Ромашка", inn: INN, consent: "true" }), { ok: false, error: "consent" });
});

test("токен регистрации: только свой вид, чужой /start не перехватывается", () => {
  const token = newSignupToken();
  assert.match(token, /^[a-z0-9]{24}$/);
  assert.equal(signupTokenOf(`${SIGNUP_START}${token}`), token);
  for (const other of ["", "maket", "partner", "cabinet", "login", "app-abc", "ch", "chat", `ch${token}x`, `ch${token.toUpperCase()}`, null]) {
    assert.equal(signupTokenOf(other), null, String(other));
  }
});

test("незаконченная регистрация живёт полчаса и читается только целой", () => {
  const token = newSignupToken();
  const p = readPending({ token, company: "ООО Ромашка", inn: INN, name: "", ipHash: "a", device: "b", at: 1_000 });
  assert.ok(p);
  assert.equal(pendingAlive(p, 1_000 + SIGNUP_TTL_MS - 1), true);
  assert.equal(pendingAlive(p, 1_000 + SIGNUP_TTL_MS), false);
  assert.equal(readPending({ token: "x", at: 1 }), null);
  assert.equal(readPending(null), null);
});

test("пробный компании один: тот же ИНН, номер или Telegram второй раз не проходят", () => {
  const now = Date.parse("2026-12-01T10:00:00Z");
  const ask = { inn: INN, phone: "+7 900 111-22-33", tg: "42", ipHash: "ip1", device: "d1" };
  assert.deepEqual(trialVerdict(ask, [], now), { ok: true });
  const old = { inn: "500100732259", phone: "79005556677", tg: "7", ipHash: "ip9", device: "d9", at: now - 400 * 86_400_000 };
  assert.deepEqual(trialVerdict(ask, [old], now), { ok: true });
  assert.deepEqual(trialVerdict(ask, [{ ...old, inn: INN }], now), { ok: false, reason: "used" });
  assert.deepEqual(trialVerdict(ask, [{ ...old, phone: "89001112233" }], now), { ok: false, reason: "used" });
  assert.deepEqual(trialVerdict(ask, [{ ...old, tg: "42" }], now), { ok: false, reason: "used" });
  assert.deepEqual(trialVerdict(ask, [{ ...old, device: "d1", at: now - 86_400_000 }], now), { ok: false, reason: "device" });
  assert.deepEqual(trialVerdict(ask, [{ ...old, ipHash: "ip1", at: now - 86_400_000 }], now), { ok: false, reason: "ip" });
});

test("бот: ключ в сообщении один раз, на каждый отказ есть слова, тире нет", () => {
  const done = SIGNUP_BOT.done("chk_test", CALLHELPER_TRIAL.days, CALLHELPER_TRIAL.minutes, "https://e/x", "https://e/c");
  assert.equal(done.split("chk_test").length, 2);
  assert.ok(done.includes(`${CALLHELPER_TRIAL.days} дня`) && done.includes(`${CALLHELPER_TRIAL.minutes} минут`));
  const texts = [done, SIGNUP_BOT.ask("ООО"), SIGNUP_BOT.stale, SIGNUP_BOT.closed, SIGNUP_BOT.foreign, SIGNUP_BOT.failed, ...(["inn", "phone", "used", "device", "ip"] as const).map((r) => SIGNUP_BOT.refused(r))];
  for (const t of texts) {
    assert.ok(t && t.length > 20, t);
    assert.doesNotMatch(t, /[—–]/, t);
  }
});

test("ключ в чат уходит без пуша и колокольчика, чужой контакт номер не подтверждает", () => {
  const hook = readFileSync("app/api/telegram/webhook/route.ts", "utf8");
  const part = hook.slice(hook.indexOf("async function handleCallhelperContact"), hook.indexOf("async function handleClientMedia"));
  assert.match(part, /contact\.user_id !== fromId/);
  assert.match(part, /sendMessage\(chatId, doneText\(done\.key\), \{ mirror: false \}\)/);
  // Регистрация разбирается раньше чата продаж: владелец проверяет её из своей лички.
  assert.ok(hook.indexOf("handleCallhelperStart(chat.id, signup)") < hook.indexOf("if (isSalesChat(chat.id))"));
  const store = readFileSync("lib/callhelper/signup-store.ts", "utf8");
  // Строка пробного пишется раньше ключа, регистрация забирается удалением строки чата.
  assert.ok(store.indexOf('.from("callhelper_trials")\n    .insert') < store.indexOf("await createOrg("));
  assert.match(store, /delete\(\)\.eq\("key", `\$\{BY_CHAT\}\$\{chat\}`\)\.select/);
  assert.doesNotMatch(store.slice(store.indexOf("tellOwnerSignup")), /\bkey\b.*sendMessage/);
});

test("страница, кабинет и оферта: числа только из тарифов, длинных тире нет", () => {
  const offer = JSON.stringify(CALLHELPER_OFFER);
  for (const t of CALLHELPER_TARIFFS) assert.ok(offer.includes(t.name), t.name);
  assert.ok(offer.includes(`${CALLHELPER_OVER_RUB} ₽`));
  assert.ok(offer.includes("152-ФЗ") && offer.includes("по поручению"));
  for (const text of [offer, JSON.stringify(CALLHELPER_PAGE), JSON.stringify(CALLHELPER_CABINET)]) assert.doesNotMatch(text, /[—–]| - /);
  // Своих цен на странице нет: рубли берутся из lib/callhelper/tariffs.ts.
  assert.doesNotMatch(JSON.stringify(CALLHELPER_PAGE), /\d[\d\s]*₽/);
  const page = readFileSync("app/[locale]/callhelper/page.tsx", "utf8");
  assert.match(page, /signupOpen\(\)/);
  assert.match(page, /CALLHELPER_TARIFFS\.map/);
  // Кабинет ходит только в открытый API по ключу и в поиск не идёт.
  const cabinet = readFileSync("components/callhelper/cabinet.tsx", "utf8");
  assert.match(cabinet, /Authorization: `Bearer \$\{k\}`/);
  assert.match(cabinet, /sessionStorage/);
  assert.doesNotMatch(cabinet, /localStorage/);
  assert.match(readFileSync("app/[locale]/callhelper/cabinet/page.tsx", "utf8"), /index: false/);
});

test("регистрация по умолчанию закрыта и открывается только владельцем", () => {
  const store = readFileSync("lib/callhelper/signup-store.ts", "utf8");
  assert.match(store, /\?\.open === true/);
  const actions = readFileSync("app/admin/callhelper/actions.ts", "utf8");
  const part = actions.slice(actions.indexOf("export async function switchSignup"));
  assert.match(part.slice(0, 200), /requireRole\("admin"\)/);
  const route = readFileSync("app/api/callhelper/signup/route.ts", "utf8");
  assert.ok(route.indexOf("signupOpen()))") < route.indexOf("parseSignup(body)"));
});
