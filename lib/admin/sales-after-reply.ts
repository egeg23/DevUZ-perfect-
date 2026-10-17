import { LADDER, PROMO, SHOW_RU, SHOW_UZ } from "@/lib/admin/mockup-offer";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Продажа после ответа: про него, цена раньше, ответы на возражения.
 *
 * Владелец, 17.10.2026, на разбор продаж по базе: «Делаем все по твоим
 * рекомендациям, они правдивые». Цифры с 07.10 по 17.10.2026: 453
 * «Здравствуйте» → 206 ответили, 188 получили кружок → после него ответили
 * 63, остальные 125 замолчали; «+» — 5; за 30 дней 41 макет и 0 оплат.
 * После кружка пишут «Какой сайт?», «Что значит прототип?»: кружок общий, и
 * человек не понимает, что он про него. После макета — «дорого». Часть
 * «ответов» — автоответчики, и кружок им уходит впустую.
 *
 * Здесь только правила, без базы и без модели: что считать автоответчиком,
 * какая строка уходит перед кружком, какой кружок ниши, цена после «+»,
 * вопрос через два дня после «передам руководству», пауза и вид ответа
 * модели и A/B. База — outreach-talk-store, свип — sales-after-reply-store.
 */

/**
 * Новый заход после ответа включён. Откат — одной строкой: false, и всё
 * идёт как до 17.10.2026 (половина «new» ведёт себя как «old»). Исправления
 * ошибок (автоответчик, пауза и вид ответа модели, лесенка, кнопки
 * менеджера) от этого не зависят.
 */
export const SALES_NEW = true;

/**
 * Половина A/B. Назначается при «Здравствуйте» случайно и поровну
 * (prospects.sales_arm): «old» — как было, «new» — строка перед кружком,
 * кружок ниши, цена после «+», готовые ответы на возражения в переписке
 * модели, вопрос через два дня после «передам руководству», «покажу за 15
 * минут» рядом с макетом.
 */
export type SalesArm = "old" | "new";

export function pickArm(random: () => number = Math.random): SalesArm {
  return random() < 0.5 ? "old" : "new";
}

/** Ведёт ли касание новый заход: половина «new», и переключатель включён. */
export function salesNew(p: { sales_arm?: unknown }, on: boolean = SALES_NEW): boolean {
  return on && p.sales_arm === "new";
}

// ── 1. Автоответчик — не ответ ───────────────────────────────────────────

/**
 * Автоответчик компании. Примеры — из базы (outreach_messages, входящие,
 * 07–17.10.2026): «Мы отвечаем в рабочее время… Ваше сообщение получено»,
 * «Вы обратились к нам в нерабочее время», «Спасибо за обращение в Novikov
 * Café! Мы свяжемся с вами в ближайшее время», «Ваше сообщение передано
 * менеджеру», «Xabaringiz qabul qilindi», «Sizga tez orada javob beramiz»,
 * «operatorlar hozir ishlamayapti», «Thank you for contacting…».
 *
 * Живой вежливый отказ («Спасибо за предложение, если будет актуально — мы
 * сами свяжемся») сюда не попадает: в нём нет ни обращения, ни рабочего
 * времени, ни «сообщение получено».
 */
const AUTO_REPLY: readonly RegExp[] = [
  /(?:не)?рабоч(?:ее|ие|ее\s+время|их)\s+(?:время|часы|часов|дни)/iu,
  /в\s+нерабочее\s+время/iu,
  /(?:ваше\s+)?сообщение\s+(?:получено|принято|передано)/iu,
  /передан[оа]?\s+(?:менеджеру|администратору|оператору|специалисту)/iu,
  /спасибо\s+за\s+(?:ваше\s+)?(?:обращение|сообщение)/iu,
  /вы\s+обратились\s+(?:к\s+нам|в\s)/iu,
  /(?:ответ\p{L}*|свяж\p{L}*)[^.!?\n]{0,40}в\s+ближайшее\s+время|в\s+ближайшее\s+время[^.!?\n]{0,40}(?:ответ\p{L}*|свяж\p{L}*)/iu,
  /(?:администратор|менеджер|оператор|специалист)\p{L}*\s+(?:сейчас\s+)?(?:не\s+работают|свяжется|свяжутся|ответит|ответят)/iu,
  /первый\s+освободивш/iu,
  /qabul\s+qilindi/iu,
  /tez\s+orada\s+(?:siz\p{L}*\s+)?javob/iu,
  /murojaat(?:ingiz)?\s+(?:qilganingiz\s+)?uchun\s+(?:rahmat|tashakkur)/iu,
  /murojaat\s+qil(?:dingiz|indingiz)/iu,
  /ish\s+vaqt/iu,
  /(?:operator|administrator|menejer)\p{L}*\s+hozir\s+ishlamay/iu,
  /thank\s+you\s+for\s+(?:contacting|your\s+message)/iu,
  /(?:working|business|office)\s+hours/iu,
  /(?:will|shall)\s+(?:get\s+back|reply|respond)\s+(?:to\s+you\s+)?(?:as\s+soon|shortly|soon)/iu,
  /auto-?reply|автоответ/iu,
];

