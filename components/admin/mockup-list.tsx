"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { mockupCodeAction } from "@/app/admin/mockups/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { usePanelDict } from "@/components/admin/panel-locale";
import { mockupsDict } from "@/content/admin-panel/mockups";
import type { MockupRow } from "@/lib/admin/mockups";
import type { CodeResult } from "@/lib/admin/mockups-store";

/**
 * Список макетов с поиском и кнопкой пароля (раздел «Макеты»).
 *
 * Строки собирает сервер (lib/admin/mockups-store.ts) — без фактов, html и
 * контактов клиента. Здесь только поиск, фильтр и «Сгенерировать пароль»:
 * пароль показывается один раз, сразу после нажатия, — в базе его нет,
 * только хеш. Потерялся — новый пароль, старый доживёт до своего часа.
 */

export type MockupView = MockupRow & { createdText: string; liveUntilText: string | null };

type Filter = "all" | "hand" | "auto" | "showcase";

const INPUT = "w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green disabled:cursor-progress disabled:opacity-50";

const ACCESS_TONE = {
  closed: "border-green/30 text-green",
  open: "border-gold/30 text-gold",
  public: "border-line text-faint",
} as const;

function matches(row: MockupView, filter: Filter): boolean {
  if (filter === "showcase") return row.kind === "showcase";
  if (filter === "auto") return row.kind === "proto" && row.auto;
  if (filter === "hand") return row.kind === "proto" && !row.auto;
  return true;
}

export function MockupList({ rows }: { rows: MockupView[] }) {
  const t = usePanelDict(mockupsDict);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CodeResult>>({});

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        matches(row, filter) &&
        (!q || [row.name, row.site ?? "", row.niche, row.url].some((text) => text.toLowerCase().includes(q))),
    );
  }, [rows, query, filter]);

  const filters: [Filter, string][] = [
    ["all", t.filterAll],
    ["hand", t.filterHand],
    ["auto", t.filterAuto],
    ["showcase", t.filterShowcase],
  ];

  async function generate(row: MockupView) {
    if (row.access === "open" && !window.confirm(t.confirmClose(row.name))) return;
    setBusy(row.ref);
    try {
      const result = await mockupCodeAction(row.ref);
      setResults((prev) => ({ ...prev, [row.ref]: result }));
      if (result.ok) router.refresh();
    } catch {
      setResults((prev) => ({ ...prev, [row.ref]: { ok: false, reason: "offline" } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6" data-mockup-list>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className={`${INPUT} sm:max-w-sm`}
        />
        <div className="flex flex-wrap gap-1.5">
          {filters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === key ? "border-green/50 bg-green/10 text-green" : "border-line text-muted hover:text-text"
              }`}
            >
              {label} · {rows.filter((row) => matches(row, key)).length}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-faint">{t.empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((row) => {
            const result = results[row.ref];
            const access = row.access === "closed" ? t.accessClosed : row.access === "open" ? t.accessOpen : t.accessPublic;
            return (
              <li key={row.ref} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-medium text-text">{row.name}</span>
                      {row.site ? <span className="font-mono text-xs text-blue-soft">{row.site}</span> : null}
                      {row.kind === "showcase" ? <span className="text-xs text-faint">{t.tagShowcase}</span> : null}
                      {row.auto ? <span className="text-xs text-faint">{t.tagAuto}</span> : null}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span>
                        {t.niche}: {row.niche}
                      </span>
                      <span className="text-faint">·</span>
                      <span>
                        {t.made}: {row.createdText}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 ${ACCESS_TONE[row.access]}`}>{access}</span>
                      {row.liveUntilText ? <span className="text-green">{t.liveUntil(row.liveUntilText)}</span> : null}
                      {row.opens ? <span className="text-faint">{t.opens(row.opens)}</span> : null}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-faint">{row.url}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={row.openHref} target="_blank" rel="noopener noreferrer" className={BUTTON}>
                      {t.open}
                    </a>
                    <CopyMessage text={row.url} label={t.copyLink} />
                    {row.canCode ? (
                      <button type="button" onClick={() => generate(row)} disabled={busy !== null} className={BUTTON}>
                        {busy === row.ref ? t.busy : t.generate}
                      </button>
                    ) : (
                      <span className="text-xs text-faint">{t.noCode}</span>
                    )}
                  </div>
                </div>

                {result?.ok ? (
                  <div className="mt-3 rounded-lg border border-green/30 bg-green/5 px-4 py-3" data-mockup-code>
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-xs text-muted">{t.password}</span>
                      <span className="font-mono text-2xl tracking-[0.3em] text-green">{result.code}</span>
                      <span className="text-xs text-muted">{t.validUntil(result.until)}</span>
                    </p>
                    {result.closedNow ? <p className="mt-1 text-xs text-gold">{t.closedNow}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CopyMessage text={result.message} label={t.copyMessage} />
                      <CopyMessage text={result.code} label={t.copyCode} />
                    </div>
                    <p className="mt-2 text-xs text-faint">{t.messageHint}</p>
                  </div>
                ) : result ? (
                  <p className="mt-2 text-xs text-gold">{t[`fail_${result.reason}`]}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
