import Link from "next/link";

import {
  closeTouchAction,
  markSelfContactedAction,
  prepareOutreachAction,
  recordManualAnswerAction,
  sendOutreachAction,
  skipProspectAction,
} from "@/app/admin/prospect/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { DoneButton, SubmitButton } from "@/components/admin/submit-button";
import { checkFresh, sendProblems } from "@/lib/admin/outreach-store";
import {
  HOURLY_CAP,
  canContact,
  queueView,
  untilSendWindow,
  routeFor,
  whatsappLink,
} from "@/lib/admin/outreach";
import { outreachHooks } from "@/lib/admin/outreach";
import { seoReport, type SeoGrade } from "@/lib/audit/seo";
import type { Prospect } from "@/lib/admin/outreach-store";
import { REST_PAGE } from "@/lib/admin/outreach-view";
import type { Role } from "@/lib/admin/roles";
import { CLOSE_REASONS, mayClose } from "@/lib/admin/touch-close";
import { parseTouchError, type ParsedTouchError, type ProblemRef } from "@/lib/admin/touch-errors";
import { isAutoNote } from "@/lib/proto/auto-note";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import {
  autopilotDict,
  closeButtonDict,
  closeLabelDict,
  outreachListDict,
  problemDict,
  protoNoteDict,
  prospectStatusDict,
  reasonDict,
  routeDict,
  seoGradeDict,
  touchErrorDict,
} from "@/content/admin-panel/prospect";
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

/**
 * Проблема письма словами на языке панели: код — из messageProblems /
 * nositeProblems, числа и имена — из `args`. Русский `text` проблемы здесь
 * не нужен: его читает модель, а не сотрудник.
 */
function problemText(p: ProblemRef, t: Picked<typeof problemDict>): string {
  const [a, b] = p.args;
  switch (p.code) {
    case "short":
      return t.short(Number(a ?? 40));
    case "long":
      return t.long(Number(a ?? 150));
    case "no_host":
      return t.no_host(String(a ?? ""));
    case "no_us":
      return t.no_us;
    case "invented":
      return t.invented(String(a ?? ""));
    case "foreign_script":
      return t.foreign_script(String(a ?? ""));
    case "banned":
      return t.banned;
    case "no_seo_score":
      return t.no_seo_score(Number(a ?? 0));
    case "no_loss":
      return t.no_loss(Number(a ?? 0), Number(b ?? 0));
    case "foreign_reference":
      return t.foreign_reference(String(a ?? ""));
    case "no_reference":
      return t.no_reference(String(a ?? ""));
    case "no_proto_link":
      return t.no_proto_link(String(a ?? ""));
    case "no_prototype":
      return t.no_prototype(Number(a ?? 12));
    default:
      return t.unknown;
  }
}

/** Отказ кнопки из `?e=` словами: причина, проверка письма, дефект или код. */
function errorText(e: ParsedTouchError, locale: PanelLocale): string {
  if (e.code === "no_way" || e.code === "nothing_to_say" || e.code === "already") {
    return pick(reasonDict, locale)[e.code];
  }
  const errors = pick(touchErrorDict, locale);
  if (e.code === "problems" && e.problems.length) {
    const problems = pick(problemDict, locale);
    return e.problems.map((p) => problemText(p, problems)).join(" ");
  }
  if (e.code === "defect") return e.detail ? `${errors.defect} ${e.detail}` : errors.defect;
  return errors[e.code];
}

