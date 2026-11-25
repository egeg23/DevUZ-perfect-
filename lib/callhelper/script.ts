/**
 * DevUz CallHelper — сценарий звонка, который задаёт колл-центр.
 *
 * Владелец, 25.11.2026: «Давай сделаем ИИ суфлёра для колл-центров, который
 * бы анализировал разговор и по заданным параметрам рекомендовал что говорить
 * и отрабатывал возражения», на план — «Делаем, название: DevUz CallHelper»,
 * и «это сервис которым будут пользоваться другие кц… по подписке».
 *
 * «Заданные параметры» — этот сценарий: продукт и цель звонка, этапы со
 * словами, по которым видно, что этап пройден, возражения со своими ответами,
 * обязательные фразы и запрещённые слова. Колл-центр пишет его сам в простой
 * форме (по строке на этап или возражение, части через «|»), код разбирает
 * её здесь без модели.
 *
 * Сценарий — данные клиента: в модель он уходит внутри тегов как данные, а
 * размеры ограничены (LIMITS), чтобы один запрос не стоил как сто.
 */

export type CallStage = {
  /** Как этап называется в списке: «Представиться». */
  name: string;
  /** Что сказать на этом этапе — подсказка, пока модель думает или молчит. */
  say: string;
  /** Слова оператора, по которым этап считается пройденным. */
  words: string[];
};

export type CallObjection = {
  name: string;
  /** Слова клиента, по которым узнаём возражение (начало слова: «дорог» ловит «дорого»). */
  words: string[];
  /** Ответ колл-центра — показывается сразу, без модели. */
  answer: string;
};

export type CallScript = {
  product: string;
  goal: string;
  stages: CallStage[];
  objections: CallObjection[];
  /** Фразы, которые оператор обязан сказать за звонок. */
  must: string[];
  /** Слова, которых оператор говорить не должен. */
  banned: string[];
};

export const LIMITS = {
  text: 400,
  answer: 600,
  stages: 12,
  objections: 20,
  words: 15,
  must: 8,
  banned: 40,
  word: 40,
} as const;

const clip = (value: unknown, max: number): string =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/** Слова через запятую: без пустых, без повторов, не длиннее LIMITS.word. */
export function splitWords(raw: unknown, max: number = LIMITS.words): string[] {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,;]/);
  const out: string[] = [];
  for (const item of list) {
    const word = clip(item, LIMITS.word).toLowerCase();
    if (word.length >= 2 && !out.includes(word)) out.push(word);
    if (out.length >= max) break;
  }
  return out;
}

/** Сценарий из чего угодно (тело запроса, память браузера): лишнее отброшено, длинное обрезано. */
export function cleanScript(raw: unknown): CallScript {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const arr = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];
  return {
    product: clip(src.product, LIMITS.text),
    goal: clip(src.goal, LIMITS.text),
    stages: arr(src.stages)
      .map((s) => ({ name: clip(s.name, 80), say: clip(s.say, LIMITS.text), words: splitWords(s.words) }))
      .filter((s) => s.name)
      .slice(0, LIMITS.stages),
    objections: arr(src.objections)
      .map((o) => ({ name: clip(o.name, 80), words: splitWords(o.words), answer: clip(o.answer, LIMITS.answer) }))
      .filter((o) => o.name && o.words.length && o.answer)
      .slice(0, LIMITS.objections),
    must: (Array.isArray(src.must) ? src.must : []).map((m) => clip(m, LIMITS.text)).filter(Boolean).slice(0, LIMITS.must),
    banned: splitWords(src.banned, LIMITS.banned),
  };
}

/** Что в сценарии не так — показывается над формой. Пустой список — можно звонить. */
export function scriptProblems(script: CallScript): string[] {
  const out: string[] = [];
  if (!script.product) out.push("product");
  if (!script.goal) out.push("goal");
  if (!script.stages.length) out.push("stages");
  if (script.stages.some((s) => !s.words.length)) out.push("stageWords");
  return out;
}

/** Форма сценария — простые текстовые поля: так его пишет любой руководитель колл-центра. */
export type ScriptForm = {
  product: string;
  goal: string;
  /** «Название | что сказать | слова через запятую» — по строке на этап. */
  stages: string;
  /** «Название | слова через запятую | ответ» — по строке на возражение. */
  objections: string;
  /** По фразе на строку. */
  must: string;
  /** Через запятую. */
  banned: string;
};

const parts = (line: string): string[] => line.split("|").map((p) => p.trim());

export function scriptFromForm(form: Partial<ScriptForm>): CallScript {
  const lines = (text: unknown) => String(text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return cleanScript({
    product: form.product,
    goal: form.goal,
    stages: lines(form.stages).map((line) => {
      const [name = "", say = "", words = ""] = parts(line);
      return { name, say, words };
    }),
    objections: lines(form.objections).map((line) => {
      const [name = "", words = "", ...answer] = parts(line);
      return { name, words, answer: answer.join(" | ") };
    }),
    must: lines(form.must),
    banned: form.banned,
  });
}

export function formFromScript(script: CallScript): ScriptForm {
  return {
    product: script.product,
    goal: script.goal,
    stages: script.stages.map((s) => [s.name, s.say, s.words.join(", ")].join(" | ")).join("\n"),
    objections: script.objections.map((o) => [o.name, o.words.join(", "), o.answer].join(" | ")).join("\n"),
    must: script.must.join("\n"),
    banned: script.banned.join(", "),
  };
}

/**
 * Пример — звонок лидогенерации для стоматологии: с этого начинает каждый,
 * кто открыл раздел впервые. Цен и обещаний в нём нет: их пишет заказчик.
 */
export const EXAMPLE_SCRIPT: CallScript = cleanScript({
  product: "Имплантация зубов в клинике заказчика, бесплатная консультация и снимок",
  goal: "Записать человека на бесплатную консультацию: день и время",
  stages: [
    {
      name: "Представиться",
      say: "Здравствуйте! Меня зовут Анна, клиника «Улыбка». Предупреждаю: разговор записывается. Вы оставляли заявку на консультацию по имплантации, удобно говорить?",
      words: "меня зовут, клиника, записывается",
    },
    {
      name: "Узнать задачу",
      say: "Подскажите, какой зуб беспокоит и как давно его нет?",
      words: "беспокоит, давно, какой зуб, сколько зубов",
    },
    {
      name: "Рассказать о консультации",
      say: "На консультации врач посмотрит снимок и скажет, подходит ли имплантация и сколько это будет стоить именно у вас. Это бесплатно.",
      words: "консультац, снимок, бесплатно",
    },
    {
      name: "Записать",
      say: "Когда вам удобнее: завтра вечером или в субботу утром?",
      words: "удобнее, завтра, суббот, запишу, записала, записал",
    },
  ],
  objections: [
    {
      name: "Дорого",
      words: "дорого, дороговато, денег нет, не потяну",
      answer: "Понимаю. Поэтому и предлагаем сначала бесплатную консультацию: врач посчитает точную сумму, а по оплате есть рассрочка. Когда удобно подойти?",
    },
    {
      name: "Подумаю",
      words: "подумаю, подумать, не сейчас",
      answer: "Конечно, решение серьёзное. Давайте я запишу вас на консультацию: вы ничего не теряете, а будет что обдумать по делу. Удобно в субботу?",
    },
  ],
  must: ["разговор записывается"],
  banned: "гарантируем, без боли, бесплатная имплантация, дешевле всех",
});
