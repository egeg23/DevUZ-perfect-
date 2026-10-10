import { open, seal, tokenKey } from "@/lib/ads/crypto";
import { googleConnector } from "@/lib/ads/connectors/google";
import { seedStubState, stubConnector, type StubState } from "@/lib/ads/connectors/stub";
import { yandexConnector } from "@/lib/ads/connectors/yandex";
import { refreshGoogle } from "@/lib/ads/oauth";
import { DEFAULT_THRESHOLDS, type AccountLimits, type AdsConnector, type Mode, type Payload, type Platform, type Thresholds } from "@/lib/ads/types";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Автопилот рекламы: чтение и запись базы (таблицы ads_*, миграция 0150).
 *
 * Пишет только сервер; кто что вправе — решают страницы и действия
 * (lib/ads/access.ts). Здесь — ничего, что кабинет клиента мог бы прочитать
 * в обход: ключи доступа отдаются только `connectorFor`, расшифрованными в
 * памяти на время прохода.
 */

export type Workspace = {
  id: string;
  name: string;
  kind: "studio" | "agency" | "business";
  locale: "ru" | "uz";
  created_at: string;
  last_report_at: string | null;
};

export type Member = { id: string; workspace_id: string; telegram_user_id: number; name: string; notify: boolean };

export type Account = {
  id: string;
  workspace_id: string;
  platform: Platform;
  external_id: string;
  name: string;
  currency: string;
  sandbox: boolean;
  has_credentials: boolean;
  mode: Mode;
  stopped: boolean;
  max_shift_pct: number;
  max_actions_day: number;
  settings: Partial<Thresholds>;
  status: "new" | "ok" | "error" | "disconnected";
  last_error: string | null;
  last_sync_at: string | null;
  created_at: string;
};

export type Proposal = {
  id: number;
  account_id: string;
  kind: Payload["kind"];
  status: "new" | "rejected" | "applied" | "failed" | "expired" | "rolled_back";
  title: string;
  why: string;
  numbers: Record<string, number | string>;
  payload: Payload;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  error: string | null;
};

export type Action = {
  id: number;
  account_id: string;
  proposal_id: number | null;
  kind: string;
  actor: string;
  auto: boolean;
  why: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  at: string;
  rolled_back_at: string | null;
  rollback_of: number | null;
};

export type AdTest = {
  id: number;
  account_id: string;
  campaign_id: string;
  ad_group_id: string;
  control_ad_id: string;
  variant_ad_id: string;
  status: "running" | "won" | "lost" | "stopped";
  started_at: string;
  ended_at: string | null;
  result: Record<string, unknown> | null;
};

const ACCOUNT_FIELDS =
  "id, workspace_id, platform, external_id, name, currency, sandbox, credentials_enc, mode, stopped, max_shift_pct, max_actions_day, settings, status, last_error, last_sync_at, created_at";

function toAccount(row: Record<string, unknown>): Account {
  const { credentials_enc, ...rest } = row;
  return { ...(rest as Omit<Account, "has_credentials">), has_credentials: Boolean(credentials_enc) };
}

/** Флаг включения: ADS_AUTOPILOT=1 в .env или хранилище. Выключен — фоновых проходов нет. */
export async function adsEnabled(): Promise<boolean> {
  return (await appSecret("ADS_AUTOPILOT")) === "1";
}

export function limitsOf(account: Account): AccountLimits {
  return { mode: account.mode, stopped: account.stopped, maxShiftPct: account.max_shift_pct, maxActionsDay: account.max_actions_day };
}

export function thresholdsOf(account: Account): Thresholds {
  return { ...DEFAULT_THRESHOLDS, ...account.settings };
}

/* ── Кабинеты и люди ───────────────────────────────────────────────────── */

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_workspaces").select("*").is("archived_at", null).order("created_at");
  return (data as Workspace[] | null) ?? [];
}

export async function workspaceById(id: string): Promise<Workspace | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("ads_workspaces").select("*").eq("id", id).is("archived_at", null).maybeSingle();
  return (data as Workspace | null) ?? null;
}

export async function createWorkspace(input: { name: string; kind: Workspace["kind"]; locale: Workspace["locale"]; createdBy: string | null }): Promise<Workspace | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("ads_workspaces")
    .insert({ name: input.name.slice(0, 120), kind: input.kind, locale: input.locale, created_by: input.createdBy })
    .select("*")
    .single();
  return (data as Workspace | null) ?? null;
}

export async function membersOf(workspaceId: string): Promise<Member[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_members").select("*").eq("workspace_id", workspaceId).order("created_at");
  return (data as Member[] | null) ?? [];
}

export async function memberById(id: string): Promise<Member | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("ads_members").select("*").eq("id", id).maybeSingle();
  return (data as Member | null) ?? null;
}

export async function membershipsOf(telegramUserId: number): Promise<Member[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_members").select("*").eq("telegram_user_id", telegramUserId);
  return (data as Member[] | null) ?? [];
}

