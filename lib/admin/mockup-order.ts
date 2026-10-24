import type { Role } from "@/lib/admin/roles";

/**
 * Заказ макета в задаче — правила, без базы.
 *
 * Владелец, 23.10.2026: «На меня менеджеры через нашу crm ставят задачу,
 * может сделать обязательное поле: МАКЕТ (да/нет)? Тогда мы кодом сможем
 * определять ответственного за макеты. Если нажимает — да, значит он
 * ответственный за работу по этому макету с клиентом». На план — «Делаем».
 *
 * - Вопрос «Заказ макета» обязателен, когда среди исполнителей есть тот,
 *   кто собирает макеты (MOCKUP_MAKER_ROLES — владелец). Другим задачам он
 *   не нужен: «Связаться: …» от бота, задачи руководителя по другим делам.
 * - «Да» — нужен клиент (лид или касание, выбор поиском) и сайт клиента.
 * - Макет, собранный по заказу, привязывается к задаче (`mockup_ref`), и
 *   ответственным за макет становится тот, кто поставил задачу
 *   («по заказу», lib/admin/mockups.ts → mockupOwner). Назначенный руками
 *   в «Макетах» по-прежнему главнее.
 *
 * Держит tests/mockup-order.test.ts.
 */

/** Кто собирает макеты: задаче им вопрос «Заказ макета» обязателен. */
export const MOCKUP_MAKER_ROLES: readonly Role[] = ["admin"];

export function makesMockups(role: Role | string | null | undefined): boolean {
  return (MOCKUP_MAKER_ROLES as readonly string[]).includes(String(role ?? ""));
}

/** Ответ формы: null — вопроса не было или не ответили. */
export type MockupOrderInput = {
  mockup: boolean | null;
  leadId: string | null;
  prospectId: string | null;
  site: string | null;
};

export const NO_ORDER: MockupOrderInput = { mockup: null, leadId: null, prospectId: null, site: null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Сайт клиента длиннее не бывает; длиннее — мусор в поле. */
export const SITE_MAX = 200;

/** Поля формы «Поставить задачу» → заказ. Чужое в полях — как пусто. */
export function orderFromForm(get: (name: string) => string | null): MockupOrderInput {
  const answer = (get("mockup") ?? "").trim();
  const mockup = answer === "yes" ? true : answer === "no" ? false : null;
  if (mockup !== true) return { ...NO_ORDER, mockup };
  const id = (name: string) => {
    const v = (get(name) ?? "").trim();
    return UUID.test(v) ? v.toLowerCase() : null;
  };
  const site = (get("mockup_site") ?? "").trim().slice(0, SITE_MAX);
  return { mockup, leadId: id("mockup_lead"), prospectId: id("mockup_prospect"), site: site || null };
}

/**
 * Адрес сайта → хост без www: «https://www.Tirex.uz/ru» → «tirex.uz». Не
 * похоже на адрес — null.
 */
export function siteHost(raw: string | null | undefined): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || /^xn--/.test(host) ? host : null;
  } catch {
    return null;
  }
}

export type OrderProblem = "mockup" | "mockup_client" | "mockup_site";

/**
 * Что не так с заказом. `required` — среди исполнителей есть тот, кто
 * собирает макеты: тогда без ответа «да» или «нет» задача не ставится.
 */
export function orderProblem(order: MockupOrderInput, required: boolean): OrderProblem | null {
  if (order.mockup === null) return required ? "mockup" : null;
  if (!order.mockup) return null;
  if (!order.leadId && !order.prospectId) return "mockup_client";
  if (!siteHost(order.site)) return "mockup_site";
  return null;
}

/** Что пишется в задачу. Заказ без «да» — только ответ, без клиента и сайта. */
export function orderColumns(order: MockupOrderInput): Record<string, unknown> {
  if (order.mockup !== true) return { mockup: order.mockup };
  return {
    mockup: true,
    mockup_lead_id: order.leadId,
    mockup_prospect_id: order.leadId ? null : order.prospectId,
    mockup_site: siteHost(order.site),
  };
}

/** Заказ в задаче — то, что читают «Задачи», «Прототипы» и «Макеты». */
export type MockupOrder = {
  taskId: string;
  title: string;
  creatorId: string;
  assigneeId: string;
  leadId: string | null;
  prospectId: string | null;
  site: string | null;
  ref: string | null;
  open: boolean;
};

/**
 * Какой заказ подходит макету: тот, чей сайт совпадает с сайтом макета.
 * Несколько — самый старый: его ждут дольше. Не нашли — null, человек
 * выберет сам.
 */
export function orderForSite(orders: readonly MockupOrder[], site: string | null | undefined): MockupOrder | null {
  const host = siteHost(site);
  if (!host) return null;
  return orders.find((o) => !o.ref && siteHost(o.site) === host) ?? null;
}

/**
 * «Собрать прототип» у заказа — форма «Прототипов» с сайтом, касанием и
 * самим заказом: собранный прототип привяжется к задаче сам.
 */
export function protoHrefFor(order: Pick<MockupOrder, "taskId" | "site" | "prospectId">): string {
  const q = new URLSearchParams();
  if (order.site) q.set("url", order.site);
  if (order.prospectId) q.set("prospect", order.prospectId);
  q.set("order", order.taskId);
  return `/admin/proto?${q.toString()}#build`;
}

/** Кто может привязать макет к заказу: исполнитель задачи, руководитель и владелец. */
export function canLinkOrder(order: Pick<MockupOrder, "assigneeId">, staff: { id: string; role: Role | string }): boolean {
  return order.assigneeId === staff.id || staff.role === "admin" || staff.role === "head";
}
