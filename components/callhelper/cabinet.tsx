"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CALLHELPER_CABINET as T } from "@/content/callhelper-page";

/**
 * Кабинет колл-центра DevUz CallHelper: вход по ключу, остаток минут,
 * сценарии и итоги звонков. Ходит в тот же API v1, что расширение
 * (lib/callhelper/api.ts); своих прав у страницы нет. Ключ лежит в памяти
 * вкладки (sessionStorage) и пропадает, когда её закрыли.
 */

const API = "/api/callhelper/v1";
const STORE = "ch-cabinet-key";

type Form = { product: string; goal: string; stages: string; objections: string; must: string; banned: string };
type Script = { id: string; name: string; form: Form };
type Summary = { seconds: number; stages: { name: string; done: boolean }[]; stagesDone: number; objections: string[]; banned: string[]; recordNotice: boolean };
type Call = { id: string; operator: string | null; started_at: string; ended_at: string | null; seconds: number | null; summary: Summary | null };
type Me = {
  org: { name: string; plan: keyof typeof T.access.plan; operators: number };
  access: { ok: true; minutes_left: number | null; hours_left: number | null } | { ok: false; reason: string };
  used_minutes: number;
  limits: { scripts: number };
};
type ErrorKey = keyof typeof T.errors;

const EMPTY: Form = { product: "", goal: "", stages: "", objections: "", must: "", banned: "" };
const FIELDS = ["product", "goal", "stages", "objections", "must", "banned"] as const;
const field = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-[0.95rem] text-white placeholder:text-white/40 focus:border-green/60 focus:outline-none";
const card = "rounded-2xl border border-line bg-surface/60 p-5";
const h2 = "font-display text-[1.35rem] font-bold text-white";
const ghost = "rounded-full border border-white/20 px-4 py-2 text-[0.86rem] font-semibold text-white hover:border-white/50 disabled:opacity-50";
const cta = "box-cta rounded-full px-5 py-2.5 text-[0.9rem] font-semibold text-ink disabled:opacity-60";

