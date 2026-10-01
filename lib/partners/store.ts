import { createHash } from "node:crypto";

import { record } from "@/lib/admin/audit";
import type { PaymentMoney } from "@/lib/admin/finance";
import type { Staff } from "@/lib/admin/session";
import {
  MAX_LINKS,
  MIN_PAYOUT_USD,
  MODEL_SWITCH_DAYS,
  REF_TTL_DAYS,
  canWithdrawNow,
  generateCode,
  generateSlug,
  agencyCounts,
  agencyMatches,
  autoPayoutDue,
  clientCounts,
  clientFieldsProblem,
  hostKey,
  MAX_CLIENTS_PER_MONTH,
  normalizeInn,
  sameCompany,
  tashkentMonth,
  companyKey,
  contactKey,
  DEFAULT_MODEL,
  canSwitchModel,
  isPayoutModel,
  isPerk,
  isTarget,
  isReserved,
  normalizeCode,
  partnerAccrualOf,
  partnerBalanceOf,
  validCode,
  validRequisites,
  voidReason,
  SLUG_RE,
  type PartnerAccrual,
  type PayoutModel,
  type PartnerBalance,
  type PartnerProject,
  type ClientFailure,
  type CompanyFacts,
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
  /** Модель дохода: от прибыли или с оборота. Меняется раз в неделю. */
  payout_model: PayoutModel;
  model_changed_at: string | null;
};

export type PartnerLink = {
  id: string;
  created_at: string;
  partner_id: string;
  code: string;
  /** Короткая ссылка: devuz.studio/r/<slug>. */
  slug: string;
  /** Куда ведёт: путь на сайте или «bot» (lib/partners/rules.ts, TARGETS). */
  target: string;
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
  /** Автовыплата с оборота за этот проект; пусто — заявка партнёра на всё доступное. */
  project_id: string | null;
};

const PARTNER_COLUMNS =
  "id, created_at, telegram_user_id, username, name, code, requisites, status, percent_override, note, payout_model, model_changed_at";
const LINK_COLUMNS = "id, created_at, partner_id, code, slug, target, label, perk, clicks, leads, is_default";
const PAYOUT_COLUMNS =
  "id, created_at, partner_id, amount_usd, requisites, status, note, paid_at, decided_by, project_id";
const PROJECT_COLUMNS =
  "id, title, client, owner_staff_id, kind, amount_usd, tax_percent, dev_cost_usd, stage, partner_id, partner_percent, partner_void_reason, partner_model, partner_agency_id, partner_client_id";

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
    payout_model: isPayoutModel(row.payout_model) ? row.payout_model : DEFAULT_MODEL,
    model_changed_at: (row.model_changed_at as string | null) ?? null,
  };
}

function shapeLink(row: Record<string, unknown>): PartnerLink {
  const perk = String(row.perk ?? "none");
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    partner_id: row.partner_id as string,
    code: row.code as string,
    slug: String(row.slug ?? ""),
    target: String(row.target ?? "/"),
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
    project_id: (row.project_id as string | null) ?? null,
  };
}

export type ProjectWithPartner = PartnerProject & {
  title: string;
  client: string | null;
  partner_agency_id: string | null;
  partner_client_id: string | null;
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
    partner_model: (row.partner_model as string | null) ?? null,
    partner_agency_id: (row.partner_agency_id as string | null) ?? null,
    partner_client_id: (row.partner_client_id as string | null) ?? null,
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
  leads: number;
  links: PartnerLink[];
  payouts: PartnerPayout[];
};

/**
 * Всё по партнёрам разом — для страницы партнёров, кабинета и ответа в
 * боте.
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
    // Ставка у каждого проекта своя — по его сумме (rules.ts, PARTNER_TIERS).
    const accruals = mine
      .map((p) => partnerAccrualOf(p, payments, partner))
      .filter((a): a is PartnerAccrual => a !== null);
    const paidProjects = accruals.filter((a) => a.state === "earned").length;
    const own = payouts.filter((po) => po.partner_id === partner.id);

    return {
      partner,
      projects: mine,
      accruals,
      balance: partnerBalanceOf(accruals, own),
      paidProjects,
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

/** Свободный slug короткой ссылки. Совпадение из 27 млрд — почти невероятно, но проверяем. */
async function freeSlug(db: NonNullable<ReturnType<typeof serviceClient>>): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = generateSlug();
    const { data } = await db.from("partner_links").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
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

  const slug = await freeSlug(db);
  await db.from("partner_links").insert({
    partner_id: partner.id,
    code,
    ...(slug ? { slug } : {}),
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

  const slug = await freeSlug(db);
  await db
    .from("partner_links")
    .insert({ partner_id: partner.id, code, ...(slug ? { slug } : {}), label: "Основная ссылка", is_default: true });

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
  target: string = "/",
): Promise<{ ok: true; link: PartnerLink } | { ok: false; reason: LinkFailure }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  // Код необязателен: в кабинете ссылку заводят названием канала, а код —
  // внутренняя метка, которую человек и не увидит в короткой ссылке.
  if (!rawCode.trim()) {
    const free = await freeCode(db);
    if (!free) return { ok: false, reason: "failed" };
    rawCode = free;
  }
  if (!isTarget(target)) return { ok: false, reason: "invalid" };
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

  const slug = await freeSlug(db);
  if (!slug) return { ok: false, reason: "failed" };

  const { data, error } = await db
    .from("partner_links")
    .insert({ partner_id: partner.id, code, slug, target, label: label?.trim().slice(0, 80) || null, perk })
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
    meta: { code, perk, label: link.label, target, slug },
  });
  return { ok: true, link };
}

