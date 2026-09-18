/**
 * Язык переписки: услышать отказ, а потом уже быть вежливым.
 *
 * Владелец: «общение первичкой надо всё-таки делать на двух языках — у нас
 * рынок Узбекистана, и нам отвечают на узбекском».
 *
 * Поводом была не догадка, а переписка. С сайта alfraganus.uz пришло одно
 * слово — «Kerskmas». Это «kerakmas» с опечаткой, «не нужно». Разобрали как
 * «продолжай разговор», модель написала ответ; спас случай — ответ не прошёл
 * проверку по другой причине. Написать второй раз тому, кто отказал, — ровно
 * то, за что Telegram ограничивает аккаунт, а этим же аккаунтом скаут читает
 * чаты.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { readInbound } from "@/lib/admin/outreach-talk";
import { detectLang, talkLang } from "@/lib/talk/language";

test("узбекский отказ слышен — на латинице и на кириллице", () => {
  for (const no of ["Kerakmas", "Kerak emas", "kerak emas", "Qiziqmaymiz", "Yozmang", "Керак эмас"]) {
    assert.equal(readInbound(no), "stop", `«${no}» — это отказ, а разобрано иначе`);
  }
  // И русские отговорки, которых прежний список не знал.
  for (const no of ["Спасибо, не надо", "Не интересует", "нам это не нужно"]) {
    assert.equal(readInbound(no), "stop", `«${no}» — это отказ`);
  }
});

test("короткий ответ без вопроса модели не отдаётся", () => {
  // Опечатку правилом не поймать: «kerakmas» написано через «с», и ни одно
  // слово из списка тут не совпадёт. Ловится длиной: два слова в холодной
  // переписке — почти всегда отговорка, а цена ошибки несимметрична.
  assert.equal(readInbound("Kerskmas"), "unclear");
  assert.equal(readInbound("ок"), "unclear");
  assert.equal(readInbound("Позже"), "unclear");

  // Но вопрос — это разговор на любом языке и любой длины.
  assert.equal(readInbound("Qancha turadi?"), "talk");
  assert.equal(readInbound("Сколько?"), "talk");

  // И нормальный ответ по-прежнему разговор.
  assert.equal(
    readInbound("Здравствуйте! Спасибо за обратную связь, пришлите разбор на почту"),
    "talk",
  );
});

test("просьбу позвать человека понимаем на обоих языках", () => {
  assert.equal(readInbound("Позвоните мне пожалуйста"), "human");
  assert.equal(readInbound("Menejer bilan gaplashsak bo'ladimi"), "human");
});

test("язык определяется по приметам, а не по алфавиту", () => {
  assert.equal(detectLang("Керак эмас"), "uz", "узбекская кириллица — не русский");
  assert.equal(detectLang("Нарх қанча?"), "uz");
  assert.equal(detectLang("Assalomu alaykum, gaplashsak"), "uz");
  assert.equal(detectLang("Hello, could you send us the price for a website?"), "en");

  // Русское письмо про сайт остаётся русским. В первой версии списка стояло
  // «сайт» как узбекская примета — и всякое наше письмо, а других у нас
  // почти не бывает, читалось бы как узбекское.
  assert.equal(detectLang("Здравствуйте! Пришлите разбор на сайт, посмотрим."), "ru");
  assert.equal(detectLang("Мы посмотрели ваш сайт и нашли несколько проблем"), "ru");

  // Латиница без примет — узбекский. Сторона ошибки выбрана намеренно:
  // ответить по-английски узбеку — всё равно что не услышать.
  assert.equal(detectLang("Kerskmas"), "uz");
  assert.equal(detectLang(""), "ru");
});

test("разговор идёт на языке последней реплики клиента, а не первой", () => {
  const thread = [
    { direction: "in" as const, body: "Здравствуйте, что вы предлагаете?" },
    { direction: "out" as const, body: "Мы посмотрели ваш сайт…" },
    { direction: "in" as const, body: "Yaxshi, narx qancha bo'ladi?" },
  ];
  assert.equal(talkLang(thread), "uz", "человек перешёл на узбекский — переходим и мы");

  // Наши собственные реплики не в счёт: иначе разговор навсегда остался бы
  // на том языке, на котором мы его начали.
  assert.equal(
    talkLang([
      { direction: "out", body: "Здравствуйте, мы посмотрели ваш сайт" },
      { direction: "in", body: "Assalomu alaykum, qancha turadi?" },
    ]),
    "uz",
  );

  // Ни одного входящего — отвечать не на что, язык по умолчанию.
  assert.equal(talkLang([{ direction: "out", body: "Здравствуйте" }]), "ru");
});

test("ответ пишется на языке разговора, а не всегда по-русски", async () => {
  const { readFileSync } = await import("node:fs");
  const run = readFileSync(new URL("../lib/admin/outreach-talk-run.ts", import.meta.url), "utf8");

  assert.match(run, /const locale = talkLang\(thread\)/, "язык разговора не определяется");
  assert.match(run, /buildSystemPrompt\(locale\)/, "системный промпт по-прежнему жёстко русский");
  assert.ok(!/locale: "ru"/.test(run), "движок первички по-прежнему открывает разговор по-русски");
});