const errorKey = (code: string | undefined): ErrorKey => (code && code in T.errors ? (code as ErrorKey) : "failed");
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const when = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function CallHelperCabinet({ productHref }: { productHref: string }) {
  const [key, setKey] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<{ id: string | null; name: string; form: Form } | null>(null);

  const api = useCallback(async (k: string, method: string, path: string, body?: unknown) => {
    const response = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${k}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(String(json.error ?? "failed"));
    return json;
  }, []);

  const load = useCallback(
    async (k: string) => {
      setBusy(true);
      setError(null);
      try {
        const [m, s, c] = await Promise.all([api(k, "GET", "/me"), api(k, "GET", "/scripts"), api(k, "GET", "/calls?limit=100")]);
        setMe(m as unknown as Me);
        setScripts((s.scripts as Script[]) ?? []);
        setCalls((c.calls as Call[]) ?? []);
        setKey(k);
        try {
          sessionStorage.setItem(STORE, k);
        } catch {
          /* вкладка без памяти: кабинет работает до перезагрузки */
        }
      } catch (e) {
        setMe(null);
        setError(errorKey((e as Error).message));
      } finally {
        setBusy(false);
      }
    },
    [api],
  );

  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(STORE) ?? "";
    } catch {
      saved = "";
    }
    if (saved) void load(saved);
  }, [load]);

  function exit() {
    try {
      sessionStorage.removeItem(STORE);
    } catch {
      /* нечего чистить */
    }
    setKey("");
    setMe(null);
    setScripts([]);
    setCalls([]);
    setEdit(null);
  }

  async function act(run: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await run();
      await load(key);
      setEdit(null);
    } catch (e) {
      setError(errorKey((e as Error).message));
      setBusy(false);
    }
  }

  if (!me) {
    return (
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const k = String(new FormData(event.currentTarget).get("key") ?? "").trim();
          if (k) void load(k);
        }}
      >
        <input className={field} name="key" type="password" required autoComplete="off" placeholder={T.key} aria-label={T.key} />
        <p className="text-[0.82rem] leading-relaxed text-white/50">{T.keyHint}</p>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className={cta}>
            {T.enter}
          </button>
          <Link href={`${productHref}#start`} className="text-[0.9rem] text-green underline-offset-4 hover:underline">
            {T.noKey}
          </Link>
        </div>
        {error ? (
          <p role="alert" className="text-[0.9rem] text-[#ff9b8a]">
            {T.errors[error]}
          </p>
        ) : null}
      </form>
    );
  }

  const done = calls.filter((c) => c.summary);
  const byOperator = [...new Set(done.map((c) => c.operator || "без имени"))].map((name) => {
    const own = done.filter((c) => (c.operator || "без имени") === name);
    return {
      name,
      count: own.length,
      minutes: Math.round(own.reduce((sum, c) => sum + (c.summary?.seconds ?? 0), 0) / 60),
      stages: (own.reduce((sum, c) => sum + (c.summary?.stagesDone ?? 0), 0) / own.length).toFixed(1),
    };
  });
  const over = me.access.ok ? null : (T.access.over as Record<string, string>)[me.access.reason] ?? T.errors.failed;

  return (
    <div className="grid gap-10">
      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={h2}>{me.org.name}</h2>
            <p className="mt-1 text-[0.9rem] text-white/60">
              {T.access.title}: {T.access.plan[me.org.plan] ?? me.org.plan}
            </p>
          </div>
          <button type="button" onClick={exit} className={ghost}>
            {T.exit}
          </button>
        </div>
        {over ? (
          <p role="alert" className="mt-4 text-[0.95rem] text-[#ff9b8a]">
            {over}
          </p>
        ) : null}
        <dl className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            [T.access.seats, String(me.org.operators)],
            [T.access.used, String(me.used_minutes)],
            ...(me.access.ok && me.access.minutes_left !== null ? [[T.access.left, String(me.access.minutes_left)]] : []),
            ...(me.access.ok && me.org.plan === "trial" && me.access.hours_left !== null ? [[T.access.hours, String(me.access.hours_left)]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.78rem] uppercase tracking-[0.14em] text-white/45">{label}</dt>
              <dd className="mt-1 font-display text-[1.6rem] font-extrabold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        {me.org.plan === "trial" && me.used_minutes === 0 && !calls.length ? <p className="mt-4 text-[0.88rem] text-white/55">{T.access.notStarted}</p> : null}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={h2}>{T.scripts.title}</h2>
          {!edit && scripts.length < me.limits.scripts ? (
            <button type="button" className={ghost} onClick={() => setEdit({ id: null, name: "", form: EMPTY })}>
              {T.scripts.add}
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-[0.9rem] text-[#ff9b8a]">
            {T.errors[error]}
          </p>
        ) : null}
        {edit ? (
          <form
            className={`${card} mt-4 grid gap-3`}
            onSubmit={(event) => {
              event.preventDefault();
              void act(() => api(key, "PUT", edit.id ? `/scripts/${edit.id}` : "/scripts", { name: edit.name, form: edit.form }));
            }}
          >
            <input className={field} required minLength={2} maxLength={120} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder={T.scripts.name} aria-label={T.scripts.name} />
            {FIELDS.map((f) => (
              <label key={f} className="grid gap-1.5 text-[0.84rem] text-white/60">
                {T.scripts.fields[f]}
                <textarea
                  className={`${field} min-h-[5.5rem] font-mono text-[0.86rem]`}
                  rows={f === "stages" || f === "objections" ? 6 : 2}
                  value={edit.form[f]}
                  onChange={(e) => setEdit({ ...edit, form: { ...edit.form, [f]: e.target.value } })}
                />
              </label>
            ))}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className={cta}>
                {T.scripts.save}
              </button>
              <button
                type="button"
                disabled={busy}
                className={ghost}
                onClick={async () => {
                  try {
                    const example = (await api(key, "GET", "/scripts/example")) as { form?: Form };
                    if (example.form) setEdit({ ...edit, name: edit.name || "Мой сценарий", form: example.form });
                  } catch {
                    setError("failed");
                  }
                }}
              >
                {T.scripts.fromExample}
              </button>
              <button type="button" className={ghost} onClick={() => setEdit(null)}>
                {T.scripts.cancel}
              </button>
            </div>
          </form>
        ) : scripts.length ? (
          <ul className="mt-4 grid gap-3">
            {scripts.map((s) => (
              <li key={s.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
                <span>
                  <b className="text-white">{s.name}</b>
                  <span className="mt-1 block text-[0.88rem] text-white/60">{s.form.goal || s.form.product}</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" className={ghost} onClick={() => setEdit({ id: s.id, name: s.name, form: { ...EMPTY, ...s.form } })}>
                    {T.scripts.edit}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={ghost}
                    onClick={() => {
                      if (window.confirm(T.scripts.removeAsk)) void act(() => api(key, "DELETE", `/scripts/${s.id}`));
                    }}
                  >
                    {T.scripts.remove}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[0.95rem] text-white/65">{T.scripts.empty}</p>
        )}
      </section>

      <section>
        <h2 className={h2}>{T.calls.title}</h2>
        {!calls.length ? (
          <p className="mt-4 text-[0.95rem] text-white/65">{T.calls.empty}</p>
        ) : (
          <>
            {byOperator.length ? (
              <ul className="mt-4 grid gap-3 md:grid-cols-3" aria-label={T.calls.byOperator}>
                {byOperator.map((o) => (
                  <li key={o.name} className={card}>
                    <b className="text-white">{o.name}</b>
                    <p className="mt-1 text-[0.88rem] text-white/65">
                      {o.count} {T.calls.callsCount} · {o.minutes} {T.calls.minutes} · {o.stages} {T.calls.avgStages}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-4 grid gap-2.5">
              {calls.map((c) => {
                const s = c.summary;
                const flags = s ? [...(s.recordNotice ? [] : [T.calls.noNotice]), ...(s.banned.length ? [`${T.calls.banned}: ${s.banned.join(", ")}`] : [])] : [];
                return (
                  <li key={c.id} className={`${card} grid gap-1.5 text-[0.9rem] text-white/75 md:grid-cols-[9rem_1fr_5rem] md:items-start`}>
                    <span className="text-white/55">{when(c.started_at)}</span>
                    <span>
                      <b className="text-white">{c.operator || "без имени"}</b>
                      {s ? (
                        <>
                          <span className="mt-1 block">
                            {T.calls.stages}: {s.stagesDone} из {s.stages.length}
                            {s.objections.length ? ` · ${T.calls.objections}: ${s.objections.join(", ")}` : ""}
                          </span>
                          {flags.length ? <span className="mt-1 block text-[#ffb59f]">{flags.join(" · ")}</span> : null}
                        </>
                      ) : null}
                    </span>
                    <span className="font-mono text-white/70 md:text-right">{s ? mmss(s.seconds) : T.calls.live}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
