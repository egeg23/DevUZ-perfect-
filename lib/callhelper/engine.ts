import type { CallObjection, CallScript } from "@/lib/callhelper/script";

/**
 * DevUz CallHelper — что видно по разговору сразу, без модели.
 *
 * Всё, что можно решить словами, решает код за миллисекунды и бесплатно:
 * какое возражение сказал клиент, какой этап сценария пройден и какой
 * следующий, не сказал ли оператор запрещённое слово, какие обязательные
 * фразы ещё не прозвучали, предупредили ли о записи разговора. Модель
 * (suggest.ts) только дописывает живую следующую фразу поверх этого.
 *
 * Чистые функции: работают и в браузере оператора (подсказка появляется в
 * ту же секунду), и на сервере (то же решение уходит модели как подсказка).
 */

export type CallLine = { who: "client" | "operator"; text: string };

/**
 * Общие возражения — когда в сценарии колл-центра своего ответа нет. Слова —
 * начало слова, ответы — нейтральные, без цен и обещаний: колл-центр почти
 * всегда заменит их своими.
 */
export const BASE_OBJECTIONS: readonly (CallObjection & { key: string })[] = [
  {
    key: "busy",
    name: "Нет времени",
    words: ["нет времени", "некогда", "занят", "на работе", "за рулём", "за рулем", "перезвоните"],
    answer: "Понимаю, займу одну минуту. Или скажите, когда удобнее перезвонить, и я наберу ровно в это время.",
  },
  {
    key: "expensive",
    name: "Дорого",
    words: ["дорого", "дороговато", "денег нет", "нет денег", "не потяну", "дешевле"],
    answer: "Понимаю. Давайте сначала разберём, что именно вам нужно: так станет понятна точная сумма, и решите уже по делу.",
  },
  {
    key: "think",
    name: "Подумаю",
    words: ["подумаю", "подумать", "не сейчас", "позже", "потом"],
    answer: "Конечно. Чтобы было о чём подумать, давайте договоримся о следующем шаге: когда вам удобно?",
  },
  {
    key: "not_interested",
    name: "Не интересно",
    words: ["не интересно", "неинтересно", "не надо", "не нужно", "не нуждаюсь"],
    answer: "Понял вас. Один вопрос, чтобы больше не беспокоить: это сейчас не актуально или уже решили вопрос в другом месте?",
  },
  {
    key: "have",
    name: "Уже есть",
    words: ["уже есть", "уже работаем", "у нас есть", "уже обращались"],
    answer: "Отлично, что вопрос уже решаете. Что вам там нравится, а что хотелось бы сделать лучше?",
  },
  {
    key: "send",
    name: "Пришлите информацию",
    words: ["пришлите", "скиньте", "на почту", "в ватсап", "в whatsapp", "в телеграм", "напишите"],
    answer: "Конечно, пришлю. Чтобы отправить именно то, что нужно, уточню один момент: что для вас сейчас главное?",
  },
  {
    key: "who",
    name: "Кто вы, откуда номер",
    words: ["откуда номер", "откуда у вас", "кто вы", "кто это", "что за компания", "вы кто"],
    answer: "Вы оставляли заявку, поэтому звоню. Если неудобно, скажите, и я больше не побеспокою.",
  },
  {
    key: "boss",
    name: "Посоветуюсь",
    words: ["посоветуюсь", "с мужем", "с женой", "с руководител", "с директор", "не я решаю"],
    answer: "Конечно. Давайте договоримся, когда перезвонить, чтобы вы уже успели обсудить. Завтра в это же время удобно?",
  },
];

/** Нижний регистр, ё как е, лишние пробелы — чтобы «Дорого!» и «дорого» были одним словом. */
export function norm(text: string): string {
  return String(text ?? "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Слово или фраза сценария стоит в тексте с начала слова: «дорог» ловит «дорого», но не «недорого». */
export function hasWord(text: string, word: string): boolean {
  const w = norm(word);
  if (w.length < 2) return false;
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escape(w)}`, "u").test(norm(text));
}

export type FoundObjection = { name: string; answer: string; from: "script" | "base" };

/** Возражение в словах клиента: сначала свои возражения колл-центра, потом общие. */
export function objectionIn(text: string, script: CallScript): FoundObjection | null {
  for (const o of script.objections) {
    if (o.words.some((w) => hasWord(text, w))) return { name: o.name, answer: o.answer, from: "script" };
  }
  for (const o of BASE_OBJECTIONS) {
    if (!o.words.some((w) => hasWord(text, w))) continue;
    // Колл-центр завёл возражение с тем же названием, но другими словами: ответ — его.
    const own = script.objections.find((s) => norm(s.name) === norm(o.name));
    return own ? { name: own.name, answer: own.answer, from: "script" } : { name: o.name, answer: o.answer, from: "base" };
  }
  return null;
}

/** Предупредили ли о записи: без этого звонок в России записывать нельзя (152-ФЗ). */
const RECORD_WORDS = ["записывается", "запись разговора", "ведется запись", "записываем разговор", "разговор записыва"];

export type CallHint = {
  /** Возражение в последней реплике клиента, если она последняя в разговоре. */
  objection: FoundObjection | null;
  /** Запрещённые слова, которые оператор сказал за звонок. */
  banned: string[];
  stages: { name: string; done: boolean }[];
  /** Номер первого непройденного этапа или null, если пройдены все. */
  current: number | null;
  /** Обязательные фразы, которых ещё не было. */
  missingMust: string[];
  /** Оператор уже говорил, а о записи не предупредил. */
  noRecordNotice: boolean;
  /** Что сказать сейчас: ответ на возражение или фраза текущего этапа. */
  next: string;
};

export function analyze(script: CallScript, lines: readonly CallLine[]): CallHint {
  const said = lines.filter((l) => l.who === "operator").map((l) => l.text);
  const operator = said.join("\n");
  const last = lines[lines.length - 1];
  const objection = last && last.who === "client" ? objectionIn(last.text, script) : null;

  const stages = script.stages.map((s) => ({ name: s.name, done: s.words.some((w) => hasWord(operator, w)) }));
  const firstOpen = stages.findIndex((s) => !s.done);
  const current = firstOpen === -1 ? null : firstOpen;

  const banned = script.banned.filter((w) => hasWord(operator, w));
  const missingMust = script.must.filter((m) => !norm(operator).includes(norm(m)));
  const noRecordNotice = said.length > 0 && !RECORD_WORDS.some((w) => norm(operator).includes(w));

  const next = objection?.answer ?? (current !== null ? script.stages[current].say : "") ?? "";
  return { objection, banned, stages, current, missingMust, noRecordNotice, next };
}
