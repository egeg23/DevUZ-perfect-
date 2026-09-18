import { redirect } from "next/navigation";

import { dropCandidateAction, reviewResumeAction } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { when } from "@/components/admin/lead-table";
import { requireStaff } from "@/lib/admin/guard";
import { canSee } from "@/lib/admin/roles";
import { MAX_PDF_BYTES } from "@/lib/hiring/pdf";
import { VERDICT_TEXT, type Verdict } from "@/lib/hiring/resume";
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
  searchParams: Promise<{ e?: string; open?: string }>;
}) {
  const staff = await requireStaff();
  // Меню такую вкладку менеджеру не покажет, но адрес можно набрать руками.
  if (!canSee(staff.role, "/admin/candidates")) redirect("/admin");

  const { e, open } = await searchParams;
  const rows = await listCandidates();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Анализ кандидатов</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Загрузите резюме в PDF и напишите, на какую работу смотрим. Разбор покажет вердикт,
        сильные стороны, стопы, вопросы на собеседование и способ проверить человека делом.
      </p>

      <div className="mt-6 rounded-xl border border-line bg-surface px-5 py-5">
        <form action={reviewResumeAction} className="space-y-4">
          <label className="block text-xs uppercase tracking-wider text-faint">
            На какую работу смотрим
            <input
              name="role"
              required
              defaultValue="менеджер по продажам IT-услуг: холодные касания и обработка заявок с рекламы"
              className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-text"
            />
          </label>

          <label className="block text-xs uppercase tracking-wider text-faint">
            Резюме в PDF
            <input
              type="file"
              name="resume"
              accept="application/pdf,.pdf"
              required
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel="Читаем резюме — это до минуты…" base="rounded-xl px-4 py-2 text-sm font-semibold">
              Разобрать
            </SubmitButton>
            <span className="text-xs text-faint">
              До {Math.round(MAX_PDF_BYTES / 1024 / 1024)} МБ. Нужен PDF, из которого копируется текст: скан
              страниц не прочитается.
            </span>
          </div>
        </form>

        {e ? <p className="mt-4 text-sm text-gold">{decodeURIComponent(e)}</p> : null}
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-faint">
        Файл нигде не сохраняется — остаётся только разбор. Возраст, пол, семейное положение и
        национальность в оценке не участвуют: они ничего не говорят о работе, а решение, принятое
        по ним, — это не оценка, а предрассудок. Разбор опирается только на опыт и на то, что
        написано в резюме; последнее слово всё равно за вами.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-faint">Разобранных резюме пока нет.</p>
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
                  {VERDICT_TEXT[row.verdict]}
                </span>
                <span className="text-xs text-faint">
                  {row.role}
                  {row.author ? ` · ${row.author}` : ""} · {when(row.createdAt)}
                </span>
              </div>

              <p className="mt-3 text-[1.02rem] font-semibold leading-snug">{row.headline}</p>
              {row.report.why ? (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{row.report.why}</p>
              ) : null}
              {row.wants ? (
                <p className="mt-2 text-xs text-faint">Сам претендует на: {row.wants}</p>
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-faint">Сильные стороны</h3>
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
                  <h3 className="text-xs uppercase tracking-wider text-faint">Стопы</h3>
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
                  <h3 className="text-xs uppercase tracking-wider text-faint">Что в резюме сказано прямо</h3>
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
                  <h3 className="text-xs uppercase tracking-wider text-faint">Спросить на собеседовании</h3>
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
                  <h3 className="text-xs uppercase tracking-wider text-faint">Как проверить делом</h3>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {row.report.trial.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <form action={dropCandidateAction} className="mt-4">
                <input type="hidden" name="candidate" value={row.id} />
                <SubmitButton pendingLabel="Убираем…" base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                  Убрать разбор
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
