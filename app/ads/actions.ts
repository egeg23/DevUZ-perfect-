"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";

import { canUseAccount, canUseWorkspace, staffAdsActor, type AdsActor } from "@/lib/ads/access";
import { simulateDays } from "@/lib/ads/connectors/stub";
import { accountReport } from "@/lib/ads/report";
import { decide, reject, syncAccount, undo } from "@/lib/ads/run";
import {
  accountById,
  addMember,
  createAccount,
  createWorkspace,
  dropCredentials,
  loadStubState,
  proposalById,
  recordAction,
  removeMember,
  saveStubState,
  updateAccount,
  type Account,
} from "@/lib/ads/store";
import type { Platform } from "@/lib/ads/types";

/**
 * Действия кабинета автопилота — одни на кабинет агентства (/ads) и раздел
 * панели (/admin/ads). Каждое само проверяет, кто нажал (lib/ads/access.ts):
 * server action — обычный POST, и отправить его можно мимо страницы.
 * Итог — кодом в адресе, страница показывает строку по нему.
 */

const base = (actor: AdsActor) => (actor.kind === "staff" ? "/admin/ads" : "/ads");
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? Math.round(v) : lo));

function back(actor: AdsActor, accountId: string, result: string, detail?: string): never {
  const q = new URLSearchParams({ r: result });
  if (detail) q.set("d", detail.slice(0, 300));
  redirect(`${base(actor)}/${accountId}?${q}`);
}

async function account(formData: FormData) {
  const access = await canUseAccount(str(formData, "account"));
  if (!access) redirect("/ads");
  return access;
}

export async function saveSettingsAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const mode = str(formData, "mode") === "auto" ? "auto" : "suggest";
  const num = (k: string) => Number(str(formData, k).replace(/\s/g, "").replace(",", "."));
  const target = num("targetCpa");
  const settings = {
    ...acc.settings,
    wasteCost: Math.max(0, num("wasteCost") || 0),
    wasteClicks: clamp(num("wasteClicks"), 1, 1000),
    targetCpa: target > 0 ? target : null,
    protectedWords: str(formData, "protectedWords").split(",").map((w) => w.trim()).filter(Boolean).slice(0, 100),
    business: str(formData, "business").slice(0, 500),
  };
  const patch = { mode, max_shift_pct: clamp(num("maxShift"), 0, 30), max_actions_day: clamp(num("maxActions"), 0, 100), settings } as const;
  await updateAccount(acc.id, patch);
  await journalSettings(acc, actor, { mode: acc.mode, max_shift_pct: acc.max_shift_pct, max_actions_day: acc.max_actions_day }, { mode, max_shift_pct: patch.max_shift_pct, max_actions_day: patch.max_actions_day });
  back(actor, acc.id, "saved");
}

export async function toggleStopAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const stopped = !acc.stopped;
  await updateAccount(acc.id, { stopped });
  await journalSettings(acc, actor, { stopped: acc.stopped }, { stopped });
  back(actor, acc.id, "saved");
}

/** Режим, лимиты и стоп-кран — тоже в журнал: кто включил «сам», видно потом. */
async function journalSettings(acc: Account, actor: AdsActor, before: Record<string, unknown>, after: Record<string, unknown>) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  await recordAction({
    account_id: acc.id,
    proposal_id: null,
    kind: "settings",
    actor: actor.label,
    auto: false,
    why: `Настройки: ${Object.keys(after).map((k) => `${k} ${String(before[k])} → ${String(after[k])}`).join(", ")}`,
    before,
    after,
    rollback_of: null,
  });
}

export async function acceptAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const proposal = await proposalById(Number(str(formData, "proposal")));
  if (!proposal || proposal.account_id !== acc.id) back(actor, acc.id, "error");
  const outcome = await decide(acc, proposal, "human", actor.label);
  if (outcome.ok) back(actor, acc.id, "applied");
  back(actor, acc.id, "refused", outcome.reason);
}

export async function rejectAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const proposal = await proposalById(Number(str(formData, "proposal")));
  if (!proposal || proposal.account_id !== acc.id) back(actor, acc.id, "error");
  await reject(proposal, actor.label);
  back(actor, acc.id, "rejected");
}

