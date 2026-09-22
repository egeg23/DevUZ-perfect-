import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addReminder,
  changeStatus,
  finishReminder,
  release,
  askTransfer,
  decideTransferAction,
  revealContactAction,
  revealTranscriptAction,
  takeOverTalkAction,
  take,
  toggleAutoReminder,
} from "./actions";
import { QuoteCard } from "@/components/admin/quote-card";
import { AdminShell } from "@/components/admin/shell";
import { VOID_TITLE, type VoidReason } from "@/lib/partners/rules";
import { partnerById } from "@/lib/partners/store";
import { LeadThread } from "@/components/admin/lead-thread";
import {
  BUDGET_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  when,
} from "@/components/admin/lead-table";
import { record } from "@/lib/admin/audit";
import { clock, mayTake } from "@/lib/admin/lead-queue";
import { queueState, shareOf } from "@/lib/admin/lead-queue-store";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { quoteForLead } from "@/lib/admin/quote";
import { STATUSES, leadById } from "@/lib/admin/leads";
import { messagesFor } from "@/lib/admin/messages";
import { talkForLead } from "@/lib/admin/outreach-talk-store";
import {
  DELIVERY_GIVE_UP,
  canEdit,
  canSeeLead,
  remindersFor,
  revealContact,
  revealTranscript,
} from "@/lib/admin/ownership";
import { CONTACT_LABEL, contactLink } from "@/lib/contact";
import {
  atTashkent,
  channelName,
  placeOf,
  refOf,
  usernameOf,
  type LeadOrigin,
} from "@/lib/qualify/origin";
import { activeStaff } from "@/lib/admin/team";
import { TRANSFER_TITLE, approves, openTransferFor } from "@/lib/admin/transfers";

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
  queued: "Не ваша очередь: лид сейчас предложен другому на 30 минут. Не возьмёт — лид уйдёт следующему, и очередь может дойти до вас.",
  share: "Вы уже взяли свою равную долю лидов за месяц. Этот лид пришёл в нерабочее время и достаётся тем, у кого меньше.",
  forbidden: "Лид закреплён не за вами.",
  gone: "Лид не найден.",
  offline: "База недоступна.",
  failed: "Не получилось. Попробуйте ещё раз.",
  asked: "Просьба отправлена. Лид остаётся у вас, пока её не подтвердят.",
  approved: "Передача подтверждена — лид у нового ответственного.",
  declined: "Передачу отклонили. Лид остаётся у прежнего ответственного.",
  not_mine: "Передать может тот, у кого лид, либо руководитель или владелец.",
  free: "Лид свободен — его берут кнопкой «Взять себе», а не передают.",
  self: "Это тот же сотрудник.",
  pending: "По этому лиду уже ждёт решения другая просьба.",
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

