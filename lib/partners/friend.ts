import { PROMO } from "@/lib/admin/mockup-offer";
import { sameCompany, type CompanyFacts } from "@/lib/partners/rules";

/**
 * «Приведи друга — сайт бесплатно».
 *
 * Владелец, 22.11.2026: «Давай будет механика - приведи друга который
 * закажет сайт и получи сайт себе бесплатно». Ответ на розыгрыш сайтов у
 * конкурента, но без лотереи: сайт получает каждый, чей друг заказал и
 * оплатил.
 *
 * Участник — партнёр с `kind = 'friend'`: та же ссылка, то же слово-промокод
 * и та же атрибуция (`attributeAndNotify`), что у партнёров. Денег и
 * процента у него нет — `partnerAccrualOf` для него молчит, поэтому ни в
 * «Финансах», ни в выплатах, ни в котле соучредителей его нет. Награда —
 * подарочный лендинг по нашему макету (как PROMO.landing, без допов) или та
 * же сумма в зачёт его собственного заказа.
 *
 * Здесь только правила, без базы: что считается оплатившим другом и что
 * считается «привёл сам себя».
 */

/** Друг считается, если его проект — от цены лендинга по макету. */
export const FRIEND_MIN_USD = PROMO.landing.price;
/** Цена подарка: лендинг по макету, без допов. Столько же — в зачёт своего заказа. */
export const FRIEND_GIFT_USD = PROMO.landing.price;

/** Поля проекта, по которым решается подарок. */
export type FriendProject = {
  id: string;
  partner_id: string | null;
  amount_usd: number | null;
  stage: string;
  partner_void_reason?: string | null;
  title?: string | null;
  client?: string | null;
  created_at?: string | null;
};

export type FriendPayment = { project_id: string; amount_usd: number };

export type FriendState = "earned" | "waiting" | "small";

/**
 * Что с проектом друга:
 * - `earned` — от цены лендинга и оплачен целиком: подарок заработан;
 * - `waiting` — от цены лендинга, ещё не оплачен целиком;
 * - `small` — дешевле лендинга: друг пришёл, но подарка за него нет.
 * `null` — проект не этого участника, отменён или не засчитан (сам себя,
 * клиент уже был у студии).
 */
export function friendStateOf(
  project: FriendProject,
  friendId: string,
  payments: readonly FriendPayment[],
): FriendState | null {
  if (project.partner_id !== friendId) return null;
  if (project.stage === "cancelled" || project.partner_void_reason) return null;
  const amount = project.amount_usd ?? 0;
  if (amount < FRIEND_MIN_USD) return "small";
  const paid = payments.filter((p) => p.project_id === project.id).reduce((s, p) => s + (Number(p.amount_usd) || 0), 0);
  return paid >= amount ? "earned" : "waiting";
}

export type FriendStats = {
  /** Сколько друзей пришло: засчитанные заявки по ссылке или слову. */
  came: number;
  /** Сколько заказали: проекты, кроме отменённых и не засчитанных. */
  ordered: number;
  /** Сколько оплатили целиком от цены лендинга — столько сайтов заработано. */
  paid: number;
  /** Проекты, за которые сайт заработан. */
  earned: string[];
};

/** Прогресс участника: одна оплата друга — один сайт. */
export function friendStats(
  friendId: string,
  came: number,
  projects: readonly FriendProject[],
  payments: readonly FriendPayment[],
): FriendStats {
  let ordered = 0;
  const earned: string[] = [];
  for (const p of projects) {
    const state = friendStateOf(p, friendId, payments);
    if (!state) continue;
    ordered += 1;
    if (state === "earned") earned.push(p.id);
  }
  return { came: Math.max(came, ordered), ordered, paid: earned.length, earned };
}

/**
 * Привёл сам себя? Самого себя привести нельзя: тот же Telegram, телефон,
 * сайт или компания. Telegram и ник проверяет общий `voidReason`; здесь —
 * всё, что известно об участнике (его собственные заявки и макеты), против
 * приведённой заявки тем же сравнением, что у закреплённых клиентов
 * (`sameCompany`: телефон, Telegram, сайт, название).
 */
export function friendSelf(own: readonly CompanyFacts[], lead: CompanyFacts): boolean {
  return own.some((facts) => sameCompany(facts, lead));
}

/** Первый адрес сайта в тексте заявки — для сравнения «тот же сайт». */
export function hostInText(text: string | null | undefined): string | null {
  const m = (text ?? "").match(/\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(?:[/?#][^\s]*)?/i);
  if (!m) return null;
  const host = m[1].toLowerCase();
  // Мессенджеры и соцсети — не сайт компании.
  if (/(^|\.)(t\.me|telegram\.me|instagram\.com|wa\.me|facebook\.com|devuz\.studio)$/.test(host)) return null;
  return host;
}

/* ── Бот ────────────────────────────────────────────────────────────────── */

export type FriendCommand = "friend";

/** /friend — и узбекское, и русское слово, если человек напишет его командой. */
export function friendCommand(text: string | undefined | null): FriendCommand | null {
  const first = (text ?? "").trim().toLowerCase().split(/\s+/)[0]?.split("@")[0] ?? "";
  return first === "/friend" || first === "/drug" || first === "/dost" ? "friend" : null;
}

/** payload в /start: кнопка с сайта и кнопка после макета ведут сюда. */
export const FRIEND_START = "friend";

/** Ключ отметки «о подарке уже сказали» в team_news_sent. */
export function giftNewsKey(projectId: string): string {
  return `friend-gift:${projectId}`;
}