export function isAutoReply(text: string): boolean {
  const body = text.trim();
  if (!body) return false;
  return AUTO_REPLY.some((re) => re.test(body));
}

// ── 2. Строка перед кружком ──────────────────────────────────────────────

/** За сколько до кружка уходит строка про него: скаут шлёт строку, ждёт и шлёт кружок. */
export const INTRO_BEFORE_MS = 7_000;

export type IntroLang = "ru" | "uz";

/** О чём кружок, если сайта нет: карточка на картах, профиль, компания. */
export type IntroTarget =
  | { kind: "site"; host: string }
  | { kind: "maps"; label: string | null }
  | { kind: "profile"; where: "instagram" | "telegram" | null; label: string | null }
  | { kind: "company"; label: string | null };

/**
 * Хост текстом, без схемы и «www»: «clinic.uz», а не ссылка. Telegram
 * делает ссылку из любого «домен.зона», но превью страницы строит только
 * по первой ссылке с текстом страницы, и «disable link preview» скаут
 * ставит сам (linkPreview: false), так что под строкой картинки сайта нет.
 */
export function plainHost(host: string): string {
  return host
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
}

/** Что у нас есть о компании без сайта — для строки перед кружком. */
export function introTargetOf(p: {
  host?: unknown;
  label?: unknown;
  place_id?: unknown;
  contacts?: unknown;
}): IntroTarget {
  const host = typeof p.host === "string" ? plainHost(p.host) : "";
  if (host) return { kind: "site", host };
  const label = typeof p.label === "string" && p.label.trim() ? p.label.trim() : null;
  if (typeof p.place_id === "string" && p.place_id) return { kind: "maps", label };
  const c = (p.contacts && typeof p.contacts === "object" ? p.contacts : {}) as Record<string, unknown>;
  const has = (key: string) => Array.isArray(c[key]) && (c[key] as unknown[]).length > 0;
  if (has("instagram")) return { kind: "profile", where: "instagram", label };
  if (has("telegram")) return { kind: "profile", where: "telegram", label };
  return { kind: "company", label };
}

/** «Это про ваш сайт clinic.uz, 40 секунд» — одна строка, хост текстом. */
export function introLine(lang: IntroLang, target: IntroTarget): string {
  const name = (label: string | null) => (label ? ` «${label.replace(/[«»"]/g, "").slice(0, 60)}»` : "");
  if (lang === "uz") {
    switch (target.kind) {
      case "site":
        return `Bu sizning saytingiz ${target.host} haqida, 40 soniya`;
      case "maps":
        return `Bu xaritadagi${name(target.label)} kartochkangiz haqida, 40 soniya`;
      case "profile":
        return target.where === "instagram"
          ? `Bu Instagramdagi${name(target.label)} sahifangiz haqida, 40 soniya`
          : `Bu Telegramdagi${name(target.label)} sahifangiz haqida, 40 soniya`;
      default:
        return `Bu sizning${name(target.label)} kompaniyangiz haqida, 40 soniya`;
    }
  }
  switch (target.kind) {
    case "site":
      return `Это про ваш сайт ${target.host}, 40 секунд`;
    case "maps":
      return `Это про вашу карточку${name(target.label)} на картах, 40 секунд`;
    case "profile":
      return target.where === "instagram"
        ? `Это про ваш профиль${name(target.label)} в Инстаграме, 40 секунд`
        : `Это про ваш канал${name(target.label)} в Telegram, 40 секунд`;
    default:
      return `Это про вашу компанию${name(target.label)}, 40 секунд`;
  }
}

