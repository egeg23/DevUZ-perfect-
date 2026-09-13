import { record } from "@/lib/admin/audit";
import type { PaymentMoney } from "@/lib/admin/finance";
import type { Staff } from "@/lib/admin/session";
import {
  MAX_LINKS,
  MIN_PAYOUT_USD,
  canWithdrawNow,
  generateCode,
  isPerk,
  isProven,
  isReserved,
  normalizeCode,
  partnerAccrualOf,
  partnerBalanceOf,
  validCode,
  validRequisites,
  voidReason,
  type PartnerAccrual,
  type PartnerBalance,
  type PartnerProject,
  type Perk,
  type VoidReason,
} from "@/lib/partners/rules";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Партнёрская программа: чтение и записи.
 *
 * В базе только факты — кто партнёр, чьи ссылки, чей лид, чей проект, что
 * выплачено. Начисления считаются из проектов и платежей по правилам из
 * `rules.ts` и здесь не хранятся. Права проверяются здесь, а не на
 * странице: действие сервера — обычный POST.
 */

export type PartnerStatus = "active" | "blocked";

export type Partner = {
  id: string;
  created_at: string;
  telegram_user_id: number | null;
  username: string | null;
  name: string;
  code: string;
  requisites: string | null;
  status: PartnerStatus;
  percent_override: number | null;
  note: string | null;
};

export type PartnerLink = {
  id: string;
  created_at: string;
  partner_id: string;
  code: string;
  label: string | null;
  perk: Perk;
  clicks: number;
  leads: number;
  is_default: boolean;
};

export type PayoutStatus = "requested" | "paid" | "rejected";

export type PartnerPayout = {
  id: string;
  created_at: string;
  partner_id: string;
  amount_usd: number;
  requisites: string;
  status: PayoutStatus;
  note: string | null;
  paid_at: string | null;
  decided_by: string | null;
};

const PARTNER_COLUMNS =
  "id, created_at, telegram_user_id, username, name, code, requisites, status, percent_override, note";
const LINK_COLUMNS = "id, created_at, partner_id, code, label, perk, clicks, leads, is_default";
const PAYOUT_COLUMNS =
  "id, created_at, partner_id, amount_usd, requisites, status, note, paid_at, decided_by";
const PROJECT_COLUMNS =
  "id, title, client, owner_staff_id, kind, amount_usd, tax_percent, dev_cost_usd, stage, partner_id, partner_percent, partner_void_reason";

function shapePartner(row: Record<string, unknown>): Partner {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    telegram_user_id: row.telegram_user_id === null ? null : Number(row.telegram_user_id),
    username: (row.username as string | null) ?? null,
    name: row.name as string,
    code: row.code as string,
    requisites: (row.requisites as string | null) ?? null,
    status: row.status === "blocked" ? "blocked" : "active",
    percent_override: (row.percent_override as number | null) ?? null,
    note: (row.note as string | null) ?? null,
  };
}

function shapeLink(row: Record<string, unknown>): PartnerLink {
  const perk = String(row.perk ?? "none");
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    partner_id: row.partner_id as string,
    code: row.code as string,
    label: (row.label as string | null) ?? null,
    perk: isPerk(perk) ? perk : "none",
    clicks: Number(row.clicks ?? 0),
    leads: Number(row.leads ?? 0),
    is_default: Boolean(row.is_default),
  };
}

function shapePayout(row: Record<string, unknown>): PartnerPayout {
  const status = String(row.status);
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    partner_id: row.partner_id as string,
    amount_usd: row.amount_usd as number,
    requisites: row.requisites as string,
    status: status === "paid" ? "paid" : status === "rejected" ? "rejected" : "requested",
    note: (row.note as string | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    decided_by: (row.decided_by as string | null) ?? null,
  };
}

export type ProjectWithPartner = PartnerProject & {
  title: string;
  client: string | null;
};

function shapeProject(row: Record<string, unknown>): ProjectWithPartner {
  return {
    id: row.id as string,
    title: row.title as string,
    client: (row.client as string | null) ?? null,
    owner_staff_id: (row.owner_staff_id as string | null) ?? null,
    kind: row.kind === "upsell" ? "upsell" : "new",
    amount_usd: (row.amount_usd as number | null) ?? null,
    tax_percent: (row.tax_percent as number | null) ?? 0,
    dev_cost_usd: (row.dev_cost_usd as number | null) ?? null,
    stage: row.stage as string,
    partner_id: (row.partner_id as string | null) ?? null,
    partner_percent: (row.partner_percent as number | null) ?? null,
    partner_void_reason: (row.partner_void_reason as string | null) ?? null,
  };
}

