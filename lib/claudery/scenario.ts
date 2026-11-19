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
  /**
   * Контакт поддержки: e-mail, @username или https-ссылка (Platega,
   * 19.11.2026: «Контакты поддержки (группа не подходит — можно тикет-систему,
   * юзернейм или почту)»). Стоит в боте, на витрине и в документах.
   */
  support: string;
  extras: Extra[];
  /** Тексты витрины /claudery (владелец, 19.11.2026: «редактировать… тексты на сайте»). */
  shop: Shop;
};

/** Карточка с заголовком и строкой: шаги «Как купить», «Почему с нами спокойно». */
export type Card = { t: string; d: string };
export type Faq = { q: string; a: string };

/**
 * Тексты витрины. Владелец, 19.11.2026: «сделай возможность редактировать эту
 * информацию у нас через дашборд, чтобы мы могли менять тексты на сайте (как
 * сделали… для чехфарм)». Товары и цены — `products`, здесь только слова.
 * В заголовке призыва `{price}` — цена самой дешёвой подписки.
 */
export type Shop = {
  kicker: string;
  title: string;
  accent: string;
  lead: string;
  pills: string[];
  perks: string[];
  steps: Card[];
  trust: Card[];
  faq: Faq[];
  ctaTitle: string;
  ctaText: string;
};

export const PRICE_MARK = "{price}";
export const SHOP_LIMITS = { short: 120, long: 600, pills: 4, perks: 3, steps: 4, trust: 3, faq: 6 } as const;
/** Слова услуги клиенту не показываем: Platega согласует продажу товара. */
export const SERVICE_WORDS = /помощ|консультац|услуг|специалист/i;

export const DEFAULT_SHOP: Shop = {
  kicker: "Подписки на нейросети",
  title: "Нужная нейросеть,",
  accent: "с готовым доступом",
  lead: "Выберите подписку, оплатите по СБП и получите доступ в Telegram. Подключение и ответы на вопросы бесплатно.",
  pills: ["Оплата по СБП", "Доступ в Telegram", "Возврат, если доступ не передан"],
  perks: ["Доступ в Telegram после оплаты", "Подключение бесплатно"],
  steps: [
    { t: "Нажмите «Купить»", d: "Откроется бот Claudery в Telegram, он сразу соберёт заказ на выбранную подписку." },
    { t: "Оплатите по СБП", d: "Бот пришлёт ссылку на страницу заказа. Оплата через Platega, в пару нажатий." },
    { t: "Получите доступ", d: "Как только оплата подтвердится, бот пришлёт данные доступа и поможет подключиться." },
  ],
  trust: [
    { t: "Оплата через Platega", d: "По СБП, без ввода данных карты на нашем сайте." },
    { t: "Возврат полностью", d: "Если доступ не передан. Подробности в оферте." },
    { t: "Документы открыто", d: "Пользовательское соглашение и политика конфиденциальности внизу страницы." },
  ],
  faq: [
    {
      q: "Как я получу доступ?",
      a: "После того как платёжная система подтвердит оплату, бот Claudery пришлёт вам данные доступа и поможет подключиться. Подключение и ответы на вопросы по подписке бесплатно.",
    },
    { q: "Сколько ждать?", a: "Доступ передаём с 06:00 до 19:00 по московскому времени. Обычно в течение часа после оплаты." },
    { q: "Что если доступ не передали?", a: "Вернём оплату полностью. Напишите в поддержку, контакты внизу страницы." },
    { q: "Как оплатить?", a: "По СБП через платёжный сервис Platega, на странице заказа. Данные карты мы не видим и не храним." },
  ],
  ctaTitle: "Подписка от {price}",
  ctaText: "Откройте бота и выберите нейросеть: заказ соберётся за минуту.",
};

/** Шаг бота — внутреннее устройство, собирается из Setup (`scenarioOf`). */
export type NodeKind = "message" | "ask" | "pay";
export type Button = { label: string; to?: string; url?: string };
export type Step = { id: string; kind: NodeKind; text: string; buttons: Button[]; next?: string; amount?: number; discount?: number };
export type Scenario = { start: string; terms: string; support: string; steps: Step[] };

