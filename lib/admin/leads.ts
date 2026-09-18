import type { Brief } from "@/lib/qualify/brief";
import { seesEveryone, type Role } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Колонки перечислены поимённо, select("*") в панели запрещён.
 *
 * Причина не в трафике. Звёздочка отдаёт наружу всё, что кто-нибудь
 * добавит в таблицу завтра, — и решение «показывать ли это менеджеру»
 * оказывается принятым по умолчанию и молча.
 *
 * Чего здесь нет и почему:
 *
 * transcript — это переписка целиком. Менеджеру для работы достаточно
 * брифа; полный разговор — самый чувствительный кусок того, что клиент
 * рассказал о своём бизнесе, и он не должен читаться мимоходом со списка.
 *
 * contact_handle и contact_kind — контакт клиента и его тип. Контакт
 * отдаётся только отдельным действием revealContact() в lib/admin/ownership,
 * и только владельцу лида или админу. Причина не в скрытности: пока
 * контакт приезжает вместе со списком, «кто видел контакты» означает «все,
 * кто открывал панель», и журнал доступа ничего не доказывает. Тип контакта
 * уехал туда же — «телефон» рядом с именем компании выдаёт почти столько
 * же, сколько сам номер.
 *
 * Оба списка экспортируются ради теста: правило «здесь нет переписки и
 * контакта» держится проверкой, а не памятью того, кто правит файл.
 */
export const LIST_COLUMNS = [
  "id",
  "created_at",
  "request_no",
  "source",
  "locale",
  "contact_name",
  "company",
  "niche",
  "services",
  "budget",
  "timing",
  "score",
  "grade",
  "priority",
  "status",
  "assigned_to",
  "assigned_staff_id",
  "discount_granted",
  "partner_id",
  "partner_code",
  "partner_void_reason",
].join(", ");

export const DETAIL_COLUMNS = [
  LIST_COLUMNS,
  // Откуда пришёл: ник от Telegram, страница сайта, источник перехода.
  //
  // Ник — в подробной карточке, но не в списке. Это не полумера: в общий
  // чат отдела он теперь уходит вместе с брифом («указывай юзернейм, если
  // он есть»), то есть у менеджера он и так перед глазами, и прятать его
  // в карточке было бы театром. А вот в списке свободных лидов его быть
  // не должно: оттуда человека уводят, не взяв заявку и не оставив следа.
  // Телефон и почта по-прежнему открываются отдельным действием с записью
  // в журнал — их в чате нет.
  "tg_username",
  "entry_path",
  "entry_ref",
  "niche_tier",
  "expertise",
  "authority",
  "need",
  "intent",
  "breakdown",
  "summary",
  "notes",
  "opening_line",
  "assigned_at",
  "auto_reminder",
  "contact_revealed_at",
  "contact_revealed_by",
  "brief",
].join(", ");

export type LeadRow = {
  id: string;
  created_at: string;
  request_no: string | null;
  source: string;
  locale: string;
  contact_name: string | null;
  company: string | null;
  niche: string | null;
  services: string[];
  budget: string | null;
  timing: string | null;
  score: number;
  grade: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_staff_id: string | null;
  discount_granted: boolean;
  /** Партнёрская программа: кто привёл, по какому коду, почему не засчитано. */
  partner_id: string | null;
  partner_code: string | null;
  partner_void_reason: string | null;
};

export type LeadDetail = LeadRow & {
  tg_username: string | null;
  entry_path: string | null;
  entry_ref: string | null;
  niche_tier: number | null;
  expertise: string | null;
  authority: string | null;
  need: string | null;
  intent: string;
  breakdown: Record<string, unknown>;
  summary: Record<string, unknown>;
  notes: string | null;
  opening_line: string | null;
  assigned_at: string | null;
  auto_reminder: boolean;
  contact_revealed_at: string | null;
  contact_revealed_by: string | null;
  /** Бриф с витрины структурой — есть только у лидов с витрины. */
  brief: Brief | null;
};

export const PRIORITIES = ["hot", "warm", "nurture", "archive"] as const;
export const STATUSES = ["new", "taken", "dropped", "won", "lost"] as const;

