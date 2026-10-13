"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { hqTaskAction, type TaskState } from "@/app/admin/hq/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { hqTaskDict } from "@/content/admin-panel/hq-actions";

/**
 * Быстрая задача на «Главной»: кому — чипами (несколько сразу), что
 * сделать, быстрый срок. Ставится тем же createTasks, что и на «Лидах»:
 * бот пишет исполнителю, как обычно.
 */

export const CHIP =
  "inline-flex min-h-11 cursor-pointer select-none items-center rounded-full border px-4 text-sm transition " +
  "has-[:checked]:border-green/50 has-[:checked]:bg-green/10 has-[:checked]:text-green " +
  "border-line bg-surface-2/60 text-muted hover:text-text has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green/40";

export const FIELD =
  "w-full rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

export const PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-2xl bg-green px-5 text-sm font-semibold text-ink transition hover:bg-green-dim disabled:opacity-60";

export function HqTask({ people, preselect }: { people: { id: string; name: string }[]; preselect?: string | null }) {
  const t = usePanelDict(hqTaskDict);
  const [state, action, pending] = useActionState<TaskState, FormData>(hqTaskAction, null);
  const [due, setDue] = useState<"today" | "tomorrow" | "custom">("today");
  const form = useRef<HTMLFormElement>(null);
  const done = state?.ok ? state.at : 0;
  useEffect(() => {
    if (done) form.current?.reset();
  }, [done]);

  const message = !state
    ? null
    : state.ok
      ? state.later
        ? t.doneLater(state.n)
        : t.done(state.n)
      : {
          assignee: t.errAssignee,
          title: t.errTitle,
          past: t.errPast,
          far: t.errFar,
          failed: t.errFailed,
          forbidden: t.errForbidden,
        }[state.error];

  return (
    <form ref={form} action={action} className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-wider text-faint">{t.who}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {people.map((p) => (
            <label key={p.id} className={CHIP}>
              <input type="checkbox" name="assignee" value={p.id} defaultChecked={p.id === preselect} className="sr-only" />
              {p.name}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">{t.whoHint}</p>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">{t.what}</span>
        <input name="title" required maxLength={200} placeholder={t.whatPlaceholder} className={FIELD} autoComplete="off" />
      </label>

      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-wider text-faint">{t.due}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["today", t.dueToday],
              ["tomorrow", t.dueTomorrow],
              ["custom", t.dueCustom],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={CHIP}>
              <input
                type="radio"
                name="due"
                value={value}
                checked={due === value}
                onChange={() => setDue(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {due === "custom" ? <input type="datetime-local" name="due_at" required className={`${FIELD} mt-3`} /> : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={PRIMARY}>
          {pending ? t.sending : t.submit}
        </button>
        {message ? (
          <p role="status" className={`text-sm ${state?.ok ? "text-green" : "text-gold"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
