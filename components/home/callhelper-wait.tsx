"use client";

import Link from "next/link";
import { useState } from "react";

import { CALLHELPER_WAIT as W } from "@/content/callhelper";
import { goal } from "@/lib/visit/goal";

import g from "./glass.module.css";
import s from "./callhelper-block.module.css";

type State = "idle" | "sending" | "sent" | "bad" | "failed";

/**
 * Лист ожидания DevUz CallHelper — форма в блоке на главной. Заявка уходит
 * в /api/callhelper/wait, а не в общую форму заявок: это не лид, её видит только
 * владелец (lib/callhelper/waitlist.ts).
 */
export function CallHelperWait({ privacyHref }: { privacyHref: string }) {
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    try {
      const response = await fetch("/api/callhelper/wait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          company: data.get("company"),
          contact: data.get("contact"),
          operators: data.get("operators"),
          comment: data.get("comment"),
          website: data.get("website"),
        }),
      });
      if (response.status === 400) {
        setState("bad");
        return;
      }
      if (!response.ok) throw new Error("failed");
      goal("lead_form");
      setState("sent");
      form.reset();
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <p className={g.done} role="status">
        {W.sent}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={s.wait} aria-labelledby="callhelper-wait-title">
      <h3 id="callhelper-wait-title" className={s.h3}>
        {W.title}
      </h3>
      <p className={s.small}>{W.lead}</p>
      <div className={s.waitGrid}>
        <input className={g.field} name="name" placeholder={W.name} aria-label={W.name} maxLength={120} autoComplete="name" />
        <input className={g.field} name="company" placeholder={W.company} aria-label={W.company} maxLength={120} autoComplete="organization" />
        <input className={g.field} name="contact" required placeholder={W.contact} aria-label={W.contact} maxLength={200} autoComplete="tel" />
        <input className={g.field} name="operators" placeholder={W.operators} aria-label={W.operators} maxLength={6} inputMode="numeric" />
      </div>
      <input className={g.field} name="comment" placeholder={W.comment} aria-label={W.comment} maxLength={600} />
      {/* Ловушка для ботов: человек это поле не видит. */}
      <input className={g.trap} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className={`${g.btn} ${g.primary} ${s.waitBtn}`} disabled={state === "sending"}>
        {state === "sending" ? W.sending : W.button}
      </button>
      {state === "bad" ? (
        <p className={g.fail} role="alert">
          {W.bad}
        </p>
      ) : null}
      {state === "failed" ? (
        <p className={g.fail} role="alert">
          {W.failed}
        </p>
      ) : null}
      <p className={g.note}>
        {W.privacy} <Link href={privacyHref}>{W.privacyLink}</Link>.
      </p>
    </form>
  );
}
