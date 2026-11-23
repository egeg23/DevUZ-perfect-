"use client";

import { useState } from "react";

import { LEADGEN_NICHES, LEADGEN_TARIFFS } from "@/content/leadgen";
import { readRef } from "@/lib/partners/client";
import { currentPage, readVisit } from "@/lib/visit/client";
import { goal } from "@/lib/visit/goal";

type State = "idle" | "sending" | "sent" | "failed";

/**
 * Заявка на лидогенерацию: та же /api/lead, что форма контактов, с
 * источником `leadgen` — в карточке лида видно, что пришли за потоком
 * клиентов, а не за сайтом. Ниша и тариф уходят текстом заявки.
 */
export function LeadgenForm() {
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const niche = String(data.get("niche") ?? "");
    const tariff = String(data.get("tariff") ?? "");
    const city = String(data.get("city") ?? "").trim();
    setState("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          company: data.get("company"),
          contact: data.get("contact"),
          message: ["Лидогенерация", niche && `ниша: ${niche}`, tariff && `тариф: ${tariff}`, city && `город: ${city}`]
            .filter(Boolean)
            .join(" · "),
          website: data.get("website"),
          source: "leadgen",
          locale: "ru",
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

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-green/30 bg-green/10 p-6 text-[1rem] leading-relaxed">
        Заявка у нас. Менеджер свяжется с вами в рабочее время, обсудим нишу, город и тестовый прогон.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" required maxLength={120} placeholder="Ваше имя" autoComplete="name" className={field} />
      <input name="company" maxLength={120} placeholder="Компания" autoComplete="organization" className={field} />
      <select name="niche" defaultValue="" className={field} aria-label="Ниша">
        <option value="">Ниша</option>
        {LEADGEN_NICHES.map((n) => (
          <option key={n.key} value={n.title}>
            {n.title}
          </option>
        ))}
        <option value="Другая">Другая</option>
      </select>
      <select name="tariff" defaultValue="" className={field} aria-label="Тариф">
        <option value="">Тариф</option>
        {LEADGEN_TARIFFS.map((t) => (
          <option key={t.key} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
      <input name="city" maxLength={80} placeholder="Город" autoComplete="address-level2" className={field} />
      <input name="contact" required maxLength={200} placeholder="Телефон или Telegram" autoComplete="tel" className={field} />
      {/* Ловушка для ботов: человек это поле не видит. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button
        type="submit"
        disabled={state === "sending"}
        className="box-cta rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink transition active:scale-[0.98] disabled:opacity-60 sm:col-span-2"
      >
        {state === "sending" ? "Отправляем…" : "Обсудить тестовый прогон"}
      </button>
      {state === "failed" ? (
        <p role="alert" className="text-[0.85rem] text-red-300 sm:col-span-2">
          Не отправилось. Попробуйте ещё раз или напишите нам в Telegram.
        </p>
      ) : null}
    </form>
  );
}