/* ── Чтение ─────────────────────────────────────────────────────────────── */

export async function partnerByTelegram(telegramUserId: number): Promise<Partner | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("partners")
    .select(PARTNER_COLUMNS)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return data ? shapePartner(data as Record<string, unknown>) : null;
}

export async function partnerById(id: string): Promise<Partner | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("partners").select(PARTNER_COLUMNS).eq("id", id).maybeSingle();
  return data ? shapePartner(data as Record<string, unknown>) : null;
}

export async function listPartners(): Promise<Partner[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("partners")
    .select(PARTNER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("partners: не прочитал партнёров", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapePartner(row as Record<string, unknown>));
}

export async function partnersById(ids: readonly string[]): Promise<Map<string, Partner>> {
  const out = new Map<string, Partner>();
  const db = serviceClient();
  if (!db || !ids.length) return out;
  const { data } = await db.from("partners").select(PARTNER_COLUMNS).in("id", [...ids]);
  for (const row of data ?? []) {
    const p = shapePartner(row as Record<string, unknown>);
    out.set(p.id, p);
  }
  return out;
}

export async function linksOf(partnerIds: readonly string[]): Promise<PartnerLink[]> {
  const db = serviceClient();
  if (!db || !partnerIds.length) return [];
  const { data, error } = await db
    .from("partner_links")
    .select(LINK_COLUMNS)
    .in("partner_id", [...partnerIds])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("partners: не прочитал ссылки", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapeLink(row as Record<string, unknown>));
}

/**
 * Код → партнёр и ссылка. Сначала ссылки (у них свои коды), потом основной
 * код партнёра — у него ссылка «основная». Ничего не нашлось — null: код в
 * адресе может быть чем угодно.
 */
export async function resolveCode(
  raw: string,
): Promise<{ partner: Partner; link: PartnerLink | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const code = normalizeCode(raw);
  if (!code) return null;

  const { data: linkRow } = await db
    .from("partner_links")
    .select(LINK_COLUMNS)
    .eq("code", code)
    .maybeSingle();
  if (linkRow) {
    const link = shapeLink(linkRow as Record<string, unknown>);
    const partner = await partnerById(link.partner_id);
    return partner ? { partner, link } : null;
  }

  const { data: partnerRow } = await db
    .from("partners")
    .select(PARTNER_COLUMNS)
    .eq("code", code)
    .maybeSingle();
  if (!partnerRow) return null;
  const partner = shapePartner(partnerRow as Record<string, unknown>);
  const links = await linksOf([partner.id]);
  return { partner, link: links.find((l) => l.is_default) ?? null };
}

export async function projectsOfPartners(partnerIds: readonly string[]): Promise<ProjectWithPartner[]> {
  const db = serviceClient();
  if (!db || !partnerIds.length) return [];
  const { data, error } = await db
    .from("projects")
    .select(PROJECT_COLUMNS)
    .in("partner_id", [...partnerIds])
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("partners: не прочитал проекты партнёров", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapeProject(row as Record<string, unknown>));
}

async function paymentsOf(projectIds: readonly string[]): Promise<PaymentMoney[]> {
  const db = serviceClient();
  if (!db || !projectIds.length) return [];
  const { data } = await db
    .from("project_payments")
    .select("project_id, amount_usd")
    .in("project_id", [...projectIds])
    .limit(5000);
  return (data ?? []).map((row) => ({
    project_id: row.project_id as string,
    amount_usd: row.amount_usd as number,
  }));
}

export async function payoutsOf(
  partnerIds: readonly string[] | "all",
  status?: PayoutStatus,
): Promise<PartnerPayout[]> {
  const db = serviceClient();
  if (!db) return [];
  if (partnerIds !== "all" && !partnerIds.length) return [];
  let query = db.from("partner_payouts").select(PAYOUT_COLUMNS).order("created_at", { ascending: false });
  if (partnerIds !== "all") query = query.in("partner_id", [...partnerIds]);
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(2000);
  if (error) {
    console.error("partners: не прочитал выплаты", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapePayout(row as Record<string, unknown>));
}

export async function leadCounts(partnerIds: readonly string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const db = serviceClient();
  if (!db || !partnerIds.length) return out;
  const { data } = await db
    .from("leads")
    .select("partner_id")
    .in("partner_id", [...partnerIds])
    .is("partner_void_reason", null)
    .limit(5000);
  for (const row of data ?? []) {
    const id = row.partner_id as string;
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

/* ── Сводка по партнёрам: начисления, ступень, баланс ───────────────────── */

export type PartnerSummary = {
  partner: Partner;
  projects: ProjectWithPartner[];
  accruals: PartnerAccrual[];
  balance: PartnerBalance;
  /** Оплаченных целиком проектов по приведённым клиентам. */
  paidProjects: number;
  proven: boolean;
  leads: number;
  links: PartnerLink[];
  payouts: PartnerPayout[];
};

/**
 * Всё по партнёрам разом — для страницы партнёров и для ответа в боте.
 * Ступень считается по всем проектам партнёра: 25 % открываются за
 * результат, и результат — это оплаченные проекты, а не регистрации.
 */
export async function summarize(partners: Partner[]): Promise<PartnerSummary[]> {
  const ids = partners.map((p) => p.id);
  const [projects, links, payouts, leads] = await Promise.all([
    projectsOfPartners(ids),
    linksOf(ids),
    payoutsOf(ids),
    leadCounts(ids),
  ]);
  const payments = await paymentsOf(projects.map((p) => p.id));

  return partners.map((partner) => {
    const mine = projects.filter((p) => p.partner_id === partner.id);
    // Первый проход — сколько оплачено, чтобы понять ступень; второй —
    // начисления по ставке этой ступени.
    const paidProjects = mine
      .map((p) => partnerAccrualOf(p, payments, partner, false))
      .filter((a) => a && a.state === "earned").length;
    const proven = isProven(paidProjects);
    const accruals = mine
      .map((p) => partnerAccrualOf(p, payments, partner, proven))
      .filter((a): a is PartnerAccrual => a !== null);
    const own = payouts.filter((po) => po.partner_id === partner.id);

    return {
      partner,
      projects: mine,
      accruals,
      balance: partnerBalanceOf(accruals, own),
      paidProjects,
      proven,
      leads: leads.get(partner.id) ?? 0,
      links: links.filter((l) => l.partner_id === partner.id),
      payouts: own,
    };
  });
}

/* ── Партнёр и ссылки ───────────────────────────────────────────────────── */

export type TelegramIdentity = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function displayName(from: TelegramIdentity): string {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
  return (name || (from.username ? `@${from.username}` : `id ${from.id}`)).slice(0, 120);
}

async function freeCode(db: NonNullable<ReturnType<typeof serviceClient>>): Promise<string | null> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateCode();
    if (isReserved(code)) continue;
    const [{ data: p }, { data: l }] = await Promise.all([
      db.from("partners").select("id").eq("code", code).maybeSingle(),
      db.from("partner_links").select("id").eq("code", code).maybeSingle(),
    ]);
    if (!p && !l) return code;
  }
  return null;
}

/**
 * Партнёр по Telegram: есть — вернуть, нет — завести с основной ссылкой.
 * Заводится сам, из бота: программа открыта всем, регистрация — это и есть
 * команда /ref. Если владелец завёл человека руками без Telegram, а тот
 * потом написал боту — записи не сливаются: у ручной нет id, чтобы узнать.
 */
export async function ensurePartner(from: TelegramIdentity): Promise<Partner | null> {
  const db = serviceClient();
  if (!db) return null;

  const existing = await partnerByTelegram(from.id);
  if (existing) {
    // Имя и username могли смениться — держим свежими, это не факт о деньгах.
    const patch: Record<string, unknown> = {};
    const name = displayName(from);
    if (name !== existing.name) patch.name = name;
    if ((from.username ?? null) !== existing.username) patch.username = from.username ?? null;
    if (Object.keys(patch).length) await db.from("partners").update(patch).eq("id", existing.id);
    return { ...existing, ...patch } as Partner;
  }

  const code = await freeCode(db);
  if (!code) return null;

  const { data, error } = await db
    .from("partners")
    .insert({
      telegram_user_id: from.id,
      username: from.username ?? null,
      name: displayName(from),
      code,
    })
    .select(PARTNER_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    console.error("partners: не завёл партнёра", error?.message);
    return null;
  }
  const partner = shapePartner(data as Record<string, unknown>);

  await db.from("partner_links").insert({
    partner_id: partner.id,
    code,
    label: "Основная ссылка",
    is_default: true,
  });

  await record("partner.created", {
    targetType: "partner",
    targetId: partner.id,
    meta: { via: "bot", code },
  });
  return partner;
}

export type PartnerOp<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { value?: undefined } : { value: T }))
  | { ok: false; reason: string };

