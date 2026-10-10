import type { SupabaseClient } from "@supabase/supabase-js";

import { randomKey } from "@/lib/ai-staff/crypto";
import type { Turn } from "@/lib/ai-staff/engine";
import { parseHours, type WorkHours } from "@/lib/ai-staff/hours";
import { TRIAL_DAYS, usageSite, type PlanId, type UsageRow } from "@/lib/ai-staff/plans";
import type { KnowledgeKind } from "@/lib/ai-staff/prompt";
import { serviceClient } from "@/lib/supabase";

/**
 * База ИИ-сотрудников. Единственное место, где код ходит в таблицы `ai_*`.
 *
 * Изоляция клиентов держится здесь. RLS в базе включён без политик, и
 * сервер ходит по сервисному ключу, который его обходит, — значит, чужие
 * данные не отдаст только код. Правило одно: функция, которая читает или
 * пишет данные клиента, получает `tenantId` первым аргументом и фильтрует по
 * нему каждый запрос, включая запись (`.eq("tenant_id", tenantId)` рядом с
 * id строки — чтобы чужой id из формы не нашёл строку). `tenantId` берётся из
 * сессии кабинета, из канала или из ключа виджета — никогда из тела запроса.
 *
 * Исключения — функции, которые и ищут клиента: по каналу, ключу виджета,
 * коду приглашения, Telegram id человека. Они перечислены в
 * tests/ai-staff-isolation.test.ts, и новое исключение проходит только
 * через этот список.
 */

function db(): SupabaseClient {
  const client = serviceClient();
  if (!client) throw new Error("ai-staff: база не настроена");
  return client;
}

/* ── Флаг сервиса ─────────────────────────────────────────────────────── */

let enabledCache: { value: boolean; at: number } | null = null;

/** Включён ли сервис. Помнится минуту: вебхуки спрашивают на каждое сообщение. */
export async function serviceEnabled(now = Date.now()): Promise<boolean> {
  if (enabledCache && now - enabledCache.at < 60_000) return enabledCache.value;
  const client = serviceClient();
  if (!client) return false;
  const { data } = await client.from("ai_settings").select("value").eq("key", "enabled").maybeSingle();
  const value = data?.value === true;
  enabledCache = { value, at: now };
  return value;
}

export async function setServiceEnabled(on: boolean): Promise<void> {
  await db().from("ai_settings").upsert({ key: "enabled", value: on, updated_at: new Date().toISOString() });
  enabledCache = null;
}

/* ── Клиенты ──────────────────────────────────────────────────────────── */

export type Tenant = {
  id: string;
  report_sent_on?: string | null;
  name: string;
  niche: string;
  site_url: string | null;
  locale: "ru" | "uz";
  plan: PlanId;
  status: "active" | "paused" | "blocked";
  trial_until: string | null;
  paid_until: string | null;
  answer_mode: "always" | "off_hours";
  work_hours: WorkHours;
  invite_code: string;
  limit_noticed_at: string | null;
  demo: boolean;
  notes: string | null;
  created_at: string;
};

const TENANT_COLUMNS =
  "id, report_sent_on, name, niche, site_url, locale, plan, status, trial_until, paid_until, answer_mode, work_hours, invite_code, limit_noticed_at, demo, notes, created_at";

function asTenant(row: Record<string, unknown>): Tenant {
  return { ...(row as unknown as Tenant), work_hours: parseHours(row.work_hours) };
}

export async function tenantById(tenantId: string): Promise<Tenant | null> {
  const { data } = await db().from("ai_tenants").select(TENANT_COLUMNS).eq("id", tenantId).maybeSingle();
  return data ? asTenant(data) : null;
}

export type TgPerson = { id: number; name: string; username: string | null };