// ── 3. Кружки по нишам ───────────────────────────────────────────────────

/** Ниши кружков. «general» — общий, тот, что был до 17.10.2026. */
export const CIRCLE_NICHES = [
  "general",
  "medcentr",
  "stomatologiya",
  "mebel",
  "restoran",
  "salon-krasoty",
  "turagentstvo",
  "uchebnyy-centr",
  "nedvizhimost",
] as const;

export type CircleNiche = (typeof CIRCLE_NICHES)[number];

export function isCircleNiche(value: unknown): value is CircleNiche {
  return typeof value === "string" && (CIRCLE_NICHES as readonly string[]).includes(value);
}

/** Названия ниш для бота (бот пишет по-русски); в панели — словарь. */
export const CIRCLE_NICHE_RU: Readonly<Record<CircleNiche, string>> = {
  general: "Общий",
  medcentr: "Медцентр",
  stomatologiya: "Стоматология",
  mebel: "Мебель",
  restoran: "Ресторан",
  "salon-krasoty": "Салон красоты",
  turagentstvo: "Турагентство",
  "uchebnyy-centr": "Учебный центр",
  nedvizhimost: "Недвижимость",
};

/**
 * Ниша кружка по нише компании: ключ классификатора («stomatologiya»),
 * кампания с карт («стоматология»), а без ниши — по названию и адресу.
 * Не узнали — общий кружок.
 */
