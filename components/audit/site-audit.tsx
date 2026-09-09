"use client";

import { useRef, useState } from "react";

import type { AuditReport, Severity } from "@/lib/audit/checks";
import type { Dictionary } from "@/content/dictionaries";

/**
 * Форма проверки сайта — вход для холодных лидов.
 *
 * Задумана как работа, сделанная до того, как что-то попросили: человек
 * вводит адрес и получает разбор, ничего не заплатив и никому не написав.
 * Поэтому здесь нет ни регистрации, ни поля почты, ни «отправим отчёт на
 * email» — всё это превращает подарок в обмен и убивает смысл.
 *
 * Кнопка в конце передаёт находки в чат-виджет через то же событие, которым
 * пользуется калькулятор: разговор начинается не с «здравствуйте», а с сути.
 */

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "border-red-500/40 bg-red-500/5",
  major: "border-amber-500/40 bg-amber-500/5",
  minor: "border-white/10 bg-white/[0.02]",
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-red-400",
  major: "bg-amber-400",
  minor: "bg-muted",
};

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; report: AuditReport }
  | { kind: "error"; message: string };

export function SiteAudit({ dict }: { dict: Dictionary }) {
  const t = dict.audit;
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim() || state.kind === "checking") return;
    setState({ kind: "checking" });

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        const message =
          response.status === 429 ? t.errorMany
          : data?.error === "blocked" ? t.errorBlocked
          : data?.error === "bad_url" ? t.errorBad
          : t.errorAny;
        setState({ kind: "error", message });
        return;
      }
      setState({ kind: "done", report: data as AuditReport });
    } catch {
      setState({ kind: "error", message: t.errorAny });
    }
  }

  /** Уводит находки в чат: менеджер видит разбор, а не голое «здравствуйте». */
  function discuss(report: AuditReport) {
    const lines = report.findings.map((f) => `— ${f.title}`).join("\n");
    const message = `${report.url}\n${t.scoreLabel}: ${report.score}/100\n\n${lines}`;
    window.dispatchEvent(new CustomEvent("devuz:prefill", { detail: message }));
  }

  function reset() {
    setState({ kind: "idle" });
    setUrl("");
    inputRef.current?.focus();
  }

  const report = state.kind === "done" ? state.report : null;
  const findings = report
    ? [...report.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.placeholder}
          // inputMode=url даёт на телефоне клавиатуру с точкой и слэшем;
          // без него человек ищет их по вкладкам и бросает.
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          aria-label={t.title}
          className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-4 font-mono text-base outline-none transition-colors placeholder:text-muted focus:border-green"
        />
        <button
          type="submit"
          disabled={state.kind === "checking" || !url.trim()}
          className="shrink-0 rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === "checking" ? t.checking : t.button}
        </button>
      </form>

      {state.kind === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {state.message}
        </p>
      )}

      {report && (
        <div className="mt-10">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-5xl font-bold leading-none text-green">
              {report.score}
            </span>
            <span className="text-muted">{t.scoreLabel} · {report.url}</span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <Fact label={t.factsHttps} value={report.facts.https ? t.yes : t.no} />
            <Fact label={t.factsSpeed} value={`${report.facts.ttfbMs} ms`} />
            <Fact label={t.factsPlatform} value={report.facts.platform ?? t.unknown} />
            <Fact label={t.factsShop} value={report.facts.isShop ? t.yes : t.no} />
          </dl>

          {findings.length === 0 ? (
            <p className="mt-8 rounded-xl border border-green/30 bg-green/5 px-5 py-4">
              {t.noFindings}
            </p>
          ) : (
            <ul className="mt-8 flex flex-col gap-3">
              {findings.map((f) => (
                <li
                  key={f.code}
                  className={`rounded-xl border px-5 py-4 ${SEVERITY_STYLE[f.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`mt-2 size-2 shrink-0 rounded-full ${SEVERITY_DOT[f.severity]}`}
                    />
                    <div>
                      <p className="font-semibold">{f.title}</p>
                      <p className="mt-1 text-sm text-muted">{f.impact}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {findings.length > 0 && (
              <button
                type="button"
                onClick={() => discuss(report)}
                className="rounded-xl bg-green px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-white"
              >
                {t.discuss}
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-white/12 px-6 py-3.5 font-semibold transition-colors hover:border-white/30"
            >
              {t.again}
            </button>
          </div>

          <p className="mt-8 text-sm text-muted">{t.note}</p>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono">{value}</dd>
    </div>
  );
}
