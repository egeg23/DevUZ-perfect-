"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { categories, optionsFor } from "@/content/calculator";
import type { Dictionary } from "@/content/dictionaries";
import {
  defaultSelection,
  estimate,
  estimateToMessage,
  formatUsd,
  formatUzs,
  type Selection,
} from "@/lib/calculator";
import { cn } from "@/lib/cn";
import { t, type Locale } from "@/lib/i18n";

type Currency = "uzs" | "usd";

/**
 * Калькулятор предварительной оценки.
 *
 * Считает целиком на клиенте: цифры и формулы всё равно лежат в открытом
 * коде, поэтому прятать расчёт на сервере бессмысленно, а мгновенный отклик
 * при каждой галочке — половина ценности такого инструмента.
 *
 * Результат не заканчивается цифрой. Кнопка внизу подставляет весь расчёт в
 * чат: ассистент получает и услугу, и порядок бюджета, и состав работ — то
 * есть половина BANT закрыта ещё до первого вопроса.
 */
export function PriceCalculator({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [slug, setSlug] = useState(categories[0].slug);
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(categories[0].slug),
  );
  const [currency, setCurrency] = useState<Currency>(
    // Местный заказчик думает в сумах, зарубежный — в долларах. Локаль
    // угадывает это лучше, чем любое значение по умолчанию для всех.
    locale === "en" || locale === "zh" ? "usd" : "uzs",
  );
  const [sent, setSent] = useState(false);

  const category = categories.find((c) => c.slug === slug) ?? categories[0];
  const visibleOptions = useMemo(() => optionsFor(slug), [slug]);
  const result = useMemo(() => estimate(slug, selection, locale), [slug, selection, locale]);

  function pickCategory(next: string) {
    setSlug(next);
    setSelection(defaultSelection(next));
    setSent(false);
  }

  function update(id: string, value: string | number | boolean) {
    setSelection((prev) => ({ ...prev, [id]: value }));
    setSent(false);
  }

  function discuss() {
    if (!result) return;
    const message = estimateToMessage(
      t(category.title, locale),
      result,
      locale,
      dict.calculator.prefill,
      dict.calculator.weeksLabel,
    );
    // Виджет чата слушает это событие: открывается и подставляет текст в поле
    // ввода. Событие вместо общего состояния — чтобы калькулятор не знал о
    // существовании чата, а чат о калькуляторе.
    window.dispatchEvent(new CustomEvent("devuz:prefill", { detail: message }));
    setSent(true);
  }

  const money = (value: number) =>
    currency === "uzs" ? formatUzs(value, locale) : formatUsd(value);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_23rem]">
      <div>
        {/* ── Шаг 1: тип проекта ─────────────────────────────────────────── */}
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
          01 · {dict.calculator.chooseType}
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((item) => {
            const active = item.slug === slug;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => pickCategory(item.slug)}
                aria-pressed={active}
                className={cn(
                  "flex h-full flex-col rounded-xl border p-4 text-left transition-all duration-300",
                  active
                    ? "border-green/50 bg-green/[0.07]"
                    : "border-line bg-surface hover:border-line-soft hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    active ? "border-green/40 bg-green/15 text-green" : "border-line text-faint",
                  )}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <span className="mt-3 text-[0.95rem] font-semibold leading-snug">
                  {t(item.title, locale)}
                </span>
                <span className="mt-1.5 flex-1 text-[0.78rem] leading-snug text-faint">
                  {t(item.tagline, locale)}
                </span>
                <span
                  className={cn(
                    "mt-3 font-mono text-[0.7rem]",
                    active ? "text-green" : "text-faint",
                  )}
                >
                  {dict.calculator.from} {money(item.baseUzs)}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Шаг 2: настройка ───────────────────────────────────────────── */}
        <p className="mt-11 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
          02 · {dict.calculator.configure}
        </p>
        <div className="mt-4 space-y-2.5">
          {visibleOptions.map((option) => {
            const value = selection[option.id];

            return (
              <div
                key={option.id}
                className="rounded-xl border border-line bg-surface px-5 py-4"
              >
                <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                  <div className="min-w-[11rem] flex-1">
                    <p className="text-[0.93rem] font-medium">{t(option.label, locale)}</p>
                    {option.hint ? (
                      <p className="mt-1 text-[0.76rem] leading-snug text-faint">
                        {t(option.hint, locale)}
                      </p>
                    ) : null}
                  </div>

                  {option.kind === "toggle" ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={value === true}
                      aria-label={t(option.label, locale)}
                      onClick={() => update(option.id, value !== true)}
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
                        value === true ? "border-green bg-green" : "border-line bg-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-300",
                          value === true ? "left-[1.6rem] bg-ink" : "left-1 bg-faint",
                        )}
                      />
                    </button>
                  ) : null}

                  {option.kind === "choice" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {option.choices.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          aria-pressed={value === choice.id}
                          onClick={() => update(option.id, choice.id)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-[0.8rem] transition-colors",
                            value === choice.id
                              ? "border-green/50 bg-green/12 text-green"
                              : "border-line text-muted hover:text-text",
                          )}
                        >
                          {t(choice.label, locale)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {option.kind === "counter" ? (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        aria-label="−"
                        disabled={Number(value) <= 0}
                        onClick={() => update(option.id, Math.max(0, Number(value) - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-text disabled:opacity-30"
                      >
                        −
                      </button>
                      {/* «2 × роль», а не «2 роль»: знак умножения обходит
                          склонение числительных, которое в русском и узбекском
                          иначе пришлось бы разбирать по трём формам. */}
                      <span className="w-20 text-center font-mono text-[0.82rem]">
                        {Number(value) === 0 ? (
                          <span className="text-faint">—</span>
                        ) : (
                          <>
                            {Number(value)}
                            <span className="text-faint"> × {t(option.unitLabel, locale)}</span>
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        aria-label="+"
                        disabled={Number(value) >= option.max}
                        onClick={() =>
                          update(option.id, Math.min(option.max, Number(value) + 1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-text disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Шаг 3: результат ─────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="overflow-hidden rounded-2xl border border-green/25 bg-gradient-to-b from-green/[0.07] to-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-green">
              03 · {dict.calculator.result}
            </p>
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
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">
                {dict.calculator.from}
              </p>
              <p className="mt-2 font-display text-[1.75rem] font-extrabold leading-tight text-green">
                {money(result.lowUzs)}
              </p>
              <p className="mt-1 text-[0.9rem] text-muted">— {money(result.highUzs)}</p>

              <p className="mt-5 border-t border-line pt-5 font-mono text-[0.8rem] text-muted">
                <span className="font-display text-xl font-bold text-text">
                  {result.weeksLow}–{result.weeksHigh}
                </span>{" "}
                {dict.calculator.weeksLabel}
              </p>

              <button
                type="button"
                onClick={discuss}
                className="mt-6 w-full rounded-xl bg-green px-5 py-3.5 font-semibold text-ink transition-colors hover:bg-white"
              >
                {dict.calculator.discuss}
              </button>

              {sent ? (
                <p className="mt-3 rounded-lg border border-green/30 bg-green/10 px-3 py-2.5 text-[0.78rem] leading-snug text-green">
                  {dict.calculator.handoff}
                </p>
              ) : null}

              <p className="mt-4 text-[0.7rem] leading-snug text-faint">
                {dict.calculator.disclaimer}
              </p>
            </div>
          ) : null}
        </div>

        {result ? (
          <div className="mt-3 space-y-3">
            <ScopeList title={dict.calculator.techTitle} items={result.tech} accent="green" />
            <ScopeList title={dict.calculator.workTitle} items={result.work} accent="blue" />
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function ScopeList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "green" | "blue";
}) {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-5">
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-faint">
        {title}
      </p>
      <ul className="mt-3.5 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.84rem] leading-snug text-muted">
            <span
              aria-hidden="true"
              className={cn("mt-0.5 shrink-0", accent === "green" ? "text-green" : "text-blue-soft")}
            >
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
