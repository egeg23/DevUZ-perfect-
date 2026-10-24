import Link from "next/link";

import { ContractsToSign } from "@/components/admin/dashboard";
import { AdminShell } from "@/components/admin/shell";
import { contractErrorDict, contractsPageDict } from "@/content/admin-panel/contracts";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { approvesContract } from "@/lib/admin/contracts";
import { pendingContracts } from "@/lib/admin/pulse-store";
import { signatureExists } from "@/lib/admin/signature";
import { uploadSignature } from "@/app/admin/contracts/actions";

export const dynamic = "force-dynamic";

/**
 * Договоры: что ждёт подписи, подпись владельца и объяснение порядка.
 *
 * Сами договоры живут в карточках проектов — там же, где сумма и стадия.
 * Владелец, 23.10.2026, на разбор удобства: «Делаем все сразу» — у раздела
 * не было шапки с меню (из него трудно было вернуться), а «Договоры на
 * подпись» жили на вкладке «Сегодня» «Лидов». Теперь страница — в общем
 * каркасе, и подписывающий видит здесь, что его ждёт. Страницы самого
 * договора и счёта остаются документами без каркаса.
 */
export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const staff = await requireSection("/admin/contracts");
  const locale = staff.panel_locale;
  const t = pick(contractsPageDict, locale);
  const errors = pick(contractErrorDict, locale);
  const { saved, error } = await searchParams;
  // Отказ — кодом (lib/admin/signature.ts); старая ссылка с текстом — как есть.
  const errorText = error
    ? error in errors && typeof errors[error as keyof typeof errors] === "string"
      ? (errors[error as keyof typeof errors] as string)
      : /^[a-z_]+$/.test(error)
        ? errors.failed
        : error
    : null;
  const canApprove = approvesContract(staff.role);
  const [hasSignature, toSign] = await Promise.all([signatureExists(), canApprove ? pendingContracts() : Promise.resolve([])]);

  return (
    <AdminShell staff={staff}>
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t.intro}
        </p>
      </div>

      {/* Что ждёт подписи — первым: ради этого сюда и заходят. */}
      {canApprove ? <ContractsToSign rows={toSign} locale={locale} /> : null}

      {canApprove ? (
        <section className="rounded-2xl border border-line bg-surface px-6 py-5">
          <h2 className="font-semibold">{t.signature}</h2>
          <p className="mt-1 text-sm text-muted">
            {t.signatureNote}
          </p>

          <p className="mt-3 text-sm">
            {hasSignature ? (
              <span className="text-green">{t.signatureLoaded}</span>
            ) : (
              <span className="text-amber-500">{t.noSignature}</span>
            )}
          </p>

          <form action={uploadSignature} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="signature"
              accept="image/png"
              required
              className="text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text"
            />
            <button
              type="submit"
              className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {hasSignature ? t.replace : t.upload}
            </button>
          </form>

          {saved ? <p className="mt-2 text-sm text-green">{t.saved}</p> : null}
          {errorText ? <p className="mt-2 text-sm text-amber-500">{errorText}</p> : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface px-6 py-5 text-sm leading-relaxed text-muted">
        <h2 className="font-semibold text-text">{t.protectsTitle}</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <b className="text-text">{t.arbitrationHead}</b> {t.arbitrationBody}
          </li>
          <li>
            <b className="text-text">{t.liabilityHead}</b> {t.liabilityBody}
          </li>
          <li>
            <b className="text-text">{t.lostProfitHead}</b> {t.lostProfitBody}
          </li>
          <li>
            <b className="text-text">{t.silenceHead}</b> {t.silenceBody}
          </li>
          <li>
            <b className="text-text">{t.rightsHead}</b> {t.rightsBody}
          </li>
        </ul>
        <p className="mt-4 text-xs text-faint">
          {t.lawyerNote}
        </p>
      </section>

      <Link href="/admin/projects" className="inline-block text-sm text-green hover:underline">
        {t.toProjects}
      </Link>
    </div>
    </AdminShell>
  );
}
