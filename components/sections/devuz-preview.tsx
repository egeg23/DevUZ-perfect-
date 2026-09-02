"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

/**
 * Один языковой кадр предпросмотра. Собирается на сервере из тех же словарей,
 * которыми живёт сайт: подставлять сюда отдельные тексты значило бы завести
 * вторую версию главной, которая рано или поздно разойдётся с настоящей.
 */
export type PreviewSnippet = {
  locale: Locale;
  short: string;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  manager: string;
  online: string;
  thinking: string;
  promise: string;
  ask: string;
  reply: string;
};

type Stage = "enter" | "thinking" | "typing" | "hold";

const ENTER_MS = 620;
const THINKING_MS = 780;
const HOLD_MS = 2200;

/**
 * Живой предпросмотр сайта в рамке браузера.
 *
 * Кадр переключается по языкам: меняется адрес, заголовок героя и реплика
 * AI-менеджера, которая печатается на глазах. Это не запись экрана и не
 * гифка — тот же текст, что и на настоящих страницах, поэтому предпросмотр
 * не может «устареть» относительно сайта.
 *
 * До первого попадания в зону видимости и при prefers-reduced-motion блок
 * стоит на первом кадре с полностью дописанной репликой: анимация здесь —
 * улучшение, а не условие, при котором текст вообще появляется.
 */
export function DevuzPreview({ snippets }: { snippets: PreviewSnippet[] }) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("enter");
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);
  /** Блок за пределами экрана не крутит таймеры вхолостую. */
  const [running, setRunning] = useState(false);

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // В обоих случаях остаёмся на статичном кадре: он самодостаточен.
    if (reduced || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setRunning(entry.isIntersecting);
          if (entry.isIntersecting) setStarted(true);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const snippet = snippets[index];
  const reply = snippet.reply;

  useEffect(() => {
    if (!started || !running) return;

    if (stage === "enter") {
      const id = window.setTimeout(() => setStage("thinking"), ENTER_MS);
      return () => window.clearTimeout(id);
    }

    if (stage === "thinking") {
      const id = window.setTimeout(() => {
        setTyped(0);
        setStage("typing");
      }, THINKING_MS);
      return () => window.clearTimeout(id);
    }

    if (stage === "typing") {
      if (typed >= reply.length) {
        setStage("hold");
        return;
      }
      // Шаг подобран от длины реплики: короткая и длинная фразы должны
      // печататься примерно одинаковое время, иначе языки играют вразнобой.
      const step = Math.max(16, Math.round(1000 / reply.length));
      const id = window.setTimeout(() => setTyped((n) => n + 1), step);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % snippets.length);
      setTyped(0);
      setStage("enter");
    }, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [started, running, stage, typed, reply, snippets.length]);

  const animating = started && running;
  const thinking = animating && (stage === "enter" || stage === "thinking");
  const shown = started ? reply.slice(0, typed) : reply;

  return (
    <div ref={attach} className="relative">
      {/* Свечение под рамкой: то же, что под терминалом в герое, — блок
          должен читаться как продолжение сцены сборки, а не как чужая
          картинка, вставленная в середину страницы. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-green/10 blur-[90px]"
      />

      <div className="overflow-hidden rounded-2xl border border-line bg-[#090d14]/95 shadow-[0_30px_90px_rgba(0,0,0,.7)]">
        {/* ── Шапка браузера ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 border-b border-line bg-white/[0.02] px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#28C840]" />

          <span className="ml-2 min-w-0 flex-1 truncate rounded-md border border-line bg-ink px-3 py-1.5 font-mono text-[0.64rem] text-faint">
            devuz.maximov-tech.ru/
            <span className="text-green">{snippet.locale}</span>
          </span>

          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {snippets.map((item) => (
              <span
                key={item.locale}
                className={cn(
                  "rounded px-1.5 py-1 font-mono text-[0.6rem] transition-colors duration-500",
                  item.locale === snippet.locale
                    ? "bg-green/15 text-green"
                    : "text-faint",
                )}
              >
                {item.short}
              </span>
            ))}
          </div>
        </div>

        {/* ── Содержимое «страницы» ──────────────────────────────────────── */}
        {/* key по локали: смена языка должна выглядеть как перерисовка
            страницы, а не как подмена букв в живом абзаце. */}
        <div key={snippet.locale} className="lang-swap px-5 py-6 sm:px-7 sm:py-8">
          <p className="flex items-center gap-2.5 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-green">
            <span aria-hidden="true" className="h-px w-5 bg-green" />
            {snippet.eyebrow}
          </p>

          <p className="mt-3 font-display text-[clamp(1.1rem,2.4vw,1.75rem)] font-extrabold leading-[1.12]">
            {snippet.titleLead}
            <br />
            <span className="bg-gradient-to-r from-green to-blue-soft bg-clip-text text-transparent">
              {snippet.titleAccent}
            </span>
          </p>

          {/* ── Чат первой линии ─────────────────────────────────────────── */}
          <div className="mt-6 rounded-xl border border-line bg-surface/80 p-4">
            <p className="flex items-center gap-2 border-b border-line pb-3 text-[0.72rem]">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              <span className="font-medium">{snippet.manager}</span>
              <span className="text-faint">· {snippet.online}</span>
            </p>

            <p className="mt-3.5 ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm border border-line bg-surface-2 px-3.5 py-2.5 text-[0.76rem] leading-snug text-muted">
              {snippet.ask}
            </p>

            <p className="mt-2.5 w-fit max-w-[92%] rounded-xl rounded-bl-sm border border-green/25 bg-green/[0.07] px-3.5 py-2.5 text-[0.78rem] leading-snug">
              {thinking ? (
                <span className="inline-flex items-center gap-1.5 text-faint">
                  {snippet.thinking}
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1 w-1 animate-pulse rounded-full bg-green"
                      style={{ animationDelay: `${dot * 160}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <>
                  {shown}
                  {started && stage === "typing" ? (
                    <span
                      aria-hidden="true"
                      className="logo-cursor ml-0.5 inline-block h-[0.95em] w-[0.45em] translate-y-[0.1em] bg-green"
                    />
                  ) : null}
                </>
              )}
            </p>

            <p className="mt-3.5 border-t border-line pt-3 font-mono text-[0.63rem] text-faint">
              {snippet.promise}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