/** Новый клиент: владелец, ИИ-менеджер продаж и пробный период. */
export async function createTenant(input: { name: string; niche: string; locale: "ru" | "uz"; owner: TgPerson }): Promise<Tenant> {
  const trialUntil = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
  const { data, error } = await db()
    .from("ai_tenants")
    .insert({ name: input.name.slice(0, 120), niche: input.niche.slice(0, 120), locale: input.locale, trial_until: trialUntil })
    .select(TENANT_COLUMNS)
    .single();
  if (error || !data) throw new Error(`ai-staff: клиент не создан — ${error?.message}`);
  const tenant = asTenant(data);
  await db().from("ai_members").insert({
    tenant_id: tenant.id,
    telegram_user_id: input.owner.id,
    name: input.owner.name.slice(0, 120),
    username: input.owner.username,
    role: "owner",
  });
  await db().from("ai_employees").insert({ tenant_id: tenant.id, role: "sales", name: input.locale === "uz" ? "Madina" : "Анна" });
  return tenant;
}

export type TenantPatch = Partial<
  Pick<Tenant, "name" | "niche" | "site_url" | "locale" | "answer_mode" | "work_hours" | "limit_noticed_at">
>;

export async function updateTenant(tenantId: string, patch: TenantPatch): Promise<void> {
  await db().from("ai_tenants").update(patch).eq("id", tenantId);
}

/** Тариф, статус и сроки — только из панели владельца студии. */
export async function setTenantTerms(
  tenantId: string,
  patch: Partial<Pick<Tenant, "plan" | "status" | "trial_until" | "paid_until" | "notes">>,
): Promise<void> {
  await db().from("ai_tenants").update(patch).eq("id", tenantId);
}

/** Все клиенты — для панели владельца студии (не для кабинета). */
export async function allTenants(): Promise<Tenant[]> {
  const { data } = await db().from("ai_tenants").select(TENANT_COLUMNS).order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map(asTenant);
}

/** Клиент по коду приглашения менеджера (/start join_<код>). */
export async function tenantByInvite(code: string): Promise<Tenant | null> {
  if (!/^[a-f0-9]{16,64}$/.test(code)) return null;
  const { data } = await db().from("ai_tenants").select(TENANT_COLUMNS).eq("invite_code", code).maybeSingle();
  return data ? asTenant(data) : null;
}

/* ── Люди клиента ─────────────────────────────────────────────────────── */

export type Member = {
  id: string;
  tenant_id: string;
  telegram_user_id: number;
  name: string;
  username: string | null;
  role: "owner" | "manager";
  notify: boolean;
};

const MEMBER_COLUMNS = "id, tenant_id, telegram_user_id, name, username, role, notify";

/** Чьи кабинеты открыты этому человеку в Telegram. */
export async function membershipsOf(telegramUserId: number): Promise<Array<Member & { tenant: Tenant }>> {
  const { data: rows } = await db().from("ai_members").select(MEMBER_COLUMNS).eq("telegram_user_id", telegramUserId);
  const out: Array<Member & { tenant: Tenant }> = [];
  for (const row of (rows ?? []) as Member[]) {
    const tenant = await tenantById(row.tenant_id);
    if (tenant) out.push({ ...row, tenant });
  }
  return out;
}

export async function members(tenantId: string): Promise<Member[]> {
  const { data } = await db().from("ai_members").select(MEMBER_COLUMNS).eq("tenant_id", tenantId).order("created_at");
  return (data ?? []) as Member[];
}

