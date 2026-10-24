"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { markStageAction } from "@/app/admin/hq/actions";
import { mockupCodeAction, mockupOrderAction, mockupOwnerAction } from "@/app/admin/mockups/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { SubmitButton } from "@/components/admin/submit-button";
import { usePanelDict } from "@/components/admin/panel-locale";
import { mockupsDict } from "@/content/admin-panel/mockups";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import type { Picked } from "@/lib/admin/i18n";
import type { LinkResult } from "@/lib/admin/mockup-order-store";
import { siteHost } from "@/lib/admin/mockup-order";
import type { MockupRow, MockupSend } from "@/lib/admin/mockups";
import type { CodeResult, OwnerResult } from "@/lib/admin/mockups-store";

/**
 * Список макетов с поиском и кнопкой пароля (раздел «Макеты»).
 *
 * Строки собирает сервер (lib/admin/mockups-store.ts) — без фактов, html и
 * контактов клиента. Здесь только поиск, фильтр и «Сгенерировать пароль»:
 * пароль показывается один раз, сразу после нажатия, — в базе его нет,
 * только хеш. Потерялся — новый пароль, старый доживёт до своего часа.
 */

export type MockupView = MockupRow & {
  createdText: string;
  liveUntilText: string | null;
  /** Открыт ещё столько часов, потом — по паролю (lib/proto/auto-close). */
  openHours: number | null;
  /** Закрыт паролем с этой минуты (по Ташкенту). */
  closedAtText: string | null;
  /** Ушёл клиенту в эту минуту (по Ташкенту); null — не отправлен. */
  sentAtText: string | null;
  /** Кому и с какого аккаунта — все отправки, время по Ташкенту. */
  sendsText: (MockupSend & { atText: string })[];
};

/** Сколько отправок видно сразу; остальные — под «ещё N». */
const SENDS_SHOWN = 3;

/** Кого можно назначить ответственным. Пусто — назначать нельзя (менеджер). */
export type MockupTeam = { id: string; name: string }[];

/** Открытый заказ макета из задачи: подпись и сайт клиента (для подсказки). */
export type MockupOrderOption = { taskId: string; label: string; site: string | null };

type Filter = "all" | "hand" | "unsent" | "showcase";

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
  if (filter === "hand") return row.kind === "proto";
  if (filter === "unsent") return row.kind === "proto" && !row.sentAt;
  return true;
}

