"use client";

import { useState } from "react";

import { orderCopy } from "@/content/order-form";
import { t, type Locale } from "@/lib/i18n";

const FIELD =
  "mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

/**
 * Заявка на счёт.
 *
 * Рядом с кнопкой «обсудить покупку», а не вместо неё: часть покупателей
 * хочет сначала поговорить, часть — сразу получить счёт, и заставлять
 * вторых идти через чат значит терять тех, кто уже всё решил.
 *
 * Оплаты здесь нет и не появится, пока продаём юрлицам по счёту. Форма
 * ничего не списывает и не принимает платёжных данных — она собирает то,
 * из чего выставляют счёт.
 */
export function OrderForm({
  productSlug,
  locale,
}: {
  productSlug: string;
  locale: Locale;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [requestNo, setRequestNo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const c = (key: keyof typeof orderCopy) => t(orderCopy[key], locale);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const required = ["company", "contactName", "contact"];
    if (required.some((name) => !String(form.get(name) ?? "").trim())) {
      setState("error");
      setMessage(c("required"));
      return;
    }

    setState("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: productSlug,
          locale,
          company: form.get("company"),
          taxId: form.get("taxId"),
          country: form.get("country"),
          contactName: form.get("contactName"),
          contact: form.get("contact"),
          payment: form.get("payment"),
          comment: form.get("comment"),
          website: form.get("website"),
        }),
      });

      const data = (await response.json()) as { ok?: boolean; requestNo?: string };
      if (!response.ok || !data.ok) throw new Error("failed");

      setRequestNo(data.requestNo ?? null);
      setState("done");
    } catch {
      setState("error");
      setMessage(c("error"));
    }
  }

  if (state === "done") {
    return (
      <div className="mt-10 rounded-2xl border border-green/30 bg-green/5 px-6 py-6">
        <p className="text-lg font-semibold text-green">{c("done")}</p>
        {requestNo ? (
          <p className="mt-2 font-mono text-2xl">{requestNo}</p>
        ) : null}
        <p className="mt-2 max-w-xl text-sm text-muted">{c("doneHint")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 max-w-2xl">
      <h3 className="text-xl font-bold">{c("heading")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{c("intro")}</p>

      {/* Ловушка для ботов: скрыта от людей и от программ чтения с экрана. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs uppercase tracking-wider text-faint">{c("company")}</span>
          <input name="company" required maxLength={200} className={FIELD} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-faint">{c("taxId")}</span>
          <input name="taxId" maxLength={60} className={FIELD} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-faint">{c("country")}</span>
          <input name="country" maxLength={80} className={FIELD} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-faint">{c("contactName")}</span>
          <input name="contactName" required maxLength={120} className={FIELD} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-faint">{c("contact")}</span>
          <input
            name="contact"
            required
            maxLength={200}
            placeholder={c("contactHint")}
            className={FIELD}
          />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="text-xs uppercase tracking-wider text-faint">{c("payment")}</legend>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-3">
              <input type="radio" name="payment" value="bank" defaultChecked className="accent-green" />
              {c("paymentBank")}
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="payment" value="manager" className="accent-green" />
              {c("paymentManager")}
            </label>
          </div>
        </fieldset>

        <label className="block sm:col-span-2">
          <span className="text-xs uppercase tracking-wider text-faint">{c("comment")}</span>
          <textarea name="comment" rows={3} maxLength={2000} className={`${FIELD} resize-y`} />
        </label>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60"
      >
        {state === "sending" ? c("sending") : c("submit")}
      </button>

      <p className="mt-4 max-w-xl text-xs leading-relaxed text-faint">{c("legal")}</p>
    </form>
  );
}
