import Link from "next/link";

import { cancelBroadcastAction } from "@/app/admin/hq/actions";
import { HelpHint } from "@/components/admin/help-link";
import { HqBroadcast, type RepeatOf } from "@/components/admin/hq-broadcast";
import { HqTask } from "@/components/admin/hq-task";
import { broadcastDict, hqTaskDict } from "@/content/admin-panel/hq-actions";
import { canCancel, statusOf, type BroadcastPerson } from "@/lib/admin/broadcast";
import type { Segment } from "@/lib/admin/bot-users";
import type { HistoryItem } from "@/lib/admin/broadcast-store";
import { helpAnchor } from "@/lib/admin/help";
import { clockOf } from "@/lib/admin/hq";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
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

const SEGMENT_WORD: Record<string, "segAll" | "segPartners" | "segBuyers" | "segClients"> = {
  all: "segAll",
  partners: "segPartners",
  buyers: "segBuyers",
  clients: "segClients",
};

/** История одного вида рассылок: сотрудникам — «дошло N из M», пользователям — ещё «не дошло» и «заблокировали бота». */
function History({
  items,
  tb,
  viewer,
  now,
}: {
  items: HistoryItem[];
  tb: Picked<typeof broadcastDict>;
  viewer: { id: string; role: Role };
  now: Date;
}) {
  return (
    <>
          {items.length ? (
            <ul className="mt-2 flex flex-col divide-y divide-line/60">
              {items.map((b) => {
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
                      <p className="text-xs text-muted">
                        {b.kind === "users" && b.tally
                          ? tb.usersHistoryLine(
                              `${b.authorName} → ${tb[SEGMENT_WORD[b.segment ?? "all"] ?? "segAll"]}`,
                              b.tally.sent,
                              b.tally.failed,
                              b.tally.blocked,
                              b.chats.length,
                            )
                          : tb.historyLine(b.authorName, to, b.delivered, b.recipients.length)}
                      </p>
                      <div className="flex items-center">
                      <Link
                        href={`/admin/hq?repeat=${b.id}#broadcast`}
                        className="flex min-h-11 items-center rounded-2xl px-3 text-xs text-green transition hover:bg-surface-2"
                      >
                        {tb.repeat}
                      </Link>
                      {canCancel(b, b.delivered, viewer, now) ? (
                        <form action={cancelBroadcastAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="min-h-11 rounded-2xl px-3 text-xs text-gold transition hover:bg-surface-2">
                            {tb.cancel}
                          </button>
                        </form>
                      ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-faint">{tb.historyNone}</p>
          )}
    </>
  );
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
  broadcast: {
    people: BroadcastPerson[];
    history: HistoryItem[];
    usersHistory: HistoryItem[];
    userCounts: Record<Segment, number>;
    /** «Повторить»: прошлая рассылка для формы. */
    repeat?: RepeatOf | null;
  } | null;
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
        {/* Ключ — человек из «Поставить задачу» в карточке: форма уже на
            странице, и без нового ключа отметка (defaultChecked) не
            появилась бы — так и было у владельца на телефоне 14.10.2026. */}
        <HqTask key={preselect ?? "none"} people={taskPeople} preselect={preselect} />
      </section>

      {broadcast ? (
        <section id="broadcast" className={`${CARD} scroll-mt-24`} aria-labelledby="hq-broadcast">
          <h2 id="hq-broadcast" className="mb-3 flex items-center gap-2 text-sm font-semibold">
            {tb.title}
            <HelpHint topic={helpAnchor("/admin/hq", "broadcast")} />
          </h2>
          {/* Ключ — новая форма на каждое «Повторить»: иначе состояние формы
              осталось бы прежним, и подстановка не случилась бы. */}
          <HqBroadcast
            key={broadcast.repeat?.id ?? "new"}
            people={broadcast.people}
            selfId={viewer.id}
            userCounts={broadcast.userCounts}
            historyStaff={<History items={broadcast.history} tb={tb} viewer={viewer} now={now} />}
            historyUsers={<History items={broadcast.usersHistory} tb={tb} viewer={viewer} now={now} />}
            initial={broadcast.repeat}
          />

        </section>
      ) : null}
    </>
  );
}