/** Ссылка по короткому адресу. Регистр не важен: адрес переписывают руками. */
export async function linkBySlug(rawSlug: string): Promise<{ partner: Partner; link: PartnerLink } | null> {
  const db = serviceClient();
  if (!db) return null;
  const slug = rawSlug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return null;
  const { data } = await db.from("partner_links").select(LINK_COLUMNS).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const link = shapeLink(data as Record<string, unknown>);
  const partner = await partnerById(link.partner_id);
  return partner ? { partner, link } : null;
}

export type ClickVia = "short" | "site" | "bot";

/**
 * Переход по ссылке — строка в журнале и +1 на ссылке.
 *
 * Один посетитель в день — один переход: `visitor` — хеш адреса, браузера
 * и дня, и повторная вставка упирается в уникальный индекс. Счётчик на
 * ссылке растёт только когда строка легла, поэтому перезагрузки и повторные
 * открытия его не надувают. Это статистика партнёра, а не деньги: деньги
 * идут от заявки и проекта.
 */
export async function recordClick(
  partner: Partner,
  link: PartnerLink,
  via: ClickVia,
  visitorSeed: string,
  refererHost: string | null,
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const visitor = createHash("sha256").update(visitorSeed).digest("hex").slice(0, 32);

  const { error } = await db.from("partner_clicks").insert({
    partner_id: partner.id,
    link_id: link.id,
    via,
    visitor,
    referer_host: refererHost?.slice(0, 120) ?? null,
  });
  if (error) return false; // 23505 — этот человек сегодня уже переходил

  // Счётчик пересчитывается из журнала, а не «+1 к прочитанному»: два
  // перехода в одну секунду иначе записали бы один.
  const { count } = await db
    .from("partner_clicks")
    .select("id", { count: "exact", head: true })
    .eq("link_id", link.id);
  if (count !== null) await db.from("partner_links").update({ clicks: count }).eq("id", link.id);
  return true;
}

/** Клик по ссылке с сайта (?ref=) или из бота — по коду. */
export async function countClick(
  rawCode: string,
  via: ClickVia = "site",
  seed: string | null = null,
  refererHost: string | null = null,
): Promise<boolean> {
  const resolved = await resolveCode(rawCode);
  if (!resolved?.link) return false;
  return recordClick(resolved.partner, resolved.link, via, seed ?? `${Date.now()}|${Math.random()}`, refererHost);
}

/* ── Кабинет партнёра ───────────────────────────────────────────────────── */

/** Где сейчас приведённый клиент — от заявки до оплаты. */
export type ReferralStage = "lead" | "work" | "contract" | "signed" | "paid" | "lost";

export type Referral = {
  leadId: string;
  createdAt: string;
  /** Компания или «клиент»: контактов партнёру не показываем. */
  who: string | null;
  linkLabel: string | null;
  /** Заказ агентства партнёра — его название. */
  agencyName: string | null;
  /** Заказ клиента, закреплённого партнёром вручную, — название из закрепления. */
  clientName: string | null;
  stage: ReferralStage;
  voidReason: string | null;
  /** Начисление по проекту, если он есть. */
  accrual: PartnerAccrual | null;
};

/**
 * Клиенты партнёра — по одному на лид, с этапом и начислением.
 *
 * Этап — самое дальнее, до чего дошло: договор подписан → «подписан», и так
 * далее. Партнёр видит путь своего клиента до денег, а не только «пришла
 * заявка» и через три месяца «начислено».
 */
