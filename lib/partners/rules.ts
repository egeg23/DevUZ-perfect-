import {
  accrualState,
  paidOf,
  type AccrualState,
  type PaymentMoney,
  type ProjectMoney,
} from "@/lib/admin/finance";
import { REF_COOKIE, REF_TTL_DAYS, refFromHeader } from "@/lib/partners/ref-cookie";

export { REF_COOKIE, REF_TTL_DAYS };

/**
 * Партнёрская программа: правила.
 *
 * Перенесена с seller ai, где она полная и обкатанная: личные ссылки с
 * метками и счётчиками, процент с каждой оплаты приведённого клиента,
 * ставка выше за результат, бонус новому клиенту по ссылке, заявки на
 * выплату раз в месяц, антифрод. Здесь то же самое в терминах студии:
 * партнёр — человек в боте, клиент — лид, оплата — платёж по проекту.
 *
 * Ставка — от суммы проекта и растёт с ней (владелец, 28.09): до 2 500 $ —
 * 10 %, до 5 000 — 15 %, до 10 000 — 20 %, до 30 000 — 25 %, дороже —
 * 30 %. До этого было 20 % от чистой прибыли и 25 % после трёх оплаченных
 * проектов; процент от прибыли партнёр не мог ни проверить, ни посчитать
 * заранее — себестоимость ему не видна. Сумма проекта стоит в договоре.
 *
 * Здесь только арифметика и правила; чтения и записи — в `store.ts`.
 * Начисления не хранятся, а считаются: ставка × сумма по текущим полям
 * проекта, заморозка до полной оплаты — та же, что у сотрудников.
 */

/* ── Ставки ─────────────────────────────────────────────────────────────── */

/**
 * Ставки по сумме проекта. `upTo` — включительно: проект ровно на 2 500 $ —
 * ещё 10 %, на 2 501 $ — уже 15 %. Последняя ступень без верхней границы.
 * Сумма — целыми долларами, как в договоре.
 */
export const PARTNER_TIERS: readonly { upTo: number | null; percent: number }[] = [
  { upTo: 2_500, percent: 10 },
  { upTo: 5_000, percent: 15 },
  { upTo: 10_000, percent: 20 },
  { upTo: 30_000, percent: 25 },
  { upTo: null, percent: 30 },
];

/** Меньше не выплачиваем — пыль. */
export const MIN_PAYOUT_USD = 50;
/** Сколько ссылок может завести один партнёр. */
export const MAX_LINKS = 20;

/** Ставка по сумме проекта — по таблице выше. */
export function tierPercent(amountUsd: number): number {
  for (const tier of PARTNER_TIERS) {
    if (tier.upTo === null || amountUsd <= tier.upTo) return tier.percent;
  }
  return PARTNER_TIERS[PARTNER_TIERS.length - 1].percent;
}

/**
 * Ставка по конкретному проекту. Порядок: процент по проекту (владелец задал
 * руками) → персональная ставка партнёра → по сумме проекта. Суммы ещё нет —
 * ставка первой ступени: так показываем «от 10 %», а не ничего.
 */
export function partnerPercent(input: {
  projectPercent: number | null;
  partnerOverride: number | null;
  amountUsd: number | null;
}): number {
  if (input.projectPercent !== null) return input.projectPercent;
  if (input.partnerOverride !== null) return input.partnerOverride;
  return tierPercent(Math.max(0, input.amountUsd ?? 0));
}

/* ── Бонус новому клиенту ───────────────────────────────────────────────── */

/**
 * Перк по ссылке — оффер партнёра его аудитории: скидка на первый проект.
 * Достаётся новому клиенту, не партнёру; процент партнёра идёт сверху.
 * Менеджер видит обещанную скидку на карточке лида и учитывает в сумме.
 */
export const PERKS = ["none", "disc_5", "disc_10", "disc_15"] as const;
export type Perk = (typeof PERKS)[number];

export function isPerk(value: string): value is Perk {
  return (PERKS as readonly string[]).includes(value);
}

export const PERK_TITLE: Record<Perk, string> = {
  none: "без бонуса",
  disc_5: "скидка 5 % на первый проект",
  disc_10: "скидка 10 % на первый проект",
  disc_15: "скидка 15 % на первый проект",
};

export function perkPercent(perk: Perk): number {
  return perk === "none" ? 0 : Number(perk.slice("disc_".length));
}

/* ── Коды и ссылки ──────────────────────────────────────────────────────── */

export const CODE_RE = /^[A-Z0-9_-]{3,24}$/;

/**
 * Коды, которые нельзя занять: они выглядели бы как официальные или
 * неприличные. Список короткий и намеренно: он защищает от очевидного, а не
 * от всего.
 */
const RESERVED = new Set([
  "ADMIN", "DEVUZ", "DEVUZSTUDIO", "STUDIO", "OFFICIAL", "SUPPORT", "HELP",
  "TEST", "NULL", "UNDEFINED", "LOGIN", "START", "REF", "PARTNER", "BOT",
  "TELEGRAM", "GOOGLE", "YANDEX", "PAYME", "CLICK", "HUMO", "UZCARD",
  "SEX", "XXX", "PORN",
]);

