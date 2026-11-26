"use client";

import Link from "next/link";
import { useState } from "react";

import { CALLHELPER_PAGE } from "@/content/callhelper-page";
import { goal } from "@/lib/visit/goal";

const S = CALLHELPER_PAGE.signup;
type ErrorKey = keyof typeof S.errors;

const field = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-[0.95rem] text-white placeholder:text-white/40 focus:border-green/60 focus:outline-none";

/**
 * Регистрация колл-центра на странице CallHelper: три поля → ссылка в бота
 * студии, где человек подтверждает номер и получает ключ
 * (lib/callhelper/signup.ts). Ключа на этой странице нет.
 */
export function CallHelperSignup({ offerHref }: { offerHref: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [bot, setBot] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/callhelper/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: data.get("company"),
          inn: data.get("inn"),
          name: data.get("name"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { bot?: string; error?: string };
      if (!response.ok || !body.bot) {
        setError(body.error && body.error in S.errors ? (body.error as ErrorKey) : "failed");
        return;
      }
      goal("lead_form");
      setBot(body.bot);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  if (bot) {
    return (
      <div role="status" className="grid gap-4">
        <p className="text-[1rem] leading-relaxed text-white/85">{S.next}</p>
        <a href={bot} target="_blank" rel="noopener" className="box-cta inline-flex w-fit items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink">
          {S.open}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input className={field} name="company" required minLength={2} maxLength={160} placeholder={S.company} aria-label={S.company} autoComplete="organization" />
      <div>
        <input className={field} name="inn" required inputMode="numeric" pattern="[0-9 ]{10,14}" maxLength={14} placeholder={S.inn} aria-label={S.inn} />
        <p className="mt-1.5 text-[0.8rem] text-white/50">{S.innHint}</p>
      </div>
      <input className={field} name="name" maxLength={80} placeholder={S.name} aria-label={S.name} autoComplete="name" />
      {/* Ловушка для ботов: человек это поле не видит. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <label className="flex items-start gap-3 text-[0.86rem] leading-snug text-white/75">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 flex-none accent-[#22f0a0]" />
        <span>
          {S.consent}.{" "}
          <Link href={offerHref} target="_blank" className="text-green underline-offset-4 hover:underline">
            Оферта
          </Link>
        </span>
      </label>
      <button type="submit" disabled={busy} className="box-cta mt-1 inline-flex w-fit items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink disabled:opacity-60">
        {busy ? S.sending : S.button}
      </button>
      {error ? (
        <p role="alert" className="text-[0.9rem] text-[#ff9b8a]">
          {S.errors[error]}
        </p>
      ) : null}
    </form>
  );
}