export const LIMITS = { text: 3500, label: 60, terms: 6000, extras: 4, products: 6, productTitle: 80, productNote: 200, support: 120 } as const;
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
  support: "",
  extras: [],
  shop: DEFAULT_SHOP,
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
    support: s.support,
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
  if (s.support.length > LIMITS.support || splitSupport(s.support).some((v) => !supportLink(v)))
    out.push("Поддержка: e-mail, @username или ссылка https://…, несколько — через запятую.");
  out.push(...shopProblems(s.shop));
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
    support: typeof r.support === "string" ? r.support : "",
    extras: Array.isArray(r.extras) ? (r.extras as Extra[]) : [],
    shop: parseShop(r.shop),
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
    support: str(form.get("support")),
    extras,
    shop: shopFromForm(form),
  };
}

/** Что не так с текстами витрины: длина и слова услуги. */
export function shopProblems(h: Shop): string[] {
  const out: string[] = [];
  const short: [string, string][] = [
    ["Витрина: подзаголовок", h.kicker],
    ["Витрина: заголовок", h.title],
    ["Витрина: выделенная часть заголовка", h.accent],
    ["Витрина: заголовок призыва", h.ctaTitle],
  ];
  if (!h.title.trim()) out.push("Витрина: заголовок пустой.");
  for (const [n, v] of short) if (v.length > SHOP_LIMITS.short) out.push(`${n}: длиннее ${SHOP_LIMITS.short} знаков.`);
  for (const [n, v] of [["Витрина: описание", h.lead], ["Витрина: текст призыва", h.ctaText]] as const)
    if (v.length > SHOP_LIMITS.long) out.push(`${n}: длиннее ${SHOP_LIMITS.long} знаков.`);
  const lists: [string, string[], number][] = [
    ["плашки", h.pills, SHOP_LIMITS.pills],
    ["строки карточки", h.perks, SHOP_LIMITS.perks],
  ];
  for (const [n, list, max] of lists) {
    if (list.length > max) out.push(`Витрина: ${n} — не больше ${max}.`);
    if (list.some((v) => !v.trim() || v.length > SHOP_LIMITS.short)) out.push(`Витрина: ${n} — от 1 до ${SHOP_LIMITS.short} знаков.`);
  }
  const cards: [string, { a: string; b: string }[], number][] = [
    ["шаги", h.steps.map((c) => ({ a: c.t, b: c.d })), SHOP_LIMITS.steps],
    ["карточки доверия", h.trust.map((c) => ({ a: c.t, b: c.d })), SHOP_LIMITS.trust],
    ["вопросы", h.faq.map((c) => ({ a: c.q, b: c.a })), SHOP_LIMITS.faq],
  ];
  for (const [n, list, max] of cards) {
    if (list.length > max) out.push(`Витрина: ${n} — не больше ${max}.`);
    if (list.some((c) => !c.a.trim() || c.a.length > SHOP_LIMITS.short || !c.b.trim() || c.b.length > SHOP_LIMITS.long))
      out.push(`Витрина: ${n} — нужны и заголовок (до ${SHOP_LIMITS.short}), и текст (до ${SHOP_LIMITS.long}).`);
  }
  if (SERVICE_WORDS.test(shopText(h))) out.push("Витрина: без слов «помощь», «консультация», «услуга», «специалист» — продаём подписку, не услугу.");
  return out;
}

/** Все слова витрины одной строкой — для проверки. */
export function shopText(h: Shop): string {
  return [
    h.kicker, h.title, h.accent, h.lead, h.ctaTitle, h.ctaText, ...h.pills, ...h.perks,
    ...h.steps.flatMap((c) => [c.t, c.d]), ...h.trust.flatMap((c) => [c.t, c.d]), ...h.faq.flatMap((c) => [c.q, c.a]),
  ].join(" \n ");
}

