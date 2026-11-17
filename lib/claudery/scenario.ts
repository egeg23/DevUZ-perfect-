/**
 * Настройки бота Claudery — то, что владелец правит в «ИИ-сотрудники» →
 * «Claudery».
 *
 * Владелец, 17.11.2026: «Сделай в ИИ сотрудниках, чтобы я мог собирать бота
 * там как конструктор, ну типа сценарии прописывать ответов, кнопки
 * делать»; «Гарантии результата и тд — в конструкторе пропишу сам». Следом:
 * «Убери узбекский язык от туда, бот только на рф аудиторию будет работать, и
 * сделай проще шаги и тд, не разобраться в логике».
 *
 * Поэтому путь клиента один и неизменный, а править можно только слова:
 *   1. Приветствие с кнопкой «Нужна помощь» (и до 4 своих кнопок: ответ
 *      текстом или ссылка);
 *   2. «Что случилось?» — бот ждёт сообщение, можно со скриншотом;
 *   3. Счёт Platega на сумму из настроек (оплату подтверждает Platega);
 *   4. Сообщение после оплаты;
 *   5. Условия и гарантия — в оферте.
 *
 * Хранится в stats_snapshots «claudery-setup». Бот только по-русски. Тексты
 * уходят в Telegram простым текстом, без разметки. Модели нет.
 */

export type Extra = { label: string; answer?: string; url?: string };

export type Setup = {
  greet: string;
  helpLabel: string;
  ask: string;
  pay: string;
  amount: number;
  /** Скидка тому, кто уже хоть раз оплатил, % (владелец, 17.11.2026: 30%). */
  repeatDiscount: number;
  paid: string;
  terms: string;
  extras: Extra[];
};

/** Шаг бота — внутреннее устройство, собирается из Setup (`scenarioOf`). */
export type NodeKind = "message" | "ask" | "pay";
export type Button = { label: string; to?: string; url?: string };
export type Step = { id: string; kind: NodeKind; text: string; buttons: Button[]; next?: string; amount?: number; discount?: number };
export type Scenario = { start: string; terms: string; steps: Step[] };

export const LIMITS = { text: 3500, label: 60, terms: 6000, extras: 4 } as const;
export const AMOUNT = { min: 100, max: 1_000_000, default: 5000 } as const;
/**
 * Повторное обращение — скидка (владелец, 17.11.2026: «Повторное обращение
 * по любой проблеме даем скидку тому кто уже оплачивал хоть раз в размере
 * 30%. (3500₽)»). В тексте счёта сумма стоит знаком {сумма}: бот подставит
 * ту, что выставлена этому клиенту.
 */
export const REPEAT_DISCOUNT = { min: 0, max: 90, default: 30 } as const;
export const SUM_MARK = "{сумма}";
/** То же знаком латиницей — для инструкции на узбекском и польском. */
export const SUM_MARK_LATIN = "{sum}";
export const SETUP_KEY = "claudery-setup";
/** Назначение платежа в Platega (владелец, 17.11.2026). */
export const PAY_PURPOSE = "Claudery: удалённая помощь";
export const BACK_LABEL = "← Назад";

export const DEFAULT_SETUP: Setup = {
  greet:
    "Здравствуйте! Это Claudery: удалённая помощь с нейросетями и ИИ-сервисами. Нажмите кнопку, расскажите, что не получается, и специалист поможет.",
  helpLabel: "🆘 Нужна помощь",
  ask: "Что случилось? Опишите одним сообщением. Можно приложить скриншот.",
  pay: "Спасибо, заявку записали. Стоимость помощи — {сумма}. Оплатите по кнопке ниже: как только оплата пройдёт, специалист напишет вам здесь в Telegram.",
  amount: AMOUNT.default,
  repeatDiscount: REPEAT_DISCOUNT.default,
  paid: "Оплата прошла, спасибо! Специалист напишет вам в Telegram с 06:00 до 19:00 по Москве.",
  terms: "",
  extras: [],
};

/** Путь клиента из настроек: приветствие → вопрос → счёт → после оплаты. */
export function scenarioOf(s: Setup): Scenario {
  const extras: Step[] = s.extras
    .map((e, i) => ({ e, id: `x${i}` }))
    .filter(({ e }) => e.answer && !e.url)
    .map(({ e, id }) => ({ id, kind: "message", text: e.answer!, buttons: [{ label: BACK_LABEL, to: "start" }] }));
  return {
    start: "start",
    terms: s.terms,
    steps: [
      {
        id: "start",
        kind: "message",
        text: s.greet,
        buttons: [
          { label: s.helpLabel, to: "ask" },
          ...s.extras.map((e, i) => (e.url ? { label: e.label, url: e.url } : { label: e.label, to: `x${i}` })),
        ],
      },
      { id: "ask", kind: "ask", text: s.ask, buttons: [], next: "pay" },
      { id: "pay", kind: "pay", text: s.pay, buttons: [], next: "paid", amount: s.amount, discount: s.repeatDiscount },
      { id: "paid", kind: "message", text: s.paid, buttons: [] },
      ...extras,
    ],
  };
}

export function stepOf(s: Scenario, id: string | undefined | null): Step | undefined {
  return id ? s.steps.find((step) => step.id === id) : undefined;
}

