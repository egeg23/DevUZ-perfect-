"use client";

import Link from "next/link";
import { useState } from "react";

import type { Dictionary } from "@/content/dictionaries";
import { localeHref, type Locale } from "@/lib/i18n";

type State = "idle" | "sending" | "sent" | "failed";

/**
 * Запасная форма для тех, кто не хочет разговаривать с ботом.
 *
 * Квалификации здесь нет — сервер честно помечает такой лид как
 * неквалифицированный, чтобы менеджер начал звонок с вопросов BANT, а не с
 * ложной уверенности.
 */
export function LeadForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          contact: data.get("contact"),
          message: data.get("message"),
          website: data.get("website"),
          locale,
        }),
      });
      if (!response.ok) throw new Error("failed");
      setState("sent");
      form.reset();
    } catch {
      setState("failed");
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-ink px-4 py-3 text-[0.92rem] text-text outline-none transition-colors placeholder:text-faint focus:border-green/50";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="name" placeholder={dict.contact.name} className={field} maxLength={120} />
      <input
        name="contact"
        required
        placeholder={dict.contact.contactField}
        className={field}
        maxLength={200}
      />
      <textarea
        name="message"
        rows={3}
        placeholder={dict.contact.message}
        className={`${field} resize-none`}
        maxLength={1500}
      />

      {/* Приманка для ботов: людям поле не видно и вне табуляции. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-xl bg-green px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60"
      >
        {state === "sending" ? dict.contact.sending : dict.contact.submit}
      </button>

      {state === "sent" ? (
        <p className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-[0.85rem] text-green">
          {dict.contact.sent}
        </p>
      ) : null}
      {state === "failed" ? (
        <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-[0.85rem] text-gold">
          {dict.contact.failed}
        </p>
      ) : null}

      <p className="text-[0.7rem] leading-snug text-faint">
        {dict.contact.consent} —{" "}
        <Link href={localeHref(locale, "privacy")} className="underline hover:text-muted">
          {dict.contact.consentLink}
        </Link>
        .
      </p>
    </form>
  );
}