export async function referralsOf(summary: PartnerSummary): Promise<Referral[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data: leads } = await db
    .from("leads")
    .select("id, created_at, company, status, partner_link_id, partner_void_reason, partner_agency_id, partner_client_id")
    .eq("partner_id", summary.partner.id)
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (leads ?? []) as Record<string, unknown>[];
  if (!rows.length) return [];

  const leadIds = rows.map((r) => String(r.id));
  const { data: projects } = await db
    .from("projects")
    .select("id, lead_id")
    .in("lead_id", leadIds);
  const projectByLead = new Map<string, string>();
  for (const p of (projects ?? []) as { id: string; lead_id: string | null }[]) {
    if (p.lead_id && !projectByLead.has(p.lead_id)) projectByLead.set(p.lead_id, p.id);
  }

  const projectIds = [...projectByLead.values()];
  const { data: contracts } = projectIds.length
    ? await db.from("contracts").select("project_id, status").in("project_id", projectIds)
    : { data: [] };
  const contractState = new Map<string, "contract" | "signed">();
  for (const c of (contracts ?? []) as { project_id: string; status: string }[]) {
    if (c.status === "signed") contractState.set(c.project_id, "signed");
    else if (c.status !== "void" && contractState.get(c.project_id) !== "signed") contractState.set(c.project_id, "contract");
  }

  const accrualByProject = new Map(summary.accruals.map((a) => [a.project_id, a]));
  const agencyName = new Map((await agenciesOf([summary.partner.id])).map((a) => [a.id, a.name]));
  const clientName = new Map((await clientsOf([summary.partner.id])).map((c) => [c.id, c.name]));
  const labelByLink = new Map(summary.links.map((l) => [l.id, l.is_default ? null : l.label]));

  return rows.map((r) => {
    const projectId = projectByLead.get(String(r.id)) ?? null;
    const accrual = projectId ? (accrualByProject.get(projectId) ?? null) : null;
    const status = String(r.status);
    let stage: ReferralStage = status === "new" ? "lead" : "work";
    if (status === "lost" || status === "dropped") stage = "lost";
    if (projectId) {
      stage = contractState.get(projectId) ?? "work";
      if (accrual?.state === "earned") stage = "paid";
    }
    return {
      leadId: String(r.id),
      createdAt: String(r.created_at),
      who: (r.company as string | null)?.trim() || null,
      linkLabel: r.partner_link_id ? (labelByLink.get(String(r.partner_link_id)) ?? null) : null,
      agencyName: r.partner_agency_id ? (agencyName.get(String(r.partner_agency_id)) ?? null) : null,
      clientName: r.partner_client_id ? (clientName.get(String(r.partner_client_id)) ?? null) : null,
      stage,
      voidReason: (r.partner_void_reason as string | null) ?? null,
      accrual,
    };
  });
}

