import { addScoutChatAction, removeScoutChatAction } from "@/app/admin/scout/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { scoutChatStatusDict, scoutGroupsDict } from "@/content/admin-panel/scout";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { CHAT_STATUSES, JOIN_DAILY_CAP, chatUrl, nextJoinAt, type JoinState, type ScoutChat } from "@/lib/scout/extra-chats";
import { mayRemoveChat } from "@/lib/scout/extra-chats-store";

/** Результат действия на странице: ключ `?g=` → строка словаря. */
const RESULTS = ["added", "bad", "exists", "failed", "removed", "notRemoved"] as const;
type Result = (typeof RESULTS)[number];
const OK: readonly Result[] = ["added", "removed"];

/** Сколько строк видно сразу; остальное — под «Все группы». */
const VISIBLE = 12;

const TONE: Record<ScoutChat["status"], string> = {
  pending: "border-line bg-surface-2 text-muted",
  joined: "border-green/40 bg-green/10 text-green",
  request: "border-blue-soft/40 bg-blue-soft/10 text-blue-soft",
  error: "border-gold/30 bg-gold/10 text-gold",
};

/** «15:40» по Ташкенту, а если не сегодня — «07.11 08:00». */
function tashkentTime(ms: number, now: number): string {
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", ...options }).format(new Date(ms));
  const day = (t: number) => new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit" }).format(new Date(t));
  const clock = fmt({ hour: "2-digit", minute: "2-digit" });
  return day(ms) === day(now) ? clock : `${day(ms)} ${clock}`;
}

/**
 * «Группы для скаута» на странице «Сигналы скаута».
 *
 * Владелец, 06.11.2026: «добавлять группы для отслеживания всем. Чтобы и
 * менеджеры и мы прямо там могли добавлять группы и скаут их мониторил. В
 * день самостоятельно не более 10 подписок на группы с интервалом 1-2
 * часа». Добавляет любой, кому открыт раздел; убирает тот, кто добавил,
 * руководитель или владелец. Вступает скаут (scout/runner.mjs).
 */
export function ScoutGroups({
  staff,
  locale,
  chats,
  state,
  names,
  result,
  back,
}: {
  staff: { id: string; role: string };
  locale: PanelLocale;
  chats: ScoutChat[] | null;
  state: JoinState | null;
  names: Map<string, string>;
  result: string | undefined;
  back: string;
}) {
  const t = pick(scoutGroupsDict, locale);
  const statusLabel = pick(scoutChatStatusDict, locale);
  const now = Date.now();
  const shown = RESULTS.find((key) => key === result);

  const counts = Object.fromEntries(CHAT_STATUSES.map((status) => [status, 0])) as Record<ScoutChat["status"], number>;
  for (const chat of chats ?? []) counts[chat.status] += 1;

  // Когда скаут вступит в следующую: то же правило, что у него самого.
  let when: string | null = null;
  if (state && counts.pending) {
    const at = nextJoinAt(state, new Date(now));
    if (state.pausedUntil && state.pausedUntil > now) when = t.paused(tashkentTime(state.pausedUntil, now));
    else if (at === null) when = t.tomorrow;
    else if (at <= now) when = t.nextNow;
    else when = t.next(tashkentTime(at, now));
  }

  const row = (chat: ScoutChat) => {
    const label = chat.handle ? `@${chat.handle}` : `t.me/+${chat.invite ?? ""}`;
    const who = chat.added_by ? names.get(chat.added_by) || "—" : t.fromList;
    return (
      <tr key={chat.id} className="border-t border-line-soft align-top">
        <td data-label={t.colGroup} className="py-2 pr-3">
          <a href={chatUrl(chat)} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-soft hover:underline">
            {label}
          </a>
          {chat.title ? <span className="mt-0.5 block text-xs text-muted">{chat.title}</span> : null}
          {chat.note ? <span className="mt-0.5 block text-xs text-faint">{chat.note}</span> : null}
        </td>
        <td data-label={t.colStatus} className="py-2 pr-3">
          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TONE[chat.status]}`}>{statusLabel[chat.status]}</span>
          {chat.status === "joined" && chat.joined_via ? (
            <span className="mt-0.5 block text-xs text-faint">{chat.joined_via === "scout" ? t.viaScout : t.viaManual}</span>
          ) : null}
          {chat.error && chat.status !== "joined" ? (
            <span className="mt-0.5 block max-w-xs break-words font-mono text-[11px] text-faint">{chat.error}</span>
          ) : null}
        </td>
        <td data-label={t.colAdded} className="py-2 pr-3 text-xs text-muted">{who}</td>
        <td data-label={t.remove} className="py-2 sm:text-right">
          {mayRemoveChat(staff, chat) ? (
            <form action={removeScoutChatAction}>
              <input type="hidden" name="chat" value={chat.id} />
              <input type="hidden" name="back" value={back} />
              <SubmitButton base="rounded-lg px-2.5 py-1 text-xs" tone="quiet">
                {t.remove}
              </SubmitButton>
            </form>
          ) : null}
        </td>
      </tr>
    );
  };

  const table = (list: ScoutChat[]) => (
    <div className="mt-3 overflow-x-auto">
      <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[520px]">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-faint">
            <th className="pb-2 pr-3 font-normal">{t.colGroup}</th>
            <th className="pb-2 pr-3 font-normal">{t.colStatus}</th>
            <th className="pb-2 pr-3 font-normal">{t.colAdded}</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>{list.map(row)}</tbody>
      </table>
    </div>
  );

  // Свежие сверху: только что добавленную человек ищет глазами первой.
  const list = [...(chats ?? [])].reverse();

  return (
    <section id="groups" className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {t.title} <HelpHint topic={helpAnchor("/admin/scout", "groups")} label={t.title} />
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.lead}</p>

      {shown ? (
        <p
          data-result={OK.includes(shown) ? "ok" : "warn"}
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            OK.includes(shown) ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {t[shown]}
        </p>
      ) : null}

      <form action={addScoutChatAction} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="back" value={back} />
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-faint">
          {t.addLabel}
          <input
            name="chat"
            required
            maxLength={300}
            placeholder={t.addPlaceholder}
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-text"
          />
        </label>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-faint">
          {t.noteLabel}
          <input
            name="note"
            maxLength={200}
            placeholder={t.notePlaceholder}
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          />
        </label>
        <SubmitButton base="rounded-lg px-4 py-2 text-sm" pendingLabel={t.adding}>
          {t.add}
        </SubmitButton>
      </form>

      {chats === null ? (
        <p className="mt-3 text-sm text-gold">{t.noDb}</p>
      ) : (
        <>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint">
            {CHAT_STATUSES.filter((status) => counts[status]).map((status) => (
              <span key={status}>
                {statusLabel[status]}: <span className="font-mono text-muted">{counts[status]}</span>
              </span>
            ))}
          </p>
          {state ? (
            <p className="mt-1 text-xs text-muted">
              {t.today(Math.min(state.triedToday, JOIN_DAILY_CAP), JOIN_DAILY_CAP)} {counts.pending ? t.queue(counts.pending) : null}{" "}
              {when}
            </p>
          ) : null}
          {list.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t.empty}</p>
          ) : list.length <= VISIBLE ? (
            table(list)
          ) : (
            <>
              {table(list.slice(0, VISIBLE))}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-blue-soft">{t.all(list.length)}</summary>
                {table(list.slice(VISIBLE))}
              </details>
            </>
          )}
        </>
      )}
    </section>
  );
}
