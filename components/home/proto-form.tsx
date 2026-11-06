"use client";

import Link from "next/link";
import { useState } from "react";

import { readRef } from "@/lib/partners/client";
import { currentPage, readVisit } from "@/lib/visit/client";
import { goal } from "@/lib/visit/goal";
import type { HomeCopy } from "@/content/home-copy";
import type { Locale } from "@/lib/i18n";

import s from "./glass.module.css";

type State = "idle" | "sending" | "sent" | "failed";

/**
 * Заявка на прототип за 12 часов — та же дорога, что у формы в чате
 * (/api/lead): номер заявки, очередь тёплых лидов, источник «form».
 *
 * Сайт клиента уходит в текст заявки, а не в поле `website`: `website` у
 * /api/lead — ловушка для ботов, и заявка с ним молча выбрасывается.
 * Ловушка здесь тоже есть, своим скрытым полем.
 *
 * Условия макета — ссылкой под кнопкой, до отправки и после: человек просит
 * макет, и по правилу «Макеты и прототипы — всегда под защитой» ссылку на
 * условия он получает сразу, для ознакомления, без «согласен».
 */
export function ProtoForm({
  locale,
  copy,
  termsHref,
  bot,
  botUrl,
}: {
  locale: Locale;
  copy: HomeCopy["proto"]["form"];
  termsHref: string;
  bot: string;
  botUrl: string;
}) {
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const site = String(data.get("site") ?? "").trim().slice(0, 300);
    setState("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          contact: data.get("contact"),
          message: ["Прототип за 12 часов: заявка с главной.", site ? `Сайт: ${site}` : "Сайта не указал."].join(" "),
          website: data.get("url"),
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

  const [before, after] = copy.alt.split("{bot}");

  return (
    <form onSubmit={submit} className={`${s.form} ${s.glass}`} aria-labelledby="proto-form-title">
      <h3 id="proto-form-title" className={s.serif}>
        {copy.title}
      </h3>
      <p>{copy.text}</p>
      <input className={s.field} name="name" placeholder={copy.name} aria-label={copy.name} maxLength={120} autoComplete="name" />
      <input
        className={s.field}
        name="contact"
        required
        placeholder={copy.contact}
        aria-label={copy.contact}
        maxLength={200}
        autoComplete="tel"
      />
      <input className={s.field} name="site" placeholder={copy.site} aria-label={copy.site} maxLength={300} inputMode="url" />
      {/* Приманка для ботов: людям поле не видно и вне табуляции. */}
      <input className={s.trap} name="url" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className={`${s.btn} ${s.primary}`} disabled={state === "sending"}>
        {state === "sending" ? copy.sending : copy.send}
      </button>
      {state === "sent" ? (
        <p className={s.done} role="status">
          {copy.sent}
        </p>
      ) : null}
      {state === "failed" ? (
        <p className={s.fail} role="alert">
          {copy.failed}
        </p>
      ) : null}
      <p className={s.note}>
        {copy.terms} <Link href={termsHref}>{copy.termsLink}</Link>.
        <br />
        {before}
        <a href={botUrl} target="_blank" rel="noopener noreferrer">
          @{bot}
        </a>
        {after}
      </p>
    </form>
  );
}
