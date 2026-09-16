import { categories, categoryBySlug, optionsFor } from "@/content/calculator";
import { USD_RATE } from "@/content/company";
import { defaultSelection, estimate, type Selection } from "@/lib/calculator";
import { t } from "@/lib/i18n";
import type { Brief } from "@/lib/qualify/brief";

/**
 * Смета для менеджера: что входит, сколько это стоит и что говорить.
 *
 * Владелец: «новые менеджеры не знают, сколько и что стоит. Обязательно
 * показать верхнюю и нижнюю границу, чтобы студия зарабатывала деньги и
 * менеджер не мог опуститься ниже».
 *
 * Цифры берутся из того же калькулятора, что стоит на сайте. Это не
 * экономия: клиент мог посчитать там сам, и смета менеджера, расходящаяся
 * с сайтом, читается как попытка взять больше с того, кто не проверил.
 *
 * Нижняя граница — это не «цена со скидкой», а порог, ниже которого
 * проект не окупает себя. Округляется вверх до десяти долларов: округление
 * вниз хоть на доллар — уже ниже порога. Верхняя — та же вилка, что и на
 * сайте, округляется как там.
 *
 * Скорость — наше предложение, и она стоит денег: обещанный срок короче
 * расчётного включает ускорение из калькулятора, и порог растёт вместе с
 * ним. Менеджер видит это до того, как пообещал клиенту.
 */

export type QuoteInput = {
  category: string;
  selection: Selection;
  /** Срок, который менеджер обещает клиенту, в неделях. */
  weeks: number | null;
};

export type QuoteLine = { label: string; value: string };

/** Что ещё можно предложить — с ценой, чтобы менеджер называл её сразу. */
export type Extra = { id: string; label: string; price: string };

export type Quote = {
  /** По калькулятору или по брифу с витрины — там цена уже согласована. */
  kind: "calculator" | "brief";
  category: string;
  categoryTitle: string;
  /** Ниже — нельзя. Целые доллары, округлено вверх. */
  floorUsd: number;
  ceilingUsd: number;
  floorUzs: number;
  ceilingUzs: number;
  /** Расчётный срок; у брифа с витрины его нет — назовём после созвона. */
  weeksLow: number | null;
  weeksHigh: number | null;
  promisedWeeks: number | null;
  /** Обещанный срок короче расчётного — включено ускорение. */
  rush: boolean;
  /** Что входит в работу — словами для клиента. */
  work: string[];
  /** Выбранные допы. */
  breakdown: QuoteLine[];
  extras: Extra[];
  /** Что говорить клиенту — по строке на мысль. */
  talk: string[];
};

const RUSH_CHOICE = "rush";

/** Вверх до десяти долларов: порог не может оказаться ниже себестоимости. */
export function floorUsdOf(uzs: number): number {
  return Math.ceil(uzs / USD_RATE / 10) * 10;
}

/** Как на сайте — до пятидесяти. Это верх, ему округление вниз не вредит. */
export function ceilingUsdOf(uzs: number): number {
  return Math.round(uzs / USD_RATE / 50) * 50;
}

const money = (usd: number) => `$${usd.toLocaleString("en-US")}`;

/* ── Категория по лиду ─────────────────────────────────────────────────── */

/**
 * Услуга из квалификации задаёт семейство, слова из брифа уточняют тип
 * внутри семейства сайтов. Наоборот нельзя: «приложение» встречается и в
 * «веб-приложение», и тогда сайт превратился бы в мобильный проект.
 */
const BY_SERVICE: Record<string, string> = {
  "web-development": "corporate",
  "mobile-apps": "mobile",
  "ai-llm-rag": "ai",
  "marketplace-delivery": "platform",
  "integrations-automation": "integration",
};