/** Переходы и заявки по дням за последние `days` дней — для графика в кабинете. */
export async function dailyActivity(
  partnerId: string,
  days: number,
  now: Date = new Date(),
): Promise<{ day: string; clicks: number; leads: number }[]> {
  const db = serviceClient();
  const since = new Date(now.getTime() - (days - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const out = new Map<string, { clicks: number; leads: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    out.set(d, { clicks: 0, leads: 0 });
  }
  if (db) {
    const [{ data: clicks }, { data: leads }] = await Promise.all([
      db
        .from("partner_clicks")
        .select("created_at")
        .eq("partner_id", partnerId)
        .gte("created_at", since.toISOString())
        .limit(20000),
      db
        .from("leads")
        .select("created_at")
        .eq("partner_id", partnerId)
        .is("partner_void_reason", null)
        .gte("created_at", since.toISOString())
        .limit(5000),
    ]);
    for (const row of clicks ?? []) {
      const d = String(row.created_at).slice(0, 10);
      const cell = out.get(d);
      if (cell) cell.clicks += 1;
    }
    for (const row of leads ?? []) {
      const d = String(row.created_at).slice(0, 10);
      const cell = out.get(d);
      if (cell) cell.leads += 1;
    }
  }
  return [...out.entries()].map(([day, v]) => ({ day, ...v }));
}

/** Реквизиты для выплат — из кабинета, до заявки. */
export async function saveRequisites(partner: Partner, raw: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const requisites = raw.trim();
  if (!validRequisites(requisites)) return false;
  const { error } = await db.from("partners").update({ requisites }).eq("id", partner.id);
  if (!error) await fillAutoPayoutRequisites(partner.id, requisites);
  return !error;
}

/**
 * Автовыплата с оборота заводится и без реквизитов — деньги партнёра не
 * ждут, пока он их внесёт. Внёс — реквизиты встают в открытые автовыплаты,
 * чтобы владелец видел, куда переводить.
 */
async function fillAutoPayoutRequisites(partnerId: string, requisites: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("partner_payouts")
    .update({ requisites })
    .eq("partner_id", partnerId)
    .eq("status", "requested")
    .eq("requisites", "")
    .not("project_id", "is", null);
}

/* ── Касания в боте ─────────────────────────────────────────────────────── */

/**
 * Запомнить за чатом бота, по чьей ссылке он пришёл. Правила те же, что у
 * куки на сайте: 30 дней, первый побеждает — свежую отметку другого
 * партнёра не перезаписываем.
 */
export async function touchChat(chatId: number, code: string, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  if (await touchFor(chatId, now)) return;
  await db
    .from("partner_touches")
    .upsert({ chat_id: chatId, code, seen_at: now.toISOString() }, { onConflict: "chat_id" });
}

/** Код партнёра за чатом, если переход был не раньше 30 дней назад. */
export async function touchFor(chatId: number, now: Date = new Date()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("partner_touches").select("code, seen_at").eq("chat_id", chatId).maybeSingle();
  if (!data?.code) return null;
  const age = now.getTime() - Date.parse(String(data.seen_at));
  return age <= REF_TTL_DAYS * 86_400_000 ? String(data.code) : null;
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
    /** Когда человек перешёл по ссылке — из куки; в карточке лида видно, за сколько дней до заявки. */
    refAt?: Date | null;
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
      // Модель фиксируется на клиенте сейчас: смена позже действует на
      // новых клиентов, а не на этого.
      partner_model: partner.payout_model,
      ...(ctx.refAt ? { partner_ref_at: ctx.refAt.toISOString() } : {}),
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
  // Автовыплата с оборота — отдельная заявка за свой проект и ручную не
  // держит: её сумма уже вычтена из доступного.
  if (summary.payouts.some((p) => p.status === "requested" && !p.project_id)) {
    return { ok: false, reason: "pending", balance };
  }
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
  if (typeof patch.requisites === "string") await fillAutoPayoutRequisites(partnerId, patch.requisites);

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
  fields: {
    partnerId: string | null;
    percent: number | null;
    voidReason: string | null;
    /** Заказ агентства этого партнёра. undefined — не трогать. */
    agencyId?: string | null;
  },
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
    .select("id, partner_id, partner_percent, partner_void_reason, partner_model, partner_agency_id, partner_client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!before) return { ok: false, reason: "gone" };

  // Партнёр тот же — модель и агентство остаются, какими были зафиксированы
  // при заявке. Партнёр другой — его текущая модель: проект для него новый.
  const same = before.partner_id === fields.partnerId;
  const newPartner = fields.partnerId && !same ? await partnerById(fields.partnerId) : null;
  const patch = {
    partner_id: fields.partnerId,
    partner_percent: fields.partnerId ? fields.percent : null,
    partner_void_reason: fields.partnerId ? fields.voidReason?.trim().slice(0, 64) || null : null,
    partner_model: fields.partnerId
      ? same
        ? ((before.partner_model as string | null) ?? null)
        : (newPartner?.payout_model ?? null)
      : null,
    partner_agency_id: fields.partnerId
      ? fields.agencyId !== undefined
        ? fields.agencyId
        : same
          ? ((before.partner_agency_id as string | null) ?? null)
          : null
      : null,
    // Закреплённый клиент — только у того же партнёра: другому партнёру
    // чужое закрепление не переходит.
    partner_client_id: same ? ((before.partner_client_id as string | null) ?? null) : null,
  };
  if (patch.partner_agency_id) {
    const { data: agency } = await db
      .from("partner_agencies")
      .select("partner_id, status, decided_at")
      .eq("id", patch.partner_agency_id)
      .maybeSingle();
    if (!agency || agency.partner_id !== fields.partnerId) return { ok: false, reason: "invalid" };
    // Новая привязка — только к агентству в сроке. Уже привязанный проект
    // остаётся за агентством и после срока: заказ пришёл, пока срок шёл.
    const kept = patch.partner_agency_id === ((before.partner_agency_id as string | null) ?? null);
    if (!kept && !agencyCounts({ status: String(agency.status), decided_at: (agency.decided_at as string | null) ?? null })) {
      return { ok: false, reason: "invalid" };
    }
  }
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

/* ── Модель дохода ──────────────────────────────────────────────────────── */

export type ModelResult = { ok: true } | { ok: false; reason: "offline" | "invalid" | "same" | "too_soon" | "failed" };

/**
 * Сменить модель дохода: не чаще раза в неделю, со строкой в журнале.
 *
 * Окно проверяется условной записью «где смена была больше недели назад или
 * не было вовсе»: две вкладки одновременно не сменят модель дважды.
 */
export async function setPayoutModel(partner: Partner, model: string, now: Date = new Date()): Promise<ModelResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  if (!isPayoutModel(model)) return { ok: false, reason: "invalid" };
  if (model === partner.payout_model) return { ok: false, reason: "same" };
  if (!canSwitchModel(partner.model_changed_at, now)) return { ok: false, reason: "too_soon" };

  const cutoff = new Date(now.getTime() - MODEL_SWITCH_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from("partners")
    .update({ payout_model: model, model_changed_at: now.toISOString() })
    .eq("id", partner.id)
    .eq("payout_model", partner.payout_model)
    // Время — в кавычках: точки и двоеточия в значении PostgREST иначе читает как разметку.
    .or(`model_changed_at.is.null,model_changed_at.lte."${cutoff}"`)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "too_soon" };

  await db.from("partner_model_changes").insert({
    partner_id: partner.id,
    from_model: partner.payout_model,
    to_model: model,
    changed_at: now.toISOString(),
  });
  await record("partner.model_changed", {
    targetType: "partner",
    targetId: partner.id,
    meta: { from: partner.payout_model, to: model },
  });
  return { ok: true };
}

export type ModelChange = { from_model: PayoutModel; to_model: PayoutModel; changed_at: string };

export async function modelChangesOf(partnerId: string): Promise<ModelChange[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("partner_model_changes")
    .select("from_model, to_model, changed_at")
    .eq("partner_id", partnerId)
    .order("changed_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ModelChange[];
}

/* ── Агентства на субподряде ────────────────────────────────────────────── */

export type AgencyStatus = "pending" | "active" | "rejected";

export type PartnerAgency = {
  id: string;
  created_at: string;
  partner_id: string;
  name: string;
  contact: string | null;
  website: string | null;
  note: string | null;
  status: AgencyStatus;
  decided_at: string | null;
  decision_note: string | null;
};

const AGENCY_COLUMNS = "id, created_at, partner_id, name, contact, website, note, status, decided_at, decision_note";

function shapeAgency(row: Record<string, unknown>): PartnerAgency {
  const status = String(row.status);
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    partner_id: String(row.partner_id),
    name: String(row.name),
    contact: (row.contact as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    status: status === "active" ? "active" : status === "rejected" ? "rejected" : "pending",
    decided_at: (row.decided_at as string | null) ?? null,
    decision_note: (row.decision_note as string | null) ?? null,
  };
}

export async function agenciesOf(partnerIds: readonly string[] | "all"): Promise<PartnerAgency[]> {
  const db = serviceClient();
  if (!db) return [];
  if (partnerIds !== "all" && !partnerIds.length) return [];
  let query = db.from("partner_agencies").select(AGENCY_COLUMNS).order("created_at", { ascending: false });
  if (partnerIds !== "all") query = query.in("partner_id", [...partnerIds]);
  const { data } = await query.limit(500);
  return (data ?? []).map((row) => shapeAgency(row as Record<string, unknown>));
}

export type AgencyFailure = "offline" | "invalid" | "limit" | "duplicate" | "failed";

/** Сколько агентств один партнёр может держать на проверке и в работе. */
export const MAX_AGENCIES = 20;

/**
 * Партнёр подключает агентство — оно ждёт подтверждения владельца. Пока не
 * подтверждено, заказы агентства партнёру не засчитываются: иначе можно было
 * бы «подключить» агентство, которое уже работает со студией.
 */
export async function requestAgency(
  partner: Partner,
  fields: { name: string; contact: string; website: string; note: string },
): Promise<{ ok: true; agency: PartnerAgency } | { ok: false; reason: AgencyFailure }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const name = fields.name.trim().slice(0, 120);
  const contact = fields.contact.trim().slice(0, 120) || null;
  if (name.length < 2 || !contact) return { ok: false, reason: "invalid" };

  const mine = await agenciesOf([partner.id]);
  if (mine.filter((a) => a.status !== "rejected").length >= MAX_AGENCIES) return { ok: false, reason: "limit" };

  // Одно агентство — одному партнёру: кто подключил первым, того и заказы.
  const all = await agenciesOf("all");
  const key = contactKey(contact);
  const nameKey = companyKey(name);
  if (
    all.some(
      (a) =>
        a.status !== "rejected" &&
        ((key && contactKey(a.contact) === key) || (nameKey.length >= 4 && companyKey(a.name) === nameKey)),
    )
  ) {
    return { ok: false, reason: "duplicate" };
  }

  const { data, error } = await db
    .from("partner_agencies")
    .insert({
      partner_id: partner.id,
      name,
      contact,
      website: fields.website.trim().slice(0, 200) || null,
      note: fields.note.trim().slice(0, 500) || null,
    })
    .select(AGENCY_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: "failed" };
  const agency = shapeAgency(data as Record<string, unknown>);

  await record("partner.agency_requested", {
    targetType: "partner",
    targetId: partner.id,
    meta: { agency_id: agency.id, name, contact },
  });
  return { ok: true, agency };
}

/** Владелец решил: подключено или нет. Партнёру — сообщение. */
export async function decideAgency(
  agencyId: string,
  decision: "active" | "rejected",
  note: string | null,
  admin: Staff,
  ip: string,
): Promise<{ ok: true; agency: PartnerAgency } | { ok: false; reason: "offline" | "forbidden" | "gone" | "failed" }> {
  if (admin.role !== "admin") return { ok: false, reason: "forbidden" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { data, error } = await db
    .from("partner_agencies")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: admin.id,
      decision_note: note?.trim().slice(0, 300) || null,
    })
    .eq("id", agencyId)
    .select(AGENCY_COLUMNS)
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };
  const agency = shapeAgency(data as Record<string, unknown>);

  await record("partner.agency_decided", {
    actorStaffId: admin.id,
    targetType: "partner",
    targetId: agency.partner_id,
    ip,
    meta: { agency_id: agency.id, decision, note: agency.decision_note },
  });
  return { ok: true, agency };
}

/**
 * Лид — заказ подключённого агентства? Тогда он партнёра, без окна в 30 дней
 * и без проверки «клиент уже был у студии»: у агентства повторные заказы —
 * это и есть смысл. Но не бессрочно: AGENCY_TERM_MONTHS с подтверждения
 * (lib/partners/rules.ts). Записывается на лид с агентством и моделью
 * партнёра.
 */
export async function attributeAgencyLead(
  leadId: string,
  lead: { contactHandle: string | null; company: string | null },
): Promise<{ partner: Partner; agency: PartnerAgency } | null> {
  const db = serviceClient();
  if (!db) return null;
  if (!lead.contactHandle && !lead.company) return null;

  const now = new Date();
  const active = (await agenciesOf("all")).filter((a) => agencyCounts(a, now));
  const agency = active.find((a) => agencyMatches(a, lead));
  if (!agency) return null;
  const partner = await partnerById(agency.partner_id);
  if (!partner || partner.status !== "active") return null;

  const { error } = await db
    .from("leads")
    .update({
      partner_id: partner.id,
      partner_link_id: null,
      partner_code: partner.code,
      partner_void_reason: null,
      partner_model: partner.payout_model,
      partner_agency_id: agency.id,
    })
    .eq("id", leadId);
  if (error) {
    console.error("partners: не привязал заказ агентства", error.message);
    return null;
  }
  return { partner, agency };
}

/* ── Клиенты, закреплённые вручную ──────────────────────────────────────── */

export type ClientStatus = "active" | "expired" | "cancelled";

export type PartnerClient = {
  id: string;
  created_at: string;
  partner_id: string;
  name: string;
  inn: string;
  contact_name: string | null;
  phone: string | null;
  telegram: string | null;
  website: string | null;
  note: string | null;
  status: ClientStatus;
  first_lead_at: string | null;
  cancelled_at: string | null;
  cancel_note: string | null;
};

const CLIENT_COLUMNS =
  "id, created_at, partner_id, name, inn, contact_name, phone, telegram, website, note, status, first_lead_at, cancelled_at, cancel_note";

function shapeClient(row: Record<string, unknown>): PartnerClient {
  const status = String(row.status);
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    partner_id: String(row.partner_id),
    name: String(row.name),
    inn: String(row.inn),
    contact_name: (row.contact_name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    telegram: (row.telegram as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    status: status === "expired" ? "expired" : status === "cancelled" ? "cancelled" : "active",
    first_lead_at: (row.first_lead_at as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    cancel_note: (row.cancel_note as string | null) ?? null,
  };
}

/** Что известно о закреплённой компании — для сравнения с лидом. */
export function clientFacts(client: Pick<PartnerClient, "inn" | "name" | "phone" | "telegram" | "website">): CompanyFacts {
  return { inn: client.inn, name: client.name, contacts: [client.phone, client.telegram], host: client.website };
}

export async function clientsOf(partnerIds: readonly string[] | "all"): Promise<PartnerClient[]> {
  const db = serviceClient();
  if (!db) return [];
  if (partnerIds !== "all" && !partnerIds.length) return [];
  let query = db.from("partner_clients").select(CLIENT_COLUMNS).order("created_at", { ascending: false });
  if (partnerIds !== "all") query = query.in("partner_id", [...partnerIds]);
  const { data, error } = await query.limit(2000);
  if (error) {
    console.error("partners: не прочитал закреплённых клиентов", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapeClient(row as Record<string, unknown>));
}

export async function clientById(id: string): Promise<PartnerClient | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("partner_clients").select(CLIENT_COLUMNS).eq("id", id).maybeSingle();
  return data ? shapeClient(data as Record<string, unknown>) : null;
}

/**
 * ИНН компании в карточке лида — его вписывает менеджер, когда клиент его
 * назвал. Пустое поле стирает ИНН. Лид, ещё ничей у партнёров, тут же
 * проверяется на закрепление: `client` — чьим клиентом он оказался.
 */
export async function setLeadInn(
  leadId: string,
  raw: string,
): Promise<{ ok: true; inn: string | null } | { ok: false; reason: "offline" | "invalid" | "failed" }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const text = raw.trim();
  const inn = text ? normalizeInn(text) : null;
  if (text && !inn) return { ok: false, reason: "invalid" };
  const { error } = await db.from("leads").update({ client_inn: inn }).eq("id", leadId);
  if (error) return { ok: false, reason: "failed" };
  return { ok: true, inn };
}

/**
 * Закрепления, у которых вышел срок, — в «истекло».
 *
 * Сроки считаются из дат (rules.ts, clientCounts), так что для привязки
 * лида это не нужно. Нужно базе: уникальный индекс держит одно действующее
 * закрепление на ИНН, и просроченное, оставшись «active», не дало бы
 * закрепить компанию никому. Зовётся перед новой заявкой и из свипа.
 */
export async function expireClients(now: Date = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("partner_clients").select(CLIENT_COLUMNS).eq("status", "active").limit(2000);
  const ids = (data ?? [])
    .map((row) => shapeClient(row as Record<string, unknown>))
    .filter((c) => !clientCounts(c, now))
    .map((c) => c.id);
  if (!ids.length) return 0;
  await db.from("partner_clients").update({ status: "expired" }).in("id", ids).eq("status", "active");
  return ids.length;
}

/**
 * Знает ли студия эту компанию: лид, проект, договор или касание из
 * «Касаний» с тем же ИНН, названием, контактом или сайтом.
 *
 * Это антифрод: нельзя «застолбить» тех, с кем студия уже работает или кому
 * уже писала. Таблицы маленькие (сотни строк), поэтому сравнение — здесь, по
 * тем же правилам, что и привязка лида, а не десятком запросов с ilike.
 */
async function studioKnows(facts: CompanyFacts): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const [leads, projects, contracts, prospects] = await Promise.all([
    db.from("leads").select("client_inn, company, contact_handle, tg_username").limit(10000),
    db.from("projects").select("client").limit(10000),
    db.from("contracts").select("client_tax_id, client_name").limit(10000),
    db.from("prospects").select("host, label, contacts").limit(20000),
  ]);
  const known: CompanyFacts[] = [
    ...(leads.data ?? []).map((l) => ({
      inn: l.client_inn as string | null,
      name: l.company as string | null,
      contacts: [l.contact_handle as string | null, l.tg_username as string | null],
    })),
    ...(projects.data ?? []).map((p) => ({ name: p.client as string | null })),
    ...(contracts.data ?? []).map((c) => ({ inn: c.client_tax_id as string | null, name: c.client_name as string | null })),
    ...(prospects.data ?? []).map((p) => {
      const contacts = (p.contacts ?? {}) as Partial<Record<"phones" | "telegram" | "whatsapp" | "emails", string[]>>;
      return {
        host: p.host as string | null,
        name: p.label as string | null,
        contacts: [...(contacts.phones ?? []), ...(contacts.telegram ?? []), ...(contacts.whatsapp ?? []), ...(contacts.emails ?? [])],
      };
    }),
  ];
  return known.some((k) => sameCompany(facts, k));
}

/**
 * Партнёр закрепляет клиента. Действует сразу — без подтверждения
 * владельцем, потому что всё, ради чего агентство ждёт подтверждения,
 * проверяется здесь: студия компанию не знает, другой партнёр её не
 * закрепил, лимит в месяц не выбран.
 */
export async function requestClient(
  partner: Partner,
  fields: { name: string; inn: string; contactName: string; phone: string; telegram: string; website: string; note: string },
  now: Date = new Date(),
): Promise<{ ok: true; client: PartnerClient } | { ok: false; reason: ClientFailure }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  if (partner.status !== "active") return { ok: false, reason: "blocked" };
  const problem = clientFieldsProblem(fields);
  if (problem) return { ok: false, reason: problem };

  const row = {
    partner_id: partner.id,
    name: fields.name.trim().slice(0, 120),
    inn: normalizeInn(fields.inn) as string,
    contact_name: fields.contactName.trim().slice(0, 120) || null,
    phone: fields.phone.trim().slice(0, 40) || null,
    telegram: fields.telegram.trim().slice(0, 80) || null,
    website: fields.website.trim().slice(0, 200) || null,
    note: fields.note.trim().slice(0, 500) || null,
  };
  const facts = clientFacts(row);

  await expireClients(now);
  const all = await clientsOf("all");
  const month = tashkentMonth(now);
  if (all.filter((c) => c.partner_id === partner.id && tashkentMonth(new Date(c.created_at)) === month).length >= MAX_CLIENTS_PER_MONTH) {
    return { ok: false, reason: "limit" };
  }
  const holder = all.find((c) => clientCounts(c, now) && sameCompany(facts, clientFacts(c)));
  if (holder) return { ok: false, reason: holder.partner_id === partner.id ? "mine" : "taken" };
  // Агентство другого партнёра — тоже занято: его заказы уже идут партнёру.
  const agency = (await agenciesOf("all")).find(
    (a) => a.status !== "rejected" && sameCompany(facts, { name: a.name, contacts: [a.contact], host: a.website }),
  );
  if (agency) return { ok: false, reason: agency.partner_id === partner.id ? "mine" : "taken" };
  if (await studioKnows(facts)) return { ok: false, reason: "studio" };

  const { data, error } = await db.from("partner_clients").insert(row).select(CLIENT_COLUMNS).maybeSingle();
  // Уникальный индекс по ИНН: кто-то закрепил ту же компанию секундой раньше.
  if (error?.code === "23505") return { ok: false, reason: "taken" };
  if (error || !data) return { ok: false, reason: "failed" };
  const client = shapeClient(data as Record<string, unknown>);

  await record("partner.client_claimed", {
    targetType: "partner",
    targetId: partner.id,
    meta: { client_id: client.id, name: client.name, inn: client.inn },
  });
  return { ok: true, client };
}

