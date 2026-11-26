"use client";

import { useActionState, useState } from "react";

import { createOrgAction, reissueOrgKeyAction, updateOrgAction, type OrgKeyState } from "@/app/admin/callhelper/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { callhelperDict } from "@/content/admin-panel/callhelper";
import type { OrgRowView } from "@/lib/callhelper/orgs-admin";
import { ORG_PLANS } from "@/lib/callhelper/orgs";

const FIELD = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text focus:border-green/60 focus:outline-none";
const SMALL = "rounded-lg border border-line bg-surface px-2 py-1 text-sm text-text focus:border-green/60 focus:outline-none";
const BTN = "rounded-lg bg-green px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-60";
const QUIET = "rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-text disabled:opacity-60";

const day = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 3 * 3600_000).toISOString().slice(0, 10) : "");

/**
 * «Колл-центры и ключи» в разделе DevUz CallHelper — только владельцу.
 * Ключ приходит один раз в ответе формы (createOrgAction, reissueOrgKeyAction)
 * и живёт только в памяти этой вкладки.
 */
export function CallHelperOrgs({ rows, result, docsHref, extHref }: { rows: OrgRowView[]; result: string | null; docsHref: string; extHref: string }) {
  const t = usePanelDict(callhelperDict);
  const [made, create, creating] = useActionState<OrgKeyState, FormData>(createOrgAction, null);
  const [again, reissue, reissuing] = useActionState<OrgKeyState, FormData>(reissueOrgKeyAction, null);
  const [copied, setCopied] = useState("");
  const shown = [again, made].find((s): s is Extract<OrgKeyState, { ok: true }> => !!s && s.ok);
  const error = [again, made].find((s): s is Extract<OrgKeyState, { ok: false }> => !!s && !s.ok);

  async function copy(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
    } catch {
      setCopied("");
    }
  }

  return (
    <section id="orgs" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">{t.orgsTitle}</h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
        {t.orgsLead}{" "}
        <a href={docsHref} target="_blank" rel="noopener noreferrer" className="text-green underline-offset-2 hover:underline">
          {t.orgApiDocs}
        </a>
        {" · "}
        <a href={extHref} target="_blank" rel="noopener noreferrer" className="text-green underline-offset-2 hover:underline">
          {t.orgExtDocs}
        </a>
      </p>

      {result ? (
        <p data-result={result === "saved" ? "ok" : "warn"} className={`mt-3 text-sm ${result === "saved" ? "text-green" : "text-gold"}`}>
          {t.orgResult(result)}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-gold">
          {t.orgError(error.error)}
        </p>
      ) : null}
      {shown ? (
        <div role="status" className="mt-3 rounded-xl border border-green/40 bg-green/10 p-3">
          <p className="text-sm">{t.orgKeyOnce(shown.name)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg bg-ink/60 px-2 py-1 font-mono text-xs">{shown.key}</code>
            <button type="button" onClick={() => copy(shown.key)} className={QUIET}>
              {copied === shown.key ? t.orgCopied : t.orgCopy}
            </button>
          </div>
        </div>
      ) : null}

      <form action={create} className="mt-3 grid gap-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-medium text-text">
          {t.orgName}
          <input name="name" required maxLength={160} className={`${FIELD} mt-1`} />
        </label>
        <label className="text-xs font-medium text-text">
          {t.orgContact}
          <input name="contact" maxLength={200} className={`${FIELD} mt-1`} />
        </label>
        <label className="text-xs font-medium text-text">
          {t.orgPlan}
          <select name="plan" defaultValue="trial" className={`${FIELD} mt-1`}>
            {ORG_PLANS.map((p) => (
              <option key={p} value={p}>
                {t.orgPlanName(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-text">
          {t.orgSeats}
          <input name="operators" type="number" min={1} max={5000} defaultValue={1} className={`${FIELD} mt-1`} />
        </label>
        <button type="submit" disabled={creating} className={BTN}>
          {creating ? t.orgCreating : t.orgCreate}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.orgsEmpty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[820px]">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">{t.orgName}</th>
                <th className="py-1 pr-3 font-medium">{t.orgKey}</th>
                <th className="py-1 pr-3 font-medium">{t.orgUsed}</th>
                <th className="py-1 font-medium">{t.orgPlan}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td data-label={t.orgName} className="py-2 pr-3">
                    <span className="font-medium">{r.name}</span>
                    {r.contact ? <span className="block text-xs text-muted">{r.contact}</span> : null}
                    <span className={`block text-xs ${r.access === "ok" ? "text-green" : "text-gold"}`}>{t.orgAccess(r.access)}</span>
                  </td>
                  <td data-label={t.orgKey} className="py-2 pr-3">
                    <span className="font-mono text-xs text-muted">chk_…{r.keyHint}</span>
                    <form
                      action={reissue}
                      onSubmit={(e) => {
                        if (!window.confirm(t.orgReissueSure)) e.preventDefault();
                      }}
                      className="mt-1"
                    >
                      <input type="hidden" name="org" value={r.id} />
                      <input type="hidden" name="name" value={r.name} />
                      <button type="submit" disabled={reissuing} className="text-xs text-muted underline-offset-2 hover:text-text hover:underline">
                        {t.orgReissue}
                      </button>
                    </form>
                  </td>
                  <td data-label={t.orgUsed} className="whitespace-nowrap py-2 pr-3 text-xs">
                    {r.usedMinutes}
                    {r.minutesLeft !== null ? <span className="text-muted"> / +{r.minutesLeft}</span> : null}
                  </td>
                  <td data-label={t.orgPlan} className="py-2">
                    <form action={updateOrgAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="org" value={r.id} />
                      <select name="plan" defaultValue={r.plan} aria-label={t.orgPlan} className={SMALL}>
                        {ORG_PLANS.map((p) => (
                          <option key={p} value={p}>
                            {t.orgPlanName(p)}
                          </option>
                        ))}
                      </select>
                      <input name="operators" type="number" min={1} max={5000} defaultValue={r.operators} aria-label={t.orgSeats} className={`${SMALL} w-20`} />
                      <input name="paid_until" type="date" defaultValue={day(r.paidUntil)} aria-label={t.orgPaidUntil} title={t.orgPaidUntil} className={SMALL} />
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input type="checkbox" name="active" defaultChecked={r.active} />
                        {t.orgActive}
                      </label>
                      <button type="submit" className={QUIET}>
                        {t.orgSave}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
