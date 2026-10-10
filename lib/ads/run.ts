import { judge, winnerDraft } from "@/lib/ads/abtest";
import { alertText, detectAlerts } from "@/lib/ads/alerts";
import { applyPayload, rollback } from "@/lib/ads/apply";
import { budgetDrafts } from "@/lib/ads/budget";
import { classifyQueries, groupLang, writeVariant } from "@/lib/ads/model";
import { negativeDrafts, type NegativeCandidate } from "@/lib/ads/negatives";
import {
  accountById,
  accountsOf,
  actionById,
  actionsOf,
  adsEnabled,
  autoActionsToday,
  claimProposal,
  connectorFor,
  expireProposals,
  finishTest,
  insertProposals,
  limitsOf,
  listWorkspaces,
  markRolledBack,
  membersOf,
  proposalById,
  proposalsOf,
  reconcileAlerts,
  recordAction,
  setProposalStatus,
  startTest,
  testsOf,
  thresholdsOf,
  unmarkRolledBack,
  updateAccount,
  workspaceById,
  type Account,
  type Proposal,
  type StoredAlert,
} from "@/lib/ads/store";
import type { AdsConnector, Draft, Period } from "@/lib/ads/types";

/**
 * Проход автопилота по кабинету: забрать отчёты → предложения → (в режиме
 * «сам») применить в пределах ограничителей → сказать людям.
 *
 * Зовётся фоном из свипа (`runAdsPass`, раз в сутки на кабинет) и кнопкой
 * «Обновить сейчас». Тяжёлого здесь нет: несколько запросов к API площадки
 * и два-три вызова дешёвой модели, — сборок и пересчётов на сервере нет.
 */

export const PERIOD_DAYS = 30;
/** Кабинет обновляется не чаще раза в столько часов. */
export const SYNC_EVERY_H = 20;
/** Кабинетов за один проход свипа: остальные — в следующие пять минут. */
export const ACCOUNTS_PER_PASS = 3;
/** Нерешённое предложение старше — устарело. */
export const PROPOSAL_TTL_DAYS = 14;
/** Новых тестов объявлений за один проход: каждый — вызов модели. */
export const NEW_TESTS_PER_SYNC = 2;
/** Показов у объявления за период, чтобы тест был осмысленным. */
export const TEST_MIN_IMPRESSIONS = 1000;
/** Бюджет одной кампании двигаем не чаще раза в столько дней: площадке нужно время показать итог. */
export const BUDGET_COOLDOWN_DAYS = 3;

