/**
 * Касание с рабочего аккаунта.
 *
 * Главный риск здесь не «плохой текст», а потерянный аккаунт: им же скаут
 * читает чаты, и ограничение за рассылку выключает сразу два канала.
 * Поэтому пределы проверяются наравне с содержанием.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { Finding } from "@/lib/audit/checks";
import { EMPTY_CONTACTS, type Contacts } from "@/lib/audit/contacts";
import {
  HOURLY_CAP,
  HOUR_MS,
  canContact,
  queueView,
  waitText,
  inventedNumbers,
  isStopError,
  messageProblems,
  outreachPrompt,
  isBotHandle,
  isMobile,
  routeFor,
} from "@/lib/admin/outreach";

const finding = (over: Partial<Finding> = {}): Finding => ({
  code: "no_viewport",
  severity: "critical",
  title: "Сайт не приспособлен к телефонам",
  impact: "На телефоне страница открывается в масштабе большого экрана, и многие уходят, не дочитав.",
  fix: "Делаем мобильную версию: несколько дней.",
  ...over,
});

const contacts = (over: Partial<Contacts> = {}): Contacts => ({ ...EMPTY_CONTACTS, telegram: ["@mebel"], ...over });

test("боты и каналы отсеиваются до очереди, а не по ошибке телеграма", () => {
  // Имя бота телеграм требует кончать на bot — этого хватает, чтобы не
  // потратить на автоответчик место в часовом пределе.
  assert.equal(isBotHandle("@gpuzbot"), true);
  assert.equal(isBotHandle("nrgbi_official_bot"), true);
  assert.equal(isBotHandle("@mebel"), false);

  // Первые касания ушли трём ботам из пяти: адрес с сайта компании — это её
  // бот или её канал, потому что именно их компания и публикует.
  assert.deepEqual(routeFor({ ...EMPTY_CONTACTS, telegram: ["@gpuzbot", "@mebel"] }), {
    kind: "handle",
    target: "@mebel",
  });
  // Один только бот — всё равно что ничего: писать некуда.
  assert.equal(routeFor({ ...EMPTY_CONTACTS, telegram: ["@gpuzbot"] }), null);
});

test("нет телеграма — идём по номеру, и только мобильный ведёт в телеграм", () => {
  // Городской номер телеграм не найдёт никогда: аккаунты заводят на мобильные.
  assert.equal(isMobile("+998901234567"), true);
  assert.equal(isMobile("+998711234567"), false, "71 — Ташкент, городской");

  // Номер с кнопки WhatsApp идёт раньше номера из подвала: на первом
  // заведомо читают сообщения.
  assert.deepEqual(
    routeFor({ ...EMPTY_CONTACTS, phones: ["+998711234567", "+998935550011"], whatsapp: ["+998901234567"] }),
    { kind: "phone", target: "+998901234567" },
  );

  // Остался только городской — писать некуда, но позвонить можно.
  assert.deepEqual(routeFor({ ...EMPTY_CONTACTS, phones: ["+998711234567"] }), {
    kind: "manual",
    target: "+998711234567",
  });

  assert.equal(routeFor(EMPTY_CONTACTS), null);
});

test("касание разрешено, когда есть кому и о чём; предел сюда не лезет", () => {
  const base = { contacts: contacts(), findings: [finding()], status: "new" };
  assert.equal(canContact(base), "ok");
  assert.equal(canContact({ ...base, contacts: EMPTY_CONTACTS }), "no_way");
  assert.equal(canContact({ ...base, findings: [] }), "nothing_to_say");
  assert.equal(canContact({ ...base, status: "sent" }), "already", "второе касание — это рассылка");
  assert.equal(canContact({ ...base, status: "sending" }), "already");
});

test("предел — два контакта в час, и он отодвигает отправку, а не отменяет её", () => {
  assert.equal(HOURLY_CAP, 2);

  // Час свободен: первое уходит сразу, второе — после паузы.
  assert.equal(queueView({ ahead: 0, sentLastHour: 0, oldestSentAgoMs: null }).waitMs, 0);
  assert.ok(queueView({ ahead: 1, sentLastHour: 0, oldestSentAgoMs: null }).waitMs > 0);

  // Час выбран: ждём, пока самое старое выпадет из окна.
  const full = queueView({ ahead: 0, sentLastHour: 2, oldestSentAgoMs: 40 * 60_000 });
  assert.equal(full.waitMs, 20 * 60_000, "место освободится через двадцать минут");

  // Пятый в очереди при выбранном часе ждёт ещё два часа сверх того.
  const deep = queueView({ ahead: 4, sentLastHour: 2, oldestSentAgoMs: 40 * 60_000 });
  assert.equal(deep.waitMs, 20 * 60_000 + 2 * HOUR_MS);

  assert.equal(waitText(0), "вот-вот");
  assert.equal(waitText(20 * 60_000), "примерно через 20 мин.");
  assert.equal(waitText(HOUR_MS), "примерно через 1 час");
  assert.equal(waitText(2 * HOUR_MS), "примерно через 2 часа");
  assert.equal(waitText(6 * HOUR_MS), "примерно через 6 часов");
});

test("ошибки, после которых отправлять нельзя", () => {
  assert.equal(isStopError("400: PEER_FLOOD (caused by SendMessage)"), true);
  assert.equal(isStopError("FLOOD_WAIT_420"), true);
  assert.equal(isStopError("USER_PRIVACY_RESTRICTED"), true);
  assert.equal(isStopError("Timeout"), false);
  assert.equal(isStopError("USERNAME_NOT_OCCUPIED"), false, "нет такого адреса — это про один контакт, а не про аккаунт");
});

const PROMPT = outreachPrompt({
  host: "mebel.uz",
  label: "ООО «Мебель»",
  niche: "мебель",
  findings: [finding(), finding({ code: "slow", severity: "major", title: "Сайт начинает открываться только через 4.2 сек" })],
  draft: "Здравствуйте! Меня зовут Данил, я из DevUz Studio — devuz.studio.",
  sender: "Данил",
});

test("в промпт уходит анализ, а не пересказ", () => {
  assert.match(PROMPT, /Сайт: mebel\.uz/);
  assert.match(PROMPT, /Компания: ООО «Мебель»/);
  assert.match(PROMPT, /1\. \[critical\] Сайт не приспособлен к телефонам/);
  assert.match(PROMPT, /Чем оборачивается:/);
  assert.match(PROMPT, /образец тона/);
});

test("выдуманное число ловится, число из анализа — нет", () => {
  assert.deepEqual(inventedNumbers("Сайт отвечает за 4.2 секунды", PROMPT), []);
  assert.deepEqual(inventedNumbers("Конверсия упадёт на 37%", PROMPT), ["37"]);
  // Запятая и точка — один и тот же замер.
  assert.deepEqual(inventedNumbers("за 4,2 секунды", PROMPT), []);
});

const GOOD = [
  "Здравствуйте! Меня зовут Данил, я из DevUz Studio — devuz.studio. Мы проанализировали ваш сайт mebel.uz.",
  "",
  "Открыл его с телефона: страница показывается в масштабе большого экрана, текст мелкий, кнопки крошечные. Это можно проверить прямо сейчас, открыв сайт на своём телефоне. Большинство ваших клиентов заходит именно так, и многие уходят, не дочитав. Мобильная версия для небольшого сайта — это несколько дней работы.",
  "",
  "Нашлось ещё пара мест, которые стоит поправить. Могу прислать разбор целиком — бесплатно и ни к чему не обязывает.",
].join("\n");

test("готовое сообщение проходит, а типичные провалы — нет", () => {
  assert.deepEqual(messageProblems(GOOD, PROMPT, "mebel.uz"), []);

  const codes = (m: string) => messageProblems(m, PROMPT, "mebel.uz").map((p) => p.code);
  assert.deepEqual(codes("Здравствуйте, devuz.studio, mebel.uz, есть предложение."), ["short"]);
  assert.ok(codes(GOOD.replace("mebel.uz", "вашего сайта")).includes("no_host"));
  assert.ok(codes(GOOD.replace("devuz.studio", "нашей студии")).includes("no_us"));
  assert.ok(codes(`${GOOD} Выведем вас в топ по вашим запросам.`).includes("banned"));
  assert.ok(codes(`${GOOD} Рост продаж 40% гарантируем.`).includes("banned"));
  // Кириллица и границы слова: `\b` и `\w` в JavaScript её не видят, и
  // запреты молча пропускали ровно те формы, ради которых написаны.
  assert.ok(codes(`${GOOD} Выведем в топе выдачи.`).includes("banned"));
  assert.ok(codes(`${GOOD} Предлагаем комплексный подход.`).includes("banned"));
  // Процент в первом касании запрещён в любом порядке слов: «40 % продаж»
  // и «конверсии 40 %» — одно обещание, записанное по-разному.
  assert.ok(codes(`${GOOD} Рост конверсии 40 % за месяц.`).includes("banned"));
  assert.ok(codes(`${GOOD} Дадим 40% продаж.`).includes("banned"));
  assert.ok(codes(`${GOOD} 🚀`).includes("banned"), "эмодзи в первом касании");
  assert.ok(codes(`${GOOD} Сейчас вы теряете 63 обращения в месяц.`).includes("invented"));
  assert.ok(codes(GOOD.repeat(4)).includes("long"));
});

test("правила касания записаны там, где их прочитает модель", () => {
  const lib = readFileSync(new URL("../lib/admin/outreach.ts", import.meta.url), "utf8");
  // Опора на анализ и проверяемость — то, ради чего письмо вообще читают.
  assert.match(lib, /Опирайся только на переданные находки/);
  assert.match(lib, /должен уметь проверить сам/);
  assert.match(lib, /Никаких обещаний про позиции в поиске/);
  // Пределы — не декорация: их видно и в коде, и в тексте для человека.
  assert.match(lib, /HOURLY_CAP = 2/);
  assert.match(lib, /MIN_GAP_MS = 8 \* 60_000/);
});

/* ── Очередь, лид и остановка ──────────────────────────────────────────── */