/** Сохранённое без витрины (или с частью полей) — недостающее из `DEFAULT_SHOP`. */
export function parseShop(raw: unknown): Shop {
  if (!raw || typeof raw !== "object") return DEFAULT_SHOP;
  const r = raw as Record<string, unknown>;
  const text = (k: keyof Shop) => (typeof r[k] === "string" ? (r[k] as string) : (DEFAULT_SHOP[k] as string));
  const strs = (k: "pills" | "perks") => (Array.isArray(r[k]) ? (r[k] as unknown[]).map(String) : DEFAULT_SHOP[k]);
  const cards = (k: "steps" | "trust") =>
    Array.isArray(r[k]) ? (r[k] as Card[]).map((c) => ({ t: String(c?.t ?? ""), d: String(c?.d ?? "") })) : DEFAULT_SHOP[k];
  return {
    kicker: text("kicker"),
    title: text("title"),
    accent: text("accent"),
    lead: text("lead"),
    pills: strs("pills"),
    perks: strs("perks"),
    steps: cards("steps"),
    trust: cards("trust"),
    faq: Array.isArray(r.faq) ? (r.faq as Faq[]).map((c) => ({ q: String(c?.q ?? ""), a: String(c?.a ?? "") })) : DEFAULT_SHOP.faq,
    ctaTitle: text("ctaTitle"),
    ctaText: text("ctaText"),
  };
}

/** Витрина из формы конструктора: пустая строка списка — её нет. */
export function shopFromForm(form: FormData): Shop {
  // Форма без полей витрины (открыта до выкатки) — прежние тексты страницы.
  if (!form.has("shop.title")) return DEFAULT_SHOP;
  const list = (name: string, max: number) =>
    Array.from({ length: max }, (_, i) => str(form.get(`${name}${i}`))).filter(Boolean);
  const pairs = (name: string, max: number) =>
    Array.from({ length: max }, (_, i) => ({ a: str(form.get(`${name}${i}.a`)), b: str(form.get(`${name}${i}.b`)) })).filter((c) => c.a || c.b);
  return {
    kicker: str(form.get("shop.kicker")),
    title: str(form.get("shop.title")),
    accent: str(form.get("shop.accent")),
    lead: str(form.get("shop.lead")),
    pills: list("shop.pill", SHOP_LIMITS.pills),
    perks: list("shop.perk", SHOP_LIMITS.perks),
    steps: pairs("shop.step", SHOP_LIMITS.steps).map((c) => ({ t: c.a, d: c.b })),
    trust: pairs("shop.trust", SHOP_LIMITS.trust).map((c) => ({ t: c.a, d: c.b })),
    faq: pairs("shop.faq", SHOP_LIMITS.faq).map((c) => ({ q: c.a, a: c.b })),
    ctaTitle: str(form.get("shop.ctaTitle")),
    ctaText: str(form.get("shop.ctaText")),
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

/** Контакты поддержки по одному: через запятую, точку с запятой, пробел или «и». */
export function splitSupport(raw: string): string[] {
  return raw.split(/[,;\s]+/).map((v) => v.trim()).filter((v) => v && !/^(и|или|and)$/i.test(v));
}

/** Все контакты поддержки ссылками (владелец, 19.11.2026: «@maximov_tech и Siberian_2»). */
export function supportLinks(raw: string): { text: string; href: string; web: string | null }[] {
  return splitSupport(raw).map((v) => supportLink(v)).filter((l): l is NonNullable<typeof l> => !!l);
}

/**
 * Контакт поддержки ссылкой: e-mail → mailto, @username → t.me, https как
 * есть. Не разобрался — null (такой контакт конструктор не сохранит).
 */
export function supportLink(raw: string): { text: string; href: string; web: string | null } | null {
  const v = raw.trim();
  if (!v || v.length > LIMITS.support) return null;
  if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return { text: v, href: `mailto:${v}`, web: null };
  const user = /^@?([a-z][a-z0-9_]{3,31})$/i.exec(v) ?? /^https:\/\/t\.me\/([a-z][a-z0-9_]{3,31})\/?$/i.exec(v);
  if (user) return { text: `@${user[1]}`, href: `https://t.me/${user[1]}`, web: `https://t.me/${user[1]}` };
  if (/^https:\/\/\S+$/.test(v)) return { text: v, href: v, web: v };
  return null;
}
