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
  foreignScript,
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
  // Пишем не строке с сайта, а тому, кого телеграм назвал в ответ на вопрос
  // «кто это». У человека, найденного по номеру, @адреса может не быть вовсе.
  assert.match(runner, /await client\.sendMessage\(userId, \{ message: job\.message \}\)/);
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

test("нажатие видно: кнопка, которая ждёт минуту, обязана это показывать", () => {
  // Владелец: «кнопка „связаться“ в касаниях не работает». В базе она
  // работала — девятнадцать писем за день, последнее за одиннадцать минут
  // до жалобы. Не работала обратная связь: серверное действие уходит
  // запросом в фоне, браузер не рисует ни полосы загрузки, ни курсора
  // ожидания, а за кнопкой с недавних пор стоит обход сайта на двенадцать —
  // двадцать пять секунд. Страница замирает, и вывод у нажавшего ровно один.
  const list = readFileSync(new URL("../components/admin/outreach-list.tsx", import.meta.url), "utf8");
  const button = readFileSync(new URL("../components/admin/submit-button.tsx", import.meta.url), "utf8");

  assert.ok(/useFormStatus/.test(button), "кнопка не читает состояние формы");
  assert.ok(/disabled=\{pending\}/.test(button), "кнопку можно нажать второй раз, пока идёт первая");

  // Обе долгие формы — через неё. Голая <button type="submit"> вернула бы
  // молчание: здесь это проверяет машина, а не внимательность правящего.
  const submits = list.match(/<button\s+[^>]*type="submit"/g) ?? [];
  assert.equal(
    submits.length,
    1,
    "кроме «не пишем», сабмиты должны идти через SubmitButton — иначе нажатие снова будет беззвучным",
  );
  assert.ok(/pendingLabel=/.test(list), "не сказано, что происходит, пока ждём");
  assert.ok(/до минуты/.test(list), "не сказано, сколько ждать");
});