/** Владелец отменяет закрепление — с причиной, она уходит партнёру. */
export async function cancelClient(
  clientId: string,
  note: string | null,
  admin: Staff,
  ip: string,
): Promise<{ ok: true; client: PartnerClient } | { ok: false; reason: "offline" | "forbidden" | "gone" | "invalid" | "failed" }> {
  if (admin.role !== "admin") return { ok: false, reason: "forbidden" };
  const reason = note?.trim().slice(0, 300) || "";
  if (!reason) return { ok: false, reason: "invalid" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { data, error } = await db
    .from("partner_clients")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: admin.id, cancel_note: reason })
    .eq("id", clientId)
    .neq("status", "cancelled")
    .select(CLIENT_COLUMNS)
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };
  const client = shapeClient(data as Record<string, unknown>);

  await record("partner.client_cancelled", {
    actorStaffId: admin.id,
    targetType: "partner",
    targetId: client.partner_id,
    ip,
    meta: { client_id: client.id, name: client.name, inn: client.inn, note: reason },
  });
  return { ok: true, client };
}

/**
 * Лид — от клиента, которого партнёр закрепил вручную? Тогда он партнёра.
 *
 * Читает лид сам: так одна функция служит и новой заявке (форма, чат,
 * бот), и ИНН, вписанному в карточку позже. Лид, уже привязанный к
 * партнёру (по ссылке или агентству), не трогается — кто сработал раньше,
 * тот и важнее. Исключение — привязка, которая не засчитана: тогда
 * закрепление честнее.
 *
 * Первая заявка клиента запускает срок в 12 месяцев (rules.ts,
 * CLIENT_TERM_MONTHS), и ИНН из закрепления ложится в лид, если его там нет.
 */