/** Партнёр, заведённый владельцем руками — блогер, знакомый, агентство. */
export async function createPartner(
  fields: { name: string; telegramUserId: number | null; code: string | null; note: string | null },
  admin: Staff,
  ip: string,
): Promise<{ ok: true; partner: Partner } | { ok: false; reason: "offline" | "invalid" | "taken" | "failed" }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const name = fields.name.trim().slice(0, 120);
  if (!name) return { ok: false, reason: "invalid" };

  let code: string | null;
  if (fields.code) {
    code = normalizeCode(fields.code);
    if (!validCode(code)) return { ok: false, reason: "invalid" };
  } else {
    code = await freeCode(db);
    if (!code) return { ok: false, reason: "failed" };
  }

  const { data, error } = await db
    .from("partners")
    .insert({
      telegram_user_id: fields.telegramUserId,
      name,
      code,
      note: fields.note?.trim().slice(0, 1000) || null,
    })
    .select(PARTNER_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, reason: "taken" };
    console.error("partners: не завёл партнёра", error?.message);
    return { ok: false, reason: "failed" };
  }
  const partner = shapePartner(data as Record<string, unknown>);

  await db.from("partner_links").insert({ partner_id: partner.id, code, label: "Основная ссылка", is_default: true });

  await record("partner.created", {
    actorStaffId: admin.id,
    targetType: "partner",
    targetId: partner.id,
    ip,
    meta: { via: "panel", code },
  });
  return { ok: true, partner };
}

