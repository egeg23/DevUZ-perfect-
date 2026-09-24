import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { botCopy } from "@/content/bot";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";
import { clock, minuteFields, stateFromStored, telegramMinuteUrl } from "@/lib/minute-client";
import {
  SITE_GRACE_MS,
  TELEGRAM_GRACE_MS,
  claimWindow,
  issueWindow,
  minuteSeconds,
  parseTelegramPayload,
  telegramPayload,
  validClaim,
} from "@/lib/qualify/minute";

/**
 * Минута на скидку. Владелец: «60 секунд на то, чтобы написать нашему
 * ассистенту на сайте или в тг — тогда скидка 30% закрепляется за
 * человеком. По окончании таймера остаётся только механика ответа за 20
 * секунд».
 */

const KEY = "k".repeat(64);
const T0 = Date.parse("2026-09-24T10:00:00Z");
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("написал в первую минуту — скидка закреплена, и закрепление проверяется", () => {
  const window = issueWindow(KEY, T0);
  const claim = claimWindow(KEY, window, 60, SITE_GRACE_MS, T0 + 59_000);
  assert.ok(claim, "в пределах минуты скидка не закрепилась");
  assert.ok(validClaim(KEY, claim, T0 + 7 * 24 * 3600_000), "закрепление не пережило неделю");
  // Закрепление — не окно: предъявить окно вместо закрепления нельзя.
  assert.equal(validClaim(KEY, window, T0 + 1000), false);
});

test("минута вышла — остаётся только гарантия двадцати секунд", () => {
  const window = issueWindow(KEY, T0);
  assert.equal(claimWindow(KEY, window, 60, SITE_GRACE_MS, T0 + 60_000 + SITE_GRACE_MS + 1000), null);
  // Выключенная минута не закрепляет ничего.
  assert.equal(claimWindow(KEY, window, 0, SITE_GRACE_MS, T0 + 1000), null);
});

test("Telegram получает запас на то, чтобы открыть приложение", () => {
  const window = issueWindow(KEY, T0);
  const late = T0 + 60_000 + 20_000;
  assert.equal(claimWindow(KEY, window, 60, SITE_GRACE_MS, late), null);
  assert.ok(claimWindow(KEY, window, 60, TELEGRAM_GRACE_MS, late));
  assert.equal(claimWindow(KEY, window, 60, TELEGRAM_GRACE_MS, T0 + 60_000 + TELEGRAM_GRACE_MS + 1000), null);
});

test("подделать окно или закрепление нельзя", () => {
  const window = issueWindow(KEY, T0);
  // Чужой ключ.
  assert.equal(claimWindow("x".repeat(64), window, 60, SITE_GRACE_MS, T0 + 1000), null);
  // Сдвинутое время при старой подписи: «окно выдано позже, чем было».
  const [, , sig] = window.split("_");
  const shifted = `mn_${(Math.floor(T0 / 1000) + 3600).toString(36)}_${sig}`;
  assert.equal(claimWindow(KEY, shifted, 60, SITE_GRACE_MS, T0 + 3600_000), null);
  // Мусор и не строка.
  for (const junk of ["", "mn_", "mn_zz_zz", "mc_1_2", 42, null, undefined, "mn_" + "a".repeat(80)]) {
    assert.equal(claimWindow(KEY, junk, 60, SITE_GRACE_MS, T0), null, String(junk));
    assert.equal(validClaim(KEY, junk, T0), false, String(junk));
  }
  // Закрепление с чужим ключом и просроченное.
  const claim = claimWindow(KEY, window, 60, SITE_GRACE_MS, T0 + 1000)!;
  assert.equal(validClaim("x".repeat(64), claim, T0 + 2000), false);
  assert.equal(validClaim(KEY, claim, T0 + 400 * 24 * 3600_000), false);
});

test("ссылка на бота с окном проходит в параметр start", () => {
  const window = issueWindow(KEY, T0);
  for (const locale of locales) {
    const payload = telegramPayload(window, locale);
    // Telegram пропускает в start только это и не длиннее 64 знаков.
    assert.match(payload, /^[A-Za-z0-9_-]{1,64}$/);
    assert.deepEqual(parseTelegramPayload(payload), { token: window, locale });
    assert.equal(telegramMinuteUrl("https://t.me/bot", window, locale), `https://t.me/bot?start=${payload}`);
  }
  assert.deepEqual(parseTelegramPayload(window), { token: window, locale: null });
  // Чужие payload мимо: партнёрский код, привязка заказа, передача разговора.
  for (const other of ["ref_ABC123", "order_xyz", "ru-abcdefghijklmnopqr", "partner", "login"]) {
    assert.equal(parseTelegramPayload(other), null, other);
  }
});

