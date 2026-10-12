"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { replyInTalkAction } from "@/app/admin/leads/[id]/actions";
import { EditSent } from "@/components/admin/edit-sent";
import { usePanelDict } from "@/components/admin/panel-locale";
import { leadCardDict } from "@/content/admin-panel/lead-card";
import type { TalkLine } from "@/lib/admin/outreach-talk-store";

/** Как часто чат спрашивает свежую переписку, пока вкладка открыта. */
const POLL_MS = 10_000;

/**
 * «Первичка по касанию» как чат: переписка обновляется сама, а ответ
 * уходит с рабочего аккаунта разговора — без телефона и переключения
 * аккаунтов.
 *
 * Владелец, 11.10.2026: «чтобы у нас менеджеры не переключались между
 * несколькими аккаунтами, а общались прямо через внутреннюю карточку…
 * это будет автоматически делаться». Отправляет скаут (queueStaffReply →
 * nextReply по sent_via), поэтому у своей реплики сначала «отправляется…»,
 * а через полминуты статус пропадает — ушло.
 */
export function TalkChat({
  leadId,
  prospectId,
  initial,
  from,
  aiHandling,
  emptyText,
}: {
  leadId: string;
  prospectId: string;
  initial: readonly TalkLine[];
  /** «с аккаунта «…» @ник» на языке панели; null — «Написал сам»: отсюда не ответить. */
  from: string | null;
  aiHandling: boolean;
  emptyText: string;
}) {
  const t = usePanelDict(leadCardDict);
  const router = useRouter();
  const [lines, setLines] = useState<readonly TalkLine[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const shown = useRef(initial.length);

  // Страница перерисовалась (после ответа, «Отвечать самому») — берём её ленту.
  useEffect(() => setLines(initial), [initial]);

  // Новая реплика — показать её, не заставляя листать.
  useEffect(() => {
    if (lines.length > shown.current) bottom.current?.scrollIntoView({ block: "nearest" });
    shown.current = lines.length;
  }, [lines]);

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/admin/leads/${leadId}/talk`, { cache: "no-store" });
        if (!res.ok || stop) return;
        const data = (await res.json()) as { lines: TalkLine[]; aiHandling: boolean };
        setLines(data.lines);
        // ИИ передал разговор человеку — шапка блока и кнопки должны это показать.
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
  }, [leadId, aiHandling, router]);

  const send = () => {
    const body = text.trim();
    if (!body || pending) return;
    start(async () => {
      const result = await replyInTalkAction(leadId, prospectId, body);
      if (!result.ok) {
        setError(t[`re_${result.reason}`]);
        return;
      }
      setText("");
      setError(null);
      router.refresh();
    });
  };

  return (
    <>
      {lines.length ? (
        <div className="mt-3 flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-1">
          {lines.map((line) => (
            <div
              key={line.id}
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
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text">{line.body}</p>
              {line.direction === "out" && line.status === "queued" ? (
                <p className="mt-1 text-[11px] text-faint">{t.lineQueued}</p>
              ) : line.direction === "out" && line.status === "failed" ? (
                <p className="mt-1 text-[11px] text-red-300">{t.lineFailed(line.failure ?? "")}</p>
              ) : null}
              {/* «Исправить» — у нашего письма или ответа, 48 часов после отправки. */}
              {line.direction === "out" && (line.editable || line.edit) ? (
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
          ))}
          <div ref={bottom} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      )}

      {from ? (
        <div className="mt-3">
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
            maxLength={4000}
            placeholder={t.replyPlaceholder}
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
            {error ? <span className="text-xs text-red-300">{error}</span> : null}
          </div>
          <p className="mt-2 text-xs leading-snug text-faint">{t.replyHint(from)}</p>
        </div>
      ) : null}
    </>
  );
}