export type LinkFailure = "offline" | "invalid" | "reserved" | "taken" | "limit" | "failed";

export async function createLink(
  partner: Partner,
  rawCode: string,
  label: string | null,
  perk: Perk,
): Promise<{ ok: true; link: PartnerLink } | { ok: false; reason: LinkFailure }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const code = normalizeCode(rawCode);
  if (isReserved(code)) return { ok: false, reason: "reserved" };
  if (!validCode(code)) return { ok: false, reason: "invalid" };

  const { count } = await db
    .from("partner_links")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", partner.id);
  if ((count ?? 0) >= MAX_LINKS) return { ok: false, reason: "limit" };

  const { data: clash } = await db.from("partners").select("id").eq("code", code).maybeSingle();
  if (clash) return { ok: false, reason: "taken" };

  const { data, error } = await db
    .from("partner_links")
    .insert({ partner_id: partner.id, code, label: label?.trim().slice(0, 80) || null, perk })
    .select(LINK_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, reason: "taken" };
    return { ok: false, reason: "failed" };
  }
  const link = shapeLink(data as Record<string, unknown>);

  await record("partner.link_created", {
    targetType: "partner",
    targetId: partner.id,
    meta: { code, perk, label: link.label },
  });
  return { ok: true, link };
}

/** Клик по ссылке — счётчик ради статистики партнёра, не ради денег. */
export async function countClick(rawCode: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const resolved = await resolveCode(rawCode);
  if (!resolved?.link) return false;
  const { error } = await db
    .from("partner_links")
    .update({ clicks: resolved.link.clicks + 1 })
    .eq("id", resolved.link.id);
  return !error;
}

/* ── Касания в боте ─────────────────────────────────────────────────────── */

export async function touchChat(chatId: number, code: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("partner_touches")
    .upsert({ chat_id: chatId, code, seen_at: new Date().toISOString() }, { onConflict: "chat_id" });
}

export async function touchFor(chatId: number): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("partner_touches").select("code").eq("chat_id", chatId).maybeSingle();
  return (data?.code as string | undefined) ?? null;
}

async function clearTouch(chatId: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("partner_touches").delete().eq("chat_id", chatId);
}

/* ── Привязка лида ──────────────────────────────────────────────────────── */

export type Attribution = {
  partner: Partner;
  link: PartnerLink | null;
  reason: VoidReason | null;
};