export function MockupList({ rows, team, orders = [] }: { rows: MockupView[]; team: MockupTeam; orders?: MockupOrderOption[] }) {
  const t = usePanelDict(mockupsDict);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CodeResult>>({});
  const [ownerFails, setOwnerFails] = useState<Record<string, Extract<OwnerResult, { ok: false }>["reason"]>>({});
  const [linked, setLinked] = useState<Record<string, LinkResult>>({});

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        matches(row, filter) &&
        (!q ||
          [
            row.name,
            row.site ?? "",
            row.niche,
            row.url,
            row.owner?.name ?? "",
            ...row.sendsText.flatMap((send) => [send.to, send.handle ?? "", typeof send.from === "string" ? "" : (send.from.label ?? "")]),
          ].some((text) => text.toLowerCase().includes(q))),
    );
  }, [rows, query, filter]);

  const filters: [Filter, string][] = [
    ["all", t.filterAll],
    ["hand", t.filterHand],
    ["unsent", t.filterUnsent],
    ["showcase", t.filterShowcase],
  ];

  async function assign(row: MockupView, staffId: string) {
    setBusy(row.ref);
    setOwnerFails((prev) => {
      const next = { ...prev };
      delete next[row.ref];
      return next;
    });
    try {
      const result = await mockupOwnerAction(row.ref, staffId);
      if (result.ok) router.refresh();
      else setOwnerFails((prev) => ({ ...prev, [row.ref]: result.reason }));
    } catch {
      setOwnerFails((prev) => ({ ...prev, [row.ref]: "offline" }));
    } finally {
      setBusy(null);
    }
  }

  async function linkOrder(row: MockupView, taskId: string) {
    if (!taskId) return;
    setBusy(row.ref);
    try {
      const result = await mockupOrderAction(row.ref, taskId);
      setLinked((prev) => ({ ...prev, [row.ref]: result }));
      if (result.ok) router.refresh();
    } catch {
      setLinked((prev) => ({ ...prev, [row.ref]: { ok: false, reason: "offline" } }));
    } finally {
      setBusy(null);
    }
  }

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
              <li
                key={row.ref}
                id={`mockup-${row.ref.replace(/[^a-z0-9-]/gi, "-")}`}
                className="scroll-mt-24 rounded-xl border border-line bg-surface px-4 py-3 target:ring-2 target:ring-gold/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-medium text-text">{row.name}</span>
                      {row.site ? <span className="font-mono text-xs text-blue-soft">{row.site}</span> : null}
                      {row.kind === "showcase" ? <span className="text-xs text-faint">{t.tagShowcase}</span> : null}
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
                      {row.access === "open" && row.openHours ? <span className="text-gold">{t.openFor(row.openHours)}</span> : null}
                      {row.access === "closed" && row.closedAtText ? (
                        <span className="text-faint">{row.autoClosed ? t.closedAuto(row.closedAtText) : t.closedSince(row.closedAtText)}</span>
                      ) : null}
                      {row.liveUntilText ? <span className="text-green">{t.liveUntil(row.liveUntilText)}</span> : null}
                      {row.opens ? <span className="text-faint">{t.opens(row.opens)}</span> : null}
                      {row.promo ? <span className="text-gold">{t.ownPromo(row.promo.price, row.promo.regular)}</span> : null}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" data-mockup-owner>
                      <span className="text-muted">{t.owner}:</span>
                      {team.length ? (
                        <select
                          value={row.owner?.source === "set" ? row.owner.id : ""}
                          onChange={(event) => assign(row, event.target.value)}
                          disabled={busy !== null}
                          aria-label={t.owner}
                          className="max-w-[16rem] rounded-md border border-line bg-ink px-2 py-0.5 text-xs text-text outline-none focus:border-green/50 disabled:opacity-50"
                        >
                          <option value="">
                            {row.owner && row.owner.source !== "set" ? t.ownerAuto(row.owner.name, t[`ownerFrom_${row.owner.source}`]) : t.ownerNone}
                          </option>
                          {row.owner?.source === "set" && !team.some((person) => person.id === row.owner?.id) ? (
                            <option value={row.owner.id}>{row.owner.name}</option>
                          ) : null}
                          {team.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      ) : row.owner ? (
                        <span className="font-medium text-text">
                          {row.owner.name} <span className="text-faint">({t[`ownerFrom_${row.owner.source}`]})</span>
                        </span>
                      ) : (
                        <span className="text-gold">{t.ownerNone}</span>
                      )}
                      <span className="text-faint">·</span>
                      {row.sentAtText ? (
                        <span className="text-green">{t.sentAt(row.sentAtText)}</span>
                      ) : row.kind === "proto" ? (
                        <span className="text-gold">{t.notSent}</span>
                      ) : (
                        <span className="text-faint">{t.notSentShowcase}</span>
                      )}
                      {ownerFails[row.ref] ? <span className="text-gold">{t[`ownerFail_${ownerFails[row.ref]}`]}</span> : null}
                    </p>
                    {orders.length && row.owner?.source !== "order" ? (
                      <OrderPicker row={row} orders={orders} busy={busy !== null} onLink={(taskId) => linkOrder(row, taskId)} t={t} />
                    ) : null}
                    {linked[row.ref] ? (
                      <p className={`mt-1 text-xs ${linked[row.ref].ok ? "text-green" : "text-gold"}`}>
                        {(() => {
                          const result = linked[row.ref];
                          return result.ok ? (result.closed ? t.orderDoneClosed : t.orderDone) : t[`orderFail_${result.reason}`];
                        })()}
                      </p>
                    ) : null}
                    {row.sendsText.length ? <SendList sends={row.sendsText} t={t} /> : null}
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

type MockupsDict = Picked<typeof mockupsDict>;

/**
 * Кому и с какого аккаунта ушёл макет: каждая отправка строкой, первые
 * SENDS_SHOWN сразу, остальные — под «ещё N». Клиент с лидом — ссылка на
 * карточку лида (её откроет тот, кому лид виден).
 */
function SendList({ sends, t }: { sends: MockupView["sendsText"]; t: MockupsDict }) {
  const line = (send: MockupView["sendsText"][number], i: number) => (
    <li key={`${send.at}-${i}`} className="flex flex-wrap items-baseline gap-x-1.5">
      <span aria-hidden>→</span>
      {send.leadId ? (
        <a href={`/admin/leads/${send.leadId}`} className="text-text hover:text-green">
          {send.to}
        </a>
      ) : (
        <span className="text-text">{send.to}</span>
      )}
      {send.handle ? <span className="text-faint">{send.handle}</span> : null}
      <span className="text-faint">·</span>
      <span>{send.from === "unknown" ? t.sendFromUnknown : t.sendFrom(send.from.label, send.from.handle)}</span>
      <span className="text-faint">·</span>
      <span className="text-faint">{send.atText}</span>
      {send.leadId || send.prospectId ? <ShownMark leadId={send.leadId} prospectId={send.prospectId} /> : null}
    </li>
  );
  const rest = sends.slice(SENDS_SHOWN);
  return (
    <div className="mt-1 text-xs text-muted" data-mockup-sends>
      <p className="text-faint">{t.sendsTitle}</p>
      <ul className="mt-0.5 space-y-0.5">{sends.slice(0, SENDS_SHOWN).map(line)}</ul>
      {rest.length ? (
        <details className="mt-0.5">
          <summary className="cursor-pointer text-faint hover:text-green">{t.moreSends(rest.length)}</summary>
          <ul className="mt-0.5 space-y-0.5">{rest.map((send, i) => line(send, i + SENDS_SHOWN))}</ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * «Показал макет» — у каждой отправки, рядом с паролем: показ отмечают там же,
 * где выдают доступ (владелец, 23.10.2026, на разбор удобства: раньше кнопка
 * была только на «Главной» и в карточке лида). Тот же markStageAction, что в
 * карточке лида: кто может отметить — решает canMark (менеджер — по своему).
 */
function ShownMark({ leadId, prospectId }: { leadId: string | null; prospectId: string | null }) {
  const s = usePanelDict(salesStagesDict);
  return (
    <details className="w-full sm:w-auto">
      <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-lg border border-green/40 px-2 py-0.5 text-green hover:bg-green/10 [&::-webkit-details-marker]:hidden">
        🎬 {s.markShown}
      </summary>
      <div className="mt-1 flex flex-wrap gap-2">
        {(["video", "live"] as const).map((via) => (
          <form key={via} action={markStageAction}>
            {leadId ? <input type="hidden" name="lead" value={leadId} /> : null}
            {prospectId ? <input type="hidden" name="prospect" value={prospectId} /> : null}
            <input type="hidden" name="back" value="/admin/mockups" />
            <input type="hidden" name="kind" value="shown" />
            <input type="hidden" name="via" value={via} />
            <SubmitButton base="rounded-lg px-2.5 py-1 text-xs" tone="quiet" pendingLabel={s.saving}>
              {via === "video" ? s.viaVideo : s.viaLive}
            </SubmitButton>
          </form>
        ))}
      </div>
    </details>
  );
}

/**
 * «Заказ: привязать к заказу…» — открытые заказы макетов из задач. Заказ,
 * чей сайт совпадает с сайтом макета, выбран сразу (orderForSite).
 */
function OrderPicker({
  row,
  orders,
  busy,
  onLink,
  t,
}: {
  row: MockupView;
  orders: MockupOrderOption[];
  busy: boolean;
  onLink: (taskId: string) => void;
  t: Picked<typeof mockupsDict>;
}) {
  const host = siteHost(row.site);
  const suggested = host ? (orders.find((o) => siteHost(o.site) === host)?.taskId ?? "") : "";
  const [taskId, setTaskId] = useState(suggested);
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" data-mockup-order>
      <span className="text-muted">{t.orderLabel}:</span>
      <select
        value={taskId}
        onChange={(event) => setTaskId(event.target.value)}
        disabled={busy}
        aria-label={t.orderLabel}
        className="max-w-[20rem] rounded-md border border-line bg-ink px-2 py-0.5 text-xs text-text outline-none focus:border-green/50 disabled:opacity-50"
      >
        <option value="">{t.orderPick}</option>
        {orders.map((o) => (
          <option key={o.taskId} value={o.taskId}>
            {o.label}
            {o.taskId === suggested ? ` (${t.orderSuggested})` : ""}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => onLink(taskId)} disabled={busy || !taskId} className={BUTTON}>
        {t.orderLink}
      </button>
    </p>
  );
}