export async function rollbackAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const { actionById } = await import("@/lib/ads/store");
  const action = await actionById(Number(str(formData, "action")));
  if (!action || action.account_id !== acc.id) back(actor, acc.id, "error");
  const outcome = await undo(action.id, actor.label);
  if (outcome.ok) back(actor, acc.id, "rolled");
  back(actor, acc.id, "refused", outcome.reason);
}

/** Обновить сейчас — фоном после ответа: забор отчётов не держит страницу. */
export async function syncNowAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  after(async () => {
    const fresh = await accountById(acc.id);
    if (fresh) await syncAccount(fresh).catch((error) => console.error("ads sync:", error));
  });
  back(actor, acc.id, "sync");
}

export async function sendReportAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  const locale = actor.locale === "uz" ? "uz" : "ru";
  const text = await accountReport(acc, locale, new Date());
  const { sendMessage } = await import("@/lib/qualify/telegram");
  const ok = await sendMessage(actor.telegramId, text);
  back(actor, acc.id, ok ? "report" : "error");
}

export async function disconnectAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  await dropCredentials(acc.id);
  back(actor, acc.id, "saved");
}

/** Заглушка: прокрутить неделю, чтобы тест объявлений набрал показы. Только студии. */
export async function simulateAction(formData: FormData) {
  const { account: acc, actor } = await account(formData);
  if (actor.kind !== "staff" || acc.platform !== "stub") back(actor, acc.id, "error");
  const state = await loadStubState(acc.id);
  if (state) await saveStubState(acc.id, simulateDays(state, 7));
  back(actor, acc.id, "saved");
}

/* ── Кабинеты и люди ───────────────────────────────────────────────────── */

const PLATFORMS: readonly Platform[] = ["yandex", "google", "stub"];
const CURRENCIES = ["UZS", "USD", "RUB", "KZT", "EUR"];

export async function addAccountAction(formData: FormData) {
  const workspaceId = str(formData, "workspace");
  const actor = await canUseWorkspace(workspaceId);
  if (!actor) redirect("/ads");
  const platform = str(formData, "platform") as Platform;
  if (!PLATFORMS.includes(platform)) redirect(actor.kind === "staff" ? `/admin/ads?w=${workspaceId}` : "/ads");
  // Заглушку заводит только студия: агентству она ни к чему.
  if (platform === "stub" && actor.kind !== "staff") redirect("/ads");
  const currency = CURRENCIES.includes(str(formData, "currency")) ? str(formData, "currency") : "UZS";
  const created = await createAccount({
    workspaceId,
    platform,
    name: str(formData, "name") || (platform === "stub" ? "Учебный центр (заглушка)" : platform === "google" ? "Google Ads" : "Яндекс Директ"),
    externalId: platform === "google" ? str(formData, "externalId").replace(/[^\d]/g, "") : str(formData, "externalId"),
    currency,
    sandbox: platform === "yandex" && formData.get("sandbox") === "on",
  });
  if (!created) redirect(actor.kind === "staff" ? `/admin/ads?w=${workspaceId}&r=error` : "/ads?r=error");
  redirect(`${base(actor)}/${created.id}`);
}

export async function createWorkspaceAction(formData: FormData) {
  const actor = await staffAdsActor();
  if (!actor) redirect("/admin");
  const name = str(formData, "name");
  const kind = str(formData, "kind");
  const ws = name
    ? await createWorkspace({
        name,
        kind: kind === "studio" || kind === "business" ? kind : "agency",
        locale: str(formData, "locale") === "uz" ? "uz" : "ru",
        createdBy: null,
      })
    : null;
  redirect(ws ? `/admin/ads?w=${ws.id}` : "/admin/ads?r=error");
}

export async function addMemberAction(formData: FormData) {
  const actor = await staffAdsActor();
  if (!actor) redirect("/admin");
  const workspaceId = str(formData, "workspace");
  const id = Number(str(formData, "telegramId"));
  const ok = Number.isSafeInteger(id) && id > 0 && (await addMember(workspaceId, id, str(formData, "name")));
  redirect(`/admin/ads?w=${workspaceId}&r=${ok ? "saved" : "error"}`);
}

export async function removeMemberAction(formData: FormData) {
  const actor = await staffAdsActor();
  if (!actor) redirect("/admin");
  const workspaceId = str(formData, "workspace");
  await removeMember(workspaceId, str(formData, "member"));
  redirect(`/admin/ads?w=${workspaceId}&r=saved`);
}

