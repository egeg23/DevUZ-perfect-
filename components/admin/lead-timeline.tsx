"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import { sendFromCardAction } from "@/app/admin/leads/[id]/actions";
import { EditSent } from "@/components/admin/edit-sent";
import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { cardWhen, leadCardDict, leadResultDict } from "@/content/admin-panel/lead-card";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { withTouch, type TimelineChannel, type TimelineItem } from "@/lib/admin/lead-timeline";
import type { TalkLine, TalkView } from "@/lib/admin/outreach-talk-store";

/** Как часто лента спрашивает свежую переписку касания, пока вкладка открыта. */
const POLL_MS = 10_000;

/**
 * Лента карточки лида: переписка касания, заметки команды, ступени и
 * напоминания одним списком по времени — и одно поле ответа под ним.
 *
 * Владелец, 25.10.2026: «Погнали по порядку» — на «одна лента в карточке
 * клиента, поле ответа одно, канал выбирается сам». Раньше это были три
 * блока: «Первичка по касанию» (чат с рабочего аккаунта, владелец,
 * 11.10.2026: «чтобы у нас менеджеры не переключались между несколькими
 * аккаунтами»), «Переписка с клиентом» с «Написать клиенту в бот» и
 * «Обсуждение». Всё, что они умели, — здесь: реплики касания обновляются
 * сами (скаут отправляет через полминуты — «отправляется…» пропадает),
 * «Исправить» у нашего, «Ответы на возражения», ответ от бота и заметка.
 *
 * Куда уйдёт ответ, видно на кнопках над полем (lib/admin/lead-timeline,
 * channelsOf): клиенту с рабочего аккаунта касания, клиенту от бота студии
 * или заметкой команде. Первым стоит тот, что дойдёт до клиента.
 */