/**
 * Чьи лиды видны.
 *
 * Владелец: «менеджерам не надо видеть чужих лидов после взятия в работу».
 * Значит, менеджеру — свободные и свои, а руководителю и владельцу — все:
 * их работа и есть чужие лиды. Круг задаётся здесь, а не на странице,
 * потому что забыть его на странице легче, чем в запросе.
 */
export type LeadScope = "all" | { staffId: string };

export function scopeFor(staff: { id: string; role: Role }): LeadScope {
  return seesEveryone(staff.role) ? "all" : { staffId: staff.id };
}

/**
 * Круг как условие запроса: «ничей или мой».
 *
 * Отдельной функцией, а не строкой внутри запроса, ровно затем, чтобы её
 * можно было проверить тестом: это граница приватности, и её молчаливое
 * исчезновение должно ронять сборку, а не обнаруживаться клиентом, чей
 * контакт увидел посторонний.
 */
export function scopeFilter(scope: LeadScope): string | null {
  return scope === "all" ? null : `assigned_staff_id.is.null,assigned_staff_id.eq.${scope.staffId}`;
}

export type LeadFilter = {
  priority?: string;
  status?: string;
  /** "mine" — закреплённые за этим сотрудником, "free" — ничьи. */
  owner?: string;
  ownerStaffId?: string;
  limit?: number;
  offset?: number;
};

export type LeadPage = {
  rows: LeadRow[];
  total: number;
  /** База не настроена — это не «лидов нет», и путать их нельзя. */
  offline: boolean;
};

export async function listLeads(
  filter: LeadFilter = {},
  scope: LeadScope = "all",
): Promise<LeadPage> {
  const db = serviceClient();
  if (!db) return { rows: [], total: 0, offline: true };

  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  let query = db
    .from("leads")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Значения фильтров сверяются со списком, а не подставляются как есть:
  // они приходят из строки запроса, то есть из рук кого угодно.
  if (filter.priority && (PRIORITIES as readonly string[]).includes(filter.priority)) {
    query = query.eq("priority", filter.priority);
  }
  if (filter.status && (STATUSES as readonly string[]).includes(filter.status)) {
    query = query.eq("status", filter.status);
  }
  // Круг — первым делом: он не фильтр, который человек выбрал, а граница,
  // за которую ему нельзя, и снять её переключателем в адресе нельзя тоже.
  const inScope = scopeFilter(scope);
  if (inScope) query = query.or(inScope);

  if (filter.owner === "free") {
    query = query.is("assigned_staff_id", null);
  } else if (filter.owner === "mine" && filter.ownerStaffId) {
    query = query.eq("assigned_staff_id", filter.ownerStaffId);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("admin: не прочитал лиды", error.message);
    return { rows: [], total: 0, offline: true };
  }

  return {
    rows: (data ?? []) as unknown as LeadRow[],
    total: count ?? 0,
    offline: false,
  };
}

export async function leadById(id: string): Promise<LeadDetail | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("leads")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as LeadDetail;
}

/** Сводка для верхней панели: сколько чего лежит прямо сейчас. */
export async function leadCounts(
  staffId?: string,
  scope: LeadScope = "all",
): Promise<{
  total: number;
  free: number;
  mine: number;
  offline: boolean;
}> {
  const db = serviceClient();
  if (!db) return { total: 0, free: 0, mine: 0, offline: true };

  const head = { count: "exact" as const, head: true };
  const [all, free, mine] = await Promise.all([
    db.from("leads").select("id", head),
    db.from("leads").select("id", head).is("assigned_staff_id", null),
    staffId
      ? db.from("leads").select("id", head).eq("assigned_staff_id", staffId)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  const freeCount = free.count ?? 0;
  const mineCount = mine.count ?? 0;

  return {
    // В своём круге «всего» — это ровно то, что человек может открыть:
    // свободные и свои. Показать ему общее число значило бы сказать «есть
    // ещё сорок, но они не для вас» — вопрос, а не ответ.
    total: scope === "all" ? all.count ?? 0 : freeCount + mineCount,
    free: freeCount,
    mine: mineCount,
    offline: Boolean(all.error),
  };
}
