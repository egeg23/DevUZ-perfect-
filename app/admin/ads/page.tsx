import Link from "next/link";

import { addAccountAction, addMemberAction, createWorkspaceAction, removeMemberAction } from "@/app/ads/actions";
import { AdminShell } from "@/components/admin/shell";
import { BTN, CARD, H2, INPUT, platformLabel, resultLine, statusLabel } from "@/components/ads/board";
import { adsDict } from "@/content/admin-panel/ads";
import { requireRole } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { accountsOf, adsEnabled, listWorkspaces, membersOf, proposalsOf, workspaceById } from "@/lib/ads/store";

export const dynamic = "force-dynamic";

/**
 * Раздел «Реклама» — автопилот Google Ads и Яндекс Директа. Владельцу и
 * руководителю: здесь заводят кабинеты (студия, агентства-партнёры), людей,
 * которые в них входят через бота, и рекламные кабинеты, включая заглушку
 * для обкатки. Сам кабинет аккаунта — /admin/ads/[account], тот же, что
 * видит агентство на /ads.
 */
export default async function AdsAdminPage({ searchParams }: { searchParams: Promise<{ w?: string; r?: string }> }) {
  const staff = await requireRole("admin", "head");
  const { w, r } = await searchParams;
  const t = pick(adsDict, staff.panel_locale);
  const [workspaces, flagOn] = await Promise.all([listWorkspaces(), adsEnabled()]);
  const current = w ? await workspaceById(w) : null;
  const result = resultLine(t, r, undefined);

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
      {!flagOn ? <p className="mt-2 text-xs text-faint">{t.flagOff}</p> : null}
      {result ? <p className={`mt-3 text-sm ${result.tone === "ok" ? "text-green" : "text-gold"}`}>{result.text}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <section className={CARD}>
          <p className={H2}>{t.workspacesTitle}</p>
          {workspaces.length === 0 ? <p className="mt-2 text-sm text-muted">{t.workspacesEmpty}</p> : null}
          <ul className="mt-3 space-y-1 text-sm">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <Link href={`/admin/ads?w=${ws.id}`} className={ws.id === current?.id ? "text-green" : "hover:text-green"}>
                  {ws.name}
                </Link>
                <span className="ml-2 text-xs text-faint">{ws.kind === "studio" ? t.kindStudio : ws.kind === "agency" ? t.kindAgency : t.kindBusiness}</span>
              </li>
            ))}
          </ul>
          <form action={createWorkspaceAction} className="mt-4 space-y-2 border-t border-line-soft pt-3">
            <p className="text-sm font-medium">{t.newWorkspace}</p>
            <input name="name" placeholder={t.wsName} className={INPUT} required />
            <select name="kind" className={INPUT} aria-label={t.wsKind}>
              <option value="agency">{t.kindAgency}</option>
              <option value="studio">{t.kindStudio}</option>
              <option value="business">{t.kindBusiness}</option>
            </select>
            <select name="locale" className={INPUT} aria-label={t.wsLocale}>
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
            </select>
            <button className={`${BTN} bg-green/90 text-ink hover:bg-green`}>{t.create}</button>
          </form>
        </section>

        {current ? <Workspace id={current.id} name={current.name} t={t} /> : null}
      </div>
    </AdminShell>
  );
}

async function Workspace({ id, name, t }: { id: string; name: string; t: ReturnType<typeof pick<typeof adsDict>> }) {
  const [accounts, members] = await Promise.all([accountsOf(id), membersOf(id)]);
  const waiting = await Promise.all(accounts.map(async (a) => (await proposalsOf(a.id, ["new"])).length));
  return (
    <div className="space-y-4">
      <section className={CARD}>
        <p className={H2}>
          {name} · {t.accountsTitle}
        </p>
        {accounts.length === 0 ? <p className="mt-2 text-sm text-muted">{t.accountsEmpty}</p> : null}
        <ul className="mt-3 space-y-2">
          {accounts.map((a, i) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line-soft pt-2">
              <Link href={`/admin/ads/${a.id}`} className="font-medium hover:text-green">
                {a.name || a.external_id}
              </Link>
              <span className="text-xs text-faint">
                {platformLabel(t, a.platform)} · {statusLabel(t, a.status)} · {t.waiting(waiting[i])}
              </span>
            </li>
          ))}
        </ul>
        <form action={addAccountAction} className="mt-4 grid gap-2 border-t border-line-soft pt-3 sm:grid-cols-2">
          <input type="hidden" name="workspace" value={id} />
          <p className="text-sm font-medium sm:col-span-2">{t.addAccount}</p>
          <select name="platform" className={INPUT} aria-label={t.platform}>
            <option value="stub">{t.platformStub}</option>
            <option value="yandex">{t.platformYandex}</option>
            <option value="google">{t.platformGoogle}</option>
          </select>
          <input name="name" placeholder={t.accName} className={INPUT} />
          <input name="externalId" placeholder={t.externalId} className={INPUT} />
          <select name="currency" className={INPUT} aria-label={t.currency}>
            {["UZS", "USD", "RUB", "KZT", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="sandbox" /> {t.sandbox}
          </label>
          <p className="text-xs text-faint sm:col-span-2">{t.externalIdNote}</p>
          <div className="sm:col-span-2">
            <button className={`${BTN} bg-green/90 text-ink hover:bg-green`}>{t.add}</button>
          </div>
        </form>
      </section>

      <section className={CARD}>
        <p className={H2}>{t.people}</p>
        <p className="mt-1 text-xs text-faint">{t.peopleNote}</p>
        {members.length === 0 ? <p className="mt-2 text-sm text-muted">{t.noPeople}</p> : null}
        <ul className="mt-3 space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span>
                {m.name || "—"} <span className="font-mono text-xs text-faint">{m.telegram_user_id}</span>
              </span>
              <form action={removeMemberAction}>
                <input type="hidden" name="workspace" value={id} />
                <input type="hidden" name="member" value={m.id} />
                <button className="text-xs text-faint hover:text-gold">{t.removeMember}</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addMemberAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="workspace" value={id} />
          <input name="telegramId" placeholder={t.memberId} className={`${INPUT} sm:w-40`} required inputMode="numeric" />
          <input name="name" placeholder={t.memberName} className={`${INPUT} sm:w-48`} />
          <button className={`${BTN} border border-blue-soft/40 text-blue-soft hover:bg-blue-soft/10`}>{t.addMember}</button>
        </form>
      </section>
    </div>
  );
}
