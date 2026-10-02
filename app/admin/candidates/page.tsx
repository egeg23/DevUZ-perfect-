import { redirect } from "next/navigation";

import { dropCandidateAction, reviewResumeAction } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { when } from "@/components/admin/lead-table";
import { candidateErrorDict, candidatesDict, verdictDict } from "@/content/admin-panel/candidates";
import { requireStaff } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { canSee } from "@/lib/admin/roles";
import { MAX_PDF_BYTES } from "@/lib/hiring/pdf";
import type { Verdict } from "@/lib/hiring/resume";
import { listCandidates } from "@/lib/hiring/store";

export const dynamic = "force-dynamic";

/**
 * Разбор резюме перед собеседованием.
 *
 * Владелец: «хочу новую вкладку — анализ кандидатов. Туда загружается PDF, и
 * ты выдаёшь такой же отчёт, как сделал ранее… это для оценки пригодности
 * сотрудника для работы у нас. Доступен руководителям и мне, не менеджерам».
 *
 * Отчёт устроен так же, как тот, что писался руками: вердикт первой строкой,
 * сильные стороны и стопы рядом, факты из резюме, вопросы на собеседование по
 * одному на каждый стоп и способ проверить делом. Порядок не случаен — он
 * повторяет порядок решения: брать или нет → почему → что спросить → как
 * убедиться.
 *
 * Сам файл никуда не сохраняется. Резюме — это чужие персональные данные, и
 * для решения нужен разбор, а не PDF на нашем диске.
 */

const TONE: Record<Verdict, { chip: string; card: string }> = {
  yes: { chip: "border-green/40 bg-green/10 text-green", card: "border-green/30" },
  conditional: { chip: "border-gold/40 bg-gold/10 text-gold", card: "border-gold/25" },
  no: { chip: "border-red-400/40 bg-red-500/10 text-red-300", card: "border-line" },
};

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; d?: string; open?: string }>;
}) {
  const staff = await requireStaff();
  // Меню такую вкладку менеджеру не покажет, но адрес можно набрать руками.
  if (!canSee(staff.role, "/admin/candidates")) redirect("/admin");

  const { e, d, open } = await searchParams;
  const rows = await listCandidates();
  const locale = staff.panel_locale;
  const t = pick(candidatesDict, locale);
  const verdict = pick(verdictDict, locale);
  const errors = pick(candidateErrorDict, locale);
  // Причина — кодом из действия; у «запретных оснований» пояснение
  // вставляется в саму фразу, у остальных — строкой под ней.
  const error = !e
    ? null
    : e === "forbidden"
      ? errors.forbidden(d ?? "")
      : e in errors
        ? (errors[e as keyof typeof errors] as string)
        : errors.unknown;
  const errorDetail = e && e !== "forbidden" ? d : undefined;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {t.intro}
      </p>

      <div className="mt-6 rounded-xl border border-line bg-surface px-5 py-5">
        <form action={reviewResumeAction} className="space-y-4">
          <label className="block text-xs uppercase tracking-wider text-faint">
            {t.roleLabel}
            <input
              name="role"
              required
              defaultValue={t.roleDefault}
              className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-text"
            />
          </label>

          <label className="block text-xs uppercase tracking-wider text-faint">
            {t.resumeLabel}
            <input
              type="file"
              name="resume"
              accept="application/pdf,.pdf"
              required
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel={t.reading} base="rounded-xl px-4 py-2 text-sm font-semibold">
              {t.review}
            </SubmitButton>
            <span className="text-xs text-faint">
              {t.sizeNote(Math.round(MAX_PDF_BYTES / 1024 / 1024))}
            </span>
          </div>
        </form>

        {error ? (
          <p className="mt-4 text-sm text-gold">
            {error}
            {errorDetail ? <span className="mt-1 block font-mono text-xs opacity-80">{errorDetail}</span> : null}
          </p>
        ) : null}
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-faint">
        {t.privacy}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-faint">{t.empty}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              id={`k-${row.id}`}
              className={`scroll-mt-24 rounded-xl border bg-surface px-5 py-5 ${TONE[row.verdict].card} ${
                open === row.id ? "ring-1 ring-green/40" : ""
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-base font-semibold">{row.name}</span>
                <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${TONE[row.verdict].chip}`}>
                  {verdict[row.verdict]}
                </span>
                <span className="text-xs text-faint">
                  {row.role}
                  {row.author ? ` · ${row.author}` : ""} · {when(row.createdAt, locale)}
                </span>
              </div>

              <p className="mt-3 text-[1.02rem] font-semibold leading-snug">{row.headline}</p>
              {row.report.why ? (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{row.report.why}</p>
              ) : null}
              {row.wants ? (
                <p className="mt-2 text-xs text-faint">{t.wants} {row.wants}</p>
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-faint">{t.strengths}</h3>
                  <ul className="mt-2 space-y-2.5">
                    {row.report.strengths.map((s) => (
                      <li key={s.title} className="text-sm leading-relaxed">
                        <span className="text-green">+ </span>
                        <span className="font-medium">{s.title}</span>
                        <span className="block pl-4 text-[0.88rem] text-muted">{s.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-faint">{t.stops}</h3>
                  <ul className="mt-2 space-y-2.5">
                    {row.report.stops.map((s) => (
                      <li key={s.title} className="text-sm leading-relaxed">
                        <span className="text-red-300">– </span>
                        <span className="font-medium">{s.title}</span>
                        <span className="block pl-4 text-[0.88rem] text-muted">{s.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {row.report.facts.length ? (
                <div className="mt-5">
                  <h3 className="text-xs uppercase tracking-wider text-faint">{t.facts}</h3>
                  <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {row.report.facts.map((f) => (
                      <div key={f.label} className="text-sm">
                        <dt className="inline text-faint">{f.label}: </dt>
                        <dd className="inline text-muted">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {row.report.questions.length ? (
                <div className="mt-5 border-l-2 border-blue-soft/40 pl-4">
                  <h3 className="text-xs uppercase tracking-wider text-faint">{t.questions}</h3>
                  <ul className="mt-2 space-y-2.5">
                    {row.report.questions.map((q) => (
                      <li key={q.ask} className="text-sm leading-relaxed">
                        <span className="font-medium">{q.ask}</span>
                        <span className="block text-[0.88rem] text-muted">{q.why}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {row.report.trial.length ? (
                <div className="mt-5 rounded-lg border border-line bg-surface-2/40 px-4 py-3">
                  <h3 className="text-xs uppercase tracking-wider text-faint">{t.trial}</h3>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {row.report.trial.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <form action={dropCandidateAction} className="mt-4">
                <input type="hidden" name="candidate" value={row.id} />
                <SubmitButton pendingLabel={t.removing} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                  {t.remove}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
