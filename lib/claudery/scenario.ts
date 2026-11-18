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
 *   3. Ссылка на страницу заявки на сайте: цена и оплата Platega — там, не в
 *      боте (оплату подтверждает Platega);
 *   4. Сообщение после оплаты;
 *   5. Условия и гарантия — в оферте.
 *
 * Хранится в stats_snapshots «claudery-setup». Бот только по-русски. Тексты
 * уходят в Telegram простым текстом, без разметки. Модели нет.
 */

export type Extra = { label: string; answer?: string; url?: string };

/** Товар витрины: подписка на нейросеть с ценой (владелец, 18.11.2026). */
export type Product = { title: string; note?: string; price: number };

export type Setup = {
  greet: string;
  helpLabel: string;
  ask: string;
  pay: string;
  /** Цена первого товара: её видит менеджер в карточке лида до выбора клиента. */
  amount: number;
  /** Что продаём: клиент выбирает товар на странице заказа. */
  products: Product[];
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

export const LIMITS = { text: 3500, label: 60, terms: 6000, extras: 4, products: 6, productTitle: 80, productNote: 200 } as const;
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
/**
 * Продаём товар, а не услугу (владелец, 18.11.2026, после разговора с
 * Platega: СБП согласуют, «если это просто продажа подписок на нейросети…
 * главное чтобы там не было ваших услуг»). Клиент покупает подписку из
 * витрины, подключение и ответы на вопросы — бесплатная поддержка покупателя.
 */
export const PAY_PURPOSE = "Claudery: подписка на нейросеть";
export const DEFAULT_PRODUCT: Product = { title: "Подписка на нейросеть, 1 месяц", note: "Готовый доступ на месяц. Подключение и поддержка покупателя бесплатно.", price: AMOUNT.default };
export const BACK_LABEL = "← Назад";

export const DEFAULT_SETUP: Setup = {
  greet: "Здравствуйте! Это Claudery: подписки на нейросети с готовым доступом. Нажмите кнопку и напишите, какая нейросеть нужна.",
  helpLabel: "🛒 Выбрать подписку",
  ask: "Какая нейросеть вам нужна и для чего? Напишите одним сообщением. Можно приложить скриншот.",
  pay: "Спасибо, заказ записали. Откройте его по кнопке ниже: там выбор подписки и следующий шаг. Мы на связи здесь, в Telegram.",
  amount: DEFAULT_PRODUCT.price,
  products: [DEFAULT_PRODUCT],
  repeatDiscount: REPEAT_DISCOUNT.default,
  paid: "Спасибо за покупку! В ближайшее время пришлём доступ сюда, в Telegram.",
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
    ["Вопрос «что нужно»", s.ask],
    ["Текст со ссылкой на заказ", s.pay],
    ["Текст после оплаты", s.paid],
  ];
  for (const [name, value] of texts) {
    if (!value.trim()) out.push(`${name}: пустой текст.`);
    if (value.length > LIMITS.text) out.push(`${name}: длиннее ${LIMITS.text} знаков.`);
  }
  if (!s.helpLabel.trim() || s.helpLabel.length > LIMITS.label) out.push(`Главная кнопка: от 1 до ${LIMITS.label} знаков.`);
  if (!s.products.length) out.push("Товары: нужен хотя бы один.");
  if (s.products.length > LIMITS.products) out.push(`Товаров больше ${LIMITS.products}.`);
  s.products.forEach((p, i) => {
    const at = `Товар ${i + 1}`;
    if (!p.title.trim() || p.title.length > LIMITS.productTitle) out.push(`${at}: название от 1 до ${LIMITS.productTitle} знаков.`);
    if ((p.note ?? "").length > LIMITS.productNote) out.push(`${at}: описание длиннее ${LIMITS.productNote} знаков.`);
    if (!Number.isInteger(p.price) || p.price < AMOUNT.min || p.price > AMOUNT.max) out.push(`${at}: цена от ${AMOUNT.min} до ${AMOUNT.max} ₽.`);
  });
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
  // Сохранённое до витрины: одна сумма — она и есть цена единственного товара.
  const products: Product[] =
    Array.isArray(r.products) && r.products.length
      ? (r.products as Product[]).map((p) => ({ title: String(p?.title ?? ""), ...(p?.note ? { note: String(p.note) } : {}), price: Number(p?.price) }))
      : [{ ...DEFAULT_PRODUCT, price: typeof r.amount === "number" ? r.amount : DEFAULT_PRODUCT.price }];
  const s: Setup = {
    greet: typeof r.greet === "string" ? r.greet : DEFAULT_SETUP.greet,
    helpLabel: typeof r.helpLabel === "string" ? r.helpLabel : DEFAULT_SETUP.helpLabel,
    ask: typeof r.ask === "string" ? r.ask : DEFAULT_SETUP.ask,
    pay: typeof r.pay === "string" ? r.pay : DEFAULT_SETUP.pay,
    amount: products[0].price,
    products,
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
  const products: Product[] = [];
  for (let i = 0; i < LIMITS.products; i++) {
    const title = str(form.get(`p${i}.title`));
    const note = str(form.get(`p${i}.note`));
    const raw = str(form.get(`p${i}.price`)).replace(/[\s₽]/g, "");
    if (!title && !note && !raw) continue;
    const price = Number(raw);
    products.push({ title, ...(note ? { note } : {}), price: Number.isFinite(price) && raw ? Math.round(price) : 0 });
  }
  const discount = Number(str(form.get("repeatDiscount")).replace(/[\s%]/g, "") || "0");
  return {
    greet: str(form.get("greet")),
    helpLabel: str(form.get("helpLabel")),
    ask: str(form.get("ask")),
    pay: str(form.get("pay")),
    amount: products[0]?.price ?? 0,
    products,
    repeatDiscount: Number.isFinite(discount) ? Math.round(discount) : -1,
    paid: str(form.get("paid")),
    terms: str(form.get("terms")),
    extras,
  };
}

/** Товар по номеру из формы страницы заказа; чужой номер — первый товар. */
export function productAt(s: Setup, index: number): Product {
  return s.products[Number.isInteger(index) && index >= 0 && index < s.products.length ? index : 0] ?? DEFAULT_PRODUCT;
}

/** Сумма для того, кто уже оплачивал: со скидкой, целыми рублями. */
export function repeatAmount(amount: number, discount: number): number {
  return Math.round((amount * (100 - discount)) / 100);
}

/** Текст шага со ссылкой на заявку: {сумма} → сумма этого клиента. */
export function payText(text: string, amount: number): string {
  return text.split(SUM_MARK).join(rub(amount)).split(SUM_MARK_LATIN).join(rub(amount));
}

/** Сумма в тексте: «5 000 ₽». */
export function rub(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}
