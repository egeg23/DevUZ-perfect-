import Link from "next/link";

import { InboxReply } from "@/components/admin/inbox-reply";
import { inboxDict } from "@/content/admin-panel/inbox";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { waitedMinutes, type InboxItem } from "@/lib/admin/inbox";
import type { Inbox } from "@/lib/admin/inbox-store";
import { objectionOf } from "@/lib/admin/objections";
import type { TalkView } from "@/lib/admin/outreach-talk-store";
import { STAGES, type Deal } from "@/lib/admin/sales-stages";

/** Длины полей ответа — из хранилищ касаний и бота (здесь числами: вёрстка без базы). */
export type ReplyLimits = { touch: number; bot: number };

/** Ступени «Хода сделки» справа — те же, что на «Главной» и доске лидов. Сумм здесь нет. */
const SIDE_STAGES = STAGES;

export const inboxKey = (item: InboxItem) => (item.kind === "touch" ? `t:${item.prospectId}` : `b:${item.chatId}`);
const keyOf = inboxKey;

/**
 * «Входящие» — вёрстка в три колонки по эталону «DevUz Офис» (владелец,
 * 03.11.2026: «Хочу что б было как на референсах, только с нашими
 * разделами»): слева переписки, дольше ждёт — выше; посередине разговор и
 * поле ответа с подсказкой; справа клиент и ход сделки. Только отрисовка:
 * строки готовит app/admin/inbox/page.tsx, её же рисуют тест и скриншоты.
 * Выбор — `?c=` в адресе. На телефоне — список, нажатие открывает разговор,
 * «← Все переписки» возвращает.
 */
