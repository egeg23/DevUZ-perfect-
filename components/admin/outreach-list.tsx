import Link from "next/link";

import { prepareOutreachAction, sendOutreachAction, skipProspectAction } from "@/app/admin/prospect/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import {
  HOURLY_CAP,
  REASON_TEXT,
  ROUTE_TEXT,
  canContact,
  queueView,
  routeFor,
  waitText,
  whatsappLink,
  type Reason,
} from "@/lib/admin/outreach";
import { GRADE_TEXT, seoReport, type SeoGrade } from "@/lib/audit/seo";
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

/** Балл видимости в поиске: цвет несёт смысл, а подпись его называет. */
const SEO_TONE: Record<SeoGrade, string> = {
  good: "text-green",
  fixable: "text-gold",
  poor: "text-red-300",
  blocked: "text-red-400",
};

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
  manual: "писать руками",
};

const STATUS_TONE: Record<Prospect["status"], string> = {
  new: "text-faint",
  contacting: "text-blue-soft",
  sending: "text-gold",
  sent: "text-green",
  failed: "text-red-300",
  skipped: "text-faint",
  // Не красный: ничего не сломалось, просто дальше нужны руки. Красным
  // помечено то, что надо чинить, и ручное касание в этом списке потерялось
  // бы среди провалов.
  manual: "text-blue-soft",
};

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function OutreachList({
  rows,
  hour,
  open,
  error,
  sent,
}: {
  rows: Prospect[];
  /** Что ушло за последний час: предел считается по факту отправки. */
  hour: { count: number; oldestAgoMs: number | null };
  open?: string;
  error?: string;
  sent?: boolean;
}) {
  if (!rows.length) return null;

  const queue = rows.filter((r) => r.status === "sending");
  const left = Math.max(0, HOURLY_CAP - hour.count);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Разобранные сайты</h2>
        <p className="text-xs text-faint">
          За последний час ушло {hour.count} из {HOURLY_CAP}
          {queue.length ? ` · в очереди ${queue.length}` : ""}
          {left === 0 && queue.length ? " — ждут своей очереди" : ""}
        </p>
      </div>

      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-faint">
        Пишет рабочий аккаунт студии, а не бот: два контакта в час, пауза между
        сообщениями и одно касание на сайт. Этим же аккаунтом скаут читает чаты, и
        ограничение за рассылку выключило бы оба канала сразу. Ждать очередь не
        обязательно — сообщение можно отправить со своего аккаунта, тогда и ответ
        придёт вам лично.
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
          });
          const route = routeFor(row.contacts);
          const seo = seoReport({ findings: row.findings });
          const expanded = open === row.id || row.status === "contacting";
          const wait =
            row.status === "sending"
              ? queueView({
                  ahead: queue.filter((q) => q.created_at < row.created_at).length,
                  sentLastHour: hour.count,
                  oldestSentAgoMs: hour.oldestAgoMs,
                })
              : null;

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
                <span className="ml-auto flex items-baseline gap-3">
                  {/* Два балла, а не один. Общий говорит, обратится ли
                      человек, который уже открыл сайт; этот — дойдёт ли он
                      до сайта из поиска. Менеджеру нужны оба: разговор с
                      владельцем, которого не находят, начинается иначе. */}
                  {seo.measured && seo.total > 0 ? (
                    <span className={`font-mono text-sm ${SEO_TONE[seo.grade]}`} title={GRADE_TEXT[seo.grade]}>
                      поиск {seo.score}
                    </span>
                  ) : null}
                  {row.score !== null ? (
                    <span className={`font-mono text-sm ${row.score < 60 ? "text-gold" : "text-muted"}`} title="Общая оценка">
                      {row.score}
                    </span>
                  ) : null}
                </span>
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

              {row.failure ? (
                <p className={`mt-2 text-xs ${row.status === "manual" ? "text-muted" : "text-red-300"}`}>
                  {row.failure}
                </p>
              ) : null}

              {/* Автономно писать некуда — но это не тупик: номер есть, и
                  человек дотянется тем, чем скаут не может. Готовый текст
                  рядом, чтобы касание не выродилось в «здравствуйте, я из
                  студии»: он построен вокруг находки, которую собеседник
                  может пойти и проверить. */}
              {row.status === "manual" && row.target ? (
                <div className="mt-3 rounded-lg border border-blue-soft/30 bg-blue-soft/5 px-4 py-3">
                  <p className="text-sm text-blue-soft">Дальше руками: {row.target}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{ROUTE_TEXT.manual}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={whatsappLink(row.target, row.message ?? "")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      Открыть WhatsApp с готовым текстом
                    </a>
                    <a
                      href={`tel:${row.target}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      Позвонить
                    </a>
                    {row.message ? <CopyMessage text={row.message} /> : null}
                  </div>
                </div>
              ) : null}

              {/* В очереди — не тупик: можно подождать, а можно написать
                  самому. Второе быстрее, и ответ придёт прямо менеджеру. */}
              {wait && row.target && row.message ? (
                <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
                  <p className="text-sm text-gold">
                    В очереди на отправку с рабочего аккаунта — {waitText(wait.waitMs)}
                    {wait.ahead ? `, перед ним ${wait.ahead}` : ""}.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Ждать не обязательно: откройте переписку со своего аккаунта и отправьте
                    этот же текст — ответ придёт вам лично, и лид уже ваш.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={`https://t.me/${row.target.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      Открыть {row.target} в Telegram
                    </a>
                    <CopyMessage text={row.message} />
                  </div>
                </div>
              ) : null}

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
                  <span className="text-xs text-faint">{route ? ROUTE_TEXT[route.kind] : ""}</span>
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
                      {route?.kind === "manual" ? "Взять в работу" : `Отправить в ${route?.target ?? ""}`}
                    </button>
                    <span className="text-xs text-faint">
                      Лид закрепится за вами, как только нажмёте.
                    </span>
                  </div>
                </form>
              ) : null}

              {row.status === "new" || row.status === "contacting" || row.status === "manual" ? (
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
