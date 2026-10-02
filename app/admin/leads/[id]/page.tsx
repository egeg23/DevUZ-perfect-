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
  saveInnAction,
  takeOverTalkAction,
  take,
  toggleAutoReminder,
} from "./actions";
import { QuoteCard } from "@/components/admin/quote-card";
import { AdminShell } from "@/components/admin/shell";
import type { VoidReason } from "@/lib/partners/rules";
import { clientById, partnerById } from "@/lib/partners/store";
import { partnerClientsDict } from "@/content/admin-panel/partner-clients";
import { SubmitButton } from "@/components/admin/submit-button";
import { HelpHint } from "@/components/admin/help-link";
import { LeadThread } from "@/components/admin/lead-thread";
import { helpAnchor } from "@/lib/admin/help";
import { pick, tr, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import {
  cardWhen,
  leadAuthorityDict,
  leadBudgetDict,
  leadCardDict,
  leadContactKindDict,
  leadDiscountDict,
  leadExpertiseDict,
  leadNeedDict,
  leadPriorityDict,
  leadResultDict,
  leadStatusDict,
  leadTimingDict,
  leadTransferStatusDict,
  leadVoidDict,
} from "@/content/admin-panel/lead-card";
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
  canReveal,
  canSeeLead,
  remindersFor,
  revealContact,
  revealTranscript,
} from "@/lib/admin/ownership";
import { contactLink } from "@/lib/contact";
import {
  atTashkent,
  channelName,
  placeOf,
  refOf,
  usernameOf,
  type LeadOrigin,
} from "@/lib/qualify/origin";
import { activeStaff } from "@/lib/admin/team";
import { approves, openTransferFor } from "@/lib/admin/transfers";

export const dynamic = "force-dynamic";

/**
 * Подпись по коду из базы на языке панели. Незнакомый код показывается
 * как есть: лучше «B4», чем пустое место.
 */
