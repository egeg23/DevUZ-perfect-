"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { editSentAction } from "@/app/admin/prospect/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { editSentDict, problemDict } from "@/content/admin-panel/prospect";
import type { EditState } from "@/lib/admin/outreach-edit";
import { problemText } from "@/lib/admin/problem-text";

/**
 * Кнопка «Исправить» у отправленного письма или ответа
 * (lib/admin/outreach-edit-request.ts).
 *
 * Владелец, 12.10.2026: «Оптимизация скрипта, чтобы манагеры редачили
 * касания». Ушедшее правит скаут с того же рабочего аккаунта — поэтому после
 * нажатия видно «ждёт бота», а потом «Исправлено» или «не вышло» с причиной.
 * Письмо, которое ещё ждёт ответа клиента, правится сразу.
 */
export function EditSent({
  prospectId,
  lineId = null,
  leadId = null,
  body,
  pending = false,
  editable = true,
  last = null,
}: {
  prospectId: string;
  /** Реплика ленты; null — письмо касания. */
  lineId?: string | null;
  /** Из карточки лида: право по лиду и обновление его страницы. */
  leadId?: string | null;
  body: string;
  /** Письмо ещё не ушло (ждёт ответа на приветствие) — другая подсказка. */
  pending?: boolean;
  /** Кнопку показывать: окно 48 часов не прошло. Статус прошлой правки виден и без неё. */
  editable?: boolean;
  last?: { state: EditState; failure: string | null } | null;
}) {
  const t = usePanelDict(editSentDict);
  const tp = usePanelDict(problemDict);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{ state: EditState; failure: string | null } | null>(null);
  const [busy, start] = useTransition();

  // Только что нажатое важнее того, что было на странице до нажатия.
  const shown = state ?? last;

  const save = () => {
    start(async () => {
      const result = await editSentAction({ prospectId, lineId, leadId, body: text });
      if (!result.ok) {
        const problems = (result.problems ?? []).map((p) => problemText(p, tp));
        setError(result.reason === "problems" && problems.length ? `${t.err_problems} ${problems.join(" ")}` : t[`err_${result.reason}`]);
        return;
      }
      setError(null);
      setOpen(false);
      setState({ state: result.state, failure: null });
      router.refresh();
    });
  };

  return (
    <div className="mt-2">
      {shown ? (
        <p
          className={`text-[11px] ${
            shown.state === "failed" ? "text-red-300" : shown.state === "done" ? "text-green" : "text-gold"
          }`}
        >
          {shown.state === "failed" ? t.stateFailed(shown.failure ?? "") : shown.state === "done" ? t.stateDone : t.stateWaiting}
        </p>
      ) : null}
      {editable && !open ? (
        <button
          type="button"
          onClick={() => {
            setText(body);
            setOpen(true);
          }}
          className="mt-1 rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:text-text"
        >
          {t.edit}
        </button>
      ) : null}
      {editable && open ? (
        <div className="mt-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={4000}
            className="block w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text focus:border-green/60 focus:outline-none"
          />
          <p className="mt-1 text-xs leading-snug text-faint">{pending ? t.hintPending : t.hintSent}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || !text.trim()}
              className="rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-green-dim disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? t.saving : t.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="text-xs text-faint hover:text-text"
            >
              {t.cancel}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