test("лид заводится при отправке и закрепляется за нажавшим", () => {
  const store = readFileSync(new URL("../lib/admin/outreach-store.ts", import.meta.url), "utf8");
  // Владелец: «тот сотрудник, который нажал отправить, — лид автоматически
  // закрепляется за ним». Значит, статус и владелец ставятся сразу.
  assert.match(store, /status: "taken",\n\s+assigned_staff_id: staff\.id,/);
  assert.match(store, /const leadId = await createOutreachLead\(prospect, staff, text, requestNo, route\);/);
  // Лид заводится до постановки в очередь: отказ Telegram не должен
  // оставить касание без следа.
  assert.ok(
    store.indexOf("createOutreachLead(prospect, staff, text, requestNo, route)") <
      store.indexOf('status: route.kind === "manual" ? "manual" : "sending"'),
    "лид заводится после очереди",
  );
  // Лид знает, чем мы на самом деле собирались дотянуться. Раньше здесь
  // стоял «telegram» независимо от маршрута, и менеджер шёл искать адресата
  // в телеграме, которого там не было.
  assert.match(store, /contact_kind: route\.kind === "handle" \? "telegram" : "phone"/);
  // Грейды не выдумываются: разговора ещё не было.
  assert.match(store, /budget: "B3"/);
  assert.match(store, /не выяснено — пишем первыми/);
});

