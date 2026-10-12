import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/shell";
import { LearnQuiz, type QuizQuestion } from "@/components/admin/learn-quiz";
import { learnDict } from "@/content/admin-panel/learn";
import { COURSES, PANEL_QUIZ, learnCopy } from "@/content/learn";
import { addMaterialAction, removeMaterialAction } from "@/app/admin/learn/actions";
import { requireSection } from "@/lib/admin/guard";
import { parseInline } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { AUTO_ARMS } from "@/lib/admin/letter-texts";
import { learnKey, optionOrder, questionsFor } from "@/lib/learn/quiz";
import { PASS_PERCENT } from "@/lib/learn/rules";
import { listMaterials } from "@/lib/learn/store";

export const dynamic = "force-dynamic";

/**
 * Курс «Обучения» или тест по панели: уроки, материалы владельца и
 * интерактивный тест (components/admin/learn-quiz.tsx).
 */

/** Абзац урока: **выделение** и ссылки — как в инструкции. */
function Para({ text }: { text: string }): ReactNode {
  return (
    <p className="mt-2 text-sm leading-relaxed text-muted">
      {parseInline(text).map((part, i) =>
        part.kind === "bold" ? (
          <strong key={i} className="font-medium text-text">
            {part.text}
          </strong>
        ) : part.kind === "link" ? (
          <Link key={i} href={part.href} className="text-green hover:underline">
            {part.text}
          </Link>
        ) : part.kind === "code" ? (
          <code key={i} className="font-mono text-xs">
            {part.text}
          </code>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}

/** Ссылка в инструкцию на языке панели — как у кнопки «?» в шапке. */
function helpLink(anchor: string, locale: PanelLocale): string {
  return locale === "ru" ? `/admin/help#${anchor}` : `/admin/help?lang=${locale}#${anchor}`;
}

export default async function LearnCoursePage({ params }: { params: Promise<{ course: string }> }) {
  const staff = await requireSection("/admin/learn");
  const { course } = await params;
  const key = learnKey(course);
  if (!key) notFound();

  const locale = staff.panel_locale;
  const t = pick(learnDict, locale);
  const copy = learnCopy(locale);
  const meta = COURSES.find((c) => c.key === key) ?? null;
  const text = meta ? copy.courses[meta.key] : null;
  const owner = staff.role === "admin";
  const materials = await listMaterials(key);

  const questions: QuizQuestion[] = questionsFor(key, staff, locale).map((q) => ({
    id: q.id,
    q: q.copy.q,
    options: optionOrder(q.id, q.copy.options.length).map((orig) => ({ orig, text: q.copy.options[orig] })),
    right: q.copy.options[0],
    why: q.copy.why,
    more: q.anchor ? { href: helpLink(q.anchor, locale), kind: "help" } : q.lesson ? { href: `#lesson-${q.lesson}`, kind: "lesson" } : null,
  }));

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/learn" className="text-sm text-faint hover:text-green">
        {t.back}
      </Link>
      <h1 className="mt-3 text-lg font-semibold">{text ? text.title : copy.panel.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{text ? text.summary : copy.panel.summary}</p>

      {meta && text ? (
        <section className="mt-6 max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">{t.lessonsTitle}</h2>
          <ol className="mt-3 space-y-3">
            {meta.lessons.map((lesson, i) => {
              const arm = lesson.arm ? AUTO_ARMS.find((a) => a.key === lesson.arm) : null;
              return (
                <li
                  key={lesson.id}
                  id={`lesson-${lesson.id}`}
                  className="scroll-mt-28 rounded-xl border border-line bg-surface px-5 py-4 target:border-green/60"
                >
                  <p className="font-medium">
                    {i + 1}. {text.lessons[lesson.id].title}
                  </p>
                  {text.lessons[lesson.id].paras.map((para, j) => (
                    <Para key={j} text={para} />
                  ))}
                  {arm ? (
                    <div className="mt-3">
                      <p className="text-xs text-faint">{t.armLabel}</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-line px-4 py-3 font-mono text-xs leading-relaxed text-muted">
                        {arm.body}
                      </pre>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">{t.materialsTitle}</h2>
        {materials.length ? (
          <ul className="mt-3 space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 text-sm">
                <a href={m.url} target="_blank" rel="noreferrer noopener" className="text-green hover:underline">
                  {m.title} ↗
                </a>
                {owner ? (
                  <form action={removeMaterialAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="course" value={key} />
                    <button type="submit" className="text-xs text-faint hover:text-red-300">
                      {t.materialRemove}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-faint">{t.materialsEmpty}</p>
        )}
        {owner ? (
          <form action={addMaterialAction} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="course" value={key} />
            <label className="text-xs text-faint">
              {t.materialName}
              <input name="title" required maxLength={200} className="mt-1 block w-56 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text" />
            </label>
            <label className="text-xs text-faint">
              {t.materialLink}
              <input
                name="url"
                type="url"
                required
                pattern="https?://.+"
                title={t.materialBad}
                maxLength={2000}
                className="mt-1 block w-72 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text"
              />
            </label>
            <button type="submit" className="rounded-lg border border-green/40 px-4 py-2 text-sm text-green transition hover:bg-green/10">
              {t.materialAdd}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">{t.quizTitle}</h2>
        <p className="mt-1 text-sm text-faint">{t.passRule(PASS_PERCENT)}</p>
        <div className="mt-4">
          <LearnQuiz quizKey={key} questions={questions} passPercent={PASS_PERCENT} />
        </div>
        {key === PANEL_QUIZ ? null : <p className="mt-4 text-sm text-faint">{t.botHint}</p>}
      </section>
    </AdminShell>
  );
}