/** «вот-вот» / «примерно через 20 мин.» / «примерно через 2 часа» — как waitText в lib, на языке панели. */
function waitLabel(ms: number, t: Picked<typeof outreachListDict>): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes <= 1) return t.waitSoon;
  if (minutes < 60) return t.waitMinutes(minutes);
  return t.waitHours(Math.round(minutes / 60));
}

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function OutreachList({
  rows,
  hour,
  cap = HOURLY_CAP,
  open,
  error,
  sent,
  replies,
  owners = [],
  more = null,
  viewer = null,
  locale = "ru",
}: {
  rows: Prospect[];
  /** Что ушло за последний час: предел считается по факту отправки. */
  hour: { count: number; oldestAgoMs: number | null };
  /** Первых писем в час со всех рабочих аккаунтов вместе (hourlyCapacity). */
  cap?: number;
  /** Кто владелец: его письма уходят вне очереди (lib/admin/outreach-queue.ts). */
  owners?: readonly string[];
  open?: string;
  error?: string;
  sent?: boolean;
  /** Ответы модели по ручному маршруту: их отправляет человек. */
  replies?: Record<string, string>;
  /**
   * Сколько карточек скрыто и куда ведёт «Показать ещё» — список рисуется
   * не целиком, см. lib/admin/outreach-view.ts.
   */
  more?: { hidden: number; href: string } | null;
  /** Кто смотрит: «Клиент отказался» видит тот, кто касание ведёт, руководитель и владелец. */
  viewer?: { id: string; role: Role } | null;
  /** Язык панели того, кто смотрит (`staff.panel_locale`). */
  locale?: PanelLocale;
}) {
  if (!rows.length) return null;

  const t = pick(outreachListDict, locale);
  // Касание автопрогона ничьё, пока клиент не ответил: вместо имени — «автопрогон».
  const auto = pick(autopilotDict, locale);
  const status = pick(prospectStatusDict, locale);
  const closeButton = pick(closeButtonDict, locale);
  const closeLabel = pick(closeLabelDict, locale);
  const reasonText = pick(reasonDict, locale);
  const routeText = pick(routeDict, locale);
  const gradeText = pick(seoGradeDict, locale);
  const problems = pick(problemDict, locale);
  const protoNote = pick(protoNoteDict, locale);
  // Отказ приходит кодом (lib/admin/touch-errors.ts), слова — отсюда.
  const failure = parseTouchError(error);
  const failureText = failure ? errorText(failure, locale) : "";

  const queue = rows.filter((r) => r.status === "sending");
  const left = Math.max(0, cap - hour.count);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {t.heading}
          <HelpHint topic={helpAnchor("/admin/prospect", "send")} label={t.helpSend} />
        </h2>
        <p className="flex items-center gap-2 text-xs text-faint">
          <HelpHint topic={helpAnchor("/admin/prospect", "queue")} label={t.helpQueue} />
          {t.hourLine(hour.count, cap)}
          {queue.length ? t.inQueue(queue.length) : ""}
          {left === 0 && queue.length ? t.queueWaits : ""}
        </p>
      </div>

      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-faint">
        {t.intro}
      </p>

      {sent ? (
        <p className="mt-3 rounded-xl border border-green/30 bg-green/5 px-4 py-2 text-sm text-green">
          {t.sentNotice}
        </p>
      ) : null}
      {/*
        Отказ показывается у кнопки, на которую нажали, а не здесь.
        Наверху он остаётся только для случая, когда карточки на странице
        нет вовсе — её отфильтровали или список пуст.

        Менеджеры: «кнопка „отправить“ не работает». Она работала и честно
        отказывала, но отказ печатался вверху страницы, а адрес возврата
        уводил к карточке — на полсотни строк ниже. С точки зрения
        человека нажатие не делало ничего.
      */}
      {failure && !rows.some((row) => row.id === open) ? (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
          {failureText}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const noSite = !row.host;
          const reason = canContact({
            contacts: row.contacts,
            findings: row.findings,
            status: row.status,
            noSite,
          });
          const route = routeFor(row.contacts);
          // На чём споткнётся отправка — тем же кодом, что и сама отправка.
          // Показываем до нажатия: узнать о проверке в момент отказа — это и
          // есть «кнопка не работает».
          const willRefuse = row.status === "contacting" ? sendProblems(row) : [];
          const seo = seoReport({ findings: row.findings });
          const hooks = outreachHooks(row.findings);
          // Письмо владельца уходит вне очереди — через минуту после любой
          // предыдущей отправки; все остальные ждут и его тоже.
          const isOwner = (q: Prospect) => q.claimed_by !== null && owners.includes(q.claimed_by);
          const vip = isOwner(row);
          const wait =
            row.status === "sending"
              ? vip
                ? {
                    ahead: queue.filter((q) => isOwner(q) && q.created_at < row.created_at).length,
                    // Вне очереди — но не ночью: окно 07:30–20:30 и для владельца.
                    waitMs: Math.max(60_000, untilSendWindow(Date.now())),
                  }
                : queueView({
                    ahead: queue.filter((q) => isOwner(q) || q.created_at < row.created_at).length,
                    sentLastHour: hour.count,
                    oldestSentAgoMs: hour.oldestAgoMs,
                    cap,
                    now: Date.now(),
                  })
              : null;

          // Карточка, на которую мы только что вернулись, обведена: на
          // экране их полсотни, и «вот эта» должна читаться без поиска
          // глазами.
          return (
            <li
              key={row.id}
              id={`p-${row.id}`}
              className={`${CARD} scroll-mt-24 ${open === row.id ? "border-green/50" : ""}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {row.label ? <span className="font-medium">{row.label}</span> : null}
                {/* У компании без сайта ссылки нет — вместо неё ниша, от
                    которой написано письмо. Пустая ссылка на этом месте
                    читалась бы как «адрес не загрузился». */}
                {row.url && row.host ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-xs text-blue-soft hover:underline"
                  >
                    {row.host}
                  </a>
                ) : (
                  <span className="rounded-md border border-gold/30 bg-gold/5 px-2 py-0.5 font-mono text-xs text-gold">
                    {t.noSite}
                    {row.niche ? ` · ${row.niche}` : ""}
                  </span>
                )}
                <span className={`text-xs ${row.closed_reason ? "text-faint" : STATUS_TONE[row.status]}`}>
                  {status[row.status]}
                  {row.closed_reason ? ` · ${closeLabel[row.closed_reason]}` : ""}
                  {row.claimed_name ? ` · ${row.claimed_name}` : row.autopilot_at ? ` · ${auto.owner}` : ""}
                  {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                </span>
                <span className="ml-auto flex items-baseline gap-3">
                  {/* Два балла, а не один. Общий говорит, обратится ли
                      человек, который уже открыл сайт; этот — дойдёт ли он
                      до сайта из поиска. Менеджеру нужны оба: разговор с
                      владельцем, которого не находят, начинается иначе. */}
                  {seo.measured && seo.total > 0 ? (
                    <span className={`font-mono text-sm ${SEO_TONE[seo.grade]}`} title={gradeText[seo.grade]}>
                      {t.search(seo.score)}
                    </span>
                  ) : null}
                  {/* То, ради чего письмо открывают. Менеджер должен видеть
                      это, не разворачивая карточку: с сайта, где теряется
                      половина обращений, разговор начинается с одной фразы,
                      а с сайта, где теряется пять, — с другой. */}
                  {hooks.lost ? (
                    <span className="font-mono text-sm text-red-300" title={t.lostTitle}>
                      −{hooks.lost[0]}…{hooks.lost[1]}
                    </span>
                  ) : null}
                  {row.score !== null ? (
                    <span className={`font-mono text-sm ${row.score < 60 ? "text-gold" : "text-muted"}`} title={t.scoreTitle}>
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
                      title={`${f.impact}\n\n${t.whatWeDo} ${f.fix}`}
                      className={`rounded-full border px-2 py-0.5 text-xs ${SEVERITY[f.severity] ?? SEVERITY.minor}`}
                    >
                      {f.title}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasAnyContact(row.contacts) ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="text-xs uppercase tracking-wider text-faint">{t.contacts}</span>
                  {contactsLine(row.contacts)}
                </p>
              ) : null}

              {row.lead_id ? (
                <p className="mt-2 text-sm">
                  <Link href={`/admin/leads/${row.lead_id}`} className="text-green hover:underline">
                    {t.leadLink}
                  </Link>
                </p>
              ) : null}

              {/* Прототип, собранный заранее (lib/proto/auto): ссылка из письма
                  и открывал ли её клиент. Открытие — лучший повод написать:
                  о первом бот зовёт того, кто ведёт касание. Наши собственные
                  открытия из панели не считаются. */}
              {/* Проверка по факту (lib/audit/verify.ts): когда сайт перепроверили
                  перед письмом и что не подтвердилось — этого в письме нет. */}
              {row.host && row.checked_at ? (
                <p className="mt-2 text-xs text-muted" data-fact-check>
                  {t.checkedAt(when(row.checked_at))}{" "}
                  <HelpHint topic={helpAnchor("/admin/prospect", "fact-check")} label={t.checkHelp} />
                  {row.check_dropped.length ? (
                    <span className="block text-faint">
                      {t.checkDropped} {row.check_dropped.map((d) => d.title).join("; ")}
                    </span>
                  ) : null}
                </p>
              ) : null}

              {row.proto_url ? (
                <p className="mt-2 text-sm">
                  <a href={row.proto_url} target="_blank" rel="noreferrer noopener" className="text-green hover:underline">
                    {t.protoReady}
                  </a>
                  <span className="text-xs text-muted">
                    {" · "}
                    {row.proto_opened_at ? t.protoOpened(row.proto_opens, when(row.proto_opened_at)) : t.protoNotOpened}
                  </span>
                </p>
              ) : row.proto_note && isAutoNote(row.proto_note) ? (
                <p className="mt-2 text-xs text-faint">
                  {t.protoNotBuilt}
                  {protoNote[row.proto_note]}
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
                  <p className="text-sm text-blue-soft">{t.manualNext(row.target)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{routeText.manual}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={whatsappLink(row.target, row.message ?? "")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      {t.whatsappDraft}
                    </a>
                    <a
                      href={`tel:${row.target}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      {t.call}
                    </a>
                    {row.message ? <CopyMessage text={row.message} label={t.copyText} /> : null}
                  </div>

                  {/* Отметка не отчётность: с неё начинается разговор.
                      Первое письмо ложится в ленту, модель считается
                      ведущей, и ответ клиента, который менеджер сюда
                      перенесёт, ей будет с чем связать. Без отметки карточка
                      висела бы «дальше руками», и второй менеджер написал бы
                      тому же человеку второй раз. */}
                  <form action={markSelfContactedAction} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="prospect" value={row.id} />
                    <input
                      name="note"
                      placeholder={t.notePlaceholderManual}
                      className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                    />
                    <SubmitButton
                      pendingLabel={t.marking}
                      base="rounded-lg px-3 py-1.5 text-xs"
                      tone="quiet"
                    >
                      {t.selfContacted}
                    </SubmitButton>
                  </form>
                </div>
              ) : null}

              {/* Ручной маршрут после отметки: ответ клиента приходит
                  менеджеру на телефон и к нам не попадает ничем. Перенёс —
                  дальше всё как в телеграме: модель пишет ответ, он
                  появляется здесь же, отправляет снова человек. */}
              {row.status === "sent" && row.target_kind === "manual" ? (
                <div className="mt-3 rounded-lg border border-line bg-surface-2/40 px-4 py-3">
                  <p className="text-sm text-green">
                    {t.contactedByHand}
                    {row.target ? ` — ${row.target}` : ""}
                    {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                    {row.claimed_name ? ` · ${row.claimed_name}` : row.autopilot_at ? ` · ${auto.owner}` : ""}
                  </p>
                  {row.manual_note ? (
                    <p className="mt-1 text-xs text-muted">{row.manual_note}</p>
                  ) : null}

                  {replies?.[row.id] ? (
                    <div className="mt-2 rounded-lg border border-green/25 bg-green/5 px-3 py-2">
                      <p className="text-xs text-green">{t.modelReplied}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">
                        {replies[row.id]}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <CopyMessage text={replies[row.id]} label={t.copyReply} />
                        {row.target ? (
                          <a
                            href={whatsappLink(row.target, replies[row.id])}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                          >
                            {t.whatsappReply}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <form action={recordManualAnswerAction} className="mt-3">
                    <input type="hidden" name="prospect" value={row.id} />
                    <label className="block text-xs uppercase tracking-wider text-faint">
                      {t.clientAnswerLabel}
                      <textarea
                        name="body"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text"
                      />
                    </label>
                    <SubmitButton
                      pendingLabel={t.recording}
                      base="mt-2 rounded-lg px-3 py-1.5 text-xs"
                      tone="quiet"
                    >
                      {t.recordAnswer}
                    </SubmitButton>
                  </form>
                </div>
              ) : null}

              {/* В очереди — не тупик: можно подождать, а можно написать
                  самому. Второе быстрее, и ответ придёт прямо менеджеру. */}
              {wait && row.target && row.message ? (
                <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
                  <p className="text-sm text-gold">
                    {vip ? t.ownerQueue(waitLabel(wait.waitMs, t)) : t.inQueueWait(waitLabel(wait.waitMs, t))}
                    {wait.ahead ? t.ahead(wait.ahead) : ""}.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {t.noNeedToWait(t.selfContacted)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={`https://t.me/${row.target.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                    >
                      {t.openInTelegram(row.target)}
                    </a>
                    <CopyMessage text={row.message} label={t.copyText} />
                  </div>
                </div>
              ) : null}

              {/* Кнопка появляется, только когда писать и можно, и есть куда.
                  Условие по состоянию строки, а не по «открыта ли карточка»:
                  теперь после действия мы возвращаемся на неё же якорем, и
                  прежнее !expanded показало бы форму отправки на строке,
                  которая уже ушла, — то есть предложило бы отправить второй
                  раз. Второе касание тому же человеку — это ровно то, за что
                  блокируют аккаунт.
                  Письмо без свежей проверки сайта по факту тоже получает
                  кнопку: отправить его нельзя (not_checked), и «Связаться»
                  перепроверит сайт и напишет письмо заново. */}
              {reason === "ok" &&
              (row.status === "new" || !row.message || (row.status === "contacting" && row.host && !checkFresh(row.checked_at))) ? (
                <form action={prepareOutreachAction} className="mt-3 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="prospect" value={row.id} />
                  <SubmitButton
                    pendingLabel={t.preparing}
                    base="rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    {t.contact}
                  </SubmitButton>
                  <span className="text-xs text-faint">{route ? routeText[route.kind] : ""}</span>
                  {failure && open === row.id ? (
                    <p className="w-full rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      {failureText}
                    </p>
                  ) : null}
                </form>
              ) : null}

              {reason !== "ok" && row.status === "new" ? (
                <p className="mt-2 text-xs text-faint">{reasonText[reason]}</p>
              ) : null}

              {row.status === "contacting" && row.message ? (
                <form action={sendOutreachAction} className="mt-3">
                  <input type="hidden" name="prospect" value={row.id} />
                  <label className="block text-xs uppercase tracking-wider text-faint">
                    {t.firstMessageLabel}
                    <textarea
                      name="message"
                      defaultValue={row.message}
                      rows={10}
                      className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm leading-relaxed text-text"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <SubmitButton
                      pendingLabel={t.sending}
                      base="rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      {route?.kind === "manual" ? t.takeIntoWork : t.sendTo(route?.target ?? "")}
                    </SubmitButton>
                    <span className="text-xs text-faint">
                      {t.leadWillBeYours}
                    </span>
                  </div>
                  {failure && open === row.id ? (
                    <p className="mt-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      {t.notSent} {failureText}
                      <span className="mt-1 block text-xs text-faint">{t.fixAndRetry}</span>
                    </p>
                  ) : willRefuse.length ? (
                    <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      <p className="font-medium">{t.willRefuse}</p>
                      <ul className="mt-1 space-y-1 text-[0.86rem]">
                        {willRefuse.map((p) => (
                          <li key={p.code}>— {problemText({ code: p.code, args: p.args ?? [] }, problems)}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-faint">
                        {t.willRefuseHint}
                      </p>
                    </div>
                  ) : null}
                </form>
              ) : null}

              {/* «Связался сам» — там, где скаут ещё ничего не отправлял.
                  Менеджеры пишут со своих аккаунтов: рабочая сессия Telegram
                  одна, подключить к ней всех нельзя. Без этой отметки панель
                  отправки не видит вовсе — карточка висит новой, второй
                  менеджер пишет тому же человеку второй раз, а недельный план
                  не считается ни у кого.

                  Контакты здесь не проверяются: человек уже написал, и
                  спорить с этим, потому что аудитор не нашёл на сайте
                  телефон, панели не по чину. */}
              {row.status === "new" || row.status === "contacting" || row.status === "sending" ? (
                <form
                  action={markSelfContactedAction}
                  className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3"
                >
                  <input type="hidden" name="prospect" value={row.id} />
                  <input
                    name="note"
                    placeholder={row.message ? t.notePlaceholderMessage : t.notePlaceholderEmpty}
                    className="min-w-[16rem] flex-1 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                  />
                  <SubmitButton
                    pendingLabel={t.marking}
                    base="rounded-lg px-3 py-1.5 text-xs"
                    tone="quiet"
                  >
                    {t.selfContacted}
                  </SubmitButton>
                  <span className="text-xs text-faint">
                    {t.selfHint}
                  </span>
                </form>
              ) : null}

              {/* На месте кнопки — то, чем нажатие кончилось.
                  Владелец: «чтобы при нажатии кнопка меняла название —
                  отправлено или отправлено в очередь». Заголовок карточки
                  это и раньше писал, но он вверху и мелким: человек смотрит
                  туда, куда нажал. */}
              {row.target_kind !== "manual" && (row.status === "sending" || row.status === "sent") ? (
                <div className="mt-3">
                  {/* Та же кнопка на том же месте — серая и неактивная.
                      Владелец: «кнопка после нажатия становится не активной,
                      отправлено». Менеджер смотрит туда, куда нажал, и ответ
                      должен быть там, а не в другом углу карточки. */}
                  <DoneButton base="rounded-xl px-4 py-2 text-sm font-semibold">
                    {row.status === "sending" ? t.sentToQueue : t.sent}
                  </DoneButton>

                  {/* Подтверждение для себя: с кем, когда, кто и чем.
                      Владелец: «обязательно подтверждение для себя делаем,
                      что с этим контактом мы связались». Без него карточка
                      отвечает только «что-то произошло», а менеджеру нужно
                      «с этим человеком мы связались, вот когда».

                      Цвет блока целиком идёт за доставкой: зелёная рамка с
                      золотым предупреждением внутри — два разных ответа на
                      один вопрос, и глаз верит рамке. */}
                  {row.status === "sent" ? (
                    <div
                      className={`mt-2 rounded-lg border px-4 py-3 ${
                        row.delivered_at ? "border-green/25 bg-green/5" : "border-gold/30 bg-gold/5"
                      }`}
                    >
                      <p className={`text-sm ${row.delivered_at ? "text-green" : "text-gold"}`}>
                        {t.contacted}
                        {row.target ? ` — ${row.target}` : ""}
                        {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                        {row.claimed_name ? ` · ${row.claimed_name}` : row.autopilot_at ? ` · ${auto.owner}` : ""}
                      </p>

                      {/* Проверка доставки, а не пересказ ответа Telegram.
                          Тот отвечает «принято» и тогда, когда сообщение
                          потом снимает антиспам или когда нас
                          заблокировали, — поэтому скаут перечитывает
                          переписку и ищет в ней своё сообщение по номеру. */}
                      <p className="mt-1 text-xs text-muted">
                        {row.delivered_at
                          ? t.delivered(when(row.delivered_at))
                          : (row.delivery_note ?? t.notDeliveredYet)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gold">
                      {t.queuedNote}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Касание сделано — дальше либо разговор, либо его конец.
                  Владелец: «если лид отказался… сделать кнопку — клиент
                  отказался / игнорирует. Чтобы он вылетал из очереди». */}
              {row.status === "sent" && row.closed_reason ? (
                <p className="mt-3 rounded-lg border border-line bg-surface-2/40 px-4 py-2 text-xs text-muted">
                  {closeButton[row.closed_reason]}
                  {row.closed_name ? ` · ${row.closed_name}` : ""}
                  {row.closed_at ? ` · ${when(row.closed_at)}` : ""}. {t.closedNote}
                </p>
              ) : row.status === "sent" && viewer && mayClose(row, viewer) ? (
                <form action={closeTouchAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="prospect" value={row.id} />
                  {CLOSE_REASONS.map((reason) => (
                    <SubmitButton
                      key={reason}
                      name="reason"
                      value={reason}
                      pendingLabel={t.closing}
                      base="rounded-lg px-3 py-1.5 text-xs"
                      tone="quiet"
                    >
                      {closeButton[reason]}
                    </SubmitButton>
                  ))}
                  <HelpHint topic={helpAnchor("/admin/prospect", "close")} label={t.helpClose} />
                </form>
              ) : null}

              {row.status === "new" || row.status === "contacting" || row.status === "manual" ? (
                <form action={skipProspectAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="prospect" value={row.id} />
                  <input
                    name="reason"
                    placeholder={t.skipPlaceholder}
                    className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                  />
                  <button type="submit" className="text-xs text-faint hover:text-gold">
                    {t.skip}
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>

      {more && more.hidden > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Без предзагрузки: это та же тяжёлая страница, и тянуть её заранее
              на каждое появление кнопки в окне — ровно то, от чего уходим. */}
          <Link
            href={more.href}
            prefetch={false}
            className="rounded-xl border border-line px-4 py-2 text-sm text-muted transition hover:border-green/40 hover:text-text"
          >
            {t.showMore(Math.min(REST_PAGE, more.hidden))}
          </Link>
          <span className="flex items-center gap-2 text-xs text-faint">
            {t.hiddenMore(more.hidden)}
            <HelpHint topic={helpAnchor("/admin/prospect", "list")} label={t.helpList} />
          </span>
        </div>
      ) : null}
    </section>
  );
}