export function periodOf(now: Date, days = PERIOD_DAYS): Period {
  const to = new Date(now.getTime() - 24 * 3600_000);
  const from = new Date(to.getTime() - (days - 1) * 24 * 3600_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const daysBetween = (from: string, now: Date) => Math.floor((now.getTime() - Date.parse(from)) / (24 * 3600_000));

export type SyncResult = { accountId: string; created: number; applied: number; refused: string[]; alerts?: number; error?: string };

export async function syncAccount(account: Account, now = new Date(), deps: { useModel?: boolean } = {}): Promise<SyncResult> {
  const result: SyncResult = { accountId: account.id, created: 0, applied: 0, refused: [] };
  const connector = await connectorFor(account);
  if (!connector) {
    await updateAccount(account.id, { status: "disconnected", last_error: "Нет ключа доступа — подключите кабинет заново." });
    return { ...result, error: "no-credentials" };
  }
  const period = periodOf(now);
  try {
    const drafts = await buildDrafts(account, connector, period, now, deps.useModel ?? true);
    await expireProposals(account.id, new Date(now.getTime() - PROPOSAL_TTL_DAYS * 24 * 3600_000));
    const created = await insertProposals(account.id, drafts);
    result.created = created.length;

    if (account.mode === "auto" && !account.stopped) {
      for (const proposal of created) {
        const outcome = await decide(account, proposal, "auto", "автопилот", connector, period, now);
        if (outcome.ok) result.applied += 1;
        else result.refused.push(outcome.reason);
      }
    }
    // Тревоги — после предложений: они смотрят на вчерашний день, а не на месяц.
    const fresh = await checkAlerts(account, connector, now).catch((error) => {
      console.error("ads alerts:", error);
      return [] as StoredAlert[];
    });
    result.alerts = fresh.length;
    await updateAccount(account.id, { status: "ok", last_error: null, last_sync_at: now.toISOString() });
    await notifyMembers(account, created, result);
    await notifyAlerts(account, fresh);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateAccount(account.id, { status: "error", last_error: message.slice(0, 500), last_sync_at: now.toISOString() });
    result.error = message;
  }
  return result;
}

export async function buildDrafts(account: Account, connector: AdsConnector, period: Period, now: Date, useModel: boolean): Promise<Draft[]> {
  const thresholds = thresholdsOf(account);
  const [campaigns, terms, keywords, ads] = await Promise.all([
    connector.campaigns(period),
    connector.searchTerms(period),
    connector.keywords(),
    connector.ads(period),
  ]);
  const names = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));
  const withTerms = [...new Set(terms.map((t) => t.campaignId))].filter((id) => campaigns.some((c) => c.id === id && c.active));
  const existing: Record<string, string[]> = {};
  for (const id of withTerms) existing[id] = await connector.negatives(id);
  const liveTerms = terms.filter((t) => withTerms.includes(t.campaignId));

  // Модель — только по запросам, которые правила не взяли, и только если есть ключи.
  const extra: Record<string, NegativeCandidate[]> = {};
  if (useModel && liveTerms.length && keywords.length) {
    for (const id of withTerms) {
      const own = liveTerms.filter((t) => t.campaignId === id);
      const kws = keywords.filter((k) => k.campaignId === id).map((k) => k.text);
      extra[id] = await classifyQueries({ business: thresholds.business, keywords: kws, protectedWords: thresholds.protectedWords, terms: own }).catch(() => []);
    }
  }

  // Кампании, чей бюджет менялся недавно (нами или откатом), — пока в покое.
  const cooling = recentlyMoved(await actionsOf(account.id, 100), now);
  const drafts: Draft[] = [
    ...negativeDrafts({ terms: liveTerms, keywords, existing, campaignNames: names, thresholds, extra, days: PERIOD_DAYS, currency: account.currency }),
    ...budgetDrafts({ campaigns: campaigns.filter((c) => !cooling.has(c.id)), maxShiftPct: account.max_shift_pct, currency: account.currency, days: PERIOD_DAYS }),
  ];

  // Идущие тесты: итог — предложение оставить победителя.
  const running = await testsOf(account.id);
  for (const test of running) {
    const control = ads.find((a) => a.id === test.control_ad_id);
    const variant = ads.find((a) => a.id === test.variant_ad_id);
    if (!control || !variant) continue;
    const verdict = judge(control, variant, daysBetween(test.started_at, now));
    if (verdict.state !== "running") drafts.push(winnerDraft({ testId: test.id, control, variant, verdict }));
  }

  // Новые тесты: группа с одним живым объявлением, с показами, без идущего теста.
  if (useModel) {
    const busy = new Set(running.map((t) => t.ad_group_id));
    const open = await proposalsOf(account.id, ["new"]);
    for (const p of open) if (p.payload.kind === "ad_test") busy.add(p.payload.adGroupId);
    const groups = new Map<string, typeof ads>();
    for (const ad of ads.filter((a) => a.active)) groups.set(ad.adGroupId, [...(groups.get(ad.adGroupId) ?? []), ad]);
    let made = 0;
    for (const [group, list] of groups) {
      if (made >= NEW_TESTS_PER_SYNC) break;
      const control = list[0];
      if (list.length !== 1 || busy.has(group) || control.impressions < TEST_MIN_IMPRESSIONS) continue;
      if (!campaigns.some((c) => c.id === control.campaignId && c.active)) continue;
      const kws = keywords.filter((k) => k.adGroupId === group).map((k) => k.text);
      const lang = groupLang(kws);
      const copy = await writeVariant({ platform: connector.platform === "google" ? "google" : "yandex", lang, current: control.copy, keywords: kws }).catch(() => null);
      made += 1;
      if (!copy) continue;
      drafts.push({
        kind: "ad_test",
        dedupeKey: `test:${group}`,
        title: `Тест объявлений в «${names[control.campaignId] ?? control.campaignId}»`,
        why:
          `В группе одно объявление, ${control.impressions} показов за ${PERIOD_DAYS} дн. Ставим рядом новый вариант: ` +
          `«${copy.headlines.join(" | ")}». Через 10–45 дней оставим того, кто приводит больше заявок, второй — на паузу.`,
        numbers: { impressions: control.impressions },
        payload: { kind: "ad_test", campaignId: control.campaignId, adGroupId: group, controlAdId: control.id, copy, lang },
      });
    }
  }
  return drafts;
}

export function recentlyMoved(actions: { kind: string; at: string; after: Record<string, unknown> }[], now: Date): Set<string> {
  const since = now.getTime() - BUDGET_COOLDOWN_DAYS * 24 * 3600_000;
  const out = new Set<string>();
  for (const a of actions) {
    if (a.kind !== "budget" || Date.parse(a.at) < since) continue;
    for (const b of (a.after.budgets as { campaignId: string }[] | undefined) ?? []) out.add(b.campaignId);
  }
  return out;
}

/**
 * Принять предложение: проверить, применить, записать в журнал. Отказ
 * ограничителя — предложение остаётся «новым» (человек может нажать снова,
 * когда, например, снимет стоп-кран), сбой площадки — «не вышло».
 */
