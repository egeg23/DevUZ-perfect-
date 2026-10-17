/**
 * Узбекский кружок.
 *
 * Владелец, 12.10.2026: «появился кружок с более коротким текстом и на
 * узбекском языке… если ответ от лида на узбекском — кружок на узбекском
 * отправляем». Кружки он пересылает боту со своего аккаунта, как раньше.
 *
 * Держит: ответ по-русски — русский кружок, по-узбекски — узбекский, на
 * другом языке — письмо; бот спрашивает язык кнопками; скаут помнит, какой
 * кружок в «Избранном» узбекский, и русский за него не принимает.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { circleBotReply, circleChoice, circleLangButtons, CIRCLE_CALLBACK } from "@/lib/admin/circle-bot";
import { CIRCLE_FILE_KEY, circleFileKey, isCircleLang, pickCircles } from "@/lib/admin/circle-store";
import {
  CIRCLE_BODY,
  CIRCLE_BODY_UZ,
  NO_CIRCLE,
  NO_CIRCLE_UZ,
  circleBody,
  circleLangFor,
  circleLangOf,
  noCircle,
  replyLang,
} from "@/lib/admin/hello-first";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("ответ по-русски — русский кружок, по-узбекски — узбекский, иначе письмо", () => {
  assert.equal(circleLangFor(replyLang("Здравствуйте", "ru")), "ru");
  assert.equal(circleLangFor(replyLang("Assalomu alaykum", "ru")), "uz");
  assert.equal(circleLangFor(replyLang("Ассалому алайкум", "ru")), "uz");
  // Стикер на узбекское приветствие — узбекский кружок.
  assert.equal(circleLangFor(replyLang("👍", "uz")), "uz");
  // Английский — письмо, кружка нет.
  assert.equal(circleLangFor(replyLang("Hello, who is this?", "ru")), null);
  assert.equal(circleLangFor("en"), null);
});

test("язык кружка записан в ленте и доходит до скаута", () => {
  assert.equal(circleBody("ru"), CIRCLE_BODY);
  assert.equal(circleBody("uz"), CIRCLE_BODY_UZ);
  assert.notEqual(CIRCLE_BODY, CIRCLE_BODY_UZ);
  assert.equal(circleLangOf(CIRCLE_BODY_UZ), "uz");
  assert.equal(circleLangOf(CIRCLE_BODY), "ru");
  // Кружок, поставленный в очередь до узбекского, — русский.
  assert.equal(circleLangOf("🎥 Кружок от студии"), "ru");
  assert.equal(circleLangOf(null), "ru");
  // Модель читает ленту: из неё видно, что предложено и на каком языке.
  assert.match(CIRCLE_BODY_UZ, /на узбекском/);
  assert.match(CIRCLE_BODY_UZ, /бесплатно за 12 часов/);
  assert.match(CIRCLE_BODY_UZ, /«\+»/);
});

test("нет узбекского кружка — письмо, и отчёт в 18:00 это считает", () => {
  assert.equal(noCircle("ru"), NO_CIRCLE);
  assert.equal(noCircle("uz"), NO_CIRCLE_UZ);
  // Отчёт считает по «нет кружка» (autopilot-store).
  assert.ok(NO_CIRCLE_UZ.includes("нет кружка"));
  assert.match(read("lib/admin/autopilot-store.ts"), /\.ilike\("failure", "%нет кружка%"\)/);
});

test("русский — последний кружок «Избранного», узбекский — тот, что скаут положил сам", () => {
  const note = (id: number) => ({ id, date: id * 10 });
  // Новые первыми, как отдаёт Telegram.
  assert.deepEqual(pickCircles([note(12), note(9), note(5)], [12]), { ru: note(9), uz: note(12) });
  // Узбекского нет — русский всё равно последний.
  assert.deepEqual(pickCircles([note(9), note(5)], []), { ru: note(9), uz: null });
  // Прежний узбекский, который не удалился, за русский не сходит.
  assert.deepEqual(pickCircles([note(14), note(12), note(9)], [14, 12]), { ru: note(9), uz: note(14) });
  // Новый узбекский пропал из «Избранного» — берётся прежний, что ещё лежит.
  assert.deepEqual(pickCircles([note(12), note(9)], [14, 12]), { ru: note(9), uz: note(12) });
  // Только узбекский — русского нет.
  assert.deepEqual(pickCircles([note(12)], [12]), { ru: null, uz: note(12) });
  assert.deepEqual(pickCircles([], [12]), { ru: null, uz: null });

  // Номера забыты (база промолчала при перезапуске) — узбекский узнаётся по
  // размеру файла и за русский не сходит.
  const sized = (id: number, bytes: number) => ({ id, date: id * 10, bytes });
  assert.deepEqual(pickCircles([sized(12, 4_000), sized(9, 7_000)], [], 4_000), { ru: sized(9, 7_000), uz: sized(12, 4_000) });
  // Узбекский ещё не загружен — размер ничего не значит.
  assert.deepEqual(pickCircles([sized(12, 4_000)], [], null), { ru: sized(12, 4_000), uz: null });
});

test("загруженный файл: русский под старым ключом, узбекский — под своим", () => {
  assert.equal(circleFileKey("ru"), CIRCLE_FILE_KEY);
  assert.equal(circleFileKey("uz"), `${CIRCLE_FILE_KEY}:uz`);
  assert.equal(isCircleLang("uz"), true);
  assert.equal(isCircleLang("en"), false);
  assert.equal(isCircleLang(undefined), false);
});

test("бот спрашивает язык кружка кнопками, нажатие читается однозначно", () => {
  const [ru, uz] = circleLangButtons(4512);
  assert.equal(ru.callback_data, `${CIRCLE_CALLBACK}:ru:4512`);
  assert.equal(uz.callback_data, `${CIRCLE_CALLBACK}:uz:4512`);
  // Telegram не принимает callback_data длиннее 64 байт.
  for (const button of [ru, uz]) assert.ok(Buffer.byteLength(button.callback_data) <= 64);
  assert.deepEqual(circleChoice(ru.callback_data.split(":")), { lang: "ru", messageId: 4512 });
  assert.deepEqual(circleChoice(uz.callback_data.split(":")), { lang: "uz", messageId: 4512 });
  assert.equal(circleChoice(["cl", "en", "4512"]), null);
  assert.equal(circleChoice(["cl", "uz", "x"]), null);
  assert.equal(circleChoice(["tp", "uz", "4512"]), null);

  assert.match(circleBotReply({ ok: true }, "uz"), /Узбекский кружок сохранён для касаний/);
  assert.match(circleBotReply({ ok: true }, "uz"), /ответил по-узбекски/);
  assert.match(circleBotReply({ ok: true }), /Русский кружок сохранён для касаний/);
});

test("вебхук: кружок ждёт кнопки, кнопка — только у того, кто прислал, и сохраняет один раз", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  const upload = route.slice(route.indexOf("async function handleCircleUpload("), route.indexOf("async function handleCircleLang("));
  assert.ok(upload.indexOf("changesCircle(staff)") < upload.indexOf("holdCircle("), "права проверяются до того, как кружок ждёт");
  assert.match(upload, /sendWithButtons\(message\.chat\.id, esc\(circleLangQuestion\), circleLangButtons\(messageId\)\)/);
  assert.doesNotMatch(upload, /saveCircleFromBot\(/, "без выбора языка кружок не сохраняется");

  const lang = route.slice(route.indexOf("async function handleCircleLang("), route.indexOf("/** Личность для партнёрской программы"));
  assert.match(lang, /!changesCircle\(staff\)/);
  assert.match(lang, /const circle = await takeCircle\(chatId, choice\.messageId\);/);
  // После языка — ниша кнопками (17.10.2026), сохраняет кнопка ниши.
  assert.match(lang, /circleNicheButtons\(langOnly\.lang, langOnly\.messageId\)/);
  assert.match(lang, /await saveCircleFromBot\(circle, staff, choice\.lang, choice\.niche\)/);

  const button = route.slice(route.indexOf("async function handleButton("));
  assert.match(button, /if \(parts\[0\] === CIRCLE_CALLBACK\) \{\s*if \(chatId === undefined \|\| chatId !== query\.from\?\.id\)/);

  // Забрать ожидающий кружок можно один раз: второе нажатие ничего не сохранит.
  const bot = read("lib/admin/circle-bot.ts");
  assert.match(bot, /\.from\("stats_snapshots"\)\.delete\(\)\.eq\("key", pendingKey\(chatId, messageId\)\)\.select\("payload"\)/);
});

test("скаут кладёт узбекский кружок в «Избранное», помнит его номер и убирает прежний", () => {
  const runner = read("scout/runner.mjs");
  const place = runner.slice(runner.indexOf("const placeCircle = async"), runner.indexOf("const checkCircle = async"));
  assert.match(place, /const file = files \? files\.get\(slotKey\(slot\)\) \?\? null : await circleFile\(lang\);/);
  assert.match(place, /uzIds = \[Number\(sent\.id\), \.\.\.old\]/);
  assert.match(place, /client\.deleteMessages\("me", old, \{ revoke: true \}\)/);
  const check = runner.slice(runner.indexOf("const checkCircle = async"));
  assert.match(check, /for \(const slot of CIRCLE_SLOTS\)/);
  // Номера переживают перезапуск: скаут читает их из базы.
  assert.match(runner, /uzIds = states\.get\(key\)\?\.uzIds \?\? \[\];/);
  assert.match(runner, /const general = pickCircles\(notes, uzIds, files\.get\("uz:general"\)\?\.bytes \?\? null, \{/);
  assert.match(runner, /bytes: Number\(m\.media\?\.document\?\.size \?\? 0\) \|\| null/);
});

test("«Аккаунты»: место для каждого языка и строка про оба кружка у аккаунта", () => {
  const page = read("app/admin/accounts/page.tsx");
  assert.match(page, /circleFile\("ru"\),\s*circleFile\("uz"\)/);
  assert.match(page, /t\.circleUzYes\(/);
  assert.match(page, /t\.circleUzNo/);
  assert.match(page, /\/admin\/accounts\/circle\?lang=\$\{slot\.lang\}/);
  assert.match(read("app/admin/accounts/actions.ts"), /isCircleLang\(input\?\.lang\) \? input\.lang : "ru"/);
  assert.match(read("app/admin/accounts/circle/route.ts"), /circleFile\(isCircleLang\(lang\) \? lang : "ru", isCircleNiche\(niche\) \? niche : "general"\)/);
});