/** Верхний регистр, без пробелов по краям — так код и хранится. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validCode(code: string): boolean {
  return CODE_RE.test(code) && !RESERVED.has(code);
}

export function isReserved(code: string): boolean {
  return RESERVED.has(code);
}

/** Без похожих друг на друга символов: 0/O, 1/I/L. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(random: () => number = Math.random, length = 7): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  }
  return out;
}

export function linkUrl(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}/?ref=${code}`;
}

/** Префикс в /start: отличает ссылку партнёра от токена разговора и привязки заказа. */
export const START_PREFIX = "ref_";

export function botLink(botUsername: string, code: string): string {
  return `https://t.me/${botUsername}?start=${START_PREFIX}${code}`;
}

/* ── Короткие ссылки ────────────────────────────────────────────────────── */

/**
 * devuz.studio/r/<slug> — ссылка, которую партнёр публикует.
 *
 * Владелец: «генерация уникальных ссылок через сокращение, чтобы не попасть
 * под спам». Антиспам чатов и соцсетей режет не домен, а приметы рассылки:
 * `?ref=` в адресе и одну и ту же ссылку в десятке мест. Поэтому slug
 * случайный и свой у каждого канала, а адрес — обычная ссылка на наш сайт:
 * внешний сокращатель прятал бы домен, и человек не видел бы, куда идёт.
 *
 * Строчные буквы без похожих друг на друга: ссылку переписывают с экрана и
 * диктуют голосом.
 */
export const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const SLUG_RE = /^[a-z0-9]{5,16}$/;
export const SHORT_PREFIX = "/r/";

export function generateSlug(random: () => number = Math.random, length = 7): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SLUG_ALPHABET[Math.floor(random() * SLUG_ALPHABET.length) % SLUG_ALPHABET.length];
  }
  return out;
}