export async function decide(
  account: Account,
  proposal: Proposal,
  actor: "human" | "auto",
  who: string,
  connector?: AdsConnector | null,
  period = periodOf(new Date()),
  now = new Date(),
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const conn = connector ?? (await connectorFor(account));
  if (!conn) return { ok: false, reason: "Нет ключа доступа к кабинету." };
  const claimed = await claimProposal(proposal.id, who);
  if (!claimed) return { ok: false, reason: "Предложение уже решено." };
  try {
    const outcome = await applyPayload({
      connector: conn,
      platform: account.platform,
      limits: limitsOf(account),
      actor,
      actionsToday: await autoActionsToday(account.id, now),
      payload: proposal.payload,
      period,
    });
    if (!outcome.ok) {
      await setProposalStatus(proposal.id, "new", { error: outcome.reason });
      return outcome;
    }
    await recordAction({
      account_id: account.id,
      proposal_id: proposal.id,
      kind: proposal.kind,
      actor: who,
      auto: actor === "auto",
      why: `${proposal.title}. ${proposal.why}`,
      before: outcome.before,
      after: outcome.after,
      rollback_of: null,
    });
    if (proposal.payload.kind === "ad_test" && outcome.variantAdId) {
      await startTest({
        account_id: account.id,
        campaign_id: proposal.payload.campaignId,
        ad_group_id: proposal.payload.adGroupId,
        control_ad_id: proposal.payload.controlAdId,
        variant_ad_id: outcome.variantAdId,
      });
    }
    if (proposal.payload.kind === "ad_winner") {
      const p = proposal.payload;
      const tests = await testsOf(account.id);
      const test = tests.find((t) => t.id === p.testId);
      if (test) await finishTest(test.id, p.winnerAdId === test.variant_ad_id ? "won" : "lost", { numbers: proposal.numbers });
    }
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await setProposalStatus(proposal.id, "failed", { error: reason.slice(0, 500) });
    return { ok: false, reason };
  }
}

export async function reject(proposal: Proposal, who: string): Promise<void> {
  if (proposal.status !== "new") return;
  await setProposalStatus(proposal.id, "rejected", { decided_by: who });
}

