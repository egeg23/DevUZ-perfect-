/**
 * Сценарий бота Claudery — то, что владелец собирает в конструкторе
 * («ИИ-сотрудники» → «Claudery»).
 *
 * Владелец, 17.11.2026: «Сделай в ИИ сотрудниках, чтобы я мог собирать бота
 * там как конструктор, ну типа сценарии прописывать ответов, кнопки делать»;
 * «Гарантии результата и тд — в конструкторе пропишу сам».
 *
 * Сценарий — список шагов. Шаг показывает текст на русском и узбекском и
 * кнопки: кнопка ведёт на другой шаг или открывает ссылку. Вид шага решает,
 * что бот делает сам:
 *  - «message» — просто текст и кнопки;
 *  - «ask» — ждёт от клиента сообщение (что случилось, можно со скриншотом),
 *    потом идёт на `next`;
 *  - «pay» — выставляет счёт Platega на `amount` ₽, оплату подтверждает
 *    Platega, а не слова клиента; после оплаты — шаг `next`;
 *  - «lead» — заводит заявку без оплаты (например, «позвать менеджера»).
 *
 * Хранится в stats_snapshots «claudery-scenario». Без модели: бот только
 * ходит по шагам. Тексты уходят в Telegram простым текстом, без разметки.
 */

export const LANGS = ["ru", "uz"] as const;
export type Lang = (typeof LANGS)[number];
export type Text = Record<Lang, string>;

export const KINDS = ["message", "ask", "pay", "lead"] as const;
export type NodeKind = (typeof KINDS)[number];

export type Button = { label: Text; to?: string; url?: string };
export type Step = { id: string; kind: NodeKind; text: Text; buttons: Button[]; next?: string; amount?: number };
export type Scenario = { start: string; terms: string; steps: Step[] };

export const LIMITS = { steps: 30, buttons: 6, text: 3500, label: 60, terms: 6000, id: 24 } as const;
export const AMOUNT = { min: 100, max: 1_000_000, default: 5000 } as const;
export const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
export const SCENARIO_KEY = "claudery-scenario";
/** Назначение платежа в Platega (владелец, 17.11.2026). */
export const PAY_PURPOSE = "Claudery: удалённая помощь";

/**
 * Сценарий по умолчанию: одна кнопка «Нужна помощь» → что случилось → счёт →
 * «оплачено». Гарантию и условия владелец дописывает сам: здесь их нет.
 */
export const DEFAULT_SCENARIO: Scenario = {
  start: "start",
  terms: "",
  steps: [
    {
      id: "start",
      kind: "message",
      text: {
        ru: "Здравствуйте! Это Claudery: удалённая помощь с нейросетями и ИИ-сервисами. Нажмите кнопку, расскажите, что не получается, и специалист поможет.",
        uz: "Assalomu alaykum! Bu Claudery: neyrotarmoqlar va SI xizmatlari bo‘yicha masofaviy yordam. Tugmani bosing, nima ishlamayotganini yozing, mutaxassis yordam beradi.",
      },
      buttons: [{ label: { ru: "🆘 Нужна помощь", uz: "🆘 Yordam kerak" }, to: "ask" }],
    },
    {
      id: "ask",
      kind: "ask",
      text: {
        ru: "Что случилось? Опишите одним сообщением. Можно приложить скриншот.",
        uz: "Nima bo‘ldi? Bitta xabarda yozing. Skrinshot ham yuborishingiz mumkin.",
      },
      buttons: [],
      next: "pay",
    },
    {
      id: "pay",
      kind: "pay",
      amount: AMOUNT.default,
      text: {
        ru: "Спасибо, заявку записали. Стоимость помощи — 5 000 ₽. Оплатите по кнопке ниже: как только оплата пройдёт, специалист напишет вам здесь в Telegram.",
        uz: "Rahmat, arizangiz qabul qilindi. Yordam narxi — 5 000 ₽. Quyidagi tugma orqali to‘lang: to‘lov o‘tishi bilan mutaxassis sizga Telegramda yozadi.",
      },
      buttons: [],
      next: "paid",
    },
    {
      id: "paid",
      kind: "message",
      text: {
        ru: "Оплата прошла, спасибо! Специалист напишет вам в Telegram с 08:00 до 21:00 по Ташкенту.",
        uz: "To‘lov o‘tdi, rahmat! Mutaxassis sizga Toshkent vaqti bilan 08:00 dan 21:00 gacha Telegramda yozadi.",
      },
      buttons: [],
    },
  ],
};

export function stepOf(s: Scenario, id: string | undefined | null): Step | undefined {
  return id ? s.steps.find((step) => step.id === id) : undefined;
}

