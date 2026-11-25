"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { callhelperDict } from "@/content/admin-panel/callhelper";
import { analyze, type CallLine } from "@/lib/callhelper/engine";
import {
  EXAMPLE_SCRIPT,
  cleanScript,
  formFromScript,
  scriptFromForm,
  scriptProblems,
  type CallScript,
  type ScriptForm,
} from "@/lib/callhelper/script";

/** Сценарий — в памяти браузера, пока нет кабинета колл-центра (шаг 3 плана). */
const STORE = "dz-callhelper-script";

function loadScript(): CallScript {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const script = cleanScript(JSON.parse(raw));
      if (!scriptProblems(script).length) return script;
    }
  } catch {
    // Память браузера закрыта: работаем с примером.
  }
  return EXAMPLE_SCRIPT;
}

type Answer = { phrase: string; source: "model" | "code" } | null;

const FIELD = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text focus:border-green/60 focus:outline-none";

/**
 * Экран суфлёра: слева «Скажите сейчас», этапы и предупреждения, под ними
 * лента разговора; справа сценарий. Код (engine.ts) отвечает мгновенно в
 * браузере, фраза модели приходит с /admin/callhelper/suggest и заменяет
 * подсказку кода, если успела к этому разговору.
 */
export function CallHelperDesk() {
  const t = usePanelDict(callhelperDict);
  const [script, setScript] = useState<CallScript>(EXAMPLE_SCRIPT);
  const [form, setForm] = useState<ScriptForm>(() => formFromScript(EXAMPLE_SCRIPT));
  const [lines, setLines] = useState<CallLine[]>([]);
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState<Answer>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const asked = useRef(0);

  useEffect(() => {
    const own = loadScript();
    setScript(own);
    setForm(formFromScript(own));
  }, []);

  const hint = useMemo(() => analyze(script, lines), [script, lines]);
  const formScript = useMemo(() => scriptFromForm(form), [form]);
  const problems = scriptProblems(formScript);

  async function ask(next: CallLine[]) {
    const id = ++asked.current;
    setAnswer(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/admin/callhelper/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, lines: next }),
      });
      if (id !== asked.current) return;
      if (res.status === 429) setError(t.errRate);
      else if (!res.ok) setError(t.errFail);
      else {
        const data = (await res.json()) as { phrase: string; source: "model" | "code" };
        setAnswer({ phrase: data.phrase, source: data.source });
        if (data.source === "code") setError(t.errFail);
      }
    } catch {
      if (id === asked.current) setError(t.errFail);
    } finally {
      if (id === asked.current) setBusy(false);
    }
  }

  function add(who: CallLine["who"], text: string) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const next = [...lines, { who, text: clean }];
    setLines(next);
    setDraft("");
    void ask(next);
  }

  function newCall() {
    asked.current++;
    setLines([]);
    setAnswer(null);
    setError(null);
    setBusy(false);
  }

  function save() {
    if (problems.length) return;
    setScript(formScript);
    try {
      localStorage.setItem(STORE, JSON.stringify(formScript));
    } catch {
      // Память закрыта — сценарий работает до перезагрузки страницы.
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const shown = answer?.phrase || hint.next;
  const problemText: Record<string, string> = {
    product: t.pProduct,
    goal: t.pGoal,
    stages: t.pStages,
    stageWords: t.pStageWords,
  };

  return (
    <>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.lead}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-2xl border border-green/40 bg-green/5 p-4" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-green">{t.sayNow}</h2>
              <span className="text-xs text-muted">{busy ? t.thinking : answer ? (answer.source === "model" ? t.srcModel : t.srcCode) : t.srcCode}</span>
            </div>
            <p className="mt-2 text-lg leading-snug text-text">{shown || t.allDone}</p>
            {hint.objection ? (
              <p className="mt-2 text-sm text-gold">
                {t.objection(hint.objection.name)}
                {hint.objection.from === "base" ? ` · ${t.objectionBase}` : ""}
              </p>
            ) : null}
            {shown ? (
              <button type="button" onClick={() => add("operator", shown)} className="mt-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-text hover:border-green/50">
                {t.useHint}
              </button>
            ) : null}
            {error ? <p className="mt-2 text-xs text-muted">{error}</p> : null}
          </section>

          {hint.banned.length ? (
            <p role="alert" className="rounded-xl border border-red/40 bg-red/10 px-4 py-2.5 text-sm text-red">
              {t.banned(hint.banned.join(", "))}
            </p>
          ) : null}
          {hint.noRecordNotice ? <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold">{t.record}</p> : null}
          {hint.missingMust.length && lines.length ? <p className="text-sm text-muted">{t.must(hint.missingMust.join("; "))}</p> : null}

          <section className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold">{t.stagesTitle}</h2>
            <ol className="mt-2 flex flex-col gap-1 text-sm">
              {hint.stages.map((stage, i) => (
                <li key={stage.name + i} className={stage.done ? "text-green" : i === hint.current ? "font-semibold text-text" : "text-muted"}>
                  {stage.done ? "✓" : i === hint.current ? "→" : "·"} {stage.name}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{t.talkTitle}</h2>
              <button type="button" onClick={newCall} className="text-xs text-muted hover:text-text">
                {t.newCall}
              </button>
            </div>
            {lines.length ? (
              <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto text-sm">
                {lines.map((line, i) => (
                  <li key={i} className={line.who === "client" ? "rounded-lg bg-surface-2 px-3 py-2" : "rounded-lg border border-line px-3 py-2"}>
                    <span className="mr-2 text-xs font-semibold text-muted">{line.who === "client" ? t.whoClient : t.whoOperator}</span>
                    {line.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.talkEmpty}</p>
            )}
            <label htmlFor="callhelper-line" className="sr-only">
              {t.linePlaceholder}
            </label>
            <textarea
              id="callhelper-line"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  add("client", draft);
                }
              }}
              rows={2}
              maxLength={800}
              placeholder={t.linePlaceholder}
              className={`${FIELD} mt-3`}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => add("client", draft)} className="rounded-lg bg-green px-3 py-1.5 text-sm font-medium text-ink">
                {t.addClient}
              </button>
              <button type="button" onClick={() => add("operator", draft)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-text hover:border-green/50">
                {t.addOperator}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">{t.privacy}</p>
          </section>
        </div>

        <section className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">{t.scriptTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.scriptLead}</p>
          <div className="mt-3 flex flex-col gap-3">
            {(
              [
                ["product", t.fProduct, null, 2],
                ["goal", t.fGoal, null, 2],
                ["stages", t.fStages, t.fStagesHint, 6],
                ["objections", t.fObjections, t.fObjectionsHint, 5],
                ["must", t.fMust, t.fMustHint, 2],
                ["banned", t.fBanned, t.fBannedHint, 2],
              ] as const
            ).map(([key, label, help, rows]) => (
              <div key={key}>
                <label htmlFor={`callhelper-${key}`} className="text-xs font-medium text-text">
                  {label}
                </label>
                {help ? <p className="text-[11px] text-muted">{help}</p> : null}
                <textarea
                  id={`callhelper-${key}`}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  rows={rows}
                  className={`${FIELD} mt-1`}
                />
              </div>
            ))}
            {problems.length ? (
              <ul className="text-xs text-gold">
                {problems.map((p) => (
                  <li key={p}>{problemText[p] ?? p}</li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={problems.length > 0}
                className="rounded-lg bg-green px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-50"
              >
                {t.save}
              </button>
              <button type="button" onClick={() => setForm(formFromScript(EXAMPLE_SCRIPT))} className="text-sm text-muted hover:text-text">
                {t.example}
              </button>
              {saved ? <span className="text-sm text-green">{t.saved}</span> : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
