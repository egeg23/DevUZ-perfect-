import { cancelBroadcastAction } from "@/app/admin/hq/actions";
import { HelpHint } from "@/components/admin/help-link";
import { HqBroadcast } from "@/components/admin/hq-broadcast";
import { HqTask } from "@/components/admin/hq-task";
import { broadcastDict, hqTaskDict } from "@/content/admin-panel/hq-actions";
import { canCancel, statusOf, type BroadcastPerson } from "@/lib/admin/broadcast";
import type { HistoryItem } from "@/lib/admin/broadcast-store";
import { helpAnchor } from "@/lib/admin/help";
import { clockOf } from "@/lib/admin/hq";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import type { Role } from "@/lib/admin/roles";

/**
 * Правая колонка «Главной» под «Требует внимания»: быстрая задача и
 * рассылка в бот команде с историей. Карточки — того же вида, что пульс.
 */

const CARD = "rounded-3xl border border-line/70 bg-surface p-4 shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:p-5";

const ROLE_WORD: Record<Role, "roleAdmin" | "roleHead" | "roleManager"> = {
  admin: "roleAdmin",
  head: "roleHead",
  manager: "roleManager",
};

/** «14.10 14:50» по Ташкенту. */
function stamp(iso: string): string {
  const d = new Date(Date.parse(iso) + 5 * 3600_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")} ${clockOf(iso)}`;
}

export function HqSide({
  locale,
  viewer,
  taskPeople,
  preselect,
  broadcast,
  now,
}: {
  locale: PanelLocale;
  viewer: { id: string; role: Role };
  taskPeople: { id: string; name: string }[];
  preselect?: string | null;
  /** null — рассылка этому человеку не положена (не владелец и не руководитель). */
  broadcast: { people: BroadcastPerson[]; history: HistoryItem[] } | null;
  now: Date;
}) {
  const tt = pick(hqTaskDict, locale);
  const tb = pick(broadcastDict, locale);
  return (
    <>
      <section id="task" className={`${CARD} scroll-mt-24`} aria-labelledby="hq-task">
        <h2 id="hq-task" className="mb-4 flex items-center gap-2 text-sm font-semibold">
          {tt.title}
          <HelpHint topic={helpAnchor("/admin/hq", "task")} />
        </h2>
        <HqTask people={taskPeople} preselect={preselect} />
      </section>

      {broadcast ? (
        <section id="broadcast" className={`${CARD} scroll-mt-24`} aria-labelledby="hq-broadcast">
          <h2 id="hq-broadcast" className="mb-3 flex items-center gap-2 text-sm font-semibold">
            {tb.title}
            <HelpHint topic={helpAnchor("/admin/hq", "broadcast")} />
          </h2>
          <HqBroadcast people={broadcast.people} selfId={viewer.id} />

          <h3 className="mt-6 text-xs font-medium uppercase tracking-wider text-faint">{tb.historyTitle}</h3>
          {broadcast.history.length ? (
            <ul className="mt-2 flex flex-col divide-y divide-line/60">
              {broadcast.history.map((b) => {
                const status = statusOf(b, now);
                const to =
                  b.audience === "all"
                    ? tb.toAll
                    : b.audience === "roles"
                      ? b.roles.map((r) => tb[ROLE_WORD[r as Role] ?? "roleManager"]).join(", ")
                      : tb.toPicked;
                const label = {
                  scheduled: tb.stScheduled(stamp(b.send_at)),
                  night: tb.stNight,
                  sending: tb.stSending,
                  done: tb.stDone,
                  cancelled: tb.stCancelled,
                }[status];
                return (
                  <li key={b.id} className="py-3">
                    <div className="flex items-center gap-2 text-xs text-faint">
                      <span>{stamp(b.created_at)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          status === "done"
                            ? "bg-green/10 text-green"
                            : status === "cancelled"
                              ? "bg-surface-2 text-faint"
                              : "bg-gold/15 text-gold"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-text">{b.text}</p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted">{tb.historyLine(b.authorName, to, b.delivered, b.recipients.length)}</p>
                      {canCancel(b, b.delivered, viewer, now) ? (
                        <form action={cancelBroadcastAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="min-h-11 rounded-2xl px-3 text-xs text-gold transition hover:bg-surface-2">
                            {tb.cancel}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-faint">{tb.historyNone}</p>
          )}
        </section>
      ) : null}
    </>
  );
}