export async function addMember(workspaceId: string, telegramUserId: number, name: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("ads_members")
    .upsert({ workspace_id: workspaceId, telegram_user_id: telegramUserId, name: name.slice(0, 80) }, { onConflict: "workspace_id,telegram_user_id" });
  return !error;
}

export async function removeMember(workspaceId: string, memberId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("ads_members").delete().eq("workspace_id", workspaceId).eq("id", memberId);
  return !error;
}

/* ── Рекламные кабинеты ────────────────────────────────────────────────── */

export async function accountsOf(workspaceId: string): Promise<Account[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_accounts").select(ACCOUNT_FIELDS).eq("workspace_id", workspaceId).order("created_at");
  return ((data as Record<string, unknown>[] | null) ?? []).map(toAccount);
}

export async function accountById(id: string): Promise<Account | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db.from("ads_accounts").select(ACCOUNT_FIELDS).eq("id", id).maybeSingle();
  return data ? toAccount(data as Record<string, unknown>) : null;
}

export async function createAccount(input: {
  workspaceId: string;
  platform: Platform;
  name: string;
  externalId: string;
  currency: string;
  sandbox: boolean;
}): Promise<Account | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("ads_accounts")
    .insert({
      workspace_id: input.workspaceId,
      platform: input.platform,
      name: input.name.slice(0, 120),
      external_id: input.externalId.slice(0, 64),
      currency: input.currency,
      sandbox: input.sandbox,
      stub_state: input.platform === "stub" ? seedStubState() : null,
    })
    .select(ACCOUNT_FIELDS)
    .single();
  return data ? toAccount(data as Record<string, unknown>) : null;
}

export type AccountPatch = Partial<{
  mode: Mode;
  stopped: boolean;
  max_shift_pct: number;
  max_actions_day: number;
  settings: Partial<Thresholds>;
  status: Account["status"];
  last_error: string | null;
  last_sync_at: string;
  external_id: string;
  name: string;
  currency: string;
}>;

export async function updateAccount(id: string, patch: AccountPatch): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("ads_accounts").update(patch).eq("id", id);
  return !error;
}

/** Ключи доступа — зашифрованными. Нет ADS_TOKEN_KEY — не сохраняем вовсе. */
export async function saveCredentials(id: string, credentials: Record<string, unknown>): Promise<boolean> {
  const key = await tokenKey();
  const db = serviceClient();
  if (!key || !db) return false;
  const { error } = await db.from("ads_accounts").update({ credentials_enc: seal(credentials, key), status: "new", last_error: null }).eq("id", id);
  return !error;
}

export async function dropCredentials(id: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("ads_accounts").update({ credentials_enc: null, status: "disconnected" }).eq("id", id);
  return !error;
}

export async function saveStubState(id: string, state: StubState): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_accounts").update({ stub_state: state }).eq("id", id);
}

export async function loadStubState(id: string): Promise<StubState | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("ads_accounts").select("stub_state").eq("id", id).maybeSingle();
  return ((data as { stub_state: StubState | null } | null)?.stub_state ?? null) as StubState | null;
}

type YandexStored = { token: string; refresh_token?: string };
type GoogleStored = { refresh_token: string; access_token?: string; expires_at?: number; login_customer_id?: string };

/**
 * Коннектор к кабинету. null — ключей нет или их не расшифровать (сменили
 * ADS_TOKEN_KEY): кабинет надо подключить заново.
 */
export async function connectorFor(account: Account): Promise<AdsConnector | null> {
  if (account.platform === "stub") {
    const state = (await loadStubState(account.id)) ?? seedStubState();
    return stubConnector(state, (next) => saveStubState(account.id, next));
  }
  const db = serviceClient();
  const key = await tokenKey();
  if (!db || !key) return null;
  const { data } = await db.from("ads_accounts").select("credentials_enc").eq("id", account.id).maybeSingle();
  const sealed = (data as { credentials_enc: string | null } | null)?.credentials_enc;
  if (!sealed) return null;

  if (account.platform === "yandex") {
    const creds = open<YandexStored>(sealed, key);
    if (!creds?.token) return null;
    return yandexConnector({ token: creds.token, clientLogin: account.external_id || undefined }, { sandbox: account.sandbox });
  }

  const creds = open<GoogleStored>(sealed, key);
  const developerToken = (await appSecret("GOOGLE_ADS_DEVELOPER_TOKEN")) ?? "";
  if (!creds?.refresh_token || !account.external_id) return null;
  let cached = creds;
  return googleConnector({
    customerId: account.external_id,
    loginCustomerId: creds.login_customer_id ?? (await appSecret("GOOGLE_ADS_LOGIN_CUSTOMER_ID")) ?? undefined,
    developerToken,
    accessToken: async () => {
      if (cached.access_token && (cached.expires_at ?? 0) > Date.now() + 60_000) return cached.access_token;
      const fresh = await refreshGoogle(cached.refresh_token);
      cached = { ...cached, access_token: fresh.access_token, expires_at: Date.now() + (fresh.expires_in ?? 3600) * 1000 };
      await db.from("ads_accounts").update({ credentials_enc: seal(cached, key) }).eq("id", account.id);
      return cached.access_token!;
    },
  });
}