test("длина минуты — из переменной, 0 выключает", () => {
  const before = process.env.FIRST_MINUTE_SECONDS;
  try {
    delete process.env.FIRST_MINUTE_SECONDS;
    assert.equal(minuteSeconds(), 60);
    process.env.FIRST_MINUTE_SECONDS = "0";
    assert.equal(minuteSeconds(), 0);
    process.env.FIRST_MINUTE_SECONDS = "90";
    assert.equal(minuteSeconds(), 90);
    process.env.FIRST_MINUTE_SECONDS = "мусор";
    assert.equal(minuteSeconds(), 60);
  } finally {
    if (before === undefined) delete process.env.FIRST_MINUTE_SECONDS;
    else process.env.FIRST_MINUTE_SECONDS = before;
  }
});

test("браузер: одна минута на человека, закрепление навсегда", () => {
  // Ничего не было — минуту ещё предстоит открыть.
  assert.deepEqual(stateFromStored({}, T0), { phase: "off" });
  // Идёт — продолжается после перезагрузки с того же места.
  assert.deepEqual(stateFromStored({ token: "mn_a_b", from: T0, until: T0 + 60_000 }, T0 + 10_000), {
    phase: "running",
    token: "mn_a_b",
    from: T0,
    until: T0 + 60_000,
  });
  // Вышла — не перезапускается.
  assert.deepEqual(stateFromStored({ token: "mn_a_b", from: T0, until: T0 + 60_000 }, T0 + 61_000), { phase: "over" });
  // Закреплено — сильнее всего остального.
  assert.deepEqual(stateFromStored({ token: "mn_a_b", until: T0, claim: "mc_c_d" }, T0 + 99_000), {
    phase: "claimed",
    claim: "mc_c_d",
  });

  assert.deepEqual(minuteFields({ phase: "running", token: "mn_a_b", from: T0, until: T0 + 1 }), { minute: "mn_a_b" });
  assert.deepEqual(minuteFields({ phase: "claimed", claim: "mc_c_d" }), { claim: "mc_c_d" });
  assert.deepEqual(minuteFields({ phase: "over" }), {});
  assert.equal(clock(59_001), "1:00");
  assert.equal(clock(47_000), "0:47");
  assert.equal(clock(-5), "0:00");
});

test("сервер решает сам: скидку за минуту даёт только подпись", () => {
  const chat = read("app/api/chat/route.ts");
  assert.match(chat, /const heldClaim = await checkClaim\(body\.claim\)/);
  assert.match(chat, /await claimMinute\(body\.minute, SITE_GRACE_MS\)/);
  assert.match(chat, /heldClaim \|\| newClaim \? "minute"/);
  // Скидка за минуту отключает задержку двадцати секунд.
  assert.match(chat, /history\.length === 1 && !discount \? shouldMissPromise\(\) : 0/);

  const handoff = read("app/api/handoff/route.ts");
  assert.match(handoff, /\(await checkClaim\(body\.claim\)\) \? \("minute" as const\)/);

  // Бот разбирает окно раньше партнёрских кодов и передачи разговора.
  const bot = read("app/api/telegram/webhook/route.ts");
  const minuteAt = bot.indexOf("parseTelegramPayload(payload)");
  assert.ok(minuteAt > 0 && minuteAt < bot.indexOf("codeFromStart(payload)"));
  assert.ok(minuteAt < bot.indexOf("resumeFromSite(chat.id, payload"));
  assert.match(bot, /claimMinute\(minute\.token, TELEGRAM_GRACE_MS\)/);
  // Закрепление за чатом переживает выкатку: поднимается из базы.
  assert.match(bot, /await minuteClaimed\(chat\.id\)/);
  assert.match(bot, /session\.discount = "promise"/);
});

test("тексты минуты есть на всех языках", () => {
  const faqCount = getDictionary("ru").faq.items.length;
  for (const locale of locales) {
    const dict = getDictionary(locale);
    for (const key of [
      "minuteTitle",
      "minuteText",
      "minuteChat",
      "minuteTelegram",
      "minuteHide",
      "minuteCounting",
      "minuteClaiming",
      "minuteWon",
    ] as const) {
      assert.ok(dict.chat[key].trim(), `${locale}: нет chat.${key}`);
    }
    assert.ok(dict.chat.minuteCounting.includes("{t}"), `${locale}: в счётчике нет {t}`);
    assert.ok(dict.chat.minuteWon.includes("30%"), `${locale}: в «закреплено» нет 30%`);
    assert.equal(dict.faq.items.length, faqCount, `${locale}: вопросов не столько же, сколько по-русски`);

    const copy = botCopy(locale);
    assert.ok(copy.minuteWon.includes("30%"));
    // Посреди разговора бот шлёт одну строку — второй абзац приветствия.
    assert.match(copy.minuteWon.split("\n\n")[1], /^🎁 .*30%/);
    assert.match(copy.minuteLate, /20/);
  }
});