test("результат нажатия возвращается на ту же карточку", () => {
  const list = readFileSync(new URL("../components/admin/outreach-list.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/admin/prospect/actions.ts", import.meta.url), "utf8");

  // Список бывает в полсотни карточек. Без якоря страница после действия
  // возвращается наверх, и открывшаяся карточка остаётся за три экрана
  // ниже — отличить это от «ничего не произошло» нельзя.
  assert.ok(/id=\{`p-\$\{row\.id\}`\}/.test(list), "у карточки нет якоря");
  assert.ok(/#p-\$\{id\}/.test(actions), "возврат идёт не на карточку");

  // И отказ обязан доезжать словами: действие, выбросившее наружу, в проде
  // не показывает ничего.
  assert.ok(
    /try\s*\{[\s\S]*prepareOutreach\(id, staff\)[\s\S]*catch/.test(actions),
    "исключение из подготовки остаётся без объяснения на экране",
  );
});

/* ── Маршруты касаний: телеграм только там, где дотягиваемся ───────────── */

test("скаут спрашивает, кому пишет, до отправки — и по адресу, и по номеру", () => {
  const runner = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");

  // Первые полсотни касаний ушли в каналы и ботов: @muradbuildings и @ivan
  // по виду не отличаются, а разница в том, что первому написать физически
  // нельзя. Знает об этом только телеграм, и спросить надо до отправки.
  assert.match(runner, /Api\.contacts\.ResolveUsername/, "адрес не проверяется до отправки");
  assert.match(runner, /Api\.contacts\.ImportContacts/, "номер не импортируется — телеграм по нему ничего не скажет");
  assert.match(runner, /verdictForHandle|verdictForPhone/, "приговор не разбирается");

  // Не дотянулись — это не провал: ничего не сломалось, просто автономно
  // сюда нельзя. Карточка уходит человеку, место в часовом пределе цело.
  assert.match(runner, /markUnreachable\(job\.id/, "плохой приговор не снимает карточку с очереди");

  // Импортированный номер убирается сразу: телефонная книга рабочего
  // аккаунта, распухшая от проспектов, — подпись рассылки, а телеграм ещё и
  // рассылает «ваш контакт присоединился».
  assert.match(runner, /Api\.contacts\.DeleteByPhones/, "импортированный номер остаётся в контактах");
});

test("отказ про адресата и отказ про аккаунт разведены", () => {
  const runner = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");
  const about = runner.match(/const ABOUT_TARGET = (\/.*\/[a-z]*);/);
  assert.ok(about, "нет разделения отказов");
  const re = new RegExp(about[1].slice(1, about[1].lastIndexOf("/")), "i");

  // «Такого адреса нет» — обычное дело и повод отдать карточку человеку.
  assert.ok(re.test("USERNAME_NOT_OCCUPIED"));
  assert.ok(re.test('Cannot find any entity corresponding to "+998973442417"'));
  // А это — про нас, и после такого очередь обязана встать целиком.
  assert.ok(!re.test("PEER_FLOOD"));
  assert.ok(!re.test("FLOOD_WAIT_86400"));
});

test("ответ находится по id отправителя, а не только по адресу", async () => {
  const store = readFileSync(new URL("../lib/admin/outreach-talk-store.ts", import.meta.url), "utf8");

  // У человека, найденного по номеру, @адреса может не быть вовсе — а
  // именно так мы находим тех, у кого на сайте нет телеграма. Пока
  // сверялись только по адресу, их ответы уходили в никуда, и снаружи это
  // выглядело как «клиент не отвечает».
  assert.match(store, /target_user_id/, "id адресата не участвует в поиске разговора");
  const byId = store.indexOf("String(row.target_user_id ?? \"\") === userId");
  const byHandle = store.indexOf("normalizeHandle(row.target as string | null) === handle");
  assert.ok(byId > 0 && byHandle > 0, "нет обоих способов");
  assert.ok(byId < byHandle, "адрес человек меняет, id — нет: сверять надо сперва по id");

  const runner = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");
  assert.match(runner, /recordInbound\(\{ handle, userId, body/, "скаут не передаёт id отправителя");
});

test("ручной маршрут не запирает очередь ответов и не отдаётся скауту", () => {
  const store = readFileSync(new URL("../lib/admin/outreach-talk-store.ts", import.meta.url), "utf8");

  // Взять одно верхнее и вернуть null, увидев ручное, значило бы намертво
  // запереть очередь: за ним стоят живые люди, которые сами нам написали.
  assert.match(store, /if \(p\.target_kind === "manual"\) continue;/, "ручное останавливает очередь вместо того, чтобы пропускаться");
  assert.ok(
    !/if \(p\.target_kind === "manual"\) return null;/.test(store),
    "ручное сообщение запирает всё, что стоит за ним",
  );
});

test("чужой проект в письме не проходит проверку", () => {
  // Владелец: «MAVERA идёт в пример логистики, странно. Это же застройщик».
  // Подбор ошибся сам, но ошибиться может и модель: имена наших проектов
  // лежат в том же промпте, и взять оттуда не то — один неверный токен.
  const hooks = { seo: null, lost: null, reference: "TezKetKaz" } as const;
  const right = `${GOOD} В вашей нише мы делали TezKetKaz — посмотрите devuz.studio/cases/tezketkaz.`;
  const wrong = right.replace("TezKetKaz", "MAVERA").replace("tezketkaz", "mavera");

  assert.deepEqual(messageProblems(right, PROMPT, "mebel.uz", hooks), []);
  const codes = messageProblems(wrong, PROMPT, "mebel.uz", hooks).map((p) => p.code);
  assert.ok(codes.includes("foreign_reference"), `не поймали чужой проект: ${codes.join(", ")}`);

  // Имя студии в подписи чужим проектом не считается — иначе не прошло бы
  // ни одно письмо.
  assert.deepEqual(
    messageProblems(GOOD, PROMPT, "mebel.uz", { seo: null, lost: null, reference: null }),
    [],
  );
});

test("ручной маршрут доходит до BANT: отметка, ответ клиента, ответ модели", () => {
  const store = readFileSync(new URL("../lib/admin/outreach-store.ts", import.meta.url), "utf8");
  const list = readFileSync(new URL("../components/admin/outreach-list.tsx", import.meta.url), "utf8");

  // Владелец: «И тут же подхватывает ИИ после написанного сообщение
  // пользователю до выяснения BANT». Подхватить модель может только то, что
  // ей показали: по этому маршруту ответ клиента приходит менеджеру на
  // телефон и к нам не попадает ничем.
  assert.match(store, /export async function markManualSent/);
  assert.match(store, /export async function recordManualAnswer/);
  assert.match(store, /ai_handling: true/, "после ручного касания модель не считается ведущей");

  // Первое письмо обязано лечь в ленту: без него модель, отвечая клиенту,
  // ссылалась бы на несказанное.
  assert.match(store, /direction: "out",\s*\n\s*author: "staff",/);

  assert.match(list, /markManualSentAction/, "нечем отметить, что написал руками");
  assert.match(list, /recordManualAnswerAction/, "некуда перенести ответ клиента");
  assert.match(list, /Скопировать ответ/, "ответ модели нельзя забрать");
});

test("нажал отправить — на месте кнопки написано, чем это кончилось", () => {
  const list = readFileSync(new URL("../components/admin/outreach-list.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/admin/prospect/actions.ts", import.meta.url), "utf8");

  // Владелец: «чтобы при нажатии кнопка меняла название — отправлено или
  // отправлено в очередь». Заголовок карточки писал это и раньше, но он
  // вверху и мелким, а человек смотрит туда, куда нажал.
  assert.match(list, /Отправлено в очередь/);

  // Менеджер: «кнопка остаётся того же цвета, и я не понимаю, уходит
  // сообщение или нет». Зелёная кнопка под прозрачностью выглядит зелёной
  // кнопкой — поэтому нажатая кнопка становится серой и неактивной, той же
  // самой и на том же месте, а не плашкой рядом.
  const button = readFileSync(new URL("../components/admin/submit-button.tsx", import.meta.url), "utf8");
  assert.match(list, /<DoneButton base=/, "на месте кнопки не кнопка, а что-то другое");
  assert.match(button, /disabled\n/, "отработавшая кнопка не заблокирована");
  assert.ok(
    !/disabled:opacity/.test(button),
    "прозрачность вместо цвета — ровно то, чего менеджер не заметил",
  );

  // Подтверждение для себя: с кем, когда, кто.
  assert.match(list, /Связались\{row\.target/, "нет подтверждения, что с контактом связались");
  assert.match(list, /Связались руками\{row\.target/, "по ручному маршруту подтверждения нет");

  // И возврат — на ту же карточку, иначе результат остаётся ниже экрана.
  assert.match(actions, /sent=1&open=\$\{id\}#p-\$\{id\}/);

  // Форма отправки теперь привязана к состоянию строки, а не к «открыта ли
  // карточка»: с якорем ?open= прежнее условие показало бы её на уже
  // ушедшей строке, то есть предложило бы отправить второй раз.
  assert.match(list, /row\.status === "contacting" && row\.message \?/);
  assert.ok(!/expanded && row\.message/.test(list), "форма отправки снова зависит от параметра адреса");

  // И наоборот: карточка не должна остаться без единого действия. Строка
  // без сообщения обязана получить кнопку обратно, иначе это тупик.
  assert.match(list, /row\.status === "new" \|\| !row\.message/);
});

test("доставка подтверждается перечитыванием переписки, а не ответом на отправку", () => {
  const runner = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");
  const queue = readFileSync(new URL("../lib/admin/outreach-queue.ts", import.meta.url), "utf8");

  // Владелец: «после того как отправилось — делай проверку, что с нашего
  // аккаунта реально ушло сообщение». Ответ Telegram означает только, что
  // сервер принял запрос: антиспам снимает сообщение уже после приёма, а у
  // заблокировавшего нас оно исчезает молча — ошибки в обоих случаях нет.
  assert.match(runner, /client\.getMessages\(userId, \{ ids: \[messageId\] \}\)/, "переписка не перечитывается");
  assert.match(runner, /markDelivered\(job\.id, true\)/, "подтверждение никуда не записывается");
  assert.match(runner, /markDelivered\(job\.id, false/, "неподтверждённое не отличается от подтверждённого");

  // Ищем именно своё сообщение по номеру, а не «в переписке что-то есть».
  assert.match(runner, /Number\(m\.id\) === messageId/);

  // Удалённое сообщение приходит объектом MessageEmpty с тем же номером —
  // «место было, содержимого нет». Проверка через `!m.empty` этого не
  // ловила: такого поля у объекта нет вовсе, она всегда истинна, и
  // доставка подтверждалась бы ровно в том случае, ради которого вся эта
  // проверка и заводилась.
  assert.match(runner, /m\.className === "Message"/, "удалённое сообщение сойдёт за доставленное");
  assert.ok(!/&& !m\.empty\)/.test(runner), "проверка на пустое сообщение всегда истинна");
  assert.match(queue, /sent_message_id/);

  // Не подтвердилось — статус не трогаем: отправка была, и повторное
  // касание тому же человеку — ровно то, за что блокируют аккаунт.
  assert.ok(
    !/markDelivered[\s\S]{0,400}status: "failed"/.test(queue),
    "неподтверждённая доставка откатывает отправку",
  );
});

test("маршрут упал в ручной — цель обязана стать номером, а не остаться @адресом", async () => {
  const { handTargetFrom, routeFor } = await import("@/lib/admin/outreach");

  // Карточка ручного маршрута строит из цели ссылку «позвонить» и ссылку в
  // WhatsApp. Оставив там @адрес канала, мы предлагали менеджеру
  // `tel:@muradbuildings` и адрес WhatsApp, собранный из букв.
  assert.equal(
    handTargetFrom({ whatsapp: [], phones: ["+998781228822", "+998900640880"] }),
    "+998900640880",
    "мобильный должен обгонять городской, даже если стоит вторым",
  );
  assert.equal(
    handTargetFrom({ whatsapp: ["+998979503838"], phones: ["+998781503838"] }),
    "+998979503838",
    "номер с кнопки WhatsApp идёт первым: там заведомо читают",
  );
  // Мобильного нет — берём первый городской: писать некуда, но позвонить можно.
  assert.equal(handTargetFrom({ whatsapp: [], phones: ["+998712104444"] }), "+998712104444");
  // Нет ничего — значит нечего и показывать.
  assert.equal(handTargetFrom({ whatsapp: [], phones: [] }), null);

  const store = readFileSync(new URL("../lib/admin/outreach-queue.ts", import.meta.url), "utf8");
  assert.match(store, /target: hand/, "цель не переписывается вместе с маршрутом");

  // И развилка маршрутов считается тем же правилом, чтобы они не разъехались.
  const lib = readFileSync(new URL("../lib/admin/outreach.ts", import.meta.url), "utf8");
  assert.match(lib, /const hand = handTargetFrom\(contacts\);/, "routeFor считает по своему правилу");

  // Старое поведение сохранено: мобильный — маршрут скаута, городской — руки.
  assert.deepEqual(
    routeFor({ phones: ["+998900640880"], emails: [], telegram: [], whatsapp: [], instagram: [], contactsUrl: null }),
    { kind: "phone", target: "+998900640880" },
  );
  assert.deepEqual(
    routeFor({ phones: ["+998712104444"], emails: [], telegram: [], whatsapp: [], instagram: [], contactsUrl: null }),
    { kind: "manual", target: "+998712104444" },
  );
});

test("письмо проверяется тем же промптом, каким писалось", () => {
  // Менеджеры: «кнопка „отправить“ в касании не работает».
  //
  // Она работала и отказывала по делу — только по делу, которого менеджер
  // не совершал. Письмо пишется по промпту со строками обхода, и там же
  // модели сказано сослаться на пройденную страницу по её адресу. Она
  // ссылается. А перед отправкой промпт пересобирался без обхода, и
  // проверка «числа, которых нет в анализе» отбивала номер из этого самого
  // адреса как выдуманный.
  const walked = {
    // Три страницы — не для красоты: строки обхода попадают в промпт
    // только начиная с трёх, и на двух проверка ничего бы не сторожила.
    paths: ["/", "/maps/org/my_smile/6725449754", "/maps/10335/tashkent/"],
    quote: "Яндекс Карты",
    sitemapUrls: null,
    sitemapFresh: null,
    hints: [],
    lang: "ru" as const,
  };
  const message = `${GOOD} Заглянули в том числе на /maps/org/my_smile/6725449754 — там та же история.`;
  const both = (w?: typeof walked) =>
    messageProblems(
      message,
      outreachPrompt({
        host: "mebel.uz",
        label: null,
        niche: null,
        findings: [],
        draft: null,
        sender: "Данил",
        walked: w,
      }),
      "mebel.uz",
    ).map((p) => p.code);

  assert.deepEqual(both(walked), [], "письмо не проходит проверку с тем же промптом");
  // Так выглядела проверка при отправке: тот же текст, промпт беднее.
  assert.ok(both(undefined).includes("invented"), "проверка без обхода обязана была спотыкаться");
});

test("иероглиф посреди русской фразы не уходит клиенту", () => {
  // Живой случай: «Видимость в поиске у вас高 — 92 из 100». Модель уронила
  // в текст знак чужого письма. Человек, вычитывая своё сообщение в
  // двадцатый раз за день, такой знак не видит — машина видит всегда.
  assert.deepEqual(foreignScript("Видимость в поиске у вас高 — 92 из 100"), ["高"]);
  assert.ok(
    messageProblems(`${GOOD} Видимость у вас高 хорошая.`, PROMPT, "mebel.uz").some(
      (p) => p.code === "foreign_script",
    ),
  );

  // Письма мы пишем по-русски, по-узбекски и по-английски — ни одно из
  // них проверка задевать не должна.
  assert.deepEqual(foreignScript(GOOD), []);
  assert.deepEqual(foreignScript("Assalomu alaykum, saytingizni ko‘rib chiqdik — 92 dan 100."), []);
  assert.deepEqual(foreignScript("Hello — we looked at your site, 92 of 100."), []);
  assert.deepEqual(messageProblems(GOOD, PROMPT, "mebel.uz"), []);
});