export function InboxView({
  locale,
  role,
  inbox,
  picked,
  talk,
  deal,
  names,
  now,
  limits,
}: {
  locale: PanelLocale;
  role: string;
  inbox: Inbox;
  /** Выбранный в адресе; null — на компьютере открыт первый, на телефоне список. */
  picked: InboxItem | null;
  talk: TalkView | null;
  deal: Deal | null;
  names: Readonly<Record<string, string>>;
  now: number;
  limits: ReplyLimits;
}) {
  const t = pick(inboxDict, locale);
  const st = pick(salesStagesDict, locale);
  const name = (id: string | null) => (id ? (names[id] ?? "—") : t.nobody);
  const everyone = role !== "manager";
  const current = picked ?? inbox.items[0] ?? null;
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(PANEL_INTL[locale], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" });

  return (
    <>
      {inbox.offline ? <p className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{t.offline}</p> : null}

      {inbox.items.length ? (
        <div className="os-inbox">
          {/* Слева — переписки. */}
          <section className={`os-glass os-inbox-list ${picked ? "os-phone-off" : ""}`} aria-label={t.conversations}>
            <div className="flex items-center gap-2 px-4 pb-2 pt-4">
              <h1 className="text-[15px] font-semibold text-text" style={{ fontFamily: "var(--font-sans)" }}>
                {t.title}
              </h1>
              <span className="os-pill os-pill-new ml-auto">
                <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-green" />
                {t.waitingNow}
              </span>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {inbox.items.map((item) => {
                const key = keyOf(item);
                const minutes = waitedMinutes(item.since, now);
                const on = current ? keyOf(current) === key : false;
                return (
                  <li key={key}>
                    <Link
                      href={`/admin/inbox?c=${encodeURIComponent(key)}`}
                      aria-current={on ? "true" : undefined}
                      className={`os-conv ${on ? "is-on" : ""}`}
                    >
                      <Channel kind={item.kind} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-text">{item.label}</span>
                        <span className="block truncate text-[12.5px] text-muted">{item.text || (item.kind === "touch" ? t.kindTouch : t.kindBot)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`font-mono text-[11px] ${minutes >= 60 ? "text-gold" : "text-faint"}`}>{t.waited(minutes)}</span>
                        <i aria-hidden className={`h-2 w-2 rounded-full ${minutes >= 60 ? "bg-gold" : "bg-blue-soft"}`} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-2.5 text-xs text-faint">
              <span>{t.count(inbox.items.length)}</span>
              {inbox.freeLeads ? (
                <Link href="/admin?owner=free&status=new" className="text-green hover:underline">
                  {t.freeLeads(inbox.freeLeads)}
                </Link>
              ) : null}
            </div>
          </section>

          {/* Посередине — разговор и ответ. */}
          {current ? (
            <section className={`os-glass os-inbox-thread ${picked ? "" : "os-phone-off"}`} aria-label={current.label}>
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <Link href="/admin/inbox" className="text-xs text-muted hover:text-text lg:hidden">
                  {t.back}
                </Link>
                <Avatar label={current.label} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-text">{current.label}</div>
                  <div className="truncate text-xs text-muted">
                    {current.kind === "touch" ? t.kindTouch : t.kindBot} · {t.waited(waitedMinutes(current.since, now))}
                    {everyone ? ` · ${t.owner(name(current.ownerId))}` : ""}
                  </div>
                </div>
              </div>
              <Thread current={current} talk={talk} t={t} time={time} />
              <div className="border-t border-white/10 p-3 sm:p-4">
                {current.kind === "touch" && current.leadId ? (
                  <InboxReply
                    kind="touch"
                    leadId={current.leadId}
                    prospectId={current.prospectId}
                    limit={limits.touch}
                    alwaysOpen
                    suggest={suggestFor(current, talk)}
                  />
                ) : current.kind === "touch" ? (
                  <Link href={`/admin/prospect?open=${current.prospectId}#p-${current.prospectId}`} className="text-sm text-green hover:underline">
                    {t.openTouch}
                  </Link>
                ) : (
                  <InboxReply kind="bot" chatId={current.chatId} limit={limits.bot} alwaysOpen />
                )}
              </div>
            </section>
          ) : null}

          {/* Справа — клиент и ход сделки. */}
          {current ? (
            <aside className={`os-glass os-inbox-side ${picked ? "" : "os-phone-off"}`}>
              <div className="flex items-center gap-3">
                <Avatar label={current.label} big />
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-text">{current.label}</div>
                  <div className="text-[13px] text-green">● {t.client}</div>
                  <div className="truncate text-xs text-muted">{current.kind === "touch" ? t.kindTouch : t.kindBot}</div>
                </div>
              </div>
              <dl className="mt-4 space-y-1.5 text-[13px] text-muted">
                {talk?.host ? (
                  <div className="flex gap-2">
                    <dt className="text-faint">{t.site}:</dt>
                    <dd className="truncate">{talk.host}</dd>
                  </div>
                ) : null}
                {talk?.from?.label ? (
                  <div className="flex gap-2">
                    <dt className="text-faint">{t.account}:</dt>
                    <dd className="truncate">{talk.from.label}</dd>
                  </div>
                ) : null}
                {everyone ? <div>{t.owner(name(current.ownerId))}</div> : null}
              </dl>

              {current.kind === "touch" ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <h2 className="mb-2 text-[15px] font-semibold text-text" style={{ fontFamily: "var(--font-sans)" }}>
                    {t.deal}
                  </h2>
                  <DealSteps deal={deal} labels={st} locale={locale} />
                </div>
              ) : null}

              <div className="mt-auto pt-4">
                {current.kind === "touch" && current.leadId ? (
                  <Link href={`/admin/leads/${current.leadId}#talk`} className="block rounded-xl bg-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue/85">
                    {t.open}
                  </Link>
                ) : current.kind === "touch" ? (
                  <Link href={`/admin/prospect?open=${current.prospectId}#p-${current.prospectId}`} className="block rounded-xl bg-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue/85">
                    {t.openTouch}
                  </Link>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      ) : !inbox.offline ? (
        <>
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t.lead}</p>
          <p className="os-glass mt-6 px-5 py-8 text-center text-sm text-muted">{t.empty}</p>
        </>
      ) : null}
    </>
  );
}


/** Подсказка — только если в последних словах клиента узнали возражение. */
function suggestFor(item: InboxItem, talk: TalkView | null): string | null {
  const kind = objectionOf(item.text);
  if (!kind || !talk) return null;
  return talk.quick.find((q) => q.kind === kind)?.text ?? null;
}

function Thread({
  current,
  talk,
  t,
  time,
}: {
  current: InboxItem;
  talk: TalkView | null;
  t: Picked<typeof inboxDict>;
  time: (iso: string) => string;
}) {
  const lines = current.kind === "touch" ? (talk?.lines ?? []).slice(-40) : [];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      {current.kind === "bot" ? (
        <>
          <p className="self-center rounded-full bg-white/5 px-3 py-1 text-center text-xs text-muted">{t.botOnlyLast}</p>
          <Bubble mine={false} text={current.text} meta={`${t.fromClient} · ${time(current.since)}`} />
        </>
      ) : lines.length ? (
        lines.map((line) => (
          <Bubble
            key={line.id}
            mine={line.direction === "out"}
            text={line.body}
            meta={[
              line.direction === "in" ? t.fromClient : line.author === "ai" ? t.fromAi : t.fromUs,
              time(line.created_at),
              line.status === "queued" ? t.queued : line.status === "failed" ? t.failedLine : "",
            ]
              .filter(Boolean)
              .join(" · ")}
            failed={line.status === "failed"}
          />
        ))
      ) : current.text ? (
        <Bubble mine={false} text={current.text} meta={`${t.fromClient} · ${time(current.since)}`} />
      ) : (
        <p className="text-sm text-muted">{t.noLines}</p>
      )}
    </div>
  );
}

function Bubble({ mine, text, meta, failed }: { mine: boolean; text: string; meta: string; failed?: boolean }) {
  return (
    <div className={`flex max-w-[85%] flex-col ${mine ? "items-end self-end" : "items-start self-start"}`}>
      <div
        className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm [overflow-wrap:anywhere] ${
          mine ? (failed ? "bg-red-500/20 text-text" : "bg-blue text-white") : "bg-white/[0.07] text-text"
        }`}
      >
        {text}
      </div>
      <span className="mt-1 font-mono text-[11px] text-faint">{meta}</span>
    </div>
  );
}

function DealSteps({ deal, labels, locale }: { deal: Deal | null; labels: Picked<typeof salesStagesDict>; locale: PanelLocale }) {
  const at = deal?.at ?? {};
  const reached = SIDE_STAGES.filter((s) => at[s]);
  const next = SIDE_STAGES.find((s) => !at[s]);
  const day = (iso: string) => new Date(iso).toLocaleDateString(PANEL_INTL[locale], { day: "2-digit", month: "2-digit", timeZone: "Asia/Tashkent" });
  return (
    <ol className="os-steps">
      {SIDE_STAGES.map((stage, i) => {
        const done = Boolean(at[stage]);
        const now = !done && stage === next && reached.length > 0;
        const label = labels[stage];
        return (
          <li key={stage} className={done ? "is-ok" : now ? "is-now" : ""}>
            <span className="os-step-dot" aria-hidden>
              {done ? "✓" : ""}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {i + 1}. {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
            <span className="font-mono text-[11px] text-faint">{at[stage] ? day(at[stage] as string) : "—"}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Channel({ kind }: { kind: InboxItem["kind"] }) {
  // Касания идут с рабочих аккаунтов Telegram, обращения — в бота студии (тоже Telegram): цвет различает.
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${kind === "touch" ? "bg-[#2aa3e0]" : "bg-violet"}`} aria-hidden>
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
        <path d="M21.5 3.6L2.9 10.8c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8L22.9 5c.3-1.3-.5-1.9-1.4-1.4zM9.8 14.4l-.4 3.9-1.4-4.5 10.6-6.7z" />
      </svg>
    </span>
  );
}

function Avatar({ label, big = false }: { label: string; big?: boolean }) {
  const letters = label
    .replace(/^https?:\/\//, "")
    .split(/[\s.\-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4f6bff] to-blue font-semibold text-white ${big ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"}`}
    >
      {letters || "•"}
    </span>
  );
}
