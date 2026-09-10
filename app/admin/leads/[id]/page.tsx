import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addReminder,
  changeStatus,
  finishReminder,
  release,
  revealContactAction,
  revealTranscriptAction,
  take,
  toggleAutoReminder,
} from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { LeadThread } from "@/components/admin/lead-thread";
import {
  BUDGET_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  when,
} from "@/components/admin/lead-table";
import { record } from "@/lib/admin/audit";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { STATUSES, leadById } from "@/lib/admin/leads";
import { messagesFor } from "@/lib/admin/messages";
import {
  DELIVERY_GIVE_UP,
  canEdit,
  remindersFor,
  revealContact,
  revealTranscript,
} from "@/lib/admin/ownership";
import { CONTACT_LABEL, contactLink } from "@/lib/contact";

export const dynamic = "force-dynamic";

const EXPERTISE_LABEL: Record<string, string> = {
  high: "разбирается",
  medium: "средне",
  low: "не разбирается",
};

const AUTHORITY_LABEL: Record<string, string> = {
  A1: "решает сам",
  A2: "влияет на решение",
  A3: "передаёт дальше",
};

const NEED_LABEL: Record<string, string> = {
  N1: "болит сейчас",
  N2: "понимает задачу",
  N3: "присматривается",
};

const TIMING_LABEL: Record<string, string> = {
  T1: "сейчас",
  T2: "в этом квартале",
  T3: "когда-нибудь",
};

const RESULT_MESSAGE: Record<string, string> = {
  ok: "Готово.",
  taken: "Лида уже взял кто-то другой — обновите страницу.",
  forbidden: "Лид закреплён не за вами.",
  gone: "Лид не найден.",
  offline: "База недоступна.",
  failed: "Не получилось. Попробуйте ещё раз.",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

function summaryLines(summary: Record<string, unknown>): [string, string][] {
  return Object.entries(summary)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => [key, String(value)]);
}