export function shortUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, "")}${SHORT_PREFIX}${slug}`;
}

/**
 * Куда ведёт ссылка. Страница сайта — путь без языка: язык решит сайт по
 * браузеру человека, иначе партнёр из Ташкента присылал бы узбеку русскую
 * страницу. «bot» — сразу в Telegram-бота с кодом партнёра.
 */
// Разборов здесь нет: они только на русском и узбекском, а язык решает
// браузер человека — англичанин по такой ссылке получил бы 404.
export const TARGETS = ["/", "/services", "/calculator", "/audit", "/cases", "/products", "/partners", "bot"] as const;
export type Target = (typeof TARGETS)[number];

export function isTarget(value: string): value is Target {
  return (TARGETS as readonly string[]).includes(value);
}

/** Куда отправить человека, открывшего короткую ссылку. */
export function targetUrl(target: string, code: string, botUsername: string): string {
  if (target === "bot") return botLink(botUsername, code);
  return isTarget(target) ? target : "/";
}

/**
 * Превью ссылок и поисковые роботы — не переходы.
 *
 * Ссылку в Telegram, WhatsApp или Instagram первым открывает не человек, а
 * робот мессенджера — за картинкой для превью. Без этого фильтра каждый пост
 * партнёра сразу давал бы «переход», которого не было.
 */
const BOT_UA =
  /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|vkshare|skype|discord|slack|headless|curl|wget|python|axios|node-fetch|go-http/i;

export function isBotAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  return !ua || BOT_UA.test(ua);
}

/** Сырые данные для хеша посетителя: один человек в один день — один переход. */
export function visitorSeed(ip: string, userAgent: string, day: string): string {
  return `${ip}|${userAgent.slice(0, 200)}|${day}`;
}

/** Код из payload команды /start или null, если это не партнёрская ссылка. */
export function codeFromStart(payload: string): string | null {
  if (!payload.startsWith(START_PREFIX)) return null;
  const code = normalizeCode(payload.slice(START_PREFIX.length));
  return CODE_RE.test(code) ? code : null;
}

/**
 * Код партнёра из куки запроса или null. Кука старше 30 дней — как не было:
 * окно держим и здесь, а не только сроком жизни куки в браузере.
 */
export function refFromCookieHeader(header: string | null | undefined, now: Date = new Date()): string | null {
  return refFromHeader(header, now)?.code ?? null;
}

/** Код из адреса сайта (?ref=…) — той же формы, иначе не код. */
export function codeFromQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = normalizeCode(raw);
  return CODE_RE.test(code) ? code : null;
}

/* ── Начисления ─────────────────────────────────────────────────────────── */

export type PartnerProject = ProjectMoney & {
  partner_id: string | null;
  partner_percent: number | null;
  partner_void_reason: string | null;
};

export type PartnerAccrual = {
  project_id: string;
  partner_id: string;
  percent: number;
  /** Процент задан владельцем по этому проекту, а не ступенью. */
  manual: boolean;
  amount_usd: number;
  state: AccrualState;
  void_reason: string | null;
};

/**
 * Начисление партнёру по проекту. `null`, если проект не партнёрский или
 * без суммы. Проект с причиной аннулирования даёт строку с нулём: видно,
 * что привязка была и почему не засчитана.
 */
export function partnerAccrualOf(
  project: PartnerProject,
  payments: PaymentMoney[],
  partner: { id: string; percent_override: number | null },
): PartnerAccrual | null {
  if (project.partner_id !== partner.id) return null;
  if (project.amount_usd === null) return null;

  const base = Math.max(0, project.amount_usd);
  const percent = partnerPercent({
    projectPercent: project.partner_percent,
    partnerOverride: partner.percent_override,
    amountUsd: base,
  });
  const voided = project.partner_void_reason !== null;
  const state: AccrualState = voided ? "void" : accrualState(project, paidOf(project.id, payments));

  return {
    project_id: project.id,
    partner_id: partner.id,
    percent,
    manual: project.partner_percent !== null,
    amount_usd: state === "void" ? 0 : Math.round((base * percent) / 100),
    state,
    void_reason: project.partner_void_reason,
  };
}

export type PayoutMoney = { status: "requested" | "paid" | "rejected"; amount_usd: number };

export type PartnerBalance = {
  earned: number;
  frozen: number;
  /** Заявки, по которым владелец ещё не решил. */
  requested: number;
  paid: number;
  /** Доступно к выводу: заработано − выплачено − в заявках. */
  available: number;
};

export function partnerBalanceOf(accruals: PartnerAccrual[], payouts: PayoutMoney[]): PartnerBalance {
  const b: PartnerBalance = { earned: 0, frozen: 0, requested: 0, paid: 0, available: 0 };
  for (const a of accruals) {
    if (a.state === "earned") b.earned += a.amount_usd;
    if (a.state === "frozen") b.frozen += a.amount_usd;
  }
  for (const p of payouts) {
    if (p.status === "paid") b.paid += p.amount_usd;
    if (p.status === "requested") b.requested += p.amount_usd;
  }
  b.available = b.earned - b.paid - b.requested;
  return b;
}

/* ── Окно вывода ────────────────────────────────────────────────────────── */

const TZ = "Asia/Tashkent";

function tashkent(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Первый рабочий день месяца (число): суббота и воскресенье — не рабочие. */
export function firstBusinessDay(year: number, month: number): number {
  for (let day = 1; day <= 7; day++) {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) return day;
  }
  return 1;
}

/**
 * Вывод открыт с первого рабочего дня месяца — после того как по прошлому
 * месяцу сведены платежи. До этого партнёр видит сумму, но заявку подать
 * не может.
 */
export function canWithdrawNow(now: Date = new Date()): boolean {
  const { year, month, day } = tashkent(now);
  return day >= firstBusinessDay(year, month);
}

/** Когда откроется: «02.11» — для ответа партнёру, который поспешил. */
export function withdrawOpens(now: Date = new Date()): string {
  const { year, month } = tashkent(now);
  const day = firstBusinessDay(year, month);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}`;
}

/* ── Антифрод ───────────────────────────────────────────────────────────── */

export type VoidReason = "self" | "existing_client" | "blocked";

export const VOID_TITLE: Record<VoidReason, string> = {
  self: "партнёр привёл сам себя",
  existing_client: "клиент уже был у студии до ссылки",
  blocked: "партнёр заблокирован",
};

/**
 * Почему привязку не засчитывать. Сам себя — по Telegram id или по
 * username в контакте лида. «Уже был» решает база: был ли лид или проект с
 * тем же контактом или компанией до этого касания.
 */
export function voidReason(input: {
  partnerStatus: "active" | "blocked";
  partnerTelegramId: number | null;
  partnerUsername: string | null;
  leadTelegramId: number | null;
  leadHandle: string | null;
  existingClient: boolean;
}): VoidReason | null {
  if (input.partnerStatus === "blocked") return "blocked";
  if (
    input.partnerTelegramId !== null &&
    input.leadTelegramId !== null &&
    input.partnerTelegramId === input.leadTelegramId
  ) {
    return "self";
  }
  const handle = (input.leadHandle ?? "").trim().replace(/^@/, "").toLowerCase();
  const username = (input.partnerUsername ?? "").trim().replace(/^@/, "").toLowerCase();
  if (handle && username && handle === username) return "self";
  if (input.existingClient) return "existing_client";
  return null;
}

/* ── Реквизиты ──────────────────────────────────────────────────────────── */

/** Адрес USDT TRC-20 (Tron): T и 34 символа base58. */
export function isTrc20(value: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim());
}

/** Кошелёк или реквизиты словами — владелец платит руками, ему нужно понять куда. */
export function validRequisites(value: string): boolean {
  const text = value.trim();
  if (isTrc20(text)) return true;
  return text.length >= 8 && text.length <= 200;
}