/** Откат записи журнала — одним действием. */
export async function undo(actionId: number, who: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const action = await actionById(actionId);
  if (!action || action.rollback_of !== null) return { ok: false, reason: "Этого действия нет или это сам откат." };
  const account = await accountById(action.account_id);
  if (!account) return { ok: false, reason: "Кабинета нет." };
  const connector = await connectorFor(account);
  if (!connector) return { ok: false, reason: "Нет ключа доступа к кабинету." };
  if (!(await markRolledBack(action.id))) return { ok: false, reason: "Уже откачено." };
  try {
    const outcome = await rollback({ connector, kind: action.kind, before: action.before, after: action.after, period: periodOf(new Date()) });
    if (!outcome.ok) {
      await unmarkRolledBack(action.id);
      return outcome;
    }
    await recordAction({
      account_id: account.id,
      proposal_id: action.proposal_id,
      kind: action.kind,
      actor: who,
      auto: false,
      why: `Откат: ${action.why}`,
      before: outcome.before,
      after: outcome.after,
      rollback_of: action.id,
    });
    if (action.proposal_id) await setProposalStatus(action.proposal_id, "rolled_back");
    if (action.kind === "ad_test") {
      const test = (await testsOf(account.id)).find((t) => t.variant_ad_id === String(action.after.variantAdId));
      if (test) await finishTest(test.id, "stopped", { rolledBack: true });
    }
    return { ok: true };
  } catch (error) {
    await unmarkRolledBack(action.id);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/* ── Тревоги ───────────────────────────────────────────────────────────── */

/** Вчера и семь дней до него — по Ташкенту не важно: площадки считают в своём поясе. */
export function alertPeriods(now: Date): { yesterday: Period; week: Period } {
  const day = 24 * 3600_000;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const y = new Date(now.getTime() - day);
  return {
    yesterday: { from: iso(y), to: iso(y) },
    week: { from: iso(new Date(y.getTime() - 7 * day)), to: iso(new Date(y.getTime() - day)) },
  };
}

export async function checkAlerts(account: Account, connector: AdsConnector, now: Date): Promise<StoredAlert[]> {
  const p = alertPeriods(now);
  const [yesterday, week, ads, keywords] = await Promise.all([
    connector.campaigns(p.yesterday),
    connector.campaigns(p.week),
    connector.ads(p.yesterday),
    connector.keywords(),
  ]);
  const negatives: Record<string, string[]> = {};
  for (const c of week.filter((c) => c.active)) negatives[c.id] = await connector.negatives(c.id);
  return reconcileAlerts(account.id, detectAlerts({ yesterday, week, ads, keywords, negatives }), now);
}

export function alertsNotice(account: Pick<Account, "name" | "external_id" | "currency">, alerts: Pick<StoredAlert, "kind" | "data">[], locale: "ru" | "uz"): string | null {
  if (!alerts.length) return null;
  const name = escHtml(account.name || account.external_id);
  const head = locale === "uz" ? `<b>⚠️ Reklama avtopiloti: «${name}»</b>` : `<b>⚠️ Автопилот рекламы: «${name}»</b>`;
  return [head, ...alerts.slice(0, 8).map((a) => `• ${escHtml(alertText(a, locale, account.currency))}`)].join("\n");
}

async function notifyAlerts(account: Account, alerts: StoredAlert[]): Promise<void> {
  if (!alerts.length) return;
  const workspace = await workspaceById(account.workspace_id);
  if (!workspace) return;
  const text = alertsNotice(account, alerts, workspace.locale);
  if (!text) return;
  const { sendWithButtons } = await import("@/lib/qualify/telegram");
  const button = workspace.locale === "uz" ? "Kabinetni ochish" : "Открыть кабинет";
  for (const member of await membersOf(workspace.id)) {
    if (member.notify) await sendWithButtons(member.telegram_user_id, text, [{ text: button, url: cabinetUrl(account.id) }]);
  }
}

/* ── Люди ──────────────────────────────────────────────────────────────── */

export function cabinetUrl(accountId?: string): string {
  // Ленивая ссылка: siteUrl тянет за собой настройки сайта, а тестам run.ts это ни к чему.
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://devuz.studio";
  return `${base}/ads${accountId ? `/${accountId}` : ""}`;
}

export function syncNotice(account: Account, created: Proposal[], result: SyncResult, locale: "ru" | "uz"): string | null {
  if (!created.length && !result.applied) return null;
  const name = escHtml(account.name || account.external_id);
  if (locale === "uz") {
    return (
      `<b>Reklama avtopiloti: «${name}»</b>\n` +
      (result.applied ? `O‘zi qo‘lladi: ${result.applied}. Jurnalda bir tugma bilan qaytarish mumkin.\n` : "") +
      (created.length - result.applied > 0 ? `Tasdiqlashingizni kutmoqda: ${created.length - result.applied}.` : "")
    ).trim();
  }
  return (
    `<b>Автопилот рекламы: «${name}»</b>\n` +
    (result.applied ? `Применил сам: ${result.applied}. Откатить можно одной кнопкой в журнале.\n` : "") +
    (created.length - result.applied > 0 ? `Ждут вашего решения: ${created.length - result.applied}.\n` : "") +
    created
      .slice(0, 5)
      .map((p) => `• ${escHtml(p.title)}`)
      .join("\n")
  ).trim();
}

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function notifyMembers(account: Account, created: Proposal[], result: SyncResult): Promise<void> {
  const workspace = await workspaceById(account.workspace_id);
  if (!workspace) return;
  const text = syncNotice(account, created, result, workspace.locale);
  if (!text) return;
  const { sendWithButtons } = await import("@/lib/qualify/telegram");
  const button = workspace.locale === "uz" ? "Kabinetni ochish" : "Открыть кабинет";
  for (const member of await membersOf(workspace.id)) {
    if (member.notify) await sendWithButtons(member.telegram_user_id, text, [{ text: button, url: cabinetUrl(account.id) }]);
  }
}

/* ── Фоновый проход ────────────────────────────────────────────────────── */

/**
 * Из свипа, раз в пять минут: кабинеты, которые давно не обновлялись, — по
 * три за проход; в понедельник утром — недельный отчёт. Флаг выключен —
 * ничего, один запрос к хранилищу секретов.
 */
export async function runAdsPass(now = new Date()): Promise<{ synced: SyncResult[]; reports: number }> {
  if (!(await adsEnabled())) return { synced: [], reports: 0 };
  const synced: SyncResult[] = [];
  const workspaces = await listWorkspaces();
  const due: Account[] = [];
  for (const ws of workspaces) {
    for (const account of await accountsOf(ws.id)) {
      if (account.status === "disconnected") continue;
      if (account.platform !== "stub" && !account.has_credentials) continue;
      const last = account.last_sync_at ? Date.parse(account.last_sync_at) : 0;
      if (now.getTime() - last >= SYNC_EVERY_H * 3600_000) due.push(account);
    }
  }
  for (const account of due.slice(0, ACCOUNTS_PER_PASS)) synced.push(await syncAccount(account, now));

  const { sendWeeklyReports } = await import("@/lib/ads/report");
  const reports = await sendWeeklyReports(now, workspaces);
  return { synced, reports };
}

export { proposalById };
