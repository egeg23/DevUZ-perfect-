"use client";

import { useMemo, useState } from "react";

import {
  AD_BUDGET_MAX,
  AD_BUDGET_STEP,
  DEFAULT_AD_BUDGET,
  channels,
  type MarketingCopy,
} from "@/content/marketing";
import { formatUsd, formatUzs } from "@/lib/calculator";
import { cn } from "@/lib/cn";
import { t, type Locale } from "@/lib/i18n";
import { estimateMarketing, type ContextChoice } from "@/lib/marketing/estimate";

type Currency = "uzs" | "usd";

const CONTEXT: ContextChoice[] = ["none", "google", "both"];

/**
 * Калькулятор маркетинга: каналы, контекст, бюджет — и сразу первый месяц,
 * ежемесячная работа и всё, что добавляется к рекламному бюджету.
 *
 * Считает на клиенте, как и калькулятор сайта: цены лежат в открытом
 * `content/marketing.ts`, а мгновенный отклик на каждую галочку — половина
 * пользы. Кнопка внизу кладёт расчёт в чат тем же событием `devuz:prefill`.
 */
export function MarketingCalculator({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  const [picked, setPicked] = useState<string[]>(["smm", "target"]);
  const [context, setContext] = useState<ContextChoice>("none");
  const [budget, setBudget] = useState(DEFAULT_AD_BUDGET);
  const [siteToo, setSiteToo] = useState(false);
  const [currency, setCurrency] = useState<Currency>(
    locale === "en" || locale === "zh" || locale === "uk" || locale === "pl" ? "usd" : "uzs",
  );
  const [sent, setSent] = useState(false);

  const result = useMemo(
    () => estimateMarketing({ picked, context, budget }),
    [picked, context, budget],
  );
  const hasAds = result?.lines.some((c) => c.ads) ?? false;

  const money = (value: number) => (currency === "uzs" ? formatUzs(value, locale) : formatUsd(value));
  const contextLabel: Record<ContextChoice, string> = {
    none: copy.calc.contextNone,
    google: copy.calc.contextGoogle,
    both: copy.calc.contextBoth,
  };

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSent(false);
  }

  function discuss() {
    if (!result) return;
    const message =
      copy.calc.prefill
        .replace("{channels}", result.lines.map((c) => t(c.title, locale)).join(", "))
        .replace("{budget}", money(result.adBudget))
        .replace("{first}", money(result.first))
        .replace("{monthly}", money(result.monthly)) + (siteToo ? copy.calc.prefillSite : "");
    // Чат слушает это событие: открывается и подставляет текст в поле ввода.
    window.dispatchEvent(new CustomEvent("devuz:prefill", { detail: message }));
    setSent(true);
  }

  const toggles = channels.filter((c) => c.group !== "context");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_23rem]">
      <div>
        {/* ── Шаг 1: каналы ──────────────────────────────────────────────── */}
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
          01 · {copy.calc.channels}
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {toggles.map((channel) => {
            const active = picked.includes(channel.id);
            return (
              <button
                key={channel.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(channel.id)}
                className={cn(
                  "flex h-full flex-col rounded-xl border p-4 text-left transition-all duration-300",
                  active
                    ? "border-green/50 bg-green/[0.07]"
                    : "border-line bg-surface hover:border-line-soft hover:bg-surface-2",
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[0.95rem] font-semibold leading-snug">{t(channel.title, locale)}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[0.7rem]",
                      active ? "border-green bg-green text-ink" : "border-line text-transparent",
                    )}
                  >
                    ✓
                  </span>
                </span>
                <span className="mt-1.5 flex-1 text-[0.78rem] leading-snug text-faint">{t(channel.note, locale)}</span>
                <span className={cn("mt-3 font-mono text-[0.7rem]", active ? "text-green" : "text-faint")}>
                  {channel.from ? `${copy.from} ` : ""}
                  {money(channel.monthly)} · {copy.monthlyCol.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Шаг 2: контекст ────────────────────────────────────────────── */}
        <p className="mt-11 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
          02 · {copy.calc.context}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={copy.calc.context}>
          {CONTEXT.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={context === value}
              onClick={() => {
                setContext(value);
                setSent(false);
              }}
              className={cn(
                "rounded-lg border px-3.5 py-2.5 text-[0.84rem] transition-colors",
                context === value
                  ? "border-green/50 bg-green/12 text-green"
                  : "border-line text-muted hover:text-text",
              )}
            >
              {contextLabel[value]}
            </button>
          ))}
        </div>

        {/* ── Шаг 3: бюджет и сайт ───────────────────────────────────────── */}
        <p className="mt-11 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
          03 · {copy.calc.budget}
        </p>
        <div className={cn("mt-4 rounded-xl border border-line bg-surface px-5 py-4", !hasAds && "opacity-50")}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="ad-budget" className="text-[0.93rem] font-medium">
              {copy.calc.budget}
            </label>
            <span className="font-mono text-[0.95rem] text-green">{money(budget)}</span>
          </div>
          <input
            id="ad-budget"
            type="range"
            min={0}
            max={AD_BUDGET_MAX}
            step={AD_BUDGET_STEP}
            value={budget}
            disabled={!hasAds}
            onChange={(event) => {
              setBudget(Number(event.target.value));
              setSent(false);
            }}
            className="mt-4 w-full accent-green"
          />
          <p className="mt-2 text-[0.76rem] leading-snug text-faint">{copy.calc.budgetHint}</p>
        </div>

        <div className="mt-2.5 flex items-start gap-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex-1">
            <p className="text-[0.93rem] font-medium">{copy.calc.siteToo}</p>
            <p className="mt-1 text-[0.76rem] leading-snug text-green">{copy.calc.siteTooHint}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={siteToo}
            aria-label={copy.calc.siteToo}
            onClick={() => {
              setSiteToo((v) => !v);
              setSent(false);
            }}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
              siteToo ? "border-green bg-green" : "border-line bg-ink",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-300",
                siteToo ? "left-[1.6rem] bg-ink" : "left-1 bg-faint",
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Итог ───────────────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="overflow-hidden rounded-2xl border border-green/25 bg-gradient-to-b from-green/[0.07] to-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-green">{copy.calc.kicker}</p>
            <div className="flex gap-0.5 rounded-lg border border-line p-0.5">
              {(["uzs", "usd"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={currency === code}
                  onClick={() => setCurrency(code)}
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-[0.66rem] transition-colors",
                    currency === code ? "bg-green text-ink" : "text-faint hover:text-text",
                  )}
                >
                  {code === "uzs" ? "UZS" : "USD"}
                </button>
              ))}
            </div>
          </div>

          {result ? (
            <div className="px-6 py-6">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">{copy.calc.firstMonth}</p>
              <p className="mt-2 font-display text-[1.75rem] font-extrabold leading-tight text-green">
                {money(result.firstTotal)}
              </p>

              <dl className="mt-5 space-y-2 border-t border-line pt-5 text-[0.84rem]">
                <Row label={copy.calc.monthly} value={money(result.monthly)} />
                {result.adBudget > 0 ? (
                  <>
                    <Row label={copy.calc.adBudget} value={money(result.adBudget)} />
                    <Row label={copy.calc.vat} value={money(result.vat)} />
                    <Row label={copy.calc.commission} value={money(result.commission)} />
                  </>
                ) : null}
                <Row label={copy.calc.total} value={money(result.monthlyTotal)} strong />
              </dl>

              <p className="mt-4 text-[0.76rem] leading-snug text-muted">
                {copy.calc.prepay}: −{money(result.prepaySaving)}
              </p>

              {siteToo ? (
                <div className="mt-3 rounded-lg border border-green/30 bg-green/10 px-3 py-2.5 text-green">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em]">{copy.utp.badge}</p>
                  <p className="mt-1 text-[0.78rem] leading-snug">{copy.calc.siteTooHint}</p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={discuss}
                className="mt-6 w-full rounded-xl bg-green px-5 py-3.5 font-semibold text-ink transition-colors hover:bg-white"
              >
                {copy.calc.discuss}
              </button>

              {sent ? (
                <p className="mt-3 rounded-lg border border-green/30 bg-green/10 px-3 py-2.5 text-[0.78rem] leading-snug text-green">
                  {copy.calc.sent}
                </p>
              ) : null}

              <p className="mt-4 text-[0.7rem] leading-snug text-faint">{copy.vatNote}</p>
            </div>
          ) : (
            <p className="px-6 py-8 text-[0.9rem] text-muted">{copy.calc.empty}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", strong && "border-t border-line pt-2")}>
      <dt className={strong ? "font-semibold text-text" : "text-muted"}>{label}</dt>
      <dd className={cn("whitespace-nowrap font-mono", strong ? "font-semibold text-text" : "text-text")}>{value}</dd>
    </div>
  );
}
