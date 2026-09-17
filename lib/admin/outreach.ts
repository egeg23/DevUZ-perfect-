import type { Finding } from "@/lib/audit/checks";
import type { Contacts } from "@/lib/audit/contacts";

/**
 * Касание: от находки на сайте до сообщения, которое отправит сотрудник.
 *
 * Владелец: «там, где менеджеры отсмотрели и нажали „связаться", ИИ
 * подготавливает сообщение и начинает с того, что выдал анализ; дать
 * возможность редакции первого сообщения перед отправкой. Тот сотрудник,
 * который нажал отправить, — лид автоматически закрепляется за ним».
 *
 * Пишет рабочий аккаунт студии, а не бот: бот в Telegram не может написать
 * первым. Отсюда и главное ограничение этого файла — не текст, а счётчик.
 * За рассылку из личного аккаунта Telegram ограничивает аккаунт целиком, а
 * этим же аккаунтом скаут читает чаты: потеряв его, студия теряет сразу два
 * канала. Поэтому здесь живут пределы, и они не декоративные.
 */

/* ── Предохранители ────────────────────────────────────────────────────── */

/**
 * Сколько контактов в час со всего аккаунта.
 *
 * Владелец: «выстави лимит написаний 2 контакта в час; остальные ставь в
 * очередь или предложи менеджеру не ждать очередь, а написать с личного
 * аккаунта». Предел — не отказ: сообщение всё равно принимается и уходит,
 * когда подойдёт его черёд.
 */
export const HOURLY_CAP = 2;

/** Час, в котором считается предел. */
export const HOUR_MS = 3600_000;

/**
 * Пауза между отправками внутри часа: два сообщения подряд в одну секунду
 * — это подпись рассылки, даже когда их всего два.
 */
export const MIN_GAP_MS = 8 * 60_000;
export const MAX_GAP_MS = 20 * 60_000;

/** Ошибки Telegram, после которых отправлять нельзя до конца суток. */
export const STOP_ERRORS = ["PEER_FLOOD", "USER_PRIVACY_RESTRICTED", "FLOOD_WAIT", "USER_BANNED_IN_CHANNEL"];

export function isStopError(message: string): boolean {
  const upper = message.toUpperCase();
  return STOP_ERRORS.some((code) => upper.includes(code));
}

/**
 * Кому вообще можно написать.
 *
 * Только тем, кто сам опубликовал телеграм на своём сайте: публикуя
 * @username рядом с «напишите нам», компания приглашает писать. Номер
 * телефона такого приглашения не даёт — по нему звонят, а сообщение в
 * Telegram на номер, которого нет в контактах, читается как спам и им же
 * и является.
 */
export function targetFor(contacts: Contacts): string | null {
  return contacts.telegram[0] ?? null;
}

export type Reason = "no_telegram" | "nothing_to_say" | "already" | "ok";

export const REASON_TEXT: Record<Reason, string> = {
  no_telegram: "На сайте нет телеграма — писать некуда. Остаётся почта или звонок руками.",
  nothing_to_say: "К сайту нет претензий: писать не о чем, и придумывать повод не надо.",
  already: "Этому сайту уже писали. Второе касание — это рассылка.",
  ok: "",
};

/**
 * Можно ли писать этому сайту.
 *
 * Предела здесь нет намеренно: он про очередь, а не про сайт. Исчерпанный
 * час не делает касание неуместным — он только отодвигает отправку, и
 * менеджер об этом узнаёт словами, а не запертой кнопкой.
 */
export function canContact(input: {
  contacts: Contacts;
  findings: readonly Finding[];
  status: string;
}): Reason {
  if (input.status !== "new" && input.status !== "contacting") return "already";
  if (!input.findings.length) return "nothing_to_say";
  if (!targetFor(input.contacts)) return "no_telegram";
  return "ok";
}

/* ── Очередь ───────────────────────────────────────────────────────────── */

export type QueueView = {
  /** Сколько заданий стоит перед этим, считая с нуля. */
  ahead: number;
  /** Когда примерно уйдёт — миллисекунды от «сейчас». */
  waitMs: number;
};