/* ── Предложения, журнал, тесты ────────────────────────────────────────── */

export async function proposalsOf(accountId: string, statuses: Proposal["status"][] = ["new"], limit = 50): Promise<Proposal[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("ads_proposals")
    .select("*")
    .eq("account_id", accountId)
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Proposal[] | null) ?? [];
}

export async function proposalById(id: number): Promise<Proposal | null> {
  const db = serviceClient();
  if (!db || !Number.isInteger(id)) return null;
  const { data } = await db.from("ads_proposals").select("*").eq("id", id).maybeSingle();
  return (data as Proposal | null) ?? null;
}

/** Завести предложения; такое же открытое уже есть — пропустить (уникальный индекс). */
export async function insertProposals(accountId: string, drafts: { kind: string; dedupeKey: string; title: string; why: string; numbers: object; payload: Payload }[]): Promise<Proposal[]> {
  const db = serviceClient();
  if (!db) return [];
  const out: Proposal[] = [];
  for (const d of drafts) {
    const { data, error } = await db
      .from("ads_proposals")
      .insert({ account_id: accountId, kind: d.kind, dedupe_key: d.dedupeKey, title: d.title, why: d.why, numbers: d.numbers, payload: d.payload })
      .select("*")
      .single();
    if (!error && data) out.push(data as Proposal);
  }
  return out;
}

/**
 * Решение по предложению: условной записью «где ещё new», чтобы две вкладки
 * (или человек и автопилот) не применили одно и то же дважды.
 */
export async function claimProposal(id: number, by: string): Promise<Proposal | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("ads_proposals")
    .update({ status: "applied", decided_at: new Date().toISOString(), decided_by: by })
    .eq("id", id)
    .eq("status", "new")
    .select("*")
    .maybeSingle();
  return (data as Proposal | null) ?? null;
}

export async function setProposalStatus(id: number, status: Proposal["status"], patch: { error?: string | null; decided_by?: string } = {}): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_proposals").update({ status, decided_at: new Date().toISOString(), ...patch }).eq("id", id);
}

/** Старые нерешённые предложения — в «устарело»: данные в них уже не те. */
export async function expireProposals(accountId: string, before: Date): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_proposals").update({ status: "expired" }).eq("account_id", accountId).eq("status", "new").lt("created_at", before.toISOString());
}

export async function recordAction(row: Omit<Action, "id" | "at" | "rolled_back_at">): Promise<Action | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("ads_actions").insert(row).select("*").single();
  return (data as Action | null) ?? null;
}

export async function actionsOf(accountId: string, limit = 50): Promise<Action[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_actions").select("*").eq("account_id", accountId).order("at", { ascending: false }).limit(limit);
  return (data as Action[] | null) ?? [];
}

export async function actionById(id: number): Promise<Action | null> {
  const db = serviceClient();
  if (!db || !Number.isInteger(id)) return null;
  const { data } = await db.from("ads_actions").select("*").eq("id", id).maybeSingle();
  return (data as Action | null) ?? null;
}

/** Пометить откат условной записью: дважды одно и то же не откатится. */
export async function markRolledBack(id: number): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("ads_actions")
    .update({ rolled_back_at: new Date().toISOString() })
    .eq("id", id)
    .is("rolled_back_at", null)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

export async function unmarkRolledBack(id: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_actions").update({ rolled_back_at: null }).eq("id", id);
}

/** Сколько изменений автопилот сделал сам с начала суток по Ташкенту. */
export async function autoActionsToday(accountId: string, now = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db
    .from("ads_actions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("auto", true)
    .is("rollback_of", null)
    .gte("at", tashkentDayStart(now).toISOString());
  return count ?? 0;
}

export function tashkentDayStart(now: Date): Date {
  const shifted = new Date(now.getTime() + 5 * 3600_000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 5 * 3600_000);
}

export async function testsOf(accountId: string, statuses: AdTest["status"][] = ["running"]): Promise<AdTest[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("ads_tests").select("*").eq("account_id", accountId).in("status", statuses).order("started_at", { ascending: false });
  return (data as AdTest[] | null) ?? [];
}

export async function startTest(row: { account_id: string; campaign_id: string; ad_group_id: string; control_ad_id: string; variant_ad_id: string }): Promise<AdTest | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("ads_tests").insert(row).select("*").single();
  return (data as AdTest | null) ?? null;
}

export async function finishTest(id: number, status: AdTest["status"], result: Record<string, unknown>): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_tests").update({ status, result, ended_at: new Date().toISOString() }).eq("id", id);
}

export async function markReportSent(workspaceId: string, at: Date): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("ads_workspaces").update({ last_report_at: at.toISOString() }).eq("id", workspaceId);
}