const BUTTON = "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string; contact?: string; transcript?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const {
    r: result,
    contact: wantsContact,
    transcript: wantsTranscript,
  } = await searchParams;

  const lead = await leadById(id);
  if (!lead) notFound();

  const ip = await requestIp();
  await record("lead.viewed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: lead.id,
    ip,
  });

  const mine = canEdit(lead, staff);
  const free = !lead.assigned_staff_id;

  // Контакт достаётся только по явному действию — и каждое такое
  // получение попадает в журнал отдельной строкой.
  const contact = wantsContact === "1" ? await revealContact(lead.id, staff, ip) : null;

  // Ссылка «написать в один тап» живёт здесь, а не в брифе Telegram, куда
  // она уходила раньше. Смысл её от переезда не изменился: менеджер читает
  // карточку с телефона, и «скопировать ник, открыть поиск, вставить,
  // найти» — четыре действия, на каждом из которых лид ждёт ещё пять минут.
  // Изменилось то, что до неё нужно дойти через раскрытие контакта, а оно
  // записано в журнал.
  const contactView = contact
    ? contactLink({ contact_handle: contact.handle, contact_kind: contact.kind })
    : null;
  // Переписка — тем же порядком, что и контакт: только по явному нажатию и
  // только владельцу, каждое чтение отдельной строкой в журнале.
  const transcript =
    wantsTranscript === "1" ? await revealTranscript(lead.id, staff, ip) : null;

  const [reminders, messages] = await Promise.all([
    remindersFor(lead.id),
    messagesFor(lead.id),
  ]);
  const open = reminders.filter((item) => !item.done_at);

  return (
    <AdminShell staff={staff}>
      <Link href="/admin" className="text-sm text-muted hover:text-text">
        ← к списку
      </Link>

      {result ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            result === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {RESULT_MESSAGE[result] ?? RESULT_MESSAGE.failed}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-mono text-xl">{lead.request_no ?? lead.id.slice(0, 8)}</h1>
        <span className="text-sm text-muted">{when(lead.created_at)}</span>
        <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-faint">
          {lead.grade} · {lead.score}
        </span>
        {lead.discount_granted ? (
          <span className="rounded bg-gold/15 px-2 py-0.5 text-xs text-gold">
            выдана скидка 30%
          </span>
        ) : null}
      </div>

      {/* ── Владение ────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-faint">Ведёт</p>
            <p className="mt-1 text-sm">
              {lead.assigned_to ?? "никто — лид свободен"}
              {lead.assigned_at ? (
                <span className="ml-2 text-xs text-faint">с {when(lead.assigned_at)}</span>
              ) : null}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap gap-2">
            {free ? (
              <form action={take}>
                <input type="hidden" name="lead" value={lead.id} />
                <button type="submit" className="rounded-lg bg-green px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-green-dim">
                  Взять себе
                </button>
              </form>
            ) : null}

            {mine && !free ? (
              <form action={release}>
                <input type="hidden" name="lead" value={lead.id} />
                <button type="submit" className={BUTTON}>
                  Вернуть в очередь
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {mine ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
            <span className="text-xs uppercase tracking-wider text-faint">Статус</span>
            {STATUSES.map((value) => (
              <form key={value} action={changeStatus}>
                <input type="hidden" name="lead" value={lead.id} />
                <input type="hidden" name="status" value={value} />
                <button
                  type="submit"
                  disabled={lead.status === value}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    lead.status === value
                      ? "border-green/40 bg-green/10 text-green"
                      : "border-line bg-surface-2 text-muted hover:text-text"
                  }`}
                >
                  {STATUS_LABEL[value] ?? value}
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Контакт ─────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-faint">Контакт клиента</p>

        {contact && contactView ? (
          <>
            {contactView.url ? (
              <a
                href={contactView.url}
                // Внешняя вкладка только для веб-адресов: tel: и mailto:
                // передаются приложению, и пустая вкладка после них — мусор,
                // который менеджер закрывает руками после каждого лида.
                {...(contactView.url.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
                className="mt-2 inline-block font-mono text-sm text-green underline underline-offset-4 hover:text-white"
              >
                {contactView.label}
              </a>
            ) : (
              <p className="mt-2 font-mono text-sm text-green">{contactView.label}</p>
            )}
            <p className="mt-1 text-xs text-faint">
              {contact.kind ? CONTACT_LABEL[contact.kind] ?? contact.kind : "тип не указан"} ·
              просмотр записан в журнал
            </p>
          </>
        ) : mine ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <form action={revealContactAction}>
              <input type="hidden" name="lead" value={lead.id} />
              <button type="submit" className={BUTTON}>
                Показать контакт
              </button>
            </form>
            <span className="text-xs text-faint">
              {lead.contact_revealed_at
                ? `последний раз открывали ${when(lead.contact_revealed_at)}`
                : "ещё никто не открывал"}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {free
              ? "Возьмите лида в работу, чтобы увидеть контакт."
              : "Лид закреплён за другим менеджером."}
          </p>
        )}
      </section>

      {/* ── Переписка с клиентом ────────────────────────────────────── */}
      <section
        id="transcript"
        className="mt-4 rounded-xl border border-line bg-surface px-5 py-4"
      >
        <p className="text-xs uppercase tracking-wider text-faint">Переписка с клиентом</p>

        {transcript ? (
          transcript.length ? (
            <>
              <div className="mt-3 flex flex-col gap-3">
                {transcript.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.role === "user"
                        ? "max-w-[85%] self-start rounded-xl rounded-bl-sm bg-surface-2 px-4 py-2.5"
                        : "max-w-[85%] self-end rounded-xl rounded-br-sm border border-line px-4 py-2.5"
                    }
                  >
                    <p className="text-[0.7rem] uppercase tracking-wider text-faint">
                      {line.role === "user" ? "клиент" : "ассистент"}
                    </p>
                    {/* whitespace-pre-wrap: человек писал абзацами, и склеенный
                        в одну строку разговор читается вдвое дольше. */}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.content}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-faint">просмотр записан в журнал</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Переписки нет — заявка пришла формой, а не из чата.
            </p>
          )
        ) : mine ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <form action={revealTranscriptAction}>
              <input type="hidden" name="lead" value={lead.id} />
              <button type="submit" className={BUTTON}>
                Показать переписку
              </button>
            </form>
            <span className="text-xs text-faint">
              всё, что клиент рассказал о деньгах и сроках
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {free
              ? "Возьмите лида в работу, чтобы прочитать переписку."
              : "Лид закреплён за другим менеджером."}
          </p>
        )}
      </section>

      {/* ── Напоминания ─────────────────────────────────────────────── */}
      {mine ? (
        <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs uppercase tracking-wider text-faint">Напоминания</p>
            <form action={toggleAutoReminder} className="ml-auto">
              <input type="hidden" name="lead" value={lead.id} />
              <input type="hidden" name="enabled" value={lead.auto_reminder ? "0" : "1"} />
              <button type="submit" className={BUTTON}>
                {lead.auto_reminder ? "Выключить автонапоминания" : "Включить автонапоминания"}
              </button>
            </form>
          </div>

          {open.length ? (
            <ul className="mt-3 space-y-2">
              {open.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                    item.attempts >= DELIVERY_GIVE_UP
                      ? "border-gold/40 bg-gold/10"
                      : Date.parse(item.due_at) < Date.now() && !item.sent_at
                        ? "border-blue/40 bg-blue/5"
                        : "border-line-soft bg-surface-2"
                  }`}
                >
                  <span className="font-mono text-xs text-blue-soft">{when(item.due_at)}</span>
                  <span className="text-muted">{item.note || "без пометки"}</span>
                  {item.kind === "auto" ? (
                    <span className="rounded bg-line px-1.5 py-0.5 text-[11px] text-faint">
                      авто
                    </span>
                  ) : null}
                  {/* Три разных состояния, и их нельзя сливать. «Отправлено»
                      — дошло. «Просрочено» — время вышло, свип ещё пробует.
                      «Не доставлено» — свип сдался, и об этом нужно знать:
                      напоминание, которое молча не дошло, хуже, чем его
                      отсутствие, потому что человек на него рассчитывал. */}
                  {item.attempts >= DELIVERY_GIVE_UP ? (
                    <span className="text-[11px] font-semibold text-gold">
                      не доставлено ({item.attempts} попыток) — проверьте, не заблокирован ли бот
                    </span>
                  ) : item.sent_at ? (
                    <span className="text-[11px] text-faint">отправлено</span>
                  ) : Date.parse(item.due_at) < Date.now() ? (
                    <span className="text-[11px] text-blue-soft">просрочено</span>
                  ) : null}
                  <form action={finishReminder} className="ml-auto">
                    <input type="hidden" name="lead" value={lead.id} />
                    <input type="hidden" name="reminder" value={item.id} />
                    <button type="submit" className="text-xs text-faint transition hover:text-green">
                      сделано
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Ничего не запланировано.</p>
          )}

          <form action={addReminder} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="lead" value={lead.id} />
            <label className="text-xs text-faint" htmlFor="hours">
              напомнить через
            </label>
            <input
              id="hours"
              name="hours"
              type="number"
              min="0.5"
              max="8760"
              step="0.5"
              defaultValue="24"
              className="w-20 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-faint">ч.</span>
            <input
              name="note"
              type="text"
              maxLength={300}
              placeholder="о чём напомнить"
              className="min-w-[12rem] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm"
            />
            <button type="submit" className={BUTTON}>
              Поставить
            </button>
          </form>
        </section>
      ) : null}

      <LeadThread leadId={lead.id} messages={messages} staff={staff} />

      {lead.opening_line ? (
        <p className="mt-6 max-w-3xl rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed">
          {lead.opening_line}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Кто" value={lead.contact_name} />
        <Field label="Компания" value={lead.company} />
        <Field label="Ниша" value={lead.niche} />
        <Field
          label="Услуги"
          value={lead.services?.length ? lead.services.join(", ") : null}
        />
        <Field
          label="Бюджет"
          value={lead.budget ? BUDGET_LABEL[lead.budget] ?? lead.budget : null}
        />
        <Field
          label="Сроки"
          value={lead.timing ? TIMING_LABEL[lead.timing] ?? lead.timing : null}
        />
        <Field
          label="Решение"
          value={lead.authority ? AUTHORITY_LABEL[lead.authority] ?? lead.authority : null}
        />
        <Field
          label="Потребность"
          value={lead.need ? NEED_LABEL[lead.need] ?? lead.need : null}
        />
        <Field
          label="Экспертиза"
          value={lead.expertise ? EXPERTISE_LABEL[lead.expertise] ?? lead.expertise : null}
        />
        <Field label="Приоритет" value={PRIORITY_LABEL[lead.priority] ?? lead.priority} />
        <Field label="Статус" value={STATUS_LABEL[lead.status] ?? lead.status} />
        <Field label="Источник" value={`${lead.source} · ${lead.locale}`} />
      </dl>

      {summaryLines(lead.summary).length ? (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wider text-faint">Бриф</h2>
          <dl className="mt-3 max-w-3xl space-y-3">
            {summaryLines(lead.summary).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-line bg-surface px-5 py-3">
                <dt className="font-mono text-xs text-faint">{key}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {lead.notes ? (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xs uppercase tracking-wider text-faint">Заметки</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{lead.notes}</p>
        </section>
      ) : null}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">
        Переписка с клиентом в панели не показывается: менеджеру для работы
        достаточно брифа, а полный разговор — самое чувствительное из того, что
        клиент рассказал о своём бизнесе. Открытие этой карточки и каждое
        получение контакта записаны в журнал. Обсуждение видно всей команде —
        контакт клиента в него лучше не вставлять: закрытость контакта на этом
        и держится.
      </p>
    </AdminShell>
  );
}