/**
 * Через сколько дойдёт очередь.
 *
 * Считается по двум числам: сколько уже ушло за последний час и сколько
 * заданий стоит впереди. Оценка грубая и намеренно не приукрашенная —
 * менеджеру нужно решить «ждать или написать самому», а для этого хватает
 * порядка величины.
 */
export function queueView(input: {
  ahead: number;
  sentLastHour: number;
  /** Сколько миллисекунд назад ушло самое старое из отправленных за час. */
  oldestSentAgoMs: number | null;
}): QueueView {
  const slotsNow = Math.max(0, HOURLY_CAP - input.sentLastHour);
  if (input.ahead < slotsNow) return { ahead: input.ahead, waitMs: input.ahead * MIN_GAP_MS };

  // Место освобождается, когда самое старое сообщение часа выпадает из окна.
  const freesIn = input.oldestSentAgoMs === null ? 0 : Math.max(0, HOUR_MS - input.oldestSentAgoMs);
  const extraHours = Math.floor((input.ahead - slotsNow) / HOURLY_CAP);
  return { ahead: input.ahead, waitMs: freesIn + extraHours * HOUR_MS };
}

/** «через 40 минут», «через 2 часа» — так, как это скажет человек. */
export function waitText(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes <= 1) return "вот-вот";
  if (minutes < 60) return `примерно через ${minutes} мин.`;
  const hours = Math.round(minutes / 60);
  const word = hours === 1 ? "час" : hours >= 2 && hours <= 4 ? "часа" : "часов";
  return `примерно через ${hours} ${word}`;
}

/* ── Что видит модель ──────────────────────────────────────────────────── */

export type OutreachInput = {
  host: string;
  label: string | null;
  niche: string | null;
  findings: readonly Finding[];
  /** Черновик аудитора: тон и структура, от которых отталкиваться. */
  draft: string | null;
  sender: string;
};

export function outreachPrompt(input: OutreachInput): string {
  const findings = input.findings
    .slice(0, 4)
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.title}\n   Чем оборачивается: ${f.impact}\n   Что делаем: ${f.fix}`)
    .join("\n");

  return [
    `Сайт: ${input.host}`,
    input.label ? `Компания: ${input.label}` : "Название компании неизвестно.",
    input.niche ? `Ниша: ${input.niche}` : "",
    `Отправитель: ${input.sender}.`,
    "",
    "Что нашёл анализ:",
    findings,
    "",
    input.draft ? `Черновик, собранный без модели, — как образец тона и длины:\n\n${input.draft}` : "",
    "",
    "Напиши первое сообщение в Telegram по этому сайту.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const OUTREACH_SYSTEM = `Ты пишешь первое сообщение владельцу компании в Узбекистане от имени веб-студии DevUz Studio (devuz.studio, Ташкент). Сообщение уходит в Telegram с рабочего аккаунта студии, и человек читает его на телефоне.

Задача одна: чтобы он ответил. Не продать, не рассказать о студии — ответить.

Правила, которые не обсуждаются:

— Начинай с того, что выдал анализ. Первая строка называет тебя, студию с адресом devuz.studio и домен его сайта; вторая — что именно увидели. Не «мы делаем сайты», а «на телефоне ваш сайт открывается в масштабе монитора».
— Опирайся только на переданные находки. Не выдумывай цифры, названия, историю компании и её клиентов. Число в сообщении должно совпадать с переданным.
— Одна находка — главная, её разбираешь: что увидел, чем оборачивается для его клиентов, сколько занимает починка. Остальные — одной строкой в конце.
— То, что ты называешь, адресат должен уметь проверить сам за минуту. «Откройте сайт с телефона» — это проверяемо; «у вас низкая конверсия» — нет.
— Никаких обещаний про позиции в поиске, рост продаж на проценты и «выведем в топ». Первое такое обещание переводит сообщение в спам в глазах того, кто читал уже двадцать похожих.
— Заканчивай не вопросом «интересно?», а предложением прислать разбор целиком — бесплатно и ни к чему не обязывает.
— Тон деловой и дружелюбный, на «вы». Без восклицательных знаков, без эмодзи, без слов «оптимизация», «конверсия», «комплексный подход».
— Длина: от 60 до 140 слов. Абзацы по две-три строки — на телефоне стена текста не читается.
— Пиши по-русски.
— Это первое сообщение живому человеку, а не письмо в рассылке. Напиши так, как написал бы, если бы отправлял его один раз.`;

export const OUTREACH_TOOL = {
  name: "outreach_message",
  description: "Первое сообщение владельцу сайта в Telegram.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: { type: "string", minLength: 120, maxLength: 1400 },
    },
    required: ["message"],
  },
};

/**
 * Числа в сообщении обязаны быть из анализа.
 *
 * Та же проверка, что у рекомендаций, и по той же причине: выдуманная
 * секунда в «сайт отвечает за 4.2 секунды» превращает проверяемое
 * наблюдение в ложь, которую адресат поймает первым же обновлением страницы.
 */
export function inventedNumbers(message: string, prompt: string): string[] {
  const allowed = new Set((prompt.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")));
  const out: string[] = [];
  for (const n of message.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    const norm = n.replace(",", ".");
    if (!allowed.has(norm)) out.push(n);
  }
  return [...new Set(out)];
}

/**
 * Границы слова здесь не ставятся, а классы пишутся кириллицей вручную:
 * `\b` и `\w` в JavaScript знают только латиницу, поэтому «в топ\b» не
 * срабатывает после «топ», а «комплексн\w* подход» не видит «комплексный».
 */
const BANNED = [
  /в топ/i,
  /гарантиру/i,
  /первое место/i,
  // Проценты в первом касании запрещены целиком, а не в паре с
  // «продажами»: «рост конверсии 40 %» и «40 % продаж» — одно и то же
  // обещание, записанное в разном порядке, и проверить его адресат не
  // может. Замеры анализа процентами не выражаются — терять нечего.
  /\d+\s*%/,
  /комплексн[а-яё]*\s+подход/i,
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
];

/**
 * Есть ли в тексте оборот, которого у нас не бывает.
 *
 * Отдельной функцией, потому что запреты одинаковы для первого сообщения и
 * для любой реплики дальше: «выведем в топ» одинаково врёт и в первом
 * касании, и в десятом ответе. Список один — разъехавшись, он разрешил бы
 * в переписке ровно то, что запрещено в письме.
 */
export function bannedPhrase(text: string): boolean {
  return BANNED.some((re) => re.test(text));
}

export type MessageProblem = { code: string; text: string };

/** Что не даёт отправить сообщение как есть. Пусто — можно отправлять. */
export function messageProblems(message: string, prompt: string, host: string): MessageProblem[] {
  const problems: MessageProblem[] = [];
  const words = message.trim().split(/\s+/).filter(Boolean).length;

  if (words < 40) problems.push({ code: "short", text: "Сообщение короче сорока слов — в нём не поместится ни находка, ни её последствие." });
  if (words > 200) problems.push({ code: "long", text: "Сообщение длиннее двухсот слов — на телефоне такое не читают." });
  if (!message.includes(host)) problems.push({ code: "no_host", text: `В сообщении нет домена ${host} — адресат не поймёт, что письмо про его сайт.` });
  if (!/devuz\.studio/i.test(message)) problems.push({ code: "no_us", text: "В сообщении нет devuz.studio — непонятно, кто пишет." });

  const invented = inventedNumbers(message, prompt);
  if (invented.length) {
    problems.push({ code: "invented", text: `Числа, которых нет в анализе: ${invented.join(", ")}. Проверьте или уберите.` });
  }
  if (bannedPhrase(message)) {
    problems.push({ code: "banned", text: "В сообщении есть обещание или знак, которых в первом касании быть не должно: «в топ», «гарантируем», любые проценты, «комплексный подход», эмодзи." });
  }
  return problems;
}
