import { serviceClient } from "@/lib/supabase";
import { esc } from "@/lib/qualify/telegram";

/**
 * Бриф с витрины: клиент собрал сайт из пакета и допников и нажал «отправить».
 *
 * Приходит с сервера витрины (globalex.maximov-tech.ru), а не из браузера:
 * витрина сама пересчитывает сумму по своему каталогу и подписывает запрос
 * общим секретом, поэтому цене здесь можно верить настолько, насколько
 * вообще можно верить прайсу, — подделать её из браузера нельзя.
 *
 * Здесь же — единственное место, где решается, кому бриф показывать. Заказ
 * дороже порога уходит только владельцу; всё, что дешевле, — в общий чат
 * отдела продаж. Правило одно на все входы: и на бриф с витрины, и на
 * квалификацию, которую ассистент делает по нему в боте.
 */

export type BriefAddon = {
  id: string;
  label: string;
  priceUsd: number;
  /** Входит в пакет — за это денег не берём, но менеджеру видеть надо. */
  included: boolean;
  /** Подписка: цена в месяц, в разовый итог не входит. */
  monthly?: boolean;
  /** Цена «от»: точную назовёт менеджер. */
  from?: boolean;
  /** По запросу: в цену не входит, клиент только отметил интерес. */
  onRequest?: boolean;
};

export type Brief = {
  /** Ключ проекта на витрине: mavera, adar, globalex. */
  project: string;
  /** Как проект называть в брифе и в разговоре: «MAVERA — сайт застройщика». */
  projectLabel: string;
  tier: { id: string; label: string; priceUsd: number };
  addons: BriefAddon[];
  /** Разовый итог — по нему решается «только владельцу». */
  totalUsd: number;
  /** Подписки в месяц, отдельно от разового. */
  monthlyUsd?: number;
  /** В наборе есть цена «от» — итог тоже «от». */
  fromPrice?: boolean;
  /** Страница, с которой отправили, и ссылка с набором — менеджер откроет ровно то, что видел клиент. */
  pageUrl?: string;
  shareUrl?: string;
  /** Номер заявки, под которым бриф уже ушёл. Появляется после регистрации. */
  requestNo?: string;
  /** Как клиент представился и какой контакт оставил в форме витрины. */
  name?: string;
  contact?: string;
};

/**
 * Порог «только владельцу», в долларах.
 *
 * Зашит числом и правится переменной окружения: это решение про деньги, а
 * не про код, и менять его перевыкаткой не нужно. Строгое «больше»: заказ
 * ровно в десять тысяч ещё падает всем.
 */
export const OWNER_ONLY_FROM_USD = 10_000;