/** Что не так со сценарием — словами для панели. Пусто — можно сохранять. */
export function scenarioProblems(s: Scenario): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  if (!s.steps.length) out.push("Нет ни одного шага.");
  if (s.steps.length > LIMITS.steps) out.push(`Шагов больше ${LIMITS.steps}.`);
  if (s.terms.length > LIMITS.terms) out.push(`Условия длиннее ${LIMITS.terms} знаков.`);
  for (const step of s.steps) {
    const at = `Шаг «${step.id}»`;
    if (!ID_RE.test(step.id) || step.id.length > LIMITS.id) out.push(`${at}: имя — латиница, цифры и дефис, до ${LIMITS.id} знаков.`);
    if (ids.has(step.id)) out.push(`${at}: такое имя уже есть.`);
    ids.add(step.id);
    if (!KINDS.includes(step.kind)) out.push(`${at}: неизвестный вид.`);
    for (const lang of LANGS) {
      if (!step.text[lang].trim()) out.push(`${at}: пустой текст (${lang}).`);
      if (step.text[lang].length > LIMITS.text) out.push(`${at}: текст длиннее ${LIMITS.text} знаков (${lang}).`);
    }
    if (step.buttons.length > LIMITS.buttons) out.push(`${at}: кнопок больше ${LIMITS.buttons}.`);
    if (step.kind === "pay") {
      const a = step.amount ?? 0;
      if (!Number.isInteger(a) || a < AMOUNT.min || a > AMOUNT.max) out.push(`${at}: сумма от ${AMOUNT.min} до ${AMOUNT.max} ₽.`);
    }
    if ((step.kind === "ask" || step.kind === "pay") && !step.next) out.push(`${at}: укажите, куда идти дальше.`);
  }
  for (const step of s.steps) {
    const at = `Шаг «${step.id}»`;
    if (step.next && !ids.has(step.next)) out.push(`${at}: «дальше» ведёт на несуществующий шаг «${step.next}».`);
    for (const b of step.buttons) {
      for (const lang of LANGS) {
        if (!b.label[lang].trim() || b.label[lang].length > LIMITS.label) out.push(`${at}: подпись кнопки — от 1 до ${LIMITS.label} знаков (${lang}).`);
      }
      if (Boolean(b.to) === Boolean(b.url)) out.push(`${at}: кнопка ведёт либо на шаг, либо на ссылку.`);
      if (b.to && !ids.has(b.to)) out.push(`${at}: кнопка ведёт на несуществующий шаг «${b.to}».`);
      if (b.url && !/^https:\/\/[^\s]+$/.test(b.url)) out.push(`${at}: ссылка кнопки — только https.`);
    }
  }
  if (!ids.has(s.start)) out.push("Первый шаг не найден.");
  return [...new Set(out)];
}

/** Прочитать сохранённое; битое — сценарий по умолчанию. */
export function parseScenario(raw: unknown): Scenario {
  if (!raw || typeof raw !== "object") return DEFAULT_SCENARIO;
  const r = raw as Partial<Scenario>;
  if (typeof r.start !== "string" || !Array.isArray(r.steps)) return DEFAULT_SCENARIO;
  const s: Scenario = { start: r.start, terms: typeof r.terms === "string" ? r.terms : "", steps: r.steps as Step[] };
  try {
    return scenarioProblems(s).length ? DEFAULT_SCENARIO : s;
  } catch {
    return DEFAULT_SCENARIO;
  }
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/\r/g, "").trim() : "");

/**
 * Сценарий из формы конструктора. Поля: `start`, `terms`, `n.<i>.id|kind|
 * ru|uz|next|amount|del`, `n.<i>.b.<j>.ru|uz|to|url`. Пустое имя шага —
 * шага нет (так работает пустая карточка «Новый шаг»), «удалить» — тоже.
 */
export function scenarioFromForm(form: FormData): Scenario {
  const steps: Step[] = [];
  for (let i = 0; i <= LIMITS.steps; i++) {
    const p = `n.${i}.`;
    const id = str(form.get(p + "id")).toLowerCase();
    if (!id || form.get(p + "del")) continue;
    const kind = (KINDS as readonly string[]).includes(str(form.get(p + "kind"))) ? (str(form.get(p + "kind")) as NodeKind) : "message";
    const buttons: Button[] = [];
    for (let j = 0; j < LIMITS.buttons; j++) {
      const b = `${p}b.${j}.`;
      const ru = str(form.get(b + "ru"));
      const uz = str(form.get(b + "uz"));
      const to = str(form.get(b + "to"));
      const url = str(form.get(b + "url"));
      if (!ru && !uz && !url) continue;
      buttons.push({ label: { ru, uz: uz || ru }, ...(url ? { url } : { to }) });
    }
    const next = str(form.get(p + "next"));
    const amount = Number(str(form.get(p + "amount")).replace(/\s/g, ""));
    steps.push({
      id,
      kind,
      text: { ru: str(form.get(p + "ru")), uz: str(form.get(p + "uz")) },
      buttons,
      ...(next ? { next } : {}),
      ...(kind === "pay" ? { amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : AMOUNT.default } : {}),
    });
  }
  return { start: str(form.get("start")) || steps[0]?.id || "", terms: str(form.get("terms")), steps };
}

/** Сумма в тексте: «5 000 ₽». */
export function rub(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}
