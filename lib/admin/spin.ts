import type { CircleNiche, IntroLang } from "@/lib/admin/sales-after-reply";

/**
 * SPIN в касаниях — правилами, вопросы без модели.
 *
 * Владелец, 18.11.2026: «Есть методология продаж spin - внедри ее в наши
 * касания». SPIN (Нил Рэкхем) — четыре вида вопросов по порядку:
 *
 * - Ситуация: как у человека сейчас (откуда приходят клиенты). Таких
 *   вопросов — один: остальное мы уже знаем по проверке сайта, а допрос о
 *   том, что видно и так, раздражает.
 * - Проблема: замечает ли он то, что мы нашли (уходят, не написав).
 * - Последствия: чем это для него оборачивается (уходят к конкурентам).
 * - Польза: он сам говорит, что исправленное ему нужно, — и тут же «+».
 *
 * Где работает:
 * - в переписке модели (outreach-talk → talkNote) у половины касаний
 *   (spinHalf): ступень — по числу реплик модели (spinStep), пример
 *   вопроса — из банка ниже, словами его ниши;
 * - у менеджера — кнопки «Вопросы SPIN» под полем ответа в карточке лида,
 *   для всех: вставляют вопрос на языке клиента, менеджер правит и шлёт;
 * - в письме автопрогона — заход «spin» (AUTO_ARMS в letter-texts):
 *   проблема и последствия тезисами, в конце вопрос о пользе.
 *
 * Вопросы — словами покупателя, без жаргона (jargonWords), без длинных тире
 * и штампов (plain-text), узбекский — латиницей, без чисел. Держит
 * tests/spin.test.ts.
 */

/** Откат — false: модель ведёт разговор, как до 18.11.2026. Кнопки менеджера остаются. */
export const SPIN = true;

/** С этого дня считаются половины A/B «SPIN в переписке». */
export const SPIN_FROM = "2026-11-18";

export const SPIN_STAGES = ["situation", "problem", "implication", "need"] as const;
export type SpinStage = (typeof SPIN_STAGES)[number];

/** Ступень, на которой модель уже не спрашивает, а предлагает «+». */
export type SpinStep = SpinStage | "offer";

/**
 * Половина A/B — по номеру касания, без миграции: FNV-1a от id, чётное —
 * со SPIN. Номер случайный (uuid), поэтому половины честные, и касание не
 * переходит из половины в половину между репликами.
 */