/**
 * Был ли этот клиент у студии до касания: лид с тем же контактом или
 * компанией, проект с тем же клиентом. Пустые контакт и компания ничего
 * не доказывают — тогда считаем новым.
 */
async function existingClient(
  leadId: string,
  handle: string | null,
  company: string | null,
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const h = (handle ?? "").trim();
  const c = (company ?? "").trim();

  if (h) {
    const { count } = await db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .neq("id", leadId)
      .ilike("contact_handle", h);
    if ((count ?? 0) > 0) return true;
  }
  if (c) {
    const [{ count: leads }, { count: projects }] = await Promise.all([
      db.from("leads").select("id", { count: "exact", head: true }).neq("id", leadId).ilike("company", c),
      db.from("projects").select("id", { count: "exact", head: true }).ilike("client", c),
    ]);
    if ((leads ?? 0) > 0 || (projects ?? 0) > 0) return true;
  }
  return false;
}

/**
 * Записать на лид, чей он. Привязка записывается всегда, даже когда не
 * засчитана: с причиной — чтобы владелец видел, что было касание и почему
 * денег по нему нет. Счётчик ссылки растёт только по засчитанным.
 */
export async function attributeLead(
  leadId: string,
  rawCode: string,
  ctx: {
    telegramId?: number | null;
    chatId?: number | null;
    contactHandle: string | null;
    company: string | null;
  },
): Promise<Attribution | null> {
  const db = serviceClient();
  if (!db) return null;

  const resolved = await resolveCode(rawCode);
  if (!resolved) {
    await db.from("leads").update({ partner_code: normalizeCode(rawCode).slice(0, 24) }).eq("id", leadId);
    return null;
  }
  const { partner, link } = resolved;

  const reason = voidReason({
    partnerStatus: partner.status,
    partnerTelegramId: partner.telegram_user_id,
    partnerUsername: partner.username,
    leadTelegramId: ctx.telegramId ?? null,
    leadHandle: ctx.contactHandle,
    existingClient: await existingClient(leadId, ctx.contactHandle, ctx.company),
  });

  const { error } = await db
    .from("leads")
    .update({
      partner_id: partner.id,
      partner_link_id: link?.id ?? null,
      partner_code: link?.code ?? partner.code,
      partner_void_reason: reason,
    })
    .eq("id", leadId);
  if (error) {
    console.error("partners: не привязал лид", error.message);
    return null;
  }

  if (!reason && link) {
    await db.from("partner_links").update({ leads: link.leads + 1 }).eq("id", link.id);
  }
  if (ctx.chatId) await clearTouch(ctx.chatId);

  return { partner, link, reason };
}

/* ── Выплаты ────────────────────────────────────────────────────────────── */

export type PayoutFailure = "offline" | "window" | "requisites" | "pending" | "min" | "failed";

/**
 * Заявка на выплату — всё доступное разом. Окно — с первого рабочего дня
 * месяца; одна открытая заявка за раз: вторая поверх первой означала бы,
 * что одни и те же деньги просят дважды.
 */
export async function requestPayout(
  partner: Partner,
  rawRequisites: string | null,
  now: Date = new Date(),
): Promise<{ ok: true; payout: PartnerPayout; balance: PartnerBalance } | { ok: false; reason: PayoutFailure; balance?: PartnerBalance }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const requisites = (rawRequisites ?? partner.requisites ?? "").trim();
  if (!validRequisites(requisites)) return { ok: false, reason: "requisites" };

  const [summary] = await summarize([partner]);
  const balance = summary.balance;
  if (!canWithdrawNow(now)) return { ok: false, reason: "window", balance };
  if (summary.payouts.some((p) => p.status === "requested")) return { ok: false, reason: "pending", balance };
  if (balance.available < MIN_PAYOUT_USD) return { ok: false, reason: "min", balance };

  const { data, error } = await db
    .from("partner_payouts")
    .insert({ partner_id: partner.id, amount_usd: balance.available, requisites })
    .select(PAYOUT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: "failed", balance };

  if (requisites !== partner.requisites) {
    await db.from("partners").update({ requisites }).eq("id", partner.id);
  }

  await record("partner.payout_requested", {
    targetType: "partner",
    targetId: partner.id,
    meta: { payout_id: data.id, amount_usd: balance.available },
  });
  return { ok: true, payout: shapePayout(data as Record<string, unknown>), balance };
}