export function LeadTimeline({
  leadId,
  prospectId,
  initial,
  channels,
  from,
  aiHandling,
  quick = [],
  limits,
  chat = null,
}: {
  leadId: string;
  /** Касание, чью переписку видно здесь; null — касания нет или оно не ваше. */
  prospectId: string | null;
  initial: readonly TimelineItem[];
  channels: readonly TimelineChannel[];
  /** «с аккаунта «…» @ник» на языке панели — для кнопки «Клиенту …». */
  from: string | null;
  aiHandling: boolean;
  /** «Ответы на возражения»: готовые тексты на языке клиента (talkForLead). */
  quick?: TalkView["quick"];
  /** Сколько знаков влезает в каждый канал: Telegram у касания, бот, заметка. */
  limits: Readonly<Record<TimelineChannel, number>>;
  /** Переписка в чате сайта или в боте — до лида; рисует страница (раскрытие пишется в журнал). */
  chat?: ReactNode;
}) {
  const t = usePanelDict(leadCardDict);
  const results = usePanelDict(leadResultDict);
  const ss = usePanelDict(salesStagesDict);
  const locale = usePanelLocale();
  const router = useRouter();
  const [items, setItems] = useState<readonly TimelineItem[]>(initial);
  const [channel, setChannel] = useState<TimelineChannel>(channels[0] ?? "note");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const shown = useRef(initial.length);

  // Страница перерисовалась (после ответа, «Отвечать самому») — берём её ленту.
  useEffect(() => setItems(initial), [initial]);

  // Новая строка — показать её, не заставляя листать.
  useEffect(() => {
    if (items.length > shown.current) bottom.current?.scrollIntoView({ block: "nearest" });
    shown.current = items.length;
  }, [items]);

  // Свежая переписка касания — тем же адресом, что был у чата (права те же: лид свой).
  useEffect(() => {
    if (!prospectId) return;
    let stop = false;
    const pull = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/admin/leads/${leadId}/talk`, { cache: "no-store" });
        if (!res.ok || stop) return;
        const data = (await res.json()) as { lines: TalkLine[]; aiHandling: boolean };
        setItems((now) => withTouch(now, data.lines));
        // ИИ передал разговор человеку — шапка ленты и кнопки должны это показать.
        if (data.aiHandling !== aiHandling) router.refresh();
      } catch {
        // Сеть мигнула — спросим в следующий раз.
      }
    };
    const timer = setInterval(pull, POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [leadId, prospectId, aiHandling, router]);

  // Ответ бота — словами «Написать клиенту в бот», остальное — как у ответа с рабочего аккаунта.
  const reasonText = (reason: string): string => {
    if (reason.startsWith("bot_") && Object.hasOwn(results, reason)) return results[reason as keyof typeof results] as string;
    const key = `re_${reason}` as keyof typeof t;
    return Object.hasOwn(t, key) && typeof t[key] === "string" ? (t[key] as string) : t.re_failed;
  };

  const send = () => {
    const body = text.trim();
    if (!body || pending) return;
    start(async () => {
      const result = await sendFromCardAction(leadId, channel, body, prospectId);
      if (!result.ok) {
        // Битая ссылка — какая и куда должна вести, чтобы поправить, не ища.
        const bad = result.reason === "bad_link" ? (result.bad ?? []).map((b) => (b.fix ? t.badLinkFix(b.link, b.fix) : t.badLinkNone(b.link))) : [];
        setError([reasonText(result.reason), ...bad].join(" "));
        return;
      }
      setText("");
      setError(null);
      router.refresh();
    });
  };

  const when = (iso: string) => cardWhen(iso, locale);
  const label = (c: TimelineChannel) => (c === "touch" ? t.chanTouch(from ?? "") : c === "bot" ? t.chanBot : t.chanNote);
  const hint = channel === "touch" ? t.replyHint(from ?? "") : channel === "bot" ? t.botWriteHint : t.noteHint;

  return (
    <>
      {chat}
      {items.length ? (
        <div className="mt-3 flex max-h-[36rem] flex-col gap-3 overflow-y-auto pr-1" data-timeline>
          {items.map((item) =>
            item.type === "touch" ? (
              <TouchLine key={item.id} line={item.line} leadId={leadId} prospectId={prospectId} from={from} when={when(item.at)} />
            ) : item.type === "note" ? (
              <div
                key={item.id}
                className={`rounded-lg border px-4 py-2.5 ${item.note.own ? "border-gold/25 bg-gold/5" : "border-line-soft bg-surface-2"}`}
              >
                <p className="text-[0.7rem] uppercase tracking-wider text-faint">
                  {t.noteBy(item.note.author)} · <span className="normal-case tracking-normal">{when(item.at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-text">{item.note.body}</p>
              </div>
            ) : (
              <p key={item.id} className="text-center text-xs text-faint">
                {item.event.kind === "created"
                  ? t.evCreated
                  : item.event.kind === "stage"
                    ? `✓ ${t.evStage(ss[item.event.stage], item.event.by)}`
                    : item.event.done
                      ? `✓ ${t.evReminderDone(item.event.note)}`
                      : `⏰ ${t.evReminder(when(item.event.due), item.event.note)}`}
                {" · "}
                {when(item.at)}
              </p>
            ),
          )}
          <div ref={bottom} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">{t.timelineEmpty}</p>
      )}

      <div className="mt-4 border-t border-line pt-3">
        {channels.length > 1 ? (
          <div role="radiogroup" aria-label={t.chanLabel} className="mb-2 flex flex-wrap gap-2">
            {channels.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={channel === c}
                onClick={() => {
                  setChannel(c);
                  setError(null);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition active:scale-[0.98] ${
                  channel === c ? "border-green/50 bg-green/10 text-green" : "border-line text-muted hover:text-text"
                }`}
              >
                {label(c)}
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          maxLength={limits[channel]}
          placeholder={channel === "note" ? t.notePlaceholder : t.replyPlaceholder}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-faint focus:border-green/60 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={pending || !text.trim()}
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-green-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t.replySending : t.replySend}
          </button>
          {error ? (
            <span role="alert" className="text-xs text-red-300">
              {error}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-snug text-faint">{hint}</p>
        {channel === "touch" && quick.length ? (
          <div className="mt-3" data-quick-replies>
            <p className="text-xs font-semibold text-muted">{t.quickTitle}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q.kind}
                  type="button"
                  onClick={() => setText(q.text)}
                  className="rounded-full border border-line px-3 py-1 text-xs text-text transition hover:border-green/50 hover:text-green active:scale-[0.98]"
                >
                  {t[`quick_${q.kind}`]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-faint">{t.quickHint}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** Реплика касания: клиент слева, наше справа, у нашего — статус и «Исправить». */
function TouchLine({
  line,
  leadId,
  prospectId,
  from,
  when,
}: {
  line: TalkLine;
  leadId: string;
  prospectId: string | null;
  from: string | null;
  when: string;
}) {
  const t = usePanelDict(leadCardDict);
  return (
    <div
      className={
        line.direction === "in"
          ? "max-w-[85%] self-start rounded-xl rounded-bl-sm bg-surface-2 px-4 py-2.5"
          : "max-w-[85%] self-end rounded-xl rounded-br-sm border border-line px-4 py-2.5"
      }
    >
      <p className="text-[0.7rem] uppercase tracking-wider text-faint">
        {line.direction === "in" ? t.client : line.author === "ai" ? t.aiForUs : t.you}
        {/* С какого аккаунта ушло: владелец, 11.10.2026. */}
        {line.direction === "out" && from ? <span className="normal-case tracking-normal"> · {from}</span> : null}
        <span className="normal-case tracking-normal"> · {when}</span>
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.body}</p>
      {line.direction === "out" && line.status === "queued" ? (
        <p className="mt-1 text-[11px] text-faint">{t.lineQueued}</p>
      ) : line.direction === "out" && line.status === "failed" ? (
        <p className="mt-1 text-[11px] text-red-300">{t.lineFailed(line.failure ?? "")}</p>
      ) : null}
      {/* «Исправить» — у нашего письма или ответа, 48 часов после отправки. */}
      {prospectId && line.direction === "out" && (line.editable || line.edit) ? (
        <EditSent
          prospectId={prospectId}
          lineId={line.id}
          leadId={leadId}
          body={line.body}
          editable={Boolean(line.editable)}
          last={line.edit ?? null}
        />
      ) : null}
    </div>
  );
}