function label(table: Record<string, Tr>, code: string, locale: PanelLocale): string {
  return Object.hasOwn(table, code) ? tr(table[code], locale) : code;
}

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
  searchParams: Promise<{ r?: string; contact?: string; transcript?: string; inn?: string }>;
}) {
  const staff = await requireStaff();
  const locale = staff.panel_locale;
  const t = pick(leadCardDict, locale);
  const when = (iso: string) => cardWhen(iso, locale);
  const { id } = await params;
  const {
    r: result,
    contact: wantsContact,
    transcript: wantsTranscript,
    inn: innResult,
  } = await searchParams;

  const lead = await leadById(id);
  if (!lead) notFound();

  const quote = quoteForLead(lead, locale);

  // Кто привёл: менеджеру важно знать про обещанный партнёром бонус и про
  // то, что клиент партнёрский, — на сумму и на тон разговора это влияет.
  const partner = lead.partner_id ? await partnerById(lead.partner_id) : null;
  // Сколько дней прошло от перехода по ссылке до заявки: засчитывается,
  // если не больше 30 (кука живёт столько же).
  const refDays = lead.partner_ref_at
    ? Math.max(0, Math.floor((Date.parse(lead.created_at) - Date.parse(lead.partner_ref_at)) / 86_400_000))
    : null;
  // Клиент, закреплённый партнёром вручную по ИНН: «Клиент партнёра Имя
  // (закреплён 01.10)» — менеджер видит, что это не просто заявка.
  const tc = pick(partnerClientsDict, staff.panel_locale);
  const claim = lead.partner_client_id ? await clientById(lead.partner_client_id) : null;
  const claimLabel =
    partner && claim ? tc.leadClient(partner.name, claim.created_at.slice(5, 10).split("-").reverse().join(".")) : null;
  const partnerLabel = claimLabel
    ? claimLabel
    : partner
    ? `${partner.name} · ${lead.partner_code ?? partner.code}${
        refDays !== null ? ` · ${t.refDays(refDays)}` : ""
      }${
        lead.partner_void_reason
          ? ` · ${t.notCounted(label(leadVoidDict, lead.partner_void_reason as VoidReason, locale))}`
          : ""
      }`
    : lead.partner_code
      ? t.partnerMissing(lead.partner_code)
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
  // Контакт и переписка свободного лида — только после «Взять себе», и
  // руководителю тоже: он в очереди наравне со всеми. Владелец — вне её.
  const reveals = canReveal(lead, staff);
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
        {t.back}
      </Link>

      {result ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            result === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {tr(
            Object.hasOwn(leadResultDict, result)
              ? leadResultDict[result as keyof typeof leadResultDict]
              : leadResultDict.failed,
            locale,
          )}
        </p>
      ) : null}

      {/* Очередь — там, где решают, брать ли лид. Кому лид предложен,
          видит только владелец: остальным имя ни к чему, кроме спора. */}
      {free && offer && offer.staffId === staff.id ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/5 px-4 py-3 text-sm text-green">
          {t.yourTurn(clock(offer.expiresAt))}{" "}
          <HelpHint topic={helpAnchor("/admin", "queue")} label={t.queueHelp} />
        </p>
      ) : free && offer && staff.role === "admin" ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          {t.adminQueue(holderName ?? t.someone, clock(offer.expiresAt))}
        </p>
      ) : hideHandle && !turn.ok && turn.reason === "share" ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          {t.shareBanner}
        </p>
      ) : hideHandle ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          {t.hiddenBanner}{" "}
          <HelpHint topic={helpAnchor("/admin", "queue")} label={t.queueHelp} />
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
            {tr(leadDiscountDict[lead.discount_reason ?? "promise"], locale)}
          </span>
        ) : null}
      </div>

      {/* ── Владение ────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
              {t.owner}
              <HelpHint topic={helpAnchor("/admin", "take")} label={t.takeHelp} />
            </p>
            <p className="mt-1 text-sm">
              {lead.assigned_to ?? t.nobody}
              {lead.assigned_at ? (
                <span className="ml-2 text-xs text-faint">{t.since(when(lead.assigned_at))}</span>
              ) : null}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap gap-2">
            {free ? (
              <form action={take}>
                <input type="hidden" name="lead" value={lead.id} />
                <button type="submit" className="rounded-lg bg-green px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-green-dim">
                  {t.take}
                </button>
              </form>
            ) : null}

            {mine && !free ? (
              <form action={release}>
                <input type="hidden" name="lead" value={lead.id} />
                <button type="submit" className={BUTTON}>
                  {t.release}
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
              {t.transfer} · {tr(leadTransferStatusDict[transfer.status], locale)}
            </p>
            <p className="mt-1 text-sm">
              {transfer.from_name ?? "—"} → {transfer.to_name ?? "—"}
            </p>
            {transfer.note ? (
              <p className="mt-1 text-xs text-muted">{transfer.note}</p>
            ) : null}
            <p className="mt-1 text-xs text-faint">
              {t.requestedBy(transfer.requested_name ?? "—", when(transfer.created_at))}
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
                    {t.approve}
                  </button>
                </form>
                <form action={decideTransferAction}>
                  <input type="hidden" name="lead" value={lead.id} />
                  <input type="hidden" name="transfer" value={transfer.id} />
                  <input type="hidden" name="decision" value="declined" />
                  <button type="submit" className={BUTTON}>
                    {t.decline}
                  </button>
                </form>
              </div>
            ) : (
              <p className="mt-2 text-xs text-faint">
                {t.waitingDecision}
              </p>
            )}
          </div>
        ) : canHandOver ? (
          <form
            action={askTransfer}
            className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4"
          >
            <input type="hidden" name="lead" value={lead.id} />
            <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
              {t.handOver}
              <HelpHint topic={helpAnchor("/admin", "transfer")} label={t.transferHelp} />
            </span>
            <select
              name="to"
              required
              defaultValue=""
              className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text outline-none focus:border-green/50"
            >
              <option value="" disabled>
                {t.toWhom}
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
              placeholder={t.whyHandOver}
              className="w-48 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text outline-none focus:border-green/50"
            />
            <button type="submit" className={BUTTON}>
              {decides ? t.handOver : t.askHandOver}
            </button>
            {decides ? null : (
              <span className="text-xs text-faint">{t.approvedBy}</span>
            )}
          </form>
        ) : null}

        {mine ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
            <span className="text-xs uppercase tracking-wider text-faint">{t.status}</span>
            {/* «Новый» — только у свободного лида: у закреплённого он
                значил бы «новый, но чей-то». Отпустить — «Вернуть в очередь». */}
            {STATUSES.filter((value) => value !== "new" || !lead.assigned_staff_id).map((value) => (
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
                  {label(leadStatusDict, value, locale)}
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Контакт ─────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          {t.contact}
          <HelpHint topic={helpAnchor("/admin", "card")} label={t.contactHelp} />
        </p>

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
              <p className="mt-2 font-mono text-sm text-green">
                {contact.handle?.trim() ? contactView.label : t.contactNone}
              </p>
            )}
            <p className="mt-1 text-xs text-faint">
              {contact.kind ? label(leadContactKindDict, contact.kind, locale) : t.kindUnknown} ·{" "}
              {t.viewLogged}
            </p>
          </>
        ) : reveals ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <form action={revealContactAction}>
              <input type="hidden" name="lead" value={lead.id} />
              <button type="submit" className={BUTTON}>
                {t.showContact}
              </button>
            </form>
            <span className="text-xs text-faint">
              {lead.contact_revealed_at
                ? t.lastOpened(when(lead.contact_revealed_at))
                : t.neverOpened}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {free
              ? t.takeForContact
              : t.heldByOther}
          </p>
        )}
      </section>

      {/* ── Первичка по касанию ─────────────────────────────────────── */}
      {talk && mine ? (
        <section id="talk" className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
              {t.talk}
              <HelpHint topic={helpAnchor("/admin/prospect", "replies")} label={t.talkHelp} />
            </p>
            <span className="font-mono text-xs text-blue-soft">{talk.host}</span>
            <span
              className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${
                talk.aiHandling ? "border-green/40 bg-green/10 text-green" : "border-gold/40 bg-gold/10 text-gold"
              }`}
            >
              {talk.aiHandling ? t.aiAnswers : t.youAnswer(talk.handoverReason ?? "")}
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
                    {line.direction === "in" ? t.client : line.author === "ai" ? t.aiForUs : t.you}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {t.talkEmpty}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {talk.aiHandling ? (
              <>
                <form action={takeOverTalkAction}>
                  <input type="hidden" name="lead" value={lead.id} />
                  <input type="hidden" name="prospect" value={talk.prospectId} />
                  <button type="submit" className={BUTTON}>
                    {t.takeOverTalk}
                  </button>
                </form>
                <span className="text-xs text-faint">
                  {t.aiNote}
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
                  {t.openTelegram}
                </a>
                <span className="text-xs text-faint">
                  {t.telegramNote}
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
        <p className="text-xs uppercase tracking-wider text-faint">{t.transcript}</p>

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
                      {line.role === "user" ? t.client : t.assistant}
                    </p>
                    {/* whitespace-pre-wrap: человек писал абзацами, и склеенный
                        в одну строку разговор читается вдвое дольше. */}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.content}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-faint">{t.viewLogged}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {t.noTranscript}
            </p>
          )
        ) : reveals ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <form action={revealTranscriptAction}>
              <input type="hidden" name="lead" value={lead.id} />
              <button type="submit" className={BUTTON}>
                {t.showTranscript}
              </button>
            </form>
            <span className="text-xs text-faint">
              {t.transcriptHint}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {free
              ? t.takeForTranscript
              : t.heldByOther}
          </p>
        )}
      </section>

      {/* ── Напоминания ─────────────────────────────────────────────── */}
      {mine ? (
        <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
              {t.reminders}
              <HelpHint topic={helpAnchor("/admin", "reminders")} label={t.remindersHelp} />
            </p>
            <form action={toggleAutoReminder} className="ml-auto">
              <input type="hidden" name="lead" value={lead.id} />
              <input type="hidden" name="enabled" value={lead.auto_reminder ? "0" : "1"} />
              <button type="submit" className={BUTTON}>
                {lead.auto_reminder ? t.autoOff : t.autoOn}
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
                  <span className="text-muted">{item.note || t.noNote}</span>
                  {item.kind === "auto" ? (
                    <span className="rounded bg-line px-1.5 py-0.5 text-[11px] text-faint">
                      {t.auto}
                    </span>
                  ) : null}
                  {/* Три разных состояния, и их нельзя сливать. «Отправлено»
                      — дошло. «Просрочено» — время вышло, свип ещё пробует.
                      «Не доставлено» — свип сдался, и об этом нужно знать:
                      напоминание, которое молча не дошло, хуже, чем его
                      отсутствие, потому что человек на него рассчитывал. */}
                  {item.attempts >= DELIVERY_GIVE_UP ? (
                    <span className="text-[11px] font-semibold text-gold">
                      {t.undelivered(item.attempts)}
                    </span>
                  ) : item.sent_at ? (
                    <span className="text-[11px] text-faint">{t.sent}</span>
                  ) : Date.parse(item.due_at) < Date.now() ? (
                    <span className="text-[11px] text-blue-soft">{t.overdue}</span>
                  ) : null}
                  <form action={finishReminder} className="ml-auto">
                    <input type="hidden" name="lead" value={lead.id} />
                    <input type="hidden" name="reminder" value={item.id} />
                    <button type="submit" className="text-xs text-faint transition hover:text-green">
                      {t.done}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t.nothingPlanned}</p>
          )}

          <form action={addReminder} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="lead" value={lead.id} />
            <label className="text-xs text-faint" htmlFor="hours">
              {t.remindIn}
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
            <span className="text-xs text-faint">{t.hoursUnit}</span>
            <input
              name="note"
              type="text"
              maxLength={300}
              placeholder={t.remindWhat}
              className="min-w-[12rem] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm"
            />
            {/* Серая и неактивная, пока напоминание записывается: без этого
                нетерпеливое нажатие ставило одно и то же десятки раз. */}
            <SubmitButton pendingLabel={t.setting} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
              {t.set}
            </SubmitButton>
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
        <Field label={t.who} value={lead.contact_name} />
        <Field label={t.company} value={lead.company} />
        <Field label={t.partner} value={partnerLabel} />
        <div id="inn" className="scroll-mt-24">
          <dt className="text-xs uppercase tracking-wider text-faint">{tc.innLabel}</dt>
          {mine ? (
            <dd className="mt-1">
              <form action={saveInnAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="lead" value={lead.id} />
                <input
                  name="inn"
                  inputMode="numeric"
                  maxLength={15}
                  defaultValue={lead.client_inn ?? ""}
                  placeholder="123456789"
                  aria-label={tc.innLabel}
                  className="w-36 rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-sm"
                />
                <SubmitButton pendingLabel={tc.innSaving} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                  {tc.innSave}
                </SubmitButton>
              </form>
              <p className={`mt-1 text-xs ${innResult === "bad" || innResult === "forbidden" || innResult === "failed" ? "text-gold" : innResult ? "text-green" : "text-faint"}`}>
                {innResult === "bad"
                  ? tc.innBad
                  : innResult === "forbidden"
                    ? tc.innForbidden
                    : innResult === "client"
                      ? tc.innSavedClient
                      : innResult === "saved"
                        ? tc.innSaved
                        : tc.innHint}
              </p>
            </dd>
          ) : (
            <dd className="mt-1 font-mono text-sm">{lead.client_inn || "—"}</dd>
          )}
        </div>
        <Field label={t.niche} value={lead.niche} />
        <Field
          label={t.services}
          value={lead.services?.length ? lead.services.join(", ") : null}
        />
        <Field
          label={t.budget}
          value={lead.budget ? label(leadBudgetDict, lead.budget, locale) : null}
        />
        <Field
          label={t.timing}
          value={lead.timing ? label(leadTimingDict, lead.timing, locale) : null}
        />
        <Field
          label={t.authority}
          value={lead.authority ? label(leadAuthorityDict, lead.authority, locale) : null}
        />
        <Field
          label={t.need}
          value={lead.need ? label(leadNeedDict, lead.need, locale) : null}
        />
        <Field
          label={t.expertise}
          value={lead.expertise ? label(leadExpertiseDict, lead.expertise, locale) : null}
        />
        <Field label={t.priority} value={label(leadPriorityDict, lead.priority, locale)} />
        <Field label={t.status} value={label(leadStatusDict, lead.status, locale)} />
        {/*
          «Откуда писал, во сколько, где» — теми же словами, что и в
          уведомлении: менеджер читает бриф в чате, а карточку открывает
          следом, и два разных описания одного и того же места сбивают.
        */}
        <Field label={t.wroteFrom} value={`${channelName(lead.source, locale)} · ${lead.locale}`} />
        <Field label={t.when} value={atTashkent(lead.created_at, locale)} />
        <Field
          label={t.where}
          value={
            [placeOf(lead2origin(lead), locale), refOf(lead2origin(lead), locale)].filter(Boolean).join(" · ") ||
            null
          }
        />
        <Field
          label={t.tgHandle}
          value={hideHandle ? t.handleHidden : usernameOf(lead2origin(lead))}
        />
      </dl>

      {summaryLines(lead.summary).length ? (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wider text-faint">{t.brief}</h2>
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
          <h2 className="text-xs uppercase tracking-wider text-faint">{t.quote}</h2>
          <QuoteCard quote={quote} locale={locale} />
        </section>
      ) : null}

      {lead.notes ? (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xs uppercase tracking-wider text-faint">{t.notes}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{lead.notes}</p>
        </section>
      ) : null}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">
        {t.footer}
      </p>
    </AdminShell>
  );
}
