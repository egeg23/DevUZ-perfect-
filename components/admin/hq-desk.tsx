import Link from "next/link";

import { hqDeskDict } from "@/content/admin-panel/hq-desk";
import { inboxDict } from "@/content/admin-panel/inbox";
import { PANEL_INTL, pick, type PanelLocale } from "@/lib/admin/i18n";
import { waitedMinutes, type InboxItem } from "@/lib/admin/inbox";

/**
 * Верхний ряд «Главной» по эталону «DevUz Офис» (владелец, 03.11.2026:
 * «Хочу что б было как на референсах, только с нашими разделами»): слева
 * «Входящие» — кто ждёт ответа человека, тот же список, что раздел; справа
 * «Сегодня» — три числа и касания по дням. Только отрисовка готовых чисел:
 * их считают loadInbox и loadHq, модели нет.
 */

export type DeskTile = { label: string; value: number; sub?: string; delta?: number };

const keyOf = (item: InboxItem) => (item.kind === "touch" ? `t:${item.prospectId}` : `b:${item.chatId}`);

export function HqDesk({
  locale,
  items,
  now,
  tiles,
  days,
}: {
  locale: PanelLocale;
  items: readonly InboxItem[];
  now: Date;
  /** Нет — правой карточки нет (менеджеру свой пульс ниже). */
  tiles?: readonly DeskTile[];
  /** Касания по дням, старший день первым. */
  days?: readonly number[];
}) {
  const t = pick(hqDeskDict, locale);
  const ti = pick(inboxDict, locale);
  const top = items.slice(0, 6);
  return (
    <div className={`mb-6 grid gap-4 ${tiles ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : ""}`}>
      <section className="os-glass os-card">
        <div className="mb-3 flex items-center gap-2.5">
          <ChatIcon />
          <h2 className="text-[15px] font-semibold text-text">{t.inbox}</h2>
          <span className="os-pill os-pill-new ml-auto">
            <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-green" />
            {t.live}
          </span>
        </div>
        {top.length ? (
          <ul className="flex flex-col gap-0.5">
            {top.map((item, i) => {
              const minutes = waitedMinutes(item.since, now.getTime());
              return (
                <li key={keyOf(item)}>
                  <Link href={`/admin/inbox?c=${encodeURIComponent(keyOf(item))}`} className={`os-conv ${i === 0 ? "is-on" : ""}`}>
                    <span
                      aria-hidden
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${item.kind === "touch" ? "bg-[#2aa3e0]" : "bg-violet"}`}
                    >
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                        <path d="M21.5 3.6L2.9 10.8c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8L22.9 5c.3-1.3-.5-1.9-1.4-1.4zM9.8 14.4l-.4 3.9-1.4-4.5 10.6-6.7z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text">{item.label}</span>
                      <span className="block truncate text-[12.5px] text-muted">{item.text || (item.kind === "touch" ? ti.kindTouch : ti.kindBot)}</span>
                    </span>
                    <span className={`shrink-0 font-mono text-[11px] ${minutes >= 60 ? "text-gold" : "text-faint"}`}>{ti.waited(minutes)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted">{t.inboxEmpty}</p>
        )}
        <Link href="/admin/inbox" className="mt-3 inline-block text-[13px] text-blue-soft hover:underline">
          {t.allInbox} →
        </Link>
      </section>

      {tiles ? (
        <section className="os-glass os-card">
          <div className="mb-3 flex items-center gap-2.5">
            <BarsIcon />
            <h2 className="text-[15px] font-semibold text-text">{t.today}</h2>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {tiles.map((tile) => (
              <div key={tile.label} className="os-stat">
                <div className="flex items-baseline gap-2 font-display text-2xl font-bold tabular-nums text-text">
                  {tile.value}
                  {tile.sub ? <span className="font-sans text-sm font-normal text-muted">{tile.sub}</span> : null}
                  {tile.delta ? (
                    <small title={t.vsPrev} className={`font-mono text-[11px] font-semibold ${tile.delta > 0 ? "text-green" : "text-gold"}`}>
                      {tile.delta > 0 ? "↑" : "↓"} {Math.abs(tile.delta)}
                    </small>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted">{tile.label}</div>
              </div>
            ))}
          </div>
          {days && days.length > 1 ? (
            <>
              <div className="mb-1 mt-5 flex items-center gap-2">
                <h3 className="text-[14px] font-semibold text-text">{t.activity}</h3>
                <span className="os-pill os-pill-new ml-auto">{t.days7}</span>
              </div>
              <Activity values={days} now={now} locale={locale} />
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

/** Плавная линия по дням с заливкой: последняя точка — сегодня. */
function Activity({ values, now, locale }: { values: readonly number[]; now: Date; locale: PanelLocale }) {
  const W = 520;
  const H = 180;
  const pl = 28;
  const pb = 24;
  const pt = 10;
  const top = Math.max(...values, 1);
  const max = top <= 5 ? 5 : Math.ceil(top / 10) * 10;
  const n = values.length;
  const x = (i: number) => pl + (i * (W - pl - 12)) / (n - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  let d = `M${x(0)},${y(values[0])}`;
  for (let i = 1; i < n; i++) {
    const cx = (x(i - 1) + x(i)) / 2;
    d += ` C${cx},${y(values[i - 1])} ${cx},${y(values[i])} ${x(i)},${y(values[i])}`;
  }
  const day = (i: number) =>
    new Date(now.getTime() - (n - 1 - i) * 86_400_000).toLocaleDateString(PANEL_INTL[locale], { weekday: "short", timeZone: "Asia/Tashkent" });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={values.join(", ")} className="block h-auto w-full">
      <defs>
        <linearGradient id="desk-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22f0a0" stopOpacity=".28" />
          <stop offset="1" stopColor="#22f0a0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="desk-line" x1="0" x2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#22f0a0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => {
        const v = Math.round(max * f);
        return (
          <g key={f}>
            <line x1={pl} x2={W - 12} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.06)" />
            <text x={pl - 8} y={y(v) + 4} textAnchor="end" fill="#5b6779" fontSize="11">
              {v}
            </text>
          </g>
        );
      })}
      <path d={`${d} L${x(n - 1)},${H - pb} L${x(0)},${H - pb}Z`} fill="url(#desk-area)" />
      <path d={d} fill="none" stroke="url(#desk-line)" strokeWidth="2.5" />
      {values.map((v, i) => (
        <g key={i}>
          <circle
            cx={x(i)}
            cy={y(v)}
            r={i === n - 1 ? 5 : 3}
            fill={i === n - 1 ? "#eaf0f7" : "#5b9bff"}
            stroke={i === n - 1 ? "#22f0a0" : "none"}
            strokeWidth={3}
          />
          <text x={x(i)} y={H - 6} textAnchor="middle" fill="#5b6779" fontSize="11">
            {day(i)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="text-muted">
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted">
      <path d="M4 19V13M9 19V7M14 19v-9M19 19V4" />
    </svg>
  );
}
