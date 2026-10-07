import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BAN_CHECK_MS, banNotices, spamBotVerdict, tashkentStamp, type Ban } from "@/lib/admin/account-ban";

/**
 * Владелец, 07.10.2026: «Проводи проверку каждый час на предмет бана с
 * уведомлением от бота всем. Это значит, что пока действует бан, сообщения
 * уходить не будут и надо писать с личного аккаунта или с другого рабочего».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const now = Date.UTC(2026, 9, 7, 10, 0);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

test("ответ @SpamBot: свободен, ограничен со сроком, ограничен без срока, непонятно", () => {
  assert.deepEqual(
    spamBotVerdict("Good news, no limits are currently applied to your account. You’re free as a bird!", now),
    { limited: false, until: null },
  );
  assert.deepEqual(spamBotVerdict("Ваш аккаунт свободен от каких-либо ограничений.", now), { limited: false, until: null });
  assert.deepEqual(
    spamBotVerdict("Хорошие новости: на Ваш аккаунт не наложено никаких ограничений. Вы свободны, как птица!", now),
    { limited: false, until: null },
  );

  const en =
    "Unfortunately, some actions can trigger a harsh response from our anti-spam systems. If you think your account was limited by mistake, you can submit a complaint to our moderators.\n\n" +
    "While the account is limited, you will not be able to send messages to people who do not have your number in their phone contacts.\n\n" +
    "Your account will be automatically released on 8 Oct 2026, 08:07 UTC.";
  assert.deepEqual(spamBotVerdict(en, now), { limited: true, until: Date.UTC(2026, 9, 8, 8, 7) });

  const ru =
    "К сожалению, иногда наша антиспам-система излишне сурово реагирует на некоторые действия. Если Вы считаете, что Ваш аккаунт ограничен по ошибке, пожалуйста, сообщите об этом нашим модераторам.\n\n" +
    "Пока действуют ограничения, Вы не сможете писать тем, кто не сохранил Ваш номер в список контактов.\n\n" +
    "Ограничения будут автоматически сняты 8 окт. 2026 г., 08:07 UTC.";
  assert.deepEqual(spamBotVerdict(ru, now), { limited: true, until: Date.UTC(2026, 9, 8, 8, 7) });

  assert.deepEqual(spamBotVerdict("Your account is now limited. While the account is limited, you will not be able to…", now), {
    limited: true,
    until: null,
  });
  // Непонятный ответ — ни «снято», ни «ограничен»: не будим команду и не выпускаем письма.
  assert.equal(spamBotVerdict("Hello! Please choose an option below.", now), null);
});

const men: Ban = { key: "men", label: "Рабочий аккаунт для мужчин", until: Date.UTC(2026, 9, 8, 8, 7), stuck: 19, people: ["Азиз", "Тимур"] };

test("новое ограничение — всем: какой аккаунт, до какого часа по Ташкенту, кого касается и что делать", () => {
  const { notices, told } = banNotices({ bans: [men], told: {}, labels: {}, now, esc });
  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, "new");
  const text = notices[0].text;
  assert.match(text, /«Рабочий аккаунт для мужчин» — до 08\.10 13:07 по Ташкенту/);
  assert.match(text, /первые сообщения новым клиентам с этого аккаунта не уходят/);
  assert.match(text, /В очереди ждут 19/);
  assert.match(text, /Касается: Азиз, Тимур/);
  assert.match(text, /с личного аккаунта или с другого рабочего/);
  assert.match(text, /«Связался сам»/);
  assert.equal(told.men, men.until);
  assert.equal(tashkentStamp(men.until), "08.10 13:07");
});

test("одно ограничение — одно сообщение: уточнение срока раньше названного часа не повторяется", () => {
  const told = { men: men.until };
  const later = { ...men, until: men.until + 2 * 3600_000 };
  assert.equal(banNotices({ bans: [later], told, labels: {}, now, esc }).notices.length, 0);
  // Названный срок прошёл, а аккаунт всё ещё стоит — «продлено».
  const after = men.until + 60_000;
  const out = banNotices({ bans: [{ ...later, until: after + 24 * 3600_000 }], told, labels: {}, now: after, esc });
  assert.equal(out.notices[0].kind, "longer");
  assert.match(out.notices[0].text, /Ограничение продлено/);
});

test("ограничение снято — всем «снова пишет», и больше о нём не вспоминаем", () => {
  const out = banNotices({ bans: [], told: { men: men.until }, labels: { men: men.label }, now, esc });
  assert.equal(out.notices.length, 1);
  assert.equal(out.notices[0].kind, "lifted");
  assert.match(out.notices[0].text, /«Рабочий аккаунт для мужчин» снова пишет/);
  assert.deepEqual(out.told, {});
  // Имя из панели не ломает разметку бота.
  const odd = banNotices({ bans: [{ ...men, label: "<b>x</b>" }], told: {}, labels: {}, now, esc });
  assert.ok(!odd.notices[0].text.includes("<b>x</b>"));
});

test("скаут спрашивает @SpamBot каждым аккаунтом раз в час и пишет ответ в базу", () => {
  assert.equal(BAN_CHECK_MS, 3600_000);
  const runner = read("scout/runner.mjs");
  assert.match(runner, /client\.getInputEntity\("SpamBot"\)/);
  assert.match(runner, /client\.sendMessage\(bot, \{ message: "\/start" \}\)/);
  assert.match(runner, /spamBotVerdict\(text, Date\.now\(\)\)/);
  assert.match(runner, /await recordBanCheck\(key, verdict, text\)/);
  assert.match(runner, /setInterval\(checkBan, BAN_CHECK_MS\)/);
  // Не при каждом старте: скаут перезапускает каждая выкатка.
  assert.match(runner, /last \+ BAN_CHECK_MS - Date\.now\(\)/);
  // Ответ @SpamBot — сообщение бота, и в разговоры с клиентами он не попадёт.
  assert.match(runner, /if \(sender\?\.bot\) return;/);
});

test("главный аккаунт после ограничения стоит и после перезапуска — ограничение в базе", () => {
  const runner = read("scout/runner.mjs");
  assert.match(runner, /let mainUntil = \(await mainLimitUntil\(\)/);
  assert.match(runner, /paused: \(\) => mainUntil > Date\.now\(\)/);
  assert.match(runner, /mainUntil = await markMainFlood\(why\)/);
  // Расчёт очереди тоже его видит.
  assert.match(read("lib/admin/outreach-queue.ts"), /mainLimitUntil\(now\)/);
});

test("«свободен» от @SpamBot не снимает сутки после отказа на отправке", () => {
  const store = read("lib/admin/account-ban-store.ts");
  assert.match(store, /String\(data\?\.flood_note \?\? ""\)\.startsWith\("SpamBot:"\)/);
  assert.match(store, /row\.source === "spambot"/);
  assert.match(store, /if \(!db \|\| !verdict\) return;/);
});

test("свип говорит всем активным, с 07:00 до 23:00, и не повторяет рассылку при сбое", () => {
  const sweep = read("lib/admin/account-ban-sweep.ts");
  assert.match(sweep, /if \(!messageWindow\(new Date\(now\)\)\) return 0;/);
  assert.match(sweep, /\.from\("staff"\)\.select\("telegram_user_id"\)\.eq\("is_active", true\)/);
  assert.ok(sweep.indexOf("upsert({ key: BAN_NOTIFIED_KEY") < sweep.indexOf("sendMessage(chat, notice.text)"), "сначала запомнить, потом слать");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await banSweep\(Date\.now\(\)\)/);
});
