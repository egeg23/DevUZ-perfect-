import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { TrashButton } from "@/components/admin/trash-button";
import { leadSortDict } from "@/content/admin-panel/lead-sort";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { idleDays } from "@/lib/admin/lead-tidy";
import { parseSkip, sortQueue, type SortCard } from "@/lib/admin/lead-sort";
import { loadSort } from "@/lib/admin/lead-sort-store";
import { mayTrash } from "@/lib/admin/lead-trash";
import { sortSkipAction, sortTakeAction, sortTidyAction, sortTrashAction } from "./actions";

export const dynamic = "force-dynamic";

const BIG = "min-h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98]";
const GHOST = `${BIG} border border-white/10 bg-white/5 text-text hover:border-white/25`;

/**
 * «Разобрать лиды» (lib/admin/lead-sort.ts) — скопившееся по одному лиду:
 * крупная карточка и решение в одно нажатие, после него — сразу следующий,
 * результат плашкой сверху (components/admin/keep-place.tsx). Владелец,
 * 03.11.2026: «сделай более удобный способ разгребать лиды, которые
 * скапливаются». Раздел — «Лиды»: открыт всем, права решают действия.
 */
export default async function LeadSortPage({ searchParams }: { searchParams: Promise<{ skip?: string }> }) {
  const staff = await requireSection("/admin");
  const locale = staff.panel_locale;
  const t = pick(leadSortDict, locale);
  const { skip: rawSkip } = await searchParams;
  const skip = parseSkip(rawSkip);
  const now = new Date();
  const data = await loadSort(staff.id);
  const all = sortQueue(data, now, new Set());
  const queue = sortQueue(data, now, new Set(skip));
  const card = queue[0] ?? null;
  const idleLeft = queue.filter((c) => c.kind === "idle").length;
  const freeLeft = queue.length - idleLeft;
  const skipValue = skip.join(",");

  return (
    <AdminShell staff={staff}>
      <Link href="/admin" className="text-sm text-muted hover:text-text">
        {t.back}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.lead}</p>
      {data.offline ? <p className="mt-3 text-sm text-gold">{t.offline}</p> : null}

      {card ? (
        <>
          <p className="mt-4 font-mono text-xs text-faint">{t.left(idleLeft, freeLeft)}</p>
          <section className="os-glass os-card mt-3 max-w-2xl" aria-live="polite">
            <Card card={card} t={t} now={now} />

            {/* Решение. */}
            <div className="mt-5 flex flex-wrap gap-2">
              {card.kind === "free" ? (
                <form action={sortTakeAction}>
                  <input type="hidden" name="lead" value={card.id} />
                  <input type="hidden" name="skip" value={skipValue} />
                  <button type="submit" className={`${BIG} bg-green text-ink hover:bg-green-dim`}>
                    {t.take}
                  </button>
                </form>
              ) : (
                <>
                  {(["won", "lost"] as const).map((answer) => (
                    <form key={answer} action={sortTidyAction}>
                      <input type="hidden" name="lead" value={card.id} />
                      <input type="hidden" name="answer" value={answer} />
                      <input type="hidden" name="skip" value={skipValue} />
                      <button type="submit" className={answer === "won" ? `${BIG} bg-green text-ink hover:bg-green-dim` : GHOST}>
                        {t[answer]}
                      </button>
                    </form>
                  ))}
                </>
              )}
              {mayTrash(staff, { assigned_staff_id: card.kind === "free" ? null : staff.id }) ? (
                <TrashButton
                  action={sortTrashAction}
                  leadId={card.id}
                  confirm={t.trashConfirm}
                  hidden={{ skip: skipValue }}
                  className={`${BIG} border border-red-400/30 bg-red-500/10 text-red-200 hover:border-red-400/60`}
                >
                  {t.trash}
                </TrashButton>
              ) : null}
              <form action={sortSkipAction}>
                <input type="hidden" name="lead" value={card.id} />
                <input type="hidden" name="skip" value={skipValue} />
                <button type="submit" className={GHOST}>
                  {t.skip}
                </button>
              </form>
            </div>

            {card.kind === "idle" ? (
              card.canWait ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <span className="text-sm text-muted">{t.waitTitle}</span>
                  {(["w1", "w3", "w7"] as const).map((term) => (
                    <form key={term} action={sortTidyAction}>
                      <input type="hidden" name="lead" value={card.id} />
                      <input type="hidden" name="answer" value={term} />
                      <input type="hidden" name="skip" value={skipValue} />
                      <button type="submit" className={GHOST}>
                        {t[term]}
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border-t border-white/10 pt-4 text-sm text-gold">{t.noWait}</p>
              )
            ) : null}
            <p className="mt-4 text-xs text-faint">{t.trashHint}</p>
          </section>
        </>
      ) : all.length ? (
        <div className="os-glass os-card mt-5 max-w-2xl">
          <p className="text-sm text-muted">{t.skippedAll}</p>
          <Link href="/admin/leads/sort" className="mt-3 inline-block rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink">
            {t.restart}
          </Link>
        </div>
      ) : (
        <p className="os-glass mt-5 max-w-2xl px-5 py-8 text-center text-sm text-muted">{t.empty}</p>
      )}
    </AdminShell>
  );
}

function Card({ card, t, now }: { card: SortCard; t: ReturnType<typeof pick<typeof leadSortDict>>; now: Date }) {
  const days = (iso: string) => Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / 86_400_000));
  return (
    <>
      <span className={`os-pill ${card.kind === "idle" ? "os-pill-late" : "os-pill-new"}`}>{card.kind === "idle" ? t.kindIdle : t.kindFree}</span>
      <h2 className="mt-3 text-xl font-semibold text-text">{card.label}</h2>
      <p className="mt-1 font-mono text-xs text-faint">
        {card.kind === "idle" ? t.idleFor(idleDays(card.movedAt, now)) : [card.requestNo, t.waitsFor(days(card.createdAt))].filter(Boolean).join(" · ")}
      </p>
      {card.kind === "free" ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-faint">{t.wants}</dt>
            <dd className="mt-0.5 whitespace-pre-line text-text">{card.request ?? t.noRequest}</dd>
          </div>
          {card.source ? (
            <div>
              <dt className="text-xs text-faint">{t.source}</dt>
              <dd className="mt-0.5 text-muted">
                {Object.hasOwn(t, `src_${card.source}`) ? (t[`src_${card.source}` as keyof typeof t] as string) : card.source}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <Link href={`/admin/leads/${card.id}`} className="mt-3 inline-block text-sm text-blue-soft hover:underline">
        {t.open} →
      </Link>
    </>
  );
}
