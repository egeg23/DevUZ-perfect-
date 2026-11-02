"use client";

import Link from "next/link";
import { useState } from "react";

import type { Dictionary } from "@/content/dictionaries";
import { localeHref, type Locale } from "@/lib/i18n";
import { readRef } from "@/lib/partners/client";
import { currentPage, readVisit } from "@/lib/visit/client";
import { goal } from "@/lib/visit/goal";

type State = "idle" | "sending" | "sent" | "failed";

/**
 * Лист ожидания DevUz Box: имя, компания, телефон или Telegram.
 *
 * Та же заявка, что форма в «Контактах» (app/api/lead): лид уходит команде
 * в Telegram и в панель, только с источником `box`, чтобы было видно, что
 * человек пришёл с промо-страницы коробки, а не за сайтом. Квалификации
 * нет, как и у обычной формы: менеджер начинает разговор с вопросов.
 */
export function BoxWaitlist({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, setState] = useState<State>("idle");
  const copy = dict.box.waitlist;

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
          company: data.get("company"),
          contact: data.get("contact"),
          message: `${dict.box.waitlist.kicker}: ${dict.box.hero.badge}`,
          website: data.get("website"),
          source: "box",
          locale,
          ref: readRef(),
          page: currentPage(),
          from: readVisit(),
        }),
      });
      if (!response.ok) throw new Error("failed");
      goal("lead_form");
      setState("sent");
      form.reset();
    } catch {
      setState("failed");
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-ink/70 px-4 py-3 text-[0.95rem] text-text outline-none transition-colors placeholder:text-faint focus:border-green/50";

  return (
    <form onSubmit={submit} className="space-y-3" data-box-waitlist>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" placeholder={copy.name} className={field} maxLength={120} autoComplete="name" />
        <input name="company" placeholder={copy.company} className={field} maxLength={120} autoComplete="organization" />
      </div>
      <input name="contact" required placeholder={copy.contact} className={field} maxLength={200} autoComplete="tel" />

      {/* Приманка для ботов: людям поле не видно и вне табуляции. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

      <button
        type="submit"
        disabled={state === "sending"}
        className="box-cta w-full rounded-xl px-6 py-3.5 font-semibold text-ink transition active:scale-[0.99] disabled:opacity-60"
      >
        {state === "sending" ? copy.sending : copy.submit}
      </button>

      {state === "sent" ? (
        <p className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-[0.88rem] text-green">{copy.sent}</p>
      ) : null}
      {state === "failed" ? (
        <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-[0.88rem] text-gold">{copy.failed}</p>
      ) : null}

      <p className="text-[0.72rem] leading-snug text-faint">
        {dict.contact.consent}:{" "}
        <Link href={localeHref(locale, "privacy")} className="underline hover:text-muted">
          {dict.contact.consentLink}
        </Link>
        .
      </p>
    </form>
  );
}
