import Link from "next/link";

import { prepareOutreachAction, sendOutreachAction, skipProspectAction } from "@/app/admin/prospect/actions";
import { DAILY_CAP, REASON_TEXT, canContact, targetFor, type Reason } from "@/lib/admin/outreach";
import type { Prospect } from "@/lib/admin/outreach-store";
import { contactsLine, hasAnyContact } from "@/lib/audit/contacts";

/**
 * Разобранные сайты и первое касание по каждому.
 *
 * Порядок на экране повторяет порядок решения: что нашли → куда написать →
 * что отправим. Текст сообщения открыт для правки прямо здесь: владелец
 * просил «дать возможность редакции первого сообщения перед отправкой», и
 * это не украшение — сотрудник знает про клиента то, чего не знает модель.
 */

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";

const SEVERITY: Record<string, string> = {
  critical: "border-red-500/40 text-red-300",
  major: "border-gold/40 text-gold",
  minor: "border-line text-muted",
};

const STATUS_LABEL: Record<Prospect["status"], string> = {
  new: "не писали",
  contacting: "сообщение готово",
  sending: "в очереди на отправку",
  sent: "отправлено",
  failed: "не ушло",
  skipped: "пропущен",
};

const STATUS_TONE: Record<Prospect["status"], string> = {
  new: "text-faint",
  contacting: "text-blue-soft",
  sending: "text-gold",
  sent: "text-green",
  failed: "text-red-300",
  skipped: "text-faint",
};

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function OutreachList({
  rows,
  sentToday,
  open,
  error,
  sent,
}: {
  rows: Prospect[];
  sentToday: number;
  open?: string;
  error?: string;
  sent?: boolean;
}) {
  if (!rows.length) return null;

  const left = Math.max(0, DAILY_CAP - sentToday);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Разобранные сайты</h2>
        <p className="text-xs text-faint">
          Отправлено за сутки: {sentToday} из {DAILY_CAP}
          {left === 0 ? " — на сегодня всё, остальные уйдут завтра" : ""}
        </p>
      </div>

      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-faint">
        Пишет рабочий аккаунт студии, а не бот. Поэтому предел на сутки, пауза между
        сообщениями и одно касание на сайт — этим же аккаунтом скаут читает чаты, и
        ограничение за рассылку выключило бы оба канала сразу.
      </p>

      {sent ? (
        <p className="mt-3 rounded-xl border border-green/30 bg-green/5 px-4 py-2 text-sm text-green">
          Сообщение в очереди. Уйдёт с рабочего аккаунта в ближайшие минуты, лид уже закреплён за вами.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
          {REASON_TEXT[error as Reason] ?? decodeURIComponent(error)}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const reason = canContact({
            contacts: row.contacts,
            findings: row.findings,
            status: row.status,
            sentToday,
          });
          const target = targetFor(row.contacts);
          const expanded = open === row.id || row.status === "contacting";

          return (
            <li key={row.id} className={CARD}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {row.label ? <span className="font-medium">{row.label}</span> : null}
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-xs text-blue-soft hover:underline"
                >
                  {row.host}
                </a>
                <span className={`text-xs ${STATUS_TONE[row.status]}`}>
                  {STATUS_LABEL[row.status]}
                  {row.claimed_name ? ` · ${row.claimed_name}` : ""}
                  {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                </span>
                {row.score !== null ? (
                  <span className={`ml-auto font-mono text-sm ${row.score < 60 ? "text-gold" : "text-muted"}`}>
                    {row.score}
                  </span>
                ) : null}
              </div>

              {row.findings.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.findings.slice(0, 6).map((f) => (
                    <span
                      key={f.code}
                      title={`${f.impact}\n\nЧто делаем: ${f.fix}`}
                      className={`rounded-full border px-2 py-0.5 text-xs ${SEVERITY[f.severity] ?? SEVERITY.minor}`}
                    >
                      {f.title}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasAnyContact(row.contacts) ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="text-xs uppercase tracking-wider text-faint">Контакты: </span>
                  {contactsLine(row.contacts)}
                </p>
              ) : null}

              {row.lead_id ? (
                <p className="mt-2 text-sm">
                  <Link href={`/admin/leads/${row.lead_id}`} className="text-green hover:underline">
                    Лид по этому сайту →
                  </Link>
                </p>
              ) : null}

              {row.failure ? <p className="mt-2 text-xs text-red-300">{row.failure}</p> : null}

              {/* Кнопка появляется, только когда писать и можно, и есть куда. */}
              {reason === "ok" && !expanded ? (
                <form action={prepareOutreachAction} className="mt-3 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="prospect" value={row.id} />
                  <button
                    type="submit"
                    className="rounded-xl bg-green/90 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-green"
                  >
                    Связаться
                  </button>
                  <span className="text-xs text-faint">напишем в {target}</span>
                </form>
              ) : null}

              {reason !== "ok" && row.status === "new" ? (
                <p className="mt-2 text-xs text-faint">{REASON_TEXT[reason]}</p>
              ) : null}

              {expanded && row.message ? (
                <form action={sendOutreachAction} className="mt-3">
                  <input type="hidden" name="prospect" value={row.id} />
                  <label className="block text-xs uppercase tracking-wider text-faint">
                    Первое сообщение — правьте перед отправкой
                    <textarea
                      name="message"
                      defaultValue={row.message}
                      rows={10}
                      className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm leading-relaxed text-text"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-green/90 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-green"
                    >
                      Отправить в {target}
                    </button>
                    <span className="text-xs text-faint">
                      Лид закрепится за вами, как только нажмёте.
                    </span>
                  </div>
                </form>
              ) : null}

              {row.status === "new" || row.status === "contacting" ? (
                <form action={skipProspectAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="prospect" value={row.id} />
                  <input
                    name="reason"
                    placeholder="почему не пишем"
                    className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                  />
                  <button type="submit" className="text-xs text-faint hover:text-gold">
                    не пишем
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