const WEB_KEYWORDS: Array<[RegExp, string]> = [
  [/интернет-магазин|магазин|корзин|e-?commerce|\bshop\b|do['‘’]?kon|savat/i, "ecommerce"],
  [/маркетплейс|marketplace|платформ|портал|личн\w* кабинет|\bsaas\b|\bcrm\b|\berp\b/i, "platform"],
  [/лендинг|landing|одностраничн|одна страница|lending/i, "landing"],
];

const ANY_KEYWORDS: Array<[RegExp, string]> = [
  ...WEB_KEYWORDS,
  [/мобильн|приложени|\bios\b|android|flutter|\bilova/i, "mobile"],
  [/чат-?бот|ассистент|нейросет|\bai\b|\bllm\b|\bgpt\b|\brag\b|chatbot/i, "ai"],
  [/интеграц|\b1с\b|\b1c\b|iiko|автоматизац/i, "integration"],
  [/поддержк|аудит|доработ|починить|исправить/i, "support"],
  [/дизайн|figma|макет|брендинг|dizayn/i, "design"],
];

export type LeadLike = {
  services: readonly string[];
  niche: string | null;
  summary: Record<string, unknown>;
};

function leadText(lead: LeadLike): string {
  const s = lead.summary;
  return [lead.niche ?? "", s.request, s.need, s.client]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
}

export function categoryForLead(lead: LeadLike): string {
  const text = leadText(lead);
  const family = lead.services.map((s) => BY_SERVICE[s]).find(Boolean);

  if (family && family !== "corporate") return family;

  const keywords = family ? WEB_KEYWORDS : ANY_KEYWORDS;
  for (const [re, slug] of keywords) {
    if (re.test(text)) return slug;
  }
  return "corporate";
}

/* ── Допы по словам брифа ──────────────────────────────────────────────── */

const LANGUAGES = [
  /узбекск|uzbek|o['‘’]?zbek|на узбекском/i,
  /русск|russian|на русском/i,
  /английск|english|на английском/i,
  /китайск|chinese|xitoy/i,
];

const TOGGLES: Array<[string, RegExp]> = [
  ["payments", /оплат|payme|click|uzum|платеж|to['‘’]?lov/i],
  ["auth", /личн\w* кабинет|регистрац|авториз|вход для/i],
  ["notifications", /уведомлен|\bsms\b|смс|push/i],
  ["seo", /\bseo\b|сео|продвижен|в поиске|google/i],
];

/**
 * Только то, что в брифе сказано прямо. Угадывать «наверное, нужен
 * кабинет» нельзя: угаданный доп поднимает порог, и менеджер называет
 * клиенту цену за то, чего тот не просил.
 */
export function selectionForLead(category: string, lead: LeadLike): Selection {
  const selection = defaultSelection(category);
  const text = leadText(lead);
  const ids = new Set(optionsFor(category).map((o) => o.id));

  if (ids.has("languages")) {
    const mentioned = LANGUAGES.filter((re) => re.test(text)).length;
    const option = optionsFor(category).find((o) => o.id === "languages");
    const max = option?.kind === "counter" ? option.max : 0;
    selection.languages = Math.min(max, Math.max(0, mentioned - 1));
  }
  for (const [id, re] of TOGGLES) {
    if (ids.has(id) && re.test(text)) selection[id] = true;
  }
  return selection;
}

/* ── Расчёт ────────────────────────────────────────────────────────────── */

function extrasFor(category: string, selection: Selection): Extra[] {
  const out: Extra[] = [];
  for (const option of optionsFor(category)) {
    const label = t(option.label, "ru");
    const value = selection[option.id];
    if (option.kind === "toggle") {
      if (value === true) continue;
      const price = option.addUzs
        ? `+${money(floorUsdOf(option.addUzs))}`
        : option.mul
          ? `+${Math.round((option.mul - 1) * 100)}% к сумме`
          : "включено";
      out.push({ id: option.id, label, price });
    } else if (option.kind === "counter") {
      const unit = t(option.unitLabel, "ru");
      const price = option.unitUzs
        ? `${money(floorUsdOf(option.unitUzs))} за ${unit}`
        : `+${Math.round((option.unitMul ?? 0) * 100)}% за ${unit}`;
      out.push({ id: option.id, label, price });
    } else {
      const chosen = option.choices.find((c) => c.id === value) ?? option.choices[0];
      for (const choice of option.choices) {
        if (choice === chosen || choice === option.choices[0]) continue;
        const price = choice.addUzs
          ? `+${money(floorUsdOf(choice.addUzs))}`
          : choice.mul && choice.mul !== 1
            ? `+${Math.round((choice.mul - 1) * 100)}% к сумме`
            : "включено";
        out.push({ id: `${option.id}:${choice.id}`, label: `${label}: ${t(choice.label, "ru")}`, price });
      }
    }
  }
  return out;
}

export function quoteFor(input: QuoteInput): Quote | null {
  const category = categoryBySlug(input.category);
  if (!category) return null;

  const selection: Selection = { ...defaultSelection(input.category), ...input.selection };
  const base = estimate(input.category, selection, "ru");
  if (!base) return null;

  // Обещали быстрее, чем считает калькулятор, — это ускорение, и оно уже
  // в цене. Ставить его молча нельзя, поэтому rush уходит наружу словами.
  const promised = input.weeks;
  const rush = promised !== null && promised < base.weeksLow && selection.urgency !== RUSH_CHOICE;
  if (rush) selection.urgency = RUSH_CHOICE;
  const est = rush ? estimate(input.category, selection, "ru") ?? base : base;

  // Порог — от точной суммы, а не от округлённой «от» с сайта: та
  // округляется до полумиллиона в обе стороны и на лендинге уходит ниже базы.
  const floorUsd = floorUsdOf(est.exactUzs);
  const ceilingUsd = Math.max(floorUsd, ceilingUsdOf(est.highUzs));
  const siteLowUsd = ceilingUsdOf(est.lowUzs);
  const title = t(category.title, "ru");

  const talk = [
    `Ориентир по «${title}»: ${money(floorUsd)}–${money(ceilingUsd)}. Точную цифру называем после короткого созвона — в неё войдёт то, чего нет ни в одном калькуляторе.`,
    promised !== null
      ? `Срок: ${promised} ${weeksWord(promised)} с даты аванса${rush ? ` — быстрее расчётных ${base.weeksLow}–${base.weeksHigh}, поэтому в порог уже включено ускорение (+30%)` : ""}.`
      : `Срок: ${est.weeksLow}–${est.weeksHigh} недель с даты аванса. Дизайн и разработка идут параллельно — это и есть наша скорость.`,
    `Ниже ${money(floorUsd)} не опускаемся: это порог, под которым проект не окупается. Скидку согласует только владелец.`,
    ...(siteLowUsd < floorUsd
      ? [`На сайте калькулятор показывает «от ${money(siteLowUsd)}» — это округление вниз. Если клиент ссылается на него, объясняем: точная цифра ${money(floorUsd)}, разница — округление, а не наценка.`]
      : []),
  ];

  return {
    kind: "calculator",
    category: input.category,
    categoryTitle: title,
    floorUsd,
    ceilingUsd,
    floorUzs: est.exactUzs,
    ceilingUzs: est.highUzs,
    weeksLow: est.weeksLow,
    weeksHigh: est.weeksHigh,
    promisedWeeks: promised,
    rush,
    work: est.work,
    breakdown: est.breakdown,
    extras: extrasFor(input.category, selection),
    talk,
  };
}

function weeksWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "неделя";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "недели";
  return "недель";
}

/** Смета по лиду без участия менеджера: категория и допы — из брифа. */
export function quoteForLead(lead: LeadLike & { brief?: Brief | null }): Quote | null {
  if (lead.brief) return briefQuote(lead.brief);
  const category = categoryForLead(lead);
  return quoteFor({ category, selection: selectionForLead(category, lead), weeks: null });
}

/**
 * Бриф с витрины: цену клиент собрал сам и видел её. Порог равен итогу —
 * ниже него нельзя по той же причине, что и с калькулятором, а выше
 * нечестно: цифра уже названа.
 */
export function briefQuote(brief: Brief): Quote {
  const paid = brief.addons.filter((a) => !a.included && !a.monthly && !a.onRequest && a.priceUsd > 0);
  const total = Math.max(0, Math.round(brief.totalUsd));
  const extras: Extra[] = [
    ...brief.addons.filter((a) => a.onRequest).map((a) => ({ id: a.id, label: a.label, price: "по запросу — цену называет менеджер" })),
    ...brief.addons.filter((a) => a.monthly).map((a) => ({ id: a.id, label: a.label, price: `${money(a.priceUsd)}/мес` })),
  ];
  return {
    kind: "brief",
    category: brief.project,
    categoryTitle: brief.projectLabel,
    floorUsd: total,
    ceilingUsd: total,
    floorUzs: total * USD_RATE,
    ceilingUzs: total * USD_RATE,
    weeksLow: null,
    weeksHigh: null,
    promisedWeeks: null,
    rush: false,
    work: [
      `Пакет «${brief.tier.label}»`,
      ...brief.addons.filter((a) => a.included).map((a) => a.label),
    ],
    breakdown: [
      { label: `Пакет «${brief.tier.label}»`, value: money(brief.tier.priceUsd) },
      ...paid.map((a) => ({ label: a.label, value: `${a.from ? "от " : ""}${money(a.priceUsd)}` })),
    ],
    extras,
    talk: [
      `Итог ${brief.fromPrice ? "от " : ""}${money(total)} — клиент собрал его сам на витрине и видел цифру. Ниже нельзя, выше — нечестно.`,
      "Срок называем после созвона: в брифе его нет.",
      ...(extras.length ? ["Есть позиции «по запросу» — их цену считаем по калькулятору, не ниже его порога."] : []),
    ],
  };
}

/* ── Хранение и формы ──────────────────────────────────────────────────── */

/** Разбор того, что лежит в projects.quote. Мусор — это null, а не падение. */
export function parseQuote(raw: unknown): QuoteInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.category !== "string" || !categoryBySlug(r.category)) return null;
  const selection: Selection = {};
  if (r.selection && typeof r.selection === "object") {
    for (const [key, value] of Object.entries(r.selection as Record<string, unknown>)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        selection[key] = value;
      }
    }
  }
  const weeks =
    typeof r.weeks === "number" && Number.isFinite(r.weeks) && r.weeks > 0 ? Math.round(r.weeks) : null;
  return { category: r.category, selection, weeks };
}

/**
 * Выбор из формы карточки проекта.
 *
 * Поля называются по id опции с префиксом, чтобы не пересечься с полями
 * денег на той же странице. Счётчик режется по max опции: цифру в поле
 * можно вписать любую.
 */
export function selectionFromForm(category: string, get: (name: string) => string | null): Selection {
  const selection = defaultSelection(category);
  for (const option of optionsFor(category)) {
    const raw = get(`opt_${option.id}`);
    if (option.kind === "toggle") {
      selection[option.id] = raw === "on" || raw === "1" || raw === "true";
    } else if (option.kind === "choice") {
      selection[option.id] = option.choices.some((c) => c.id === raw) ? (raw as string) : option.choices[0].id;
    } else {
      const n = Number.parseInt(raw ?? "", 10);
      selection[option.id] = Number.isFinite(n) ? Math.max(0, Math.min(option.max, n)) : 0;
    }
  }
  return selection;
}

export function weeksFromForm(raw: string | null): number | null {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 && n <= 52 ? n : null;
}

/** Сумма ниже порога сметы. Без сметы порога нет — и запрета нет. */
export function belowFloor(amountUsd: number | null | undefined, quote: Quote | null): boolean {
  return quote !== null && amountUsd !== null && amountUsd !== undefined && amountUsd < quote.floorUsd;
}

export const CATEGORY_CHOICES = categories.map((c) => ({ slug: c.slug, title: t(c.title, "ru") }));
