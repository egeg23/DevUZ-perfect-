"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { submitQuiz } from "@/app/admin/learn/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { learnDict } from "@/content/admin-panel/learn";

/**
 * Интерактивный тест: по одному вопросу, сразу «верно» или «неверно» с
 * объяснением и ссылкой (урок курса или пункт инструкции), полоса
 * прогресса, в конце — итог.
 *
 * Варианты приходят уже перемешанными, у каждого — его номер в тексте
 * (`orig`, верный — 0): так ответ проверяется сразу, без запроса на сервер.
 * Засчитывает результат только сервер (`submitQuiz`) — он заново считает
 * ответы по своему тексту, и подделанный браузером «верно» ничего не даёт.
 */

export type QuizQuestion = {
  id: string;
  q: string;
  options: { orig: number; text: string }[];
  /** Верный ответ текстом — показывается после ошибки. */
  right: string;
  why: string;
  /** Куда читать после ошибки: урок на этой странице или пункт инструкции. */
  more: { href: string; kind: "lesson" | "help" } | null;
};

export function LearnQuiz({ quizKey, questions, passPercent }: { quizKey: string; questions: QuizQuestion[]; passPercent: number }) {
  const t = usePanelDict(learnDict);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; saved: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!questions.length) return <p className="text-sm text-faint">{t.noQuestions}</p>;

  const restart = () => {
    setStarted(true);
    setIndex(0);
    setAnswers({});
    setResult(null);
    setFailed(false);
  };

  if (!started) {
    return (
      <button
        type="button"
        onClick={restart}
        className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90"
      >
        {t.start}
      </button>
    );
  }

  const done = Object.keys(answers).length;
  const progress = Math.round((done * 100) / questions.length);
  const bar = (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
      <div className="h-full rounded-full bg-green transition-all" style={{ width: `${progress}%` }} />
    </div>
  );

  if (result || failed) {
    return (
      <div className="space-y-4">
        {bar}
        {result ? (
          <div className={`rounded-xl border px-5 py-4 ${result.passed ? "border-green/40 bg-green/5" : "border-gold/40 bg-gold/5"}`}>
            <p className="font-mono text-xl">{t.result(result.score, result.total)}</p>
            <p className={`mt-1 text-sm ${result.passed ? "text-green" : "text-gold"}`}>
              {result.passed ? t.passedMsg : t.failedMsg(passPercent)}
            </p>
            {!result.saved ? <p className="mt-1 text-sm text-red-300">{t.saveFailed}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-red-300">{t.saveFailed}</p>
        )}
        <button type="button" onClick={restart} className="rounded-lg border border-line px-4 py-2 text-sm transition hover:border-green/50">
          {t.again}
        </button>
      </div>
    );
  }

  const q = questions[index];
  const chosen = answers[q.id];
  const answered = chosen !== undefined;
  const last = index === questions.length - 1;

  const finish = () => {
    startTransition(async () => {
      try {
        const res = await submitQuiz(quizKey, answers);
        if (res.ok) setResult(res);
        else setFailed(true);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <div className="space-y-4">
      {bar}
      <p className="text-xs uppercase tracking-wider text-faint">{t.questionOf(index + 1, questions.length)}</p>
      <p className="text-base font-medium leading-relaxed">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((option) => {
          const picked = chosen === option.orig;
          const tone = !answered
            ? "border-line hover:border-green/50"
            : option.orig === 0
              ? "border-green/60 bg-green/10"
              : picked
                ? "border-red-400/60 bg-red-400/10"
                : "border-line opacity-60";
          return (
            <button
              key={option.orig}
              type="button"
              disabled={answered}
              onClick={() => setAnswers((was) => ({ ...was, [q.id]: option.orig }))}
              className={`block w-full rounded-lg border px-4 py-3 text-left text-sm leading-relaxed transition ${tone}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={`rounded-xl border px-5 py-4 text-sm leading-relaxed ${chosen === 0 ? "border-green/40" : "border-red-400/40"}`}>
          <p className={chosen === 0 ? "font-medium text-green" : "font-medium text-red-300"}>{chosen === 0 ? t.right : t.wrong}</p>
          {chosen !== 0 ? (
            <p className="mt-1 text-muted">
              {t.correctIs} {q.right}
            </p>
          ) : null}
          <p className="mt-1 text-muted">{q.why}</p>
          {chosen !== 0 && q.more ? (
            <Link href={q.more.href} className="mt-2 inline-block text-green hover:underline">
              {q.more.kind === "help" ? t.readHelp : t.readLesson} →
            </Link>
          ) : null}
        </div>
      ) : null}

      {answered ? (
        last ? (
          <button
            type="button"
            onClick={finish}
            disabled={pending}
            className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t.saving : t.finish}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90"
          >
            {t.next}
          </button>
        )
      ) : null}
    </div>
  );
}