/** Происхождение лида в том виде, в каком его читают общие помощники. */
function lead2origin(lead: {
  source: string;
  tg_username: string | null;
  entry_path: string | null;
  entry_ref: string | null;
}): LeadOrigin {
  return {
    source: lead.source,
    tgUsername: lead.tg_username,
    entryPath: lead.entry_path,
    entryRef: lead.entry_ref,
  };
}

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

  const quote = quoteForLead(lead);

  // Кто привёл: менеджеру важно знать про обещанный партнёром бонус и про
  // то, что клиент партнёрский, — на сумму и на тон разговора это влияет.
  const partner = lead.partner_id ? await partnerById(lead.partner_id) : null;
  const partnerLabel = partner
    ? `${partner.name} · ${lead.partner_code ?? partner.code}${
        lead.partner_void_reason
          ? ` · не засчитано: ${VOID_TITLE[lead.partner_void_reason as VoidReason] ?? lead.partner_void_reason}`
          : ""
      }`
    : lead.partner_code
      ? `код ${lead.partner_code} — партнёр не найден`
      : null;

  const ip = await requestIp();
  await record("lead.viewed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: lead.id,
    ip,
  });

  // Чужой взятый лид менеджеру не показывается — ни списком, ни по прямой
  // ссылке: адрес лида легко переслать, и без этой проверки правило
  // держалось бы только на том, что ссылку никто не сохранил.
  if (!canSeeLead(lead, staff)) notFound();

  const mine = canEdit(lead, staff);
  const free = !lead.assigned_staff_id;
  const decides = approves(staff.role);

  const [transfer, colleagues, queue] = await Promise.all([
    openTransferFor(lead.id),
    mine || decides ? activeStaff() : Promise.resolve([]),
    free ? queueState(lead.id) : Promise.resolve({ offers: [], openedAt: null, fairShare: false }),
  ]);
  // Ночной лид — с потолком равной доли: тот, кто свою долю уже взял, не
  // должен видеть ник и писать клиенту в обход кнопки.
  const share = free && queue.fairShare && staff.role !== "admin" ? await shareOf(staff.id) : null;

  /**
   * Очередь по свободному лиду — с точки зрения того, кто смотрит.
   *
   * Ник клиента в Telegram на этой странице виден всем, кто видит лид. Пока
   * лид в очереди у другого, это лазейка ровно в обход очереди: увидел ник —
   * написал клиенту сам, не нажимая «Взять». Поэтому ник скрыт от всех, кроме
   * того, чья сейчас очередь, и владельца.
   */
  const turn = mayTake({
    role: staff.role,
    staffId: staff.id,
    offers: queue.offers,
    openedAt: queue.openedAt,
    now: new Date(),
    share,
  });
  const offer = queue.offers.find((o) => o.outcome === null && Date.parse(o.expiresAt) > Date.now()) ?? null;
  const hideHandle = free && !turn.ok;
  const holderName = offer ? (colleagues.find((c) => c.id === offer.staffId)?.display_name ?? null) : null;
  const canHandOver = (mine && !free) || (decides && !free);

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

  const [reminders, messages, talk] = await Promise.all([
    remindersFor(lead.id),
    messagesFor(lead.id),
    // Первичка по касанию: есть только у лидов, которые мы завели сами,
    // написав владельцу сайта первыми.
    talkForLead(lead.id),
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

      {/* Очередь — там, где решают, брать ли лид. Кому лид предложен,
          видит только владелец: остальным имя ни к чему, кроме спора. */}
      {free && offer && offer.staffId === staff.id ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/5 px-4 py-3 text-sm text-green">
          ⏳ Лид ваш до {clock(offer.expiresAt)}. Не возьмёте — он уйдёт следующему по очереди.
        </p>
      ) : free && offer && staff.role === "admin" ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          👁 В очереди у {holderName ?? "сотрудника"} до {clock(offer.expiresAt)}. Вы вне очереди — можете взять сами.
        </p>
      ) : hideHandle && !turn.ok && turn.reason === "share" ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          🌙 Лид пришёл в нерабочее время и делится поровну. Свою долю за месяц вы уже взяли — он для тех, у кого меньше.
        </p>
      ) : hideHandle ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Лид сейчас в очереди у другого сотрудника. Ник клиента скрыт, пока очередь не дойдёт до вас.
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

        {/* ── Передача ────────────────────────────────────────────────
            Менеджер просит, руководитель и владелец решают. Лид не двигается,
            пока решения нет: иначе отказ пришлось бы откатывать, а лид всё
            это время висел бы между двумя людьми. */}
        {transfer ? (
          <div className="mt-4 border-t border-line-soft pt-4">
            <p className="text-xs uppercase tracking-wider text-gold">
              Передача · {TRANSFER_TITLE[transfer.status]}
            </p>
            <p className="mt-1 text-sm">
              {transfer.from_name ?? "—"} → {transfer.to_name ?? "—"}
            </p>
            {transfer.note ? (
              <p className="mt-1 text-xs text-muted">{transfer.note}</p>
            ) : null}
            <p className="mt-1 text-xs text-faint">
              попросил {transfer.requested_name ?? "—"} · {when(transfer.created_at)}
            </p>

            {decides ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={decideTransferAction}>
                  <input type="hidden" name="lead" value={lead.id} />
                  <input type="hidden" name="transfer" value={transfer.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button
                    type="submit"
                    className="rounded-lg bg-green px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-green-dim"
                  >
                    Подтвердить
                  </button>
                </form>
                <form action={decideTransferAction}>
                  <input type="hidden" name="lead" value={lead.id} />
                  <input type="hidden" name="transfer" value={transfer.id} />
                  <input type="hidden" name="decision" value="declined" />
                  <button type="submit" className={BUTTON}>
                    Отклонить
                  </button>
                </form>
              </div>
            ) : (
              <p className="mt-2 text-xs text-faint">
                Ждём решения руководителя или владельца. Пока лид остаётся у прежнего
                ответственного.
              </p>
            )}
          </div>
        ) : canHandOver ? (
          <form
            action={askTransfer}
            className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4"
          >
            <input type="hidden" name="lead" value={lead.id} />
            <span className="text-xs uppercase tracking-wider text-faint">Передать</span>
            <select
              name="to"
              required
              defaultValue=""
              className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text outline-none focus:border-green/50"
            >
              <option value="" disabled>
                кому
              </option>
              {colleagues
                .filter((person) => person.id !== lead.assigned_staff_id)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name}
                  </option>
                ))}
            </select>
            <input
              name="note"
              maxLength={500}
              placeholder="почему передаёте"
              className="w-48 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text outline-none focus:border-green/50"
            />
            <button type="submit" className={BUTTON}>
              {decides ? "Передать" : "Попросить передать"}
            </button>
            {decides ? null : (
              <span className="text-xs text-faint">подтверждает руководитель или владелец</span>
            )}
          </form>
        ) : null}

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

      {/* ── Первичка по касанию ─────────────────────────────────────── */}
      {talk && mine ? (
        <section id="talk" className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-xs uppercase tracking-wider text-faint">Первичка по касанию</p>
            <span className="font-mono text-xs text-blue-soft">{talk.host}</span>
            <span
              className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${
                talk.aiHandling ? "border-green/40 bg-green/10 text-green" : "border-gold/40 bg-gold/10 text-gold"
              }`}
            >
              {talk.aiHandling ? "отвечает ИИ" : `отвечаете вы${talk.handoverReason ? ` — ${talk.handoverReason}` : ""}`}
            </span>
          </div>

          {talk.lines.length ? (
            <div className="mt-3 flex flex-col gap-3">
              {talk.lines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.direction === "in"
                      ? "max-w-[85%] self-start rounded-xl rounded-bl-sm bg-surface-2 px-4 py-2.5"
                      : "max-w-[85%] self-end rounded-xl rounded-br-sm border border-line px-4 py-2.5"
                  }
                >
                  <p className="text-[0.7rem] uppercase tracking-wider text-faint">
                    {line.direction === "in" ? "клиент" : line.author === "ai" ? "ИИ от нашего имени" : "вы"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Письмо ушло, ответа пока нет. Как ответит — первичку подхватит ИИ, а вы увидите разговор здесь.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {talk.aiHandling ? (
              <>
                <form action={takeOverTalkAction}>
                  <input type="hidden" name="lead" value={lead.id} />
                  <input type="hidden" name="prospect" value={talk.prospectId} />
                  <button type="submit" className={BUTTON}>
                    Отвечать самому
                  </button>
                </form>
                <span className="text-xs text-faint">
                  ИИ ведёт первичку от имени студии и остановится сам, когда выяснит задачу, бюджет и сроки.
                  Лид ваш в любом случае — он не переназначается.
                </span>
              </>
            ) : talk.target ? (
              <>
                <a
                  href={`https://t.me/${talk.target.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={BUTTON}
                >
                  Открыть переписку в Telegram
                </a>
                <span className="text-xs text-faint">
                  писать нужно с рабочего аккаунта студии — с него ушло письмо, и для клиента это один собеседник
                </span>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

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
        <Field label="Партнёр" value={partnerLabel} />
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
        {/*
          «Откуда писал, во сколько, где» — теми же словами, что и в
          уведомлении: менеджер читает бриф в чате, а карточку открывает
          следом, и два разных описания одного и того же места сбивают.
        */}
        <Field label="Откуда писал" value={`${channelName(lead.source)} · ${lead.locale}`} />
        <Field label="Когда" value={atTashkent(lead.created_at)} />
        <Field
          label="Где"
          value={[placeOf(lead2origin(lead)), refOf(lead2origin(lead))].filter(Boolean).join(" · ") || null}
        />
        <Field
          label="Ник в Telegram"
          value={hideHandle ? "скрыт — лид сейчас не ваш" : usernameOf(lead2origin(lead))}
        />
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

      {/* Смета считается из брифа сразу, без участия менеджера: новый
          сотрудник видит порог и потолок раньше, чем поднимет трубку. */}
      {quote ? (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-xs uppercase tracking-wider text-faint">Смета</h2>
          <QuoteCard quote={quote} />
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