export async function attributeClientLead(
  leadId: string,
  now: Date = new Date(),
): Promise<{ partner: Partner; client: PartnerClient; first: boolean } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: lead } = await db
    .from("leads")
    .select("id, client_inn, company, contact_handle, tg_username, partner_id, partner_void_reason")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return null;
  if (lead.partner_id && !lead.partner_void_reason) return null;

  const facts: CompanyFacts = {
    inn: lead.client_inn as string | null,
    name: lead.company as string | null,
    contacts: [lead.contact_handle as string | null, lead.tg_username as string | null],
  };
  const client = (await clientsOf("all")).find((c) => clientCounts(c, now) && sameCompany(clientFacts(c), facts));
  if (!client) return null;
  const partner = await partnerById(client.partner_id);
  if (!partner || partner.status !== "active") return null;

  const { error } = await db
    .from("leads")
    .update({
      partner_id: partner.id,
      partner_link_id: null,
      partner_code: partner.code,
      partner_void_reason: null,
      partner_model: partner.payout_model,
      partner_agency_id: null,
      partner_client_id: client.id,
      ...(lead.client_inn ? {} : { client_inn: client.inn }),
    })
    .eq("id", leadId);
  if (error) {
    console.error("partners: не привязал лид закреплённого клиента", error.message);
    return null;
  }
  // Проект, заведённый из лида раньше, чем лид узнали, — тоже партнёра.
  await db
    .from("projects")
    .update({ partner_id: partner.id, partner_model: partner.payout_model, partner_client_id: client.id })
    .eq("lead_id", leadId)
    .is("partner_id", null);

  // Срок в 12 месяцев — с первой заявки; условие в запросе, чтобы две
  // заявки разом не сдвинули его дважды.
  let first = false;
  if (!client.first_lead_at) {
    const { data: started } = await db
      .from("partner_clients")
      .update({ first_lead_at: now.toISOString() })
      .eq("id", client.id)
      .is("first_lead_at", null)
      .select(CLIENT_COLUMNS)
      .maybeSingle();
    if (started) {
      first = true;
      Object.assign(client, shapeClient(started as Record<string, unknown>));
    }
  }
  return { partner, client, first };
}