/** Что не так с настройками — словами для панели. Пусто — можно сохранять. */
export function setupProblems(s: Setup): string[] {
  const out: string[] = [];
  const texts: [string, string][] = [
    ["Приветствие", s.greet],
    ["Вопрос «что случилось»", s.ask],
    ["Текст со счётом", s.pay],
    ["Текст после оплаты", s.paid],
  ];
  for (const [name, value] of texts) {
    if (!value.trim()) out.push(`${name}: пустой текст.`);
    if (value.length > LIMITS.text) out.push(`${name}: длиннее ${LIMITS.text} знаков.`);
  }
  if (!s.helpLabel.trim() || s.helpLabel.length > LIMITS.label) out.push(`Главная кнопка: от 1 до ${LIMITS.label} знаков.`);
  if (!Number.isInteger(s.amount) || s.amount < AMOUNT.min || s.amount > AMOUNT.max) out.push(`Сумма: от ${AMOUNT.min} до ${AMOUNT.max} ₽.`);
  if (!Number.isInteger(s.repeatDiscount) || s.repeatDiscount < REPEAT_DISCOUNT.min || s.repeatDiscount > REPEAT_DISCOUNT.max)
    out.push(`Скидка повторным: от ${REPEAT_DISCOUNT.min} до ${REPEAT_DISCOUNT.max}%.`);
  if (s.terms.length > LIMITS.terms) out.push(`Условия длиннее ${LIMITS.terms} знаков.`);
  if (s.extras.length > LIMITS.extras) out.push(`Своих кнопок больше ${LIMITS.extras}.`);
  s.extras.forEach((e, i) => {
    const at = `Кнопка ${i + 1}`;
    if (!e.label.trim() || e.label.length > LIMITS.label) out.push(`${at}: подпись от 1 до ${LIMITS.label} знаков.`);
    if (!e.answer && !e.url) out.push(`${at}: впишите ответ или ссылку.`);
    if (e.answer && e.url) out.push(`${at}: либо ответ, либо ссылка, не оба сразу.`);
    if (e.url && !/^https:\/\/\S+$/.test(e.url)) out.push(`${at}: ссылка только https://…`);
    if (e.answer && e.answer.length > LIMITS.text) out.push(`${at}: ответ длиннее ${LIMITS.text} знаков.`);
  });
  return out;
}

/** Прочитать сохранённое; битое — настройки по умолчанию. */
export function parseSetup(raw: unknown): Setup {
  if (!raw || typeof raw !== "object") return DEFAULT_SETUP;
  const r = raw as Partial<Setup>;
  const s: Setup = {
    greet: typeof r.greet === "string" ? r.greet : DEFAULT_SETUP.greet,
    helpLabel: typeof r.helpLabel === "string" ? r.helpLabel : DEFAULT_SETUP.helpLabel,
    ask: typeof r.ask === "string" ? r.ask : DEFAULT_SETUP.ask,
    pay: typeof r.pay === "string" ? r.pay : DEFAULT_SETUP.pay,
    amount: typeof r.amount === "number" ? r.amount : DEFAULT_SETUP.amount,
    repeatDiscount: typeof r.repeatDiscount === "number" ? r.repeatDiscount : DEFAULT_SETUP.repeatDiscount,
    paid: typeof r.paid === "string" ? r.paid : DEFAULT_SETUP.paid,
    terms: typeof r.terms === "string" ? r.terms : "",
    extras: Array.isArray(r.extras) ? (r.extras as Extra[]) : [],
  };
  return setupProblems(s).length ? DEFAULT_SETUP : s;
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/\r/g, "").trim() : "");

/** Настройки из формы. Пустая строка «Своя кнопка» — кнопки нет. */
export function setupFromForm(form: FormData): Setup {
  const extras: Extra[] = [];
  for (let i = 0; i < LIMITS.extras; i++) {
    const label = str(form.get(`x${i}.label`));
    const answer = str(form.get(`x${i}.answer`));
    const url = str(form.get(`x${i}.url`));
    if (!label && !answer && !url) continue;
    extras.push({ label, ...(answer ? { answer } : {}), ...(url ? { url } : {}) });
  }
  const amount = Number(str(form.get("amount")).replace(/\s/g, ""));
  const discount = Number(str(form.get("repeatDiscount")).replace(/[\s%]/g, "") || "0");
  return {
    greet: str(form.get("greet")),
    helpLabel: str(form.get("helpLabel")),
    ask: str(form.get("ask")),
    pay: str(form.get("pay")),
    amount: Number.isFinite(amount) ? Math.round(amount) : 0,
    repeatDiscount: Number.isFinite(discount) ? Math.round(discount) : -1,
    paid: str(form.get("paid")),
    terms: str(form.get("terms")),
    extras,
  };
}

/** Сумма для того, кто уже оплачивал: со скидкой, целыми рублями. */
export function repeatAmount(amount: number, discount: number): number {
  return Math.round((amount * (100 - discount)) / 100);
}

/**
 * Текст счёта с суммой этого клиента: {сумма} → «3 500 ₽». Повторному — ещё
 * строка о скидке, чтобы он видел, откуда цена.
 */
export function payText(text: string, amount: number, full: number, discount: number): string {
  const body = text.split(SUM_MARK).join(rub(amount)).split(SUM_MARK_LATIN).join(rub(amount));
  if (amount >= full) return body;
  return `Вы уже обращались к нам, поэтому скидка ${discount}%: ${rub(amount)} вместо ${rub(full)}.\n\n${body}`;
}

/** Сумма в тексте: «5 000 ₽». */
export function rub(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}