/** Владелец решил: выплачено или отклонено. Отклонённая возвращает сумму в доступное. */
export async function decidePayout(
  payoutId: string,
  status: "paid" | "rejected",
  note: string | null,
  admin: Staff,
  ip: string,
): Promise<{ ok: true; payout: PartnerPayout } | { ok: false; reason: "offline" | "forbidden" | "gone" | "failed" }> {
  if (admin.role !== "admin") return { ok: false, reason: "forbidden" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  // Решение записывается только поверх открытой заявки: два клика по одной
  // кнопке не должны дать два решения.
  const { data, error } = await db
    .from("partner_payouts")
    .update({
      status,
      note: note?.trim().slice(0, 300) || null,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      decided_by: admin.id,
    })
    .eq("id", payoutId)
    .eq("status", "requested")
    .select(PAYOUT_COLUMNS)
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };
  const payout = shapePayout(data as Record<string, unknown>);

  await record("partner.payout_decided", {
    actorStaffId: admin.id,
    targetType: "partner",
    targetId: payout.partner_id,
    ip,
    meta: { payout_id: payoutId, status, amount_usd: payout.amount_usd },
  });
  return { ok: true, payout };
}

/* ── Правки владельца ───────────────────────────────────────────────────── */

export async function updatePartner(
  partnerId: string,
  fields: { status?: PartnerStatus; percentOverride?: number | null; note?: string | null; requisites?: string | null },
  admin: Staff,
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: "offline" | "forbidden" | "gone" | "invalid" | "failed" }> {
  if (admin.role !== "admin") return { ok: false, reason: "forbidden" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const patch: Record<string, unknown> = {};
  if (fields.status !== undefined) patch.status = fields.status;
  if (fields.percentOverride !== undefined) {
    const p = fields.percentOverride;
    if (p !== null && (!Number.isInteger(p) || p < 0 || p > 100)) return { ok: false, reason: "invalid" };
    patch.percent_override = p;
  }
  if (fields.note !== undefined) patch.note = fields.note?.trim().slice(0, 1000) || null;
  if (fields.requisites !== undefined) patch.requisites = fields.requisites?.trim().slice(0, 200) || null;
  if (!Object.keys(patch).length) return { ok: true };

  const { data, error } = await db.from("partners").update(patch).eq("id", partnerId).select("id").maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };

  await record("partner.updated", {
    actorStaffId: admin.id,
    targetType: "partner",
    targetId: partnerId,
    ip,
    meta: { fields: Object.keys(patch) },
  });
  return { ok: true };
}

/**
 * Партнёр у проекта: кто привёл клиента, процент по этому проекту и
 * причина аннулирования. Всё — владелец: это его деньги.
 */
export async function setProjectPartner(
  projectId: string,
  fields: { partnerId: string | null; percent: number | null; voidReason: string | null },
  admin: Staff,
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: "offline" | "forbidden" | "gone" | "invalid" | "failed" }> {
  if (admin.role !== "admin") return { ok: false, reason: "forbidden" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  if (fields.percent !== null && (!Number.isInteger(fields.percent) || fields.percent < 0 || fields.percent > 100)) {
    return { ok: false, reason: "invalid" };
  }
  if (fields.partnerId) {
    const partner = await partnerById(fields.partnerId);
    if (!partner) return { ok: false, reason: "invalid" };
  }

  const { data: before } = await db
    .from("projects")
    .select("id, partner_id, partner_percent, partner_void_reason")
    .eq("id", projectId)
    .maybeSingle();
  if (!before) return { ok: false, reason: "gone" };

  const patch = {
    partner_id: fields.partnerId,
    partner_percent: fields.partnerId ? fields.percent : null,
    partner_void_reason: fields.partnerId ? fields.voidReason?.trim().slice(0, 64) || null : null,
  };
  const { error } = await db.from("projects").update(patch).eq("id", projectId);
  if (error) return { ok: false, reason: "failed" };

  await record("project.partner_set", {
    actorStaffId: admin.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: { from: before, to: patch },
  });
  return { ok: true };
}

/* ── Уведомления партнёру ───────────────────────────────────────────────── */

/** Партнёру без Telegram написать некуда — молча. */
export async function notifyPartner(partner: Partner, text: string): Promise<void> {
  if (partner.telegram_user_id === null) return;
  try {
    await sendMessage(partner.telegram_user_id, text);
  } catch (error) {
    console.error("partners: не уведомил партнёра", error);
  }
}
