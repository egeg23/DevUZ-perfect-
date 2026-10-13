"use client";

import { useActionState, useEffect, useState } from "react";

import { broadcastAction, type BroadcastState } from "@/app/admin/hq/actions";
import { CHIP, FIELD, PRIMARY } from "@/components/admin/hq-task";
import { usePanelDict } from "@/components/admin/panel-locale";
import { broadcastDict } from "@/content/admin-panel/hq-actions";
import { reachable, recipientsOf, type Audience, type BroadcastPerson } from "@/lib/admin/broadcast";
import type { Role } from "@/lib/admin/roles";

/**
 * Рассылка в бот команде: текст, кому, когда — потом предпросмотр с числом
 * получателей и только тогда «Отправить». Число из предпросмотра уходит на
 * сервер (`expected`): если состав за это время изменился, сервер не
 * отправит молча другому числу людей.
 */

const ROLE_KEYS: readonly [Role, "roleAdmin" | "roleHead" | "roleManager"][] = [
  ["admin", "roleAdmin"],
  ["head", "roleHead"],
  ["manager", "roleManager"],
];

export function HqBroadcast({ people, selfId }: { people: BroadcastPerson[]; selfId: string }) {
  const t = usePanelDict(broadcastDict);
  const [state, action, pending] = useActionState<BroadcastState, FormData>(broadcastAction, null);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Audience["kind"]>("all");
  const [roles, setRoles] = useState<Role[]>(["manager"]);
  const [picked, setPicked] = useState<string[]>([]);
  const [when, setWhen] = useState<"now" | "at">("now");
  const [sendAt, setSendAt] = useState("");
  const [night, setNight] = useState(false);
  const [preview, setPreview] = useState(false);

  const done = state?.ok ? state.at : 0;
  useEffect(() => {
    if (!done) return;
    setText("");
    setPreview(false);
  }, [done]);

  const audience: Audience = kind === "all" ? { kind } : kind === "roles" ? { kind, roles } : { kind, ids: picked };
  const listed = recipientsOf(audience, people, selfId);
  const reach = reachable(listed);
  const missing = listed.filter((p) => !p.telegram);
  const others = people.filter((p) => p.id !== selfId);
  const ready = text.trim().length > 0 && reach.length > 0 && (when === "now" || Boolean(sendAt));
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const message = !state
    ? null
    : state.ok
      ? state.night
        ? t.nightSaved(state.n)
        : state.scheduled
          ? t.scheduled(state.n)
          : t.sent(state.n)
      : {
          forbidden: t.errForbidden,
          empty: t.errEmpty,
          long: t.errLong,
          audience: t.errAudience,
          bad: t.errWhen,
          past: t.errPast,
          far: t.errFar,
          nobody: t.errNobody,
          changed: t.errChanged,
          offline: t.errFailed,
          failed: t.errFailed,
        }[state.error];

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Всё, что выбрано, уходит на сервер и из предпросмотра: поля скрытые. */}
      <input type="hidden" name="text" value={text} />
      <input type="hidden" name="audience" value={kind} />
      {kind === "roles" ? roles.map((r) => <input key={r} type="hidden" name="role" value={r} />) : null}
      {kind === "pick" ? picked.map((id) => <input key={id} type="hidden" name="person" value={id} />) : null}
      <input type="hidden" name="when" value={when} />
      <input type="hidden" name="send_at" value={sendAt} />
      {night ? <input type="hidden" name="night" value="on" /> : null}
      <input type="hidden" name="expected" value={reach.length} />

      {!preview ? (
        <>
          <p className="text-sm text-muted">{t.intro}</p>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-faint">{t.text}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t.textPlaceholder}
              className={`${FIELD} resize-y`}
            />
          </label>

          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wider text-faint">{t.audience}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["all", t.audAll],
                  ["roles", t.audRoles],
                  ["pick", t.audPick],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={CHIP}>
                  <input type="radio" name="kind_ui" checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {kind === "roles" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {ROLE_KEYS.map(([role, key]) => (
                  <label key={role} className={CHIP}>
                    <input type="checkbox" checked={roles.includes(role)} onChange={() => setRoles(toggle(roles, role))} className="sr-only" />
                    {t[key]}
                  </label>
                ))}
              </div>
            ) : null}
            {kind === "pick" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {others.map((p) => (
                  <label key={p.id} className={CHIP}>
                    <input type="checkbox" checked={picked.includes(p.id)} onChange={() => setPicked(toggle(picked, p.id))} className="sr-only" />
                    {p.display_name}
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wider text-faint">{t.when}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["now", t.whenNow],
                  ["at", t.whenAt],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={CHIP}>
                  <input type="radio" name="when_ui" checked={when === value} onChange={() => setWhen(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {when === "at" ? (
              <>
                <input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className={`${FIELD} mt-3`} />
                <p className="mt-2 text-xs text-faint">{t.whenHint}</p>
              </>
            ) : null}
            <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-muted">
              <input type="checkbox" checked={night} onChange={(e) => setNight(e.target.checked)} className="h-5 w-5 accent-green" />
              {t.night}
            </label>
            <p className="text-xs text-faint">{t.nightHint}</p>
          </fieldset>

          <div>
            <button type="button" disabled={!ready} onClick={() => setPreview(true)} className={PRIMARY}>
              {t.preview}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">{t.previewTitle}</p>
          {/* Пузырь как в Telegram: так сообщение и придёт. */}
          <div className="max-w-md rounded-3xl rounded-bl-md bg-surface-2 px-4 py-3 text-sm leading-relaxed text-text">
            <p className="font-semibold">📣 …</p>
            <p className="mt-2 whitespace-pre-wrap break-words">{text.trim()}</p>
          </div>
          <div className="rounded-2xl bg-green/5 px-4 py-3 text-sm">
            <p className="font-semibold text-green">{t.willGet(reach.length)}</p>
            <p className="mt-1 text-muted">{reach.map((p) => p.display_name).join(", ")}</p>
            {missing.length ? <p className="mt-1 text-gold">{t.noTelegram(missing.map((p) => p.display_name).join(", "))}</p> : null}
            <p className="mt-1 text-xs text-faint">{t.notYou}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending || !ready} className={PRIMARY}>
              {pending ? t.sending : when === "at" ? t.schedule(sendAt.replace("T", " ")) : t.sendNow(reach.length)}
            </button>
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="inline-flex min-h-11 items-center rounded-2xl bg-surface-2 px-5 text-sm text-text transition hover:bg-line"
            >
              {t.back}
            </button>
          </div>
        </>
      )}

      {message ? (
        <p role="status" className={`text-sm ${state?.ok ? "text-green" : "text-gold"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