export function spinHalf(prospectId: string): boolean {
  let h = 0x811c9dc5;
  for (let i = 0; i < prospectId.length; i += 1) {
    h ^= prospectId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 2 === 0;
}

export function spinOn(prospectId: string, on: boolean = SPIN): boolean {
  return on && spinHalf(prospectId);
}

/**
 * Ступень по числу реплик модели в разговоре: первая — ситуация, вторая —
 * проблема, третья — последствия, четвёртая — польза и «+», дальше только
 * «+». Клиент ответил на ступень раньше — модель её пропускает (так сказано
 * в заметке), а согласие «+» ловит код раньше модели в любой момент.
 */
export function spinStep(repliesSoFar: number): SpinStep {
  const n = Math.max(0, Math.floor(repliesSoFar));
  return n < SPIN_STAGES.length ? SPIN_STAGES[n] : "offer";
}

/** Кто его клиенты — словами ниши. */
const WHO: Readonly<Record<CircleNiche, { ru: string; uz: string }>> = {
  general: { ru: "клиенты", uz: "mijozlar" },
  medcentr: { ru: "пациенты", uz: "bemorlar" },
  stomatologiya: { ru: "пациенты", uz: "bemorlar" },
  mebel: { ru: "заказчики", uz: "buyurtmachilar" },
  restoran: { ru: "гости", uz: "mehmonlar" },
  "salon-krasoty": { ru: "клиентки", uz: "mijozlar" },
  turagentstvo: { ru: "туристы", uz: "sayyohlar" },
  "uchebnyy-centr": { ru: "ученики", uz: "o‘quvchilar" },
  nedvizhimost: { ru: "покупатели", uz: "xaridorlar" },
  avtoservis: { ru: "клиенты", uz: "mijozlar" },
  avtosalon: { ru: "покупатели", uz: "xaridorlar" },
  magazin: { ru: "покупатели", uz: "xaridorlar" },
  stroitelstvo: { ru: "заказчики", uz: "buyurtmachilar" },
  logistika: { ru: "клиенты", uz: "mijozlar" },
  uslugi: { ru: "клиенты", uz: "mijozlar" },
};

/** Что человек делает, когда решился: записаться, заказать, забронировать. */
const ACT: Readonly<Record<CircleNiche, { ru: string; uz: string }>> = {
  general: { ru: "оставить заявку", uz: "ariza qoldirish" },
  medcentr: { ru: "записаться на приём", uz: "qabulga yozilish" },
  stomatologiya: { ru: "записаться на приём", uz: "qabulga yozilish" },
  mebel: { ru: "заказать замер", uz: "o‘lchovga buyurtma berish" },
  restoran: { ru: "забронировать стол", uz: "stol band qilish" },
  "salon-krasoty": { ru: "записаться", uz: "yozilish" },
  turagentstvo: { ru: "оставить заявку на тур", uz: "turga ariza qoldirish" },
  "uchebnyy-centr": { ru: "записаться на курс", uz: "kursga yozilish" },
  nedvizhimost: { ru: "записаться на просмотр", uz: "ko‘rishga yozilish" },
  avtoservis: { ru: "записаться на ремонт", uz: "ta’mirga yozilish" },
  avtosalon: { ru: "записаться на тест-драйв", uz: "test-drayvga yozilish" },
  magazin: { ru: "оформить заказ", uz: "buyurtma berish" },
  stroitelstvo: { ru: "заказать расчёт", uz: "hisob-kitobga buyurtma berish" },
  logistika: { ru: "заказать расчёт перевозки", uz: "tashish narxini so‘rash" },
  uslugi: { ru: "оставить заявку", uz: "ariza qoldirish" },
};

export type SpinContext = { lang: IntroLang; niche: CircleNiche; hasSite: boolean };

/** Вопрос ступени на языке клиента — для модели примером, для менеджера кнопкой. */
export function spinQuestion(stage: SpinStage, ctx: SpinContext): string {
  const who = WHO[ctx.niche] ?? WHO.general;
  const act = ACT[ctx.niche] ?? ACT.general;
  const uz = ctx.lang === "uz";
  switch (stage) {
    case "situation":
      return uz
        ? `Hozir ${who.uz} sizga ko‘proq qayerdan keladi: saytdanmi, Instagramdanmi yoki tanishlar tavsiyasi bilanmi?`
        : `Откуда сейчас к вам чаще приходят ${who.ru}: с сайта, из Инстаграма или по рекомендации?`;
    case "problem":
      return ctx.hasSite
        ? uz
          ? `Saytga kirib, yozmasdan va qo‘ng‘iroq qilmasdan chiqib ketadigan ${who.uz} bo‘ladimi?`
          : `Бывает, что ${who.ru} заходят на сайт и уходят, так и не написав и не позвонив?`
        : uz
          ? `Sizni internetda qidirib, topa olmagan ${who.uz} bo‘ladimi?`
          : `Бывает, что ${who.ru} ищут вас в интернете и не находят?`;
    case "implication":
      return uz
        ? `${ctx.hasSite ? "Saytda" : "Internetda"} ${act.uz} yo‘lini topa olmagan odam keyin kimga murojaat qiladi deb o‘ylaysiz?`
        : `Как думаете, куда идёт человек, который не понял, как у вас ${act.ru}?`;
    case "need":
      return uz
        ? `Agar bu odamlar ${act.uz}gacha yetib kelsa, bu siz uchun foydali bo‘larmidi?`
        : `Если бы эти люди доходили до того, чтобы ${act.ru}, вам бы это пригодилось?`;
  }
}

/** Названия ступеней для заметки модели. */
const STAGE_RU: Readonly<Record<SpinStage, string>> = {
  situation: "ситуация",
  problem: "проблема",
  implication: "последствия",
  need: "польза",
};

/**
 * Раздел заметки модели: как вести разговор по SPIN и какая ступень сейчас.
 * Пример вопроса — на языке клиента; модель подстраивает его под разговор,
 * но не превращает в допрос: один вопрос в реплике.
 */
export function spinNote(input: { repliesSoFar: number; ctx: SpinContext; goal: "mockup" | "call" }): string {
  const step = spinStep(input.repliesSoFar);
  const close =
    input.goal === "mockup"
      ? "предложение: «Если интересно — отправьте «+», и через 12 часов пришлём ссылку на макет»"
      : "предложение короткого созвона сегодня или завтра";
  const now =
    step === "offer"
      ? `Сейчас: вопросы позади. Ответь на его слова и закончи реплику шагом — ${close}.`
      : `Сейчас ступень «${STAGE_RU[step]}». Пример вопроса на его языке: «${spinQuestion(step, input.ctx)}» Подстрой его под разговор своими словами.${
          step === "need" ? ` После этого вопроса — в той же реплике ${close}.` : ""
        }`;
  return `### Как вести разговор — SPIN

Ведёшь разговор вопросами по порядку, по одному вопросу в реплике:

1. Ситуация — один вопрос о том, как у него сейчас (откуда приходят клиенты). Больше не спрашивай: остальное мы уже знаем по проверке сайта.
2. Проблема — замечает ли он то, что мы нашли, своими словами.
3. Последствия — к чему это ведёт для него: человек не дошёл до заявки и ушёл к другим.
4. Польза — вопрос, на который он сам скажет, что исправленное ему нужно. Сразу за ним — ${close}.

- Сначала ответь на то, что он спросил или сказал, потом один вопрос ступени. Без вопроса реплику не заканчивай, пока ступени не пройдены.
- Он уже сам ответил на вопрос ступени (например, рассказал, откуда клиенты) — не переспрашивай, переходи к следующей.
- Он заинтересовался, спрашивает, что дальше, сколько стоит или как выглядит макет, — вопросы закончились, сразу ${close}.
- Холодный или короткий ответ — не дави следующим вопросом: одна спокойная фраза и ${close}.
- В вопросах нет чисел и обещаний: не спрашивай «сколько вы теряете в месяц» — он не знает, а цифру за него ты называть не можешь.

${now}`;
}

/* ── A/B «SPIN в переписке» ──────────────────────────────────────────────── */

/** Победителя не объявляем раньше 30 разговоров модели на половину. */
export const SPIN_MIN = 30;

export type SpinCounts = {
  spin: boolean;
  /** Разговоры, где модель ответила хотя бы раз с SPIN_FROM. */
  talks: number;
  /** Из них дошли до «+». */
  plus: number;
  /** Из них макет ушёл. */
  mockup: number;
};

export type SpinVerdict = { kind: "early"; need: number } | { kind: "even" } | { kind: "leader"; spin: boolean; chance: number };

/**
 * Кто чаще доводит разговор модели до «+» — та же байесовская оценка, что у
 * «Нового захода» (Бета(1+успехи, 1+неудачи), нормальное приближение).
 */
export function spinVerdict(on: SpinCounts, off: SpinCounts): SpinVerdict {
  const need = Math.max(0, SPIN_MIN - Math.min(on.talks, off.talks));
  if (need > 0) return { kind: "early", need };
  const beta = (s: number, n: number) => {
    const a = 1 + s;
    const b = 1 + Math.max(0, n - s);
    return { mean: a / (a + b), variance: (a * b) / ((a + b) ** 2 * (a + b + 1)) };
  };
  const x = beta(on.plus, on.talks);
  const y = beta(off.plus, off.talks);
  const z = (x.mean - y.mean) / Math.sqrt(x.variance + y.variance || 1e-12);
  const chance = 1 / (1 + Math.exp(-1.702 * z));
  if (chance >= 0.9) return { kind: "leader", spin: true, chance };
  if (chance <= 0.1) return { kind: "leader", spin: false, chance: 1 - chance };
  return { kind: "even" };
}
