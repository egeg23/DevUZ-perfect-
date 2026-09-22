import Link from "next/link";

import {
  markSelfContactedAction,
  prepareOutreachAction,
  recordManualAnswerAction,
  sendOutreachAction,
  skipProspectAction,
} from "@/app/admin/prospect/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { DoneButton, SubmitButton } from "@/components/admin/submit-button";
import { sendProblems } from "@/lib/admin/outreach-store";
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
import { outreachHooks } from "@/lib/admin/outreach";
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
  replies,
}: {
  rows: Prospect[];
  /** Что ушло за последний час: предел считается по факту отправки. */
  hour: { count: number; oldestAgoMs: number | null };
  open?: string;
  error?: string;
  sent?: boolean;
  /** Ответы модели по ручному маршруту: их отправляет человек. */
  replies?: Record<string, string>;
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
      {/*
        Отказ показывается у кнопки, на которую нажали, а не здесь.
        Наверху он остаётся только для случая, когда карточки на странице
        нет вовсе — её отфильтровали или список пуст.

        Менеджеры: «кнопка „отправить“ не работает». Она работала и честно
        отказывала, но отказ печатался вверху страницы, а адрес возврата
        уводил к карточке — на полсотни строк ниже. С точки зрения
        человека нажатие не делало ничего.
      */}
      {error && !rows.some((row) => row.id === open) ? (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
          {REASON_TEXT[error as Reason] ?? decodeURIComponent(error)}
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
          const wait =
            row.status === "sending"
              ? queueView({
                  ahead: queue.filter((q) => q.created_at < row.created_at).length,
                  sentLastHour: hour.count,
                  oldestSentAgoMs: hour.oldestAgoMs,
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
                    без сайта{row.niche ? ` · ${row.niche}` : ""}
                  </span>
                )}
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
                  {/* То, ради чего письмо открывают. Менеджер должен видеть
                      это, не разворачивая карточку: с сайта, где теряется
                      половина обращений, разговор начинается с одной фразы,
                      а с сайта, где теряется пять, — с другой. */}
                  {hooks.lost ? (
                    <span className="font-mono text-sm text-red-300" title="Теряется обращений из каждых ста">
                      −{hooks.lost[0]}…{hooks.lost[1]}
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
                      placeholder="чем написали — WhatsApp, звонок"
                      className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                    />
                    <SubmitButton
                      pendingLabel="Отмечаем…"
                      base="rounded-lg px-3 py-1.5 text-xs"
                      tone="quiet"
                    >
                      Связался сам
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
                    Связались руками{row.target ? ` — ${row.target}` : ""}
                    {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                    {row.claimed_name ? ` · ${row.claimed_name}` : ""}
                  </p>
                  {row.manual_note ? (
                    <p className="mt-1 text-xs text-muted">{row.manual_note}</p>
                  ) : null}

                  {replies?.[row.id] ? (
                    <div className="mt-2 rounded-lg border border-green/25 bg-green/5 px-3 py-2">
                      <p className="text-xs text-green">Модель написала ответ — отправьте его тем же путём.</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">
                        {replies[row.id]}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <CopyMessage text={replies[row.id]} label="Скопировать ответ" />
                        {row.target ? (
                          <a
                            href={whatsappLink(row.target, replies[row.id])}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                          >
                            Открыть WhatsApp с ответом
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <form action={recordManualAnswerAction} className="mt-3">
                    <input type="hidden" name="prospect" value={row.id} />
                    <label className="block text-xs uppercase tracking-wider text-faint">
                      Что ответил клиент — перенесите сюда, дальше ведёт модель
                      <textarea
                        name="body"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text"
                      />
                    </label>
                    <SubmitButton
                      pendingLabel="Записываем…"
                      base="mt-2 rounded-lg px-3 py-1.5 text-xs"
                      tone="quiet"
                    >
                      Записать ответ
                    </SubmitButton>
                  </form>
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

              {/* Кнопка появляется, только когда писать и можно, и есть куда.
                  Условие по состоянию строки, а не по «открыта ли карточка»:
                  теперь после действия мы возвращаемся на неё же якорем, и
                  прежнее !expanded показало бы форму отправки на строке,
                  которая уже ушла, — то есть предложило бы отправить второй
                  раз. Второе касание тому же человеку — это ровно то, за что
                  блокируют аккаунт. */}
              {reason === "ok" && (row.status === "new" || !row.message) ? (
                <form action={prepareOutreachAction} className="mt-3 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="prospect" value={row.id} />
                  <SubmitButton
                    pendingLabel="Читаем сайт — это до минуты…"
                    base="rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Связаться
                  </SubmitButton>
                  <span className="text-xs text-faint">{route ? ROUTE_TEXT[route.kind] : ""}</span>
                  {error && open === row.id ? (
                    <p className="w-full rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      {REASON_TEXT[error as Reason] ?? decodeURIComponent(error)}
                    </p>
                  ) : null}
                </form>
              ) : null}

              {reason !== "ok" && row.status === "new" ? (
                <p className="mt-2 text-xs text-faint">{REASON_TEXT[reason]}</p>
              ) : null}

              {row.status === "contacting" && row.message ? (
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
                    <SubmitButton
                      pendingLabel="Отправляем…"
                      base="rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      {route?.kind === "manual" ? "Взять в работу" : `Отправить в ${route?.target ?? ""}`}
                    </SubmitButton>
                    <span className="text-xs text-faint">
                      Лид закрепится за вами, как только нажмёте.
                    </span>
                  </div>
                  {error && open === row.id ? (
                    <p className="mt-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      Не отправлено: {REASON_TEXT[error as Reason] ?? decodeURIComponent(error)}
                      <span className="mt-1 block text-xs text-faint">
                        Поправьте текст выше и нажмите ещё раз.
                      </span>
                    </p>
                  ) : willRefuse.length ? (
                    <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-amber-200">
                      <p className="font-medium">Это письмо отправка не пропустит:</p>
                      <ul className="mt-1 space-y-1 text-[0.86rem]">
                        {willRefuse.map((p) => (
                          <li key={p.code}>— {p.text}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-faint">
                        Поправьте текст выше — проверка пересчитается после отправки.
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
              {row.status === "new" || row.status === "contacting" ? (
                <form
                  action={markSelfContactedAction}
                  className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3"
                >
                  <input type="hidden" name="prospect" value={row.id} />
                  <input
                    name="note"
                    placeholder={row.message ? "чем написали — свой Telegram, звонок" : "что написали"}
                    className="min-w-[16rem] flex-1 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                  />
                  <SubmitButton
                    pendingLabel="Отмечаем…"
                    base="rounded-lg px-3 py-1.5 text-xs"
                    tone="quiet"
                  >
                    Связался сам
                  </SubmitButton>
                  <span className="text-xs text-faint">
                    Если писали со своего аккаунта — отметьте, иначе касание не засчитается.
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
                    {row.status === "sending" ? "Отправлено в очередь" : "Отправлено"}
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
                        Связались{row.target ? ` — ${row.target}` : ""}
                        {row.sent_at ? ` · ${when(row.sent_at)}` : ""}
                        {row.claimed_name ? ` · ${row.claimed_name}` : ""}
                      </p>

                      {/* Проверка доставки, а не пересказ ответа Telegram.
                          Тот отвечает «принято» и тогда, когда сообщение
                          потом снимает антиспам или когда нас
                          заблокировали, — поэтому скаут перечитывает
                          переписку и ищет в ней своё сообщение по номеру. */}
                      <p className="mt-1 text-xs text-muted">
                        {row.delivered_at
                          ? `Сообщение нашлось в переписке с нашего аккаунта — ${when(row.delivered_at)}.`
                          : (row.delivery_note ??
                            "Доставку ещё не подтверждали: скаут перечитывает переписку сразу после отправки.")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gold">
                      Сообщение поставлено в очередь на отправку с рабочего аккаунта. Как только уйдёт,
                      здесь появится подтверждение с временем.
                    </p>
                  )}
                </div>
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