test("очередь держит пределы аккаунта, а не надеется на отправителя", () => {
  const queue = readFileSync(new URL("../lib/admin/outreach-queue.ts", import.meta.url), "utf8");
  assert.match(queue, /if \(\(await sentLastHour\(now\)\)\.count >= HOURLY_CAP\) return null;/);
  // База недоступна — час считается занятым: лучше задержать, чем
  // отправить мимо предела.
  assert.match(queue, /if \(!db\) return \{ count: HOURLY_CAP, oldestAgoMs: null \};/);
  assert.match(queue, /if \(lastAt && now - lastAt < gap\) return null;/, "пауза между отправками не проверяется");
  assert.match(queue, /\.limit\(1\)/, "очередь отдаёт больше одного задания за раз");
  // Ошибка про аккаунт снимает всю очередь, а не только своё задание.
  assert.match(queue, /if \(!isStopError\(why\)\) return \{ stopped: false \};/);
  assert.match(queue, /\.eq\("status", "sending"\)\n\s+\.select\("id"\)/);
});

test("скаут отправляет только из очереди и останавливается на первой же ошибке аккаунта", () => {
  const runner = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");
  assert.match(runner, /const job = await nextQueued\(\);|job = await nextQueued\(\);/);
  assert.match(runner, /await client\.sendMessage\(job\.target, \{ message: job\.message \}\)/);
  assert.match(runner, /if \(outreachStopped\) return;/);
  assert.match(runner, /outreachStopped = stopped;/);
  // README обещал «ничего не отправляет» — обещание переписано, а не забыто.
  // Теперь оно сузилось до правды: первым скаут не пишет никогда, а всё
  // остальное — ответы в переписке, которую начал человек.
  const readme = readFileSync(new URL("../scout/README.md", import.meta.url), "utf8");
  assert.match(readme, /Первым в личку не пишет никогда по своей инициативе/);
  assert.ok(!/\*\*Ничего не отправляет\.\*\*/.test(readme), "README обещает то, чего больше нет");
  assert.ok(
    !/В личку пишет только то, что отправил сотрудник/.test(readme),
    "README обещает, что в личку уходит только написанное человеком, — а модель отвечает сама",
  );
  // Предел в README и предел в коде — одно число.
  assert.match(readme, new RegExp(`двух первых касаний в час`));
  assert.ok(!/двадцати пяти сообщений в сутки/.test(readme), "в README остался прежний суточный предел");
});

test("очередь — не тупик: менеджеру предложено написать самому", () => {
  const list = readFileSync(new URL("../components/admin/outreach-list.tsx", import.meta.url), "utf8");
  assert.match(list, /В очереди на отправку с рабочего аккаунта — \{waitText\(wait\.waitMs\)\}/);
  assert.match(list, /Ждать не обязательно/);
  assert.match(list, /https:\/\/t\.me\/\$\{row\.target\.replace/, "нет ссылки на переписку со своего аккаунта");
  assert.match(list, /<CopyMessage text=\{row\.message\} \/>/, "текст нельзя скопировать");
  // Предел не запирает кнопку «Связаться»: он про очередь, а не про сайт.
  assert.ok(!/sentToday/.test(list), "предел всё ещё решает, показывать ли кнопку");
});