/* ── Автовыплата с оборота ──────────────────────────────────────────────── */

/**
 * Проект оплачен целиком, модель «с оборота» — завести выплату партнёру.
 *
 * Без заявки партнёра и без ожидания начала месяца: база «с оборота» —
 * сумма проекта, и она известна сразу. Строго одна на проект: держит
 * уникальный индекс по project_id (миграция 0072) — запись платежа и свип
 * могут прийти одновременно, вторая вставка не пройдёт.
 *
 * Не заводится, если доступного меньше начисления: значит, эти деньги
 * партнёр уже попросил обычной заявкой, и вторая выплата задвоила бы их.
 *
 * `null` — выплаты нет (не та модель, не оплачено, уже заведена).
 */
export async function autoPayoutTurnover(
  projectId: string,
): Promise<{ partner: Partner; payout: PartnerPayout; project: { title: string; client: string | null } } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: project } = await db
    .from("projects")
    .select("id, title, client, partner_id, partner_void_reason")
    .eq("id", projectId)
    .maybeSingle();
  if (!project?.partner_id || project.partner_void_reason) return null;

  const partner = await partnerById(String(project.partner_id));
  if (!partner || partner.status !== "active") return null;
  const [summary] = await summarize([partner]);
  if (summary.payouts.some((p) => p.project_id === projectId)) return null;
  const accrual = summary.accruals.find((a) => a.project_id === projectId) ?? null;
  if (!autoPayoutDue(accrual) || !accrual) return null;
  if (summary.balance.available < accrual.amount_usd) return null;

  const requisites = partner.requisites && validRequisites(partner.requisites) ? partner.requisites : "";
  const { data, error } = await db
    .from("partner_payouts")
    .insert({ partner_id: partner.id, amount_usd: accrual.amount_usd, requisites, project_id: projectId })
    .select(PAYOUT_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    if (error?.code !== "23505") console.error("partners: автовыплата не записалась", error?.message);
    return null;
  }
  const payout = shapePayout(data as Record<string, unknown>);

  await record("partner.payout_auto", {
    targetType: "partner",
    targetId: partner.id,
    meta: { payout_id: payout.id, project_id: projectId, amount_usd: payout.amount_usd },
  });
  return {
    partner,
    payout,
    project: { title: String(project.title ?? ""), client: (project.client as string | null) ?? null },
  };
}

/** Оплаченные целиком партнёрские проекты без автовыплаты — для свипа. */
export async function turnoverProjectsDue(): Promise<string[]> {
  const partners = (await listPartners()).filter((p) => p.status === "active");
  if (!partners.length) return [];
  const summaries = await summarize(partners);
  const out: string[] = [];
  for (const s of summaries) {
    const done = new Set(s.payouts.map((p) => p.project_id).filter(Boolean));
    for (const a of s.accruals) if (autoPayoutDue(a) && !done.has(a.project_id)) out.push(a.project_id);
  }
  return out;
}