export async function memberOf(tenantId: string, telegramUserId: number): Promise<Member | null> {
  const { data } = await db()
    .from("ai_members")
    .select(MEMBER_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return (data as Member | null) ?? null;
}

export async function addMember(tenantId: string, person: TgPerson): Promise<void> {
  await db()
    .from("ai_members")
    .upsert(
      { tenant_id: tenantId, telegram_user_id: person.id, name: person.name.slice(0, 120), username: person.username, role: "manager" },
      { onConflict: "tenant_id,telegram_user_id", ignoreDuplicates: true },
    );
}

export async function setMemberNotify(tenantId: string, memberId: string, notify: boolean): Promise<void> {
  await db().from("ai_members").update({ notify }).eq("tenant_id", tenantId).eq("id", memberId);
}

/** Владельца не удалить: без него кабинет некому открыть. */
export async function removeMember(tenantId: string, memberId: string): Promise<void> {
  await db().from("ai_members").delete().eq("tenant_id", tenantId).eq("id", memberId).neq("role", "owner");
}

/* ── ИИ-сотрудник ─────────────────────────────────────────────────────── */

export type Employee = {
  id: string;
  tenant_id: string;
  role: "sales" | "smm" | "analyst";
  name: string;
  greeting: string;
  tone: "friendly" | "formal";
  model_tier: "standard" | "premium";
  enabled: boolean;
};

const EMPLOYEE_COLUMNS = "id, tenant_id, role, name, greeting, tone, model_tier, enabled";

export async function salesEmployee(tenantId: string): Promise<Employee | null> {
  const { data } = await db()
    .from("ai_employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("role", "sales")
    .maybeSingle();
  return (data as Employee | null) ?? null;
}

export async function updateEmployee(
  tenantId: string,
  patch: Partial<Pick<Employee, "name" | "greeting" | "tone" | "enabled">>,
): Promise<void> {
  await db().from("ai_employees").update(patch).eq("tenant_id", tenantId).eq("role", "sales");
}

/** Уровень модели меняет только панель студии: он следует из тарифа. */
export async function setEmployeeTier(tenantId: string, tier: Employee["model_tier"]): Promise<void> {
  await db().from("ai_employees").update({ model_tier: tier }).eq("tenant_id", tenantId);
}

/* ── База знаний ──────────────────────────────────────────────────────── */

export type Knowledge = {
  id: string;
  tenant_id: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  source: "text" | "site";
  source_url: string | null;
  position: number;
};

const KNOWLEDGE_COLUMNS = "id, tenant_id, kind, title, body, source, source_url, position";

export async function knowledge(tenantId: string): Promise<Knowledge[]> {
  const { data } = await db()
    .from("ai_knowledge")
    .select(KNOWLEDGE_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("position")
    .order("updated_at");
  return (data ?? []) as Knowledge[];
}

export type KnowledgeInput = { kind: KnowledgeKind; title: string; body: string };

export async function addKnowledge(
  tenantId: string,
  items: readonly KnowledgeInput[],
  source: { kind: "text" | "site"; url?: string | null } = { kind: "text" },
): Promise<void> {
  if (!items.length) return;
  const { count } = await db().from("ai_knowledge").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
  await db()
    .from("ai_knowledge")
    .insert(
      items.map((item, i) => ({
        tenant_id: tenantId,
        kind: item.kind,
        title: item.title.slice(0, 200),
        body: item.body.slice(0, 8000),
        source: source.kind,
        source_url: source.url ?? null,
        position: (count ?? 0) + i,
      })),
    );
}

export async function updateKnowledge(tenantId: string, id: string, item: KnowledgeInput): Promise<void> {
  await db()
    .from("ai_knowledge")
    .update({ kind: item.kind, title: item.title.slice(0, 200), body: item.body.slice(0, 8000), updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

export async function deleteKnowledge(tenantId: string, id: string): Promise<void> {
  await db().from("ai_knowledge").delete().eq("tenant_id", tenantId).eq("id", id);
}

/** Повторный разбор сайта заменяет прошлый, а написанное руками не трогает. */
export async function replaceSiteKnowledge(tenantId: string, items: readonly KnowledgeInput[], url: string): Promise<void> {
  await db().from("ai_knowledge").delete().eq("tenant_id", tenantId).eq("source", "site");
  await addKnowledge(tenantId, items, { kind: "site", url });
}

/* ── Каналы ───────────────────────────────────────────────────────────── */

export type ChannelKind = "tg_business" | "tg_bot" | "widget";

export type Channel = {
  id: string;
  tenant_id: string;
  kind: ChannelKind;
  status: "active" | "off" | "error";
  external_id: string | null;
  owner_user_id: number | null;
  title: string;
  widget_key: string | null;
  hook_secret: string | null;
  token_enc: string | null;
  can_reply: boolean;
  error: string | null;
  created_at: string;
};

const CHANNEL_COLUMNS =
  "id, tenant_id, kind, status, external_id, owner_user_id, title, widget_key, hook_secret, token_enc, can_reply, error, created_at";

export async function channels(tenantId: string): Promise<Channel[]> {
  const { data } = await db().from("ai_channels").select(CHANNEL_COLUMNS).eq("tenant_id", tenantId).order("created_at");
  return (data ?? []) as Channel[];
}

/** Канал Business по business_connection_id. */
export async function channelByExternal(kind: ChannelKind, externalId: string): Promise<Channel | null> {
  const { data } = await db()
    .from("ai_channels")
    .select(CHANNEL_COLUMNS)
    .eq("kind", kind)
    .eq("external_id", externalId)
    .maybeSingle();
  return (data as Channel | null) ?? null;
}

/** Канал виджета по публичному ключу. */
export async function channelByWidgetKey(key: string): Promise<Channel | null> {
  if (!/^[\w-]{16,64}$/.test(key)) return null;
  const { data } = await db().from("ai_channels").select(CHANNEL_COLUMNS).eq("widget_key", key).maybeSingle();
  return (data as Channel | null) ?? null;
}

/** Канал бота клиента по id из адреса вебхука — секрет сверяет вызывающий. */
export async function channelForHook(id: string): Promise<Channel | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db().from("ai_channels").select(CHANNEL_COLUMNS).eq("id", id).eq("kind", "tg_bot").maybeSingle();
  return (data as Channel | null) ?? null;
}

export async function saveBusinessChannel(
  tenantId: string,
  input: { connectionId: string; ownerUserId: number; title: string; canReply: boolean; enabled: boolean },
): Promise<void> {
  const row = {
    tenant_id: tenantId,
    kind: "tg_business",
    external_id: input.connectionId,
    owner_user_id: input.ownerUserId,
    title: input.title.slice(0, 120),
    can_reply: input.canReply,
    status: input.enabled ? "active" : "off",
    error: input.canReply ? null : "no_reply_right",
    updated_at: new Date().toISOString(),
  };
  const existing = await channelByExternal("tg_business", input.connectionId);
  if (existing && existing.tenant_id === tenantId) {
    await db().from("ai_channels").update(row).eq("tenant_id", tenantId).eq("id", existing.id);
  } else if (!existing) {
    await db().from("ai_channels").insert(row);
  }
}

export async function addBotChannel(
  tenantId: string,
  input: { botId: string; username: string; tokenEnc: string; hookSecret: string },
): Promise<Channel> {
  const existing = await channelByExternal("tg_bot", input.botId);
  if (existing && existing.tenant_id !== tenantId) throw new Error("bot_taken");
  const row = {
    tenant_id: tenantId,
    kind: "tg_bot",
    external_id: input.botId,
    title: `@${input.username}`,
    token_enc: input.tokenEnc,
    hook_secret: input.hookSecret,
    status: "active",
    error: null,
    updated_at: new Date().toISOString(),
  };
  const query = existing
    ? db().from("ai_channels").update(row).eq("tenant_id", tenantId).eq("id", existing.id)
    : db().from("ai_channels").insert(row);
  const { data, error } = await query.select(CHANNEL_COLUMNS).single();
  if (error || !data) throw new Error(`ai-staff: канал не сохранён — ${error?.message}`);
  return data as Channel;
}

export async function ensureWidgetChannel(tenantId: string): Promise<Channel> {
  const list = await channels(tenantId);
  const found = list.find((c) => c.kind === "widget");
  if (found) return found;
  const { data, error } = await db()
    .from("ai_channels")
    .insert({ tenant_id: tenantId, kind: "widget", widget_key: randomKey(18), title: "widget" })
    .select(CHANNEL_COLUMNS)
    .single();
  if (error || !data) throw new Error(`ai-staff: виджет не создан — ${error?.message}`);
  return data as Channel;
}

export async function setChannelStatus(tenantId: string, id: string, status: Channel["status"], error: string | null = null): Promise<void> {
  await db()
    .from("ai_channels")
    .update({ status, error, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

/* ── Разговоры ────────────────────────────────────────────────────────── */

export type ConversationKind = ChannelKind | "test";

export type Conversation = {
  id: string;
  tenant_id: string;
  channel_id: string | null;
  kind: ConversationKind;
  chat_key: string;
  customer_name: string;
  customer_handle: string | null;
  lang: string;
  mode: "ai" | "human";
  human_until: string | null;
  messages: Turn[];
  ai_replies: number;
  counted_month: string | null;
  lead_id: string | null;
  unanswered: number;
  first_reply_ms: number | null;
  off_hours: boolean;
  created_at: string;
  last_at: string;
};

const CONVERSATION_COLUMNS =
  "id, tenant_id, channel_id, kind, chat_key, customer_name, customer_handle, lang, mode, human_until, messages, ai_replies, counted_month, lead_id, unanswered, first_reply_ms, off_hours, created_at, last_at";

export async function openConversation(
  tenantId: string,
  input: { kind: ConversationKind; chatKey: string; channelId: string | null; customerName: string; customerHandle: string | null; lang: string },
): Promise<Conversation> {
  const { data: found } = await db()
    .from("ai_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("kind", input.kind)
    .eq("chat_key", input.chatKey)
    .maybeSingle();
  if (found) return found as Conversation;
  const { data, error } = await db()
    .from("ai_conversations")
    .upsert(
      {
        tenant_id: tenantId,
        kind: input.kind,
        chat_key: input.chatKey,
        channel_id: input.channelId,
        customer_name: input.customerName.slice(0, 120),
        customer_handle: input.customerHandle,
        lang: input.lang,
      },
      { onConflict: "tenant_id,kind,chat_key" },
    )
    .select(CONVERSATION_COLUMNS)
    .single();
  if (error || !data) throw new Error(`ai-staff: разговор не открыт — ${error?.message}`);
  return data as Conversation;
}

export type ConversationPatch = Partial<
  Pick<
    Conversation,
    | "messages"
    | "ai_replies"
    | "counted_month"
    | "lead_id"
    | "unanswered"
    | "first_reply_ms"
    | "off_hours"
    | "mode"
    | "human_until"
    | "lang"
    | "customer_name"
    | "customer_handle"
    | "last_at"
  >
>;

export async function saveConversation(tenantId: string, id: string, patch: ConversationPatch): Promise<void> {
  const { error } = await db().from("ai_conversations").update(patch).eq("tenant_id", tenantId).eq("id", id);
  if (error) console.error("ai-staff: разговор не сохранён", error.message);
}

export async function conversations(tenantId: string, limit = 100): Promise<Conversation[]> {
  const { data } = await db()
    .from("ai_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("tenant_id", tenantId)
    .neq("kind", "test")
    .order("last_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Conversation[];
}

export async function conversationById(tenantId: string, id: string): Promise<Conversation | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db().from("ai_conversations").select(CONVERSATION_COLUMNS).eq("tenant_id", tenantId).eq("id", id).maybeSingle();
  return (data as Conversation | null) ?? null;
}

export async function deleteConversation(tenantId: string, id: string): Promise<void> {
  await db().from("ai_conversations").delete().eq("tenant_id", tenantId).eq("id", id);
}

/** Тестовый разговор кабинета — начать заново. */
export async function resetTestConversation(tenantId: string, chatKey: string): Promise<void> {
  await db().from("ai_conversations").delete().eq("tenant_id", tenantId).eq("kind", "test").eq("chat_key", chatKey);
}

/** Диалогов в этом месяце: разговоры, где ИИ уже ответил в этом месяце. Проверка в кабинете не считается. */
export async function dialogsInMonth(tenantId: string, month: string): Promise<number> {
  const { count } = await db()
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("counted_month", month)
    .neq("kind", "test");
  return count ?? 0;
}

/* ── Заявки ───────────────────────────────────────────────────────────── */

export type Lead = {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  request_no: string;
  name: string;
  contact: string;
  need: string;
  budget: string;
  urgency: string;
  summary: string;
  reason: string;
  channel: string;
  status: "new" | "taken" | "won" | "lost";
  taken_by: string | null;
  taken_at: string | null;
  delivered: boolean;
  test: boolean;
  created_at: string;
};

const LEAD_COLUMNS =
  "id, tenant_id, conversation_id, request_no, name, contact, need, budget, urgency, summary, reason, channel, status, taken_by, taken_at, delivered, test, created_at";

export async function createLead(
  tenantId: string,
  input: Omit<Lead, "id" | "tenant_id" | "status" | "taken_by" | "taken_at" | "delivered" | "created_at">,
): Promise<Lead> {
  const { data, error } = await db()
    .from("ai_leads")
    .insert({ ...input, tenant_id: tenantId })
    .select(LEAD_COLUMNS)
    .single();
  if (error || !data) throw new Error(`ai-staff: заявка не сохранена — ${error?.message}`);
  return data as Lead;
}

export async function markLeadDelivered(tenantId: string, id: string): Promise<void> {
  await db().from("ai_leads").update({ delivered: true }).eq("tenant_id", tenantId).eq("id", id);
}

export async function leads(tenantId: string, limit = 200): Promise<Lead[]> {
  const { data } = await db()
    .from("ai_leads")
    .select(LEAD_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Lead[];
}

export async function leadById(tenantId: string, id: string): Promise<Lead | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db().from("ai_leads").select(LEAD_COLUMNS).eq("tenant_id", tenantId).eq("id", id).maybeSingle();
  return (data as Lead | null) ?? null;
}

export async function setLeadStatus(tenantId: string, id: string, status: Lead["status"], by: string | null): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "taken") Object.assign(patch, { taken_by: by, taken_at: new Date().toISOString() });
  await db().from("ai_leads").update(patch).eq("tenant_id", tenantId).eq("id", id);
}

export async function deleteLead(tenantId: string, id: string): Promise<void> {
  await db().from("ai_leads").delete().eq("tenant_id", tenantId).eq("id", id);
}

export async function leadsSince(tenantId: string, since: Date): Promise<Lead[]> {
  const { data } = await db()
    .from("ai_leads")
    .select(LEAD_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("test", false)
    .gte("created_at", since.toISOString());
  return (data ?? []) as Lead[];
}

export async function conversationsSince(tenantId: string, since: Date): Promise<Conversation[]> {
  const { data } = await db()
    .from("ai_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("tenant_id", tenantId)
    .neq("kind", "test")
    .gte("last_at", since.toISOString())
    .limit(2000);
  return (data ?? []) as Conversation[];
}

/* ── Расход и оплаты ──────────────────────────────────────────────────── */

/** Расход модели клиента с даты — по метке `saas-<id>` в model_usage. */
export async function usageSince(tenantId: string, since: Date): Promise<UsageRow[]> {
  const { data } = await db()
    .from("model_usage")
    .select("model, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens")
    .eq("site", usageSite(tenantId))
    .gte("at", since.toISOString())
    .limit(50_000);
  return (data ?? []) as UsageRow[];
}

export type Payment = {
  id: string;
  tenant_id: string;
  plan: string;
  months: number;
  amount_uzs: number;
  method: string;
  paid_until: string;
  created_at: string;
};

export async function addPayment(
  tenantId: string,
  input: { plan: PlanId; months: number; amountUzs: number; method: string; paidUntil: Date; staffId: string | null },
): Promise<void> {
  await db().from("ai_payments").insert({
    tenant_id: tenantId,
    plan: input.plan,
    months: input.months,
    amount_uzs: input.amountUzs,
    method: input.method,
    paid_until: input.paidUntil.toISOString(),
    staff_id: input.staffId,
  });
  await db().from("ai_tenants").update({ plan: input.plan, paid_until: input.paidUntil.toISOString() }).eq("id", tenantId);
}

export async function payments(tenantId: string): Promise<Payment[]> {
  const { data } = await db()
    .from("ai_payments")
    .select("id, tenant_id, plan, months, amount_uzs, method, paid_until, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Payment[];
}

/* ── Вход в кабинет ───────────────────────────────────────────────────── */

/** Одноразовая ссылка из бота: в базе только хеш, живёт 15 минут. */
export async function saveLoginToken(tokenHash: string, person: TgPerson, expiresAt: Date): Promise<void> {
  await db().from("ai_login_tokens").insert({
    token_hash: tokenHash,
    telegram_user_id: person.id,
    name: person.name.slice(0, 120),
    username: person.username,
    expires_at: expiresAt.toISOString(),
  });
}

/** Погасить ссылку: второй переход по ней уже не входит. */
export async function useLoginToken(tokenHash: string, now: Date): Promise<TgPerson | null> {
  const { data } = await db()
    .from("ai_login_tokens")
    .update({ used_at: now.toISOString() })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now.toISOString())
    .select("telegram_user_id, name, username")
    .maybeSingle();
  if (!data) return null;
  return { id: Number(data.telegram_user_id), name: String(data.name ?? ""), username: (data.username as string | null) ?? null };
}

export type CabinetSession = { telegramUserId: number; tenantId: string | null; staffId: string | null; expiresAt: string };

export async function saveSession(
  tokenHash: string,
  input: { telegramUserId: number; tenantId: string | null; staffId: string | null; expiresAt: Date },
): Promise<void> {
  await db().from("ai_sessions").insert({
    token_hash: tokenHash,
    telegram_user_id: input.telegramUserId,
    tenant_id: input.tenantId,
    staff_id: input.staffId,
    expires_at: input.expiresAt.toISOString(),
  });
}

export async function sessionByHash(tokenHash: string, now: Date): Promise<CabinetSession | null> {
  const { data } = await db()
    .from("ai_sessions")
    .select("telegram_user_id, tenant_id, staff_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", now.toISOString())
    .maybeSingle();
  if (!data) return null;
  return {
    telegramUserId: Number(data.telegram_user_id),
    tenantId: (data.tenant_id as string | null) ?? null,
    staffId: (data.staff_id as string | null) ?? null,
    expiresAt: String(data.expires_at),
  };
}

/** Какой кабинет открыт в сессии — у человека их может быть несколько. */
export async function setSessionTenant(tokenHash: string, tenantId: string): Promise<void> {
  await db().from("ai_sessions").update({ tenant_id: tenantId }).eq("token_hash", tokenHash);
}

export async function dropSession(tokenHash: string): Promise<void> {
  await db().from("ai_sessions").delete().eq("token_hash", tokenHash);
}

/* ── Настройки сервиса ────────────────────────────────────────────────── */

export async function setting<T = unknown>(key: string): Promise<T | null> {
  const client = serviceClient();
  if (!client) return null;
  const { data } = await client.from("ai_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? null;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await db().from("ai_settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

/* ── Счета и транзакции оплаты картой ─────────────────────────────────── */

export type InvoiceRow = {
  id: string;
  tenant_id: string;
  plan: PlanId;
  months: number;
  amount_uzs: number;
  provider: "payme" | "click" | null;
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  created_at: string;
};

const INVOICE_COLUMNS = "id, tenant_id, plan, months, amount_uzs, provider, status, paid_at, created_at";
const TX_COLUMNS = "id, provider, ext_id, invoice_id, amount_tiyin, state, create_time, perform_time, cancel_time, reason, provider_time";

export async function createInvoice(
  tenantId: string,
  input: { plan: PlanId; months: number; amountUzs: number; provider: "payme" | "click" },
): Promise<InvoiceRow> {
  const { data, error } = await db()
    .from("ai_invoices")
    .insert({ tenant_id: tenantId, plan: input.plan, months: input.months, amount_uzs: input.amountUzs, provider: input.provider })
    .select(INVOICE_COLUMNS)
    .single();
  if (error || !data) throw new Error(`ai-staff: счёт не создан — ${error?.message}`);
  return data as InvoiceRow;
}

export async function invoicesOf(tenantId: string): Promise<InvoiceRow[]> {
  const { data } = await db()
    .from("ai_invoices")
    .select(INVOICE_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as InvoiceRow[];
}

/** Счёт по id из запроса платёжной системы: клиента знает сам счёт. */
export async function invoiceForPayment(id: string): Promise<InvoiceRow | null> {
  const { data } = await db().from("ai_invoices").select(INVOICE_COLUMNS).eq("id", id).maybeSingle();
  return (data as InvoiceRow | null) ?? null;
}

/** Отметить счёт оплаченным — только если он ещё ждал оплаты. true — отметили мы. */
export async function claimInvoicePaid(id: string, provider: "payme" | "click"): Promise<boolean> {
  const { data } = await db()
    .from("ai_invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), provider })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  return Boolean(data?.length);
}

export async function payTx(provider: "payme" | "click", extId: string) {
  const { data } = await db().from("ai_pay_tx").select(TX_COLUMNS).eq("provider", provider).eq("ext_id", extId).maybeSingle();
  return data ? normalizeTx(data) : null;
}

export async function payTxById(id: number) {
  const { data } = await db().from("ai_pay_tx").select(TX_COLUMNS).eq("id", id).maybeSingle();
  return data ? normalizeTx(data) : null;
}

export async function openPayTx(provider: "payme" | "click", invoiceId: string) {
  const { data } = await db()
    .from("ai_pay_tx")
    .select(TX_COLUMNS)
    .eq("provider", provider)
    .eq("invoice_id", invoiceId)
    .eq("state", 1)
    .limit(1)
    .maybeSingle();
  return data ? normalizeTx(data) : null;
}

export async function insertPayTx(row: Record<string, unknown>) {
  const { data, error } = await db().from("ai_pay_tx").insert(row).select(TX_COLUMNS).single();
  if (error || !data) throw new Error(`ai-staff: транзакция не записана — ${error?.message}`);
  return normalizeTx(data);
}

export async function patchPayTx(id: number, patch: Record<string, unknown>): Promise<void> {
  await db().from("ai_pay_tx").update(patch).eq("id", id);
}

export async function payTxBetween(provider: "payme" | "click", from: number, to: number) {
  const { data } = await db()
    .from("ai_pay_tx")
    .select(TX_COLUMNS)
    .eq("provider", provider)
    .gte("create_time", from)
    .lte("create_time", to)
    .order("create_time")
    .limit(1000);
  return (data ?? []).map(normalizeTx);
}

/** bigint из PostgREST приходит числом или строкой — приводим к числу. */
function normalizeTx(row: Record<string, unknown>) {
  const n = (v: unknown) => Number(v ?? 0);
  return {
    id: n(row.id),
    provider: row.provider as "payme" | "click",
    ext_id: String(row.ext_id),
    invoice_id: String(row.invoice_id),
    amount_tiyin: n(row.amount_tiyin),
    state: n(row.state),
    create_time: n(row.create_time),
    perform_time: n(row.perform_time),
    cancel_time: n(row.cancel_time),
    reason: row.reason === null || row.reason === undefined ? null : n(row.reason),
    provider_time: n(row.provider_time),
  };
}

/* ── Ежедневный отчёт ─────────────────────────────────────────────────── */

export async function markReportSent(tenantId: string, day: string): Promise<void> {
  await db().from("ai_tenants").update({ report_sent_on: day }).eq("id", tenantId);
}