export function ownerThresholdUsd(): number {
  const raw = Number(process.env.BRIEF_OWNER_ONLY_FROM_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : OWNER_ONLY_FROM_USD;
}

export function ownerOnly(totalUsd: number): boolean {
  return totalUsd > ownerThresholdUsd();
}

/**
 * Куда слать бриф.
 *
 * Владелец — тот, у кого в команде роль admin (по замыслу панели он один),
 * либо явно заданный чат в TELEGRAM_OWNER_CHAT_ID: переменная главнее базы,
 * потому что это аварийный рычаг на случай, когда база недоступна или
 * владелец ещё не завёл себя в команду.
 *
 * Если заказ крупный, а владельца найти негде, бриф всё же уходит в чат
 * продаж с пометкой, а не теряется: не доставленный бриф на $12 000 хуже,
 * чем доставленный не туда. Пометка — чтобы это исправили после первого же
 * такого случая.
 */
export async function briefRecipients(totalUsd: number): Promise<{
  chatIds: string[];
  ownerOnly: boolean;
  /** Правило «только владельцу» не выполнено: владелец не настроен. */
  fallback: boolean;
}> {
  const sales = (process.env.TELEGRAM_SALES_CHAT_ID ?? "").trim();
  const toSales = sales ? [sales] : [];

  if (!ownerOnly(totalUsd)) {
    return { chatIds: await salesRecipients(), ownerOnly: false, fallback: false };
  }

  const owners = await ownerChatIds();
  if (owners.length) return { chatIds: owners, ownerOnly: true, fallback: false };

  console.error("brief: заказ дороже порога, а чат владельца не настроен — ушёл в чат продаж");
  return { chatIds: toSales, ownerOnly: true, fallback: true };
}

/**
 * Кому уходит карточка нового лида.
 *
 * Чат отдела продаж — и личные чаты всех, кто с лидами работает: менеджеров,
 * руководителей и владельца. До этого адрес был один, из
 * `TELEGRAM_SALES_CHAT_ID`, и у студии без общей группы это означало личный
 * чат владельца: он про лид знал, остальные — нет, и «возьми в работу»
 * доходило до менеджера пересказом.
 *
 * Границу это не двигает. В карточке и так нет ни телефона, ни почты, ни
 * переписки — только ник, если он есть, и ссылка в панель, где контакт
 * открывается отдельным действием и с записью в журнал. То есть уходит ровно
 * то, что и задумывалось для общего чата отдела продаж, — просто чата у
 * студии нет, и роль его играют личные.
 *
 * Кто боту ни разу не писал, тот и не получит: Bot API не даёт написать
 * первым, и обойти это нечем. Остальным доставка от этого не ломается.
 */
export async function salesRecipients(): Promise<string[]> {
  const sales = (process.env.TELEGRAM_SALES_CHAT_ID ?? "").trim();
  const out = new Set<string>(sales ? [sales] : []);

  const db = serviceClient();
  if (!db) return [...out];

  const { data, error } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("is_active", true)
    .in("role", ["admin", "head", "manager"]);

  if (error) {
    // База отпала — уведомление всё равно уходит туда, куда уходило всегда.
    console.error("brief: не прочитал команду для рассылки лида", error.message);
    return [...out];
  }

  for (const row of (data as { telegram_user_id: number | null }[] | null) ?? []) {
    if (typeof row.telegram_user_id === "number") out.add(String(row.telegram_user_id));
  }
  return [...out];
}

export async function ownerChatIds(): Promise<string[]> {
  const fromEnv = (process.env.TELEGRAM_OWNER_CHAT_ID ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^-?\d+$/.test(value));
  if (fromEnv.length) return fromEnv;

  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("role", "admin")
    .eq("is_active", true);

  if (error) {
    console.error("brief: не прочитал владельца из команды", error.message);
    return [];
  }

  return ((data as { telegram_user_id: number | null }[] | null) ?? [])
    .map((row) => row.telegram_user_id)
    .filter((id): id is number => typeof id === "number")
    .map(String);
}

/** Допники по видам: разовые, подписка, по запросу, бесплатные из пакета. */
function split(brief: Brief) {
  const extra = brief.addons.filter((addon) => !addon.included && !addon.onRequest && addon.priceUsd > 0);
  return {
    paid: extra.filter((addon) => !addon.monthly),
    monthly: extra.filter((addon) => addon.monthly),
    onRequest: brief.addons.filter((addon) => addon.onRequest),
    free: brief.addons.filter((addon) => addon.included || (addon.priceUsd === 0 && !addon.onRequest)),
  };
}

/**
 * Итог одной строкой: «$11 000», «от $34 900», «от $34 900 + $550/мес».
 * Одна формула на шапку, резюме, промпт и заготовку менеджера.
 */
export function briefTotal(brief: Brief): string {
  const once = `${brief.fromPrice ? "от " : ""}$${fmt(brief.totalUsd)}`;
  return brief.monthlyUsd ? `${once} + $${fmt(brief.monthlyUsd)}/мес` : once;
}

/** Состав заказа одной строкой — для резюме лида и для промпта ассистента. */
export function briefSummary(brief: Brief): string {
  const { paid, monthly, onRequest, free } = split(brief);

  const lines = [
    `${brief.projectLabel}: пакет «${brief.tier.label}» — $${fmt(brief.tier.priceUsd)}.`,
    paid.length
      ? `Допники: ${paid.map((addon) => `${addon.label} (${addon.from ? "от" : "+"}$${fmt(addon.priceUsd)})`).join(", ")}.`
      : "Допников сверх пакета нет.",
    monthly.length
      ? `Подписка: ${monthly.map((addon) => `${addon.label} ($${fmt(addon.priceUsd)}/мес)`).join(", ")}.`
      : "",
    onRequest.length ? `По запросу: ${onRequest.map((addon) => addon.label).join(", ")}.` : "",
    free.length ? `В пакете: ${free.map((addon) => addon.label).join(", ")}.` : "",
    `Итого ${briefTotal(brief)}.`,
  ];
  return lines.filter(Boolean).join(" ");
}

/**
 * Шапка над брифом в Telegram — HTML.
 *
 * Сумма и «только владельцу» стоят первыми: это то, ради чего менеджер
 * вообще открывает уведомление, а состав заказа он прочитает ниже.
 */
export function briefHeading(
  brief: Brief,
  route: { ownerOnly: boolean; fallback: boolean },
  stage: "brief" | "qualified",
): string {
  const title =
    stage === "brief"
      ? `🧩 <b>БРИФ С ВИТРИНЫ</b> · ${esc(brief.projectLabel)} · <b>${briefTotal(brief)}</b>`
      : `🤖 <b>ПЕРВИЧКА ЗАКРЫТА</b> · ${esc(brief.projectLabel)} · <b>${briefTotal(brief)}</b>`;

  const lines = [title];
  if (route.ownerOnly && !route.fallback) {
    lines.push(`🔒 Только владельцу: заказ дороже $${fmt(ownerThresholdUsd())}`);
  }
  if (route.fallback) {
    lines.push(
      `⚠️ Заказ дороже $${fmt(ownerThresholdUsd())}, а чат владельца не настроен — бриф ушёл сюда. Задайте TELEGRAM_OWNER_CHAT_ID или роль admin в команде.`,
    );
  }

  const { paid, monthly, onRequest } = split(brief);
  lines.push(
    "",
    `📦 Пакет «${esc(brief.tier.label)}» — $${fmt(brief.tier.priceUsd)}`,
    ...paid.map((addon) => `➕ ${esc(addon.label)} — ${addon.from ? "от" : "+"}$${fmt(addon.priceUsd)}`),
    ...monthly.map((addon) => `🔁 ${esc(addon.label)} — $${fmt(addon.priceUsd)}/мес`),
    ...onRequest.map((addon) => `❓ ${esc(addon.label)} — по запросу`),
  );
  if (brief.shareUrl) lines.push(`🔗 <a href="${esc(brief.shareUrl)}">Открыть набор на витрине</a>`);

  return lines.join("\n");
}

function fmt(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