const NICHE_WORDS: readonly [Exclude<CircleNiche, "general">, RegExp][] = [
  ["stomatologiya", /stomat|стомат|dent|tish/iu],
  ["medcentr", /med(?:cent|markaz|ical|\b)|клиник|clinic|klinik|медиц|медцентр|shifo|diagnost|диагност/iu],
  ["mebel", /mebel|мебел|furnit|кухн/iu],
  ["restoran", /restor|рестор|кафе|cafe|кофейн|dostavka-edy|доставк\p{L}*\s+ед|osh\s*xona|choyxona|банкет/iu],
  ["salon-krasoty", /salon|салон|beauty|krasot|красот|barber|барбер|nail|маникюр|kosmet|космет/iu],
  ["turagentstvo", /tur(?:agent|ist|izm)|туристи|турагент|travel|tour|sayohat/iu],
  ["uchebnyy-centr", /uchebn|учебн|o['ʻ‘`]?quv|education|academy|академ|курс|school|школ|maktab|shkoly|language/iu],
  ["nedvizhimost", /nedvizh|недвиж|realt|риелт|zastroy|застрой|stroitel|строител|uy-joy|kvartir|квартир/iu],
];

export function circleNicheOf(p: { niche?: unknown; label?: unknown; host?: unknown }): CircleNiche {
  const niche = String(p.niche ?? "").trim().toLowerCase();
  if (isCircleNiche(niche)) return niche;
  if (niche === "agentstvo-nedvizhimosti" || niche === "zastroyshchik" || niche === "stroitelnaya-kompaniya") return "nedvizhimost";
  if (niche === "shkoly-sady") return "uchebnyy-centr";
  if (niche === "dostavka-edy") return "restoran";
  for (const text of [niche, String(p.label ?? ""), String(p.host ?? "")]) {
    if (!text) continue;
    const hit = NICHE_WORDS.find(([, re]) => re.test(text));
    if (hit) return hit[0];
  }
  return "general";
}

// ── 4. Цена раньше — одной строкой после «+» ─────────────────────────────

/**
 * Строка о цене после «+», до макета, вместе со ссылкой на условия.
 * Числа — из PROMO: меняя цену лендинга, менять только там.
 * В outreach_messages — kind 'price': по ней вторая сессия считает ступень
 * «цена названа». kind не переименовывать.
 */
export function priceLine(lang: IntroLang): string {
  const p = PROMO.landing.price;
  return lang === "uz"
    ? `Maket bepul. Yoqsa, lending ${p} $ dan, qismlarga bo‘lib to‘lash mumkin: yarmi boshlashda, yarmi ishga tushgandan keyin, hammasi ishlayotganda.`
    : `Макет бесплатно. Понравится, лендинг от ${p} $, можно частями: половина при старте, половина после запуска, когда всё работает.`;
}

export const PRICE_KIND = "price";

// ── 5. Лесенка на «дорого» ───────────────────────────────────────────────

/**
 * Лесенка строкой для клиента: цены — из LADDER (mockup-offer.ts). «Исправим
 * ошибки» — только тому, у кого сайт есть.
 */
export function ladderLines(lang: IntroLang, hasSite = true): string[] {
  const l = LADDER;
  const lines =
    lang === "uz"
      ? [
          `saytingizdagi ${l.fixes.count} ta xatoni ${l.fixes.days} kunda tuzatamiz: ${l.fixes.price} $`,
          `sayt-vizitka: ${l.card.price} $`,
          `lending: ${l.landing.price} $`,
          `korporativ sayt: ${l.corporate.price} $`,
        ]
      : [
          `исправим ${l.fixes.count} ошибки на вашем сайте за ${l.fixes.days} дня: ${l.fixes.price} $`,
          `сайт-визитка: ${l.card.price} $`,
          `лендинг: ${l.landing.price} $`,
          `корпоративный сайт: ${l.corporate.price} $`,
        ];
  return hasSite ? lines : lines.slice(1);
}

/** Оплата частями — одна фраза на обоих языках. */
export function partsLine(lang: IntroLang): string {
  return lang === "uz"
    ? "To‘lov qismlarga: yarmi boshlashda, yarmi ishga tushgandan keyin."
    : "Оплата частями: половина при старте, половина после запуска.";
}

// ── 7. Вопрос через 2 дня после «передам руководству» ────────────────────

/** Через сколько после обещания «передам руководству» спрашиваем, посмотрел ли. */
export const BOSS_ASK_AFTER_MS = 2 * 24 * 3600_000;

/** Рабочее время для вопроса: будни, 10:00–18:00 по Ташкенту. */
export const BOSS_ASK_FROM_HOUR = 10;
export const BOSS_ASK_UNTIL_HOUR = 18;

export function bossAskText(lang: IntroLang): string {
  return lang === "uz" ? "Rahbaringiz ko‘rib chiqishga ulgurdimi?" : "Руководитель успел посмотреть?";
}

export function workingHour(ms: number): boolean {
  const t = new Date(ms + TASHKENT_OFFSET_MS);
  const day = t.getUTCDay();
  const h = t.getUTCHours();
  return day >= 1 && day <= 5 && h >= BOSS_ASK_FROM_HOUR && h < BOSS_ASK_UNTIL_HOUR;
}

/**
 * Пора ли спросить «Руководитель успел посмотреть?». Ровно один раз
 * (boss_asked_at), только если после обещания клиент молчит и мы ему
 * больше ничего не писали, кроме ответа на само обещание.
 */
export function bossAskDue(
  p: { boss_promised_at: string | null; boss_asked_at: string | null; closed_reason?: string | null },
  /** Последнее входящее после обещания — его время; null — клиент молчит. */
  lastInboundAfter: string | null,
  now: number,
): boolean {
  if (!p.boss_promised_at || p.boss_asked_at || p.closed_reason) return false;
  if (lastInboundAfter) return false;
  if (now < Date.parse(p.boss_promised_at) + BOSS_ASK_AFTER_MS) return false;
  return workingHour(now);
}

// ── 8. Ответ модели не выдаёт себя ───────────────────────────────────────

/** Пауза перед ответом модели — как человек набирает: 40–120 секунд от входящего. */
export const HUMAN_MIN_MS = 40_000;
export const HUMAN_MAX_MS = 120_000;

/**
 * Когда отправить ответ модели. Свип ходит раз в пять минут, и пауза часто
 * уже есть: тогда null — не трогаем. Иначе — входящее плюс 40–120 секунд.
 */
export function humanSendAfter(inboundAt: string | null, now: number, random: () => number = Math.random): string | null {
  const base = inboundAt ? Date.parse(inboundAt) : now;
  if (!Number.isFinite(base)) return null;
  const at = base + HUMAN_MIN_MS + Math.floor(random() * (HUMAN_MAX_MS - HUMAN_MIN_MS));
  return at > now ? new Date(at).toISOString() : null;
}

/** Ответ модели до макета: не длиннее, чем человек напишет в мессенджере. */
export const AI_MAX_SENTENCES = 3;
export const AI_MAX_CHARS = 320;

/** «Отлично!», «Конечно!» и подобное в начале — так пишет робот, а не менеджер. */
const ROBOT_OPENER =
  /^\s*(?:отлично|конечно|прекрасно|замечательно|супер|великолепно|безусловно|разумеется|хороший\s+вопрос|отличный\s+вопрос|ajoyib|albatta|zo['ʻ‘`]?r|great|sure|absolutely|of\s+course|excellent)(?![\p{L}])/iu;

const LIST_LINE = /^\s*(?:[-•*·▪●]|\d+[.)])\s+/mu;

export function sentences(text: string): number {
  return text
    .replace(/https?:\/\/\S+/g, "ссылка")
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter((s) => /\p{L}/u.test(s)).length;
}

/**
 * Что выдаёт в ответе модели робота. Пусто — можно отправлять. Держит это
 * код, как jargon: просьба в промпте выполняется не всегда.
 */
export function aiStyleProblems(text: string): { code: "opener" | "list" | "long"; text: string }[] {
  const out: { code: "opener" | "list" | "long"; text: string }[] = [];
  const t = text.trim();
  if (ROBOT_OPENER.test(t)) out.push({ code: "opener", text: "Ответ начинается с «Отлично!», «Конечно!»: так пишет робот." });
  if (LIST_LINE.test(t)) out.push({ code: "list", text: "В ответе список: в мессенджере так не пишут." });
  if (t.length > AI_MAX_CHARS || sentences(t) > AI_MAX_SENTENCES) {
    out.push({ code: "long", text: `Ответ длиннее ${AI_MAX_SENTENCES} коротких предложений.` });
  }
  return out;
}

/**
 * Снять робота с начала: «Отлично! Макет бесплатный» → «Макет бесплатный».
 * Остальное (список, длина) не чиним, а не отправляем.
 */
export function withoutOpener(text: string): string {
  const rest = text.replace(new RegExp(`${ROBOT_OPENER.source}[\\s,!.)]*`, "iu"), "").trim();
  if (!rest || rest === text.trim()) return text.trim();
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// ── 9. Показ вместо ссылки ───────────────────────────────────────────────

export function showLine(lang: IntroLang): string {
  return lang === "uz" ? SHOW_UZ : SHOW_RU;
}

// ── 10. A/B «Новый заход после ответа» ───────────────────────────────────

/** Победителя не объявляем раньше 100 «Здравствуйте» на половину. */
export const AB_MIN_HELLO = 100;

export type ArmCounts = {
  arm: SalesArm;
  hello: number;
  /** Ответили живые: без автоответчиков. */
  live: number;
  afterCircle: number;
  plus: number;
  mockup: number;
  paid: number;
};

export type AbVerdict = { kind: "early"; need: number } | { kind: "even" } | { kind: "leader"; arm: SalesArm; chance: number };

/**
 * Кто ведёт по доле «+» от «Здравствуйте» — та же байесовская оценка, что
 * у текстов писем (Бета(1+успехи, 1+неудачи), нормальное приближение).
 * Раньше 100 «Здравствуйте» на каждой половине — рано.
 */
export function abVerdict(old: ArmCounts, neu: ArmCounts): AbVerdict {
  const need = Math.max(0, AB_MIN_HELLO - Math.min(old.hello, neu.hello));
  if (need > 0) return { kind: "early", need };
  const beta = (s: number, n: number) => {
    const a = 1 + s;
    const b = 1 + Math.max(0, n - s);
    const mean = a / (a + b);
    return { mean, variance: (a * b) / ((a + b) ** 2 * (a + b + 1)) };
  };
  const x = beta(neu.plus, neu.hello);
  const y = beta(old.plus, old.hello);
  const z = (x.mean - y.mean) / Math.sqrt(x.variance + y.variance || 1e-12);
  const chance = 0.5 * (1 + erf(z / Math.SQRT2));
  if (chance >= 0.9) return { kind: "leader", arm: "new", chance };
  if (chance <= 0.1) return { kind: "leader", arm: "old", chance: 1 - chance };
  return { kind: "even" };
}

function erf(x: number): number {
  // Абрамовиц и Стиган 7.1.26: точности хватает для «90% или нет».
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
