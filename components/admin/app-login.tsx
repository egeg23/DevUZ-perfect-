"use client";

import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";

import { signInWithCode, startAppLogin, type AppLoginState } from "@/app/admin/login/actions";
import { loginDict } from "@/content/admin-panel/login";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

/** Открыта ли панель как установленное приложение (иконка на экране). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Вход в установленном приложении — кодом из бота (lib/admin/app-login.ts).
 *
 * В обычном браузере остаётся вход по ссылке (`children`): его не трогаем.
 * Приложение узнаём по display-mode standalone; `forced` — ссылка «Войти
 * кодом из бота» под обычным входом, на случай, если телефон приложение не
 * распознал.
 */
export function AppLogin({ locale, forced, children }: { locale: PanelLocale; forced: boolean; children: ReactNode }) {
  const t = pick(loginDict, locale);
  const [app, setApp] = useState(forced);
  const [asked, setAsked] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [state, submit, checking] = useActionState<AppLoginState, FormData>(signInWithCode, { error: null });

  useEffect(() => {
    if (isStandalone()) setApp(true);
  }, []);

  if (!app) {
    return (
      <>
        {children}
        <a href="/admin/login?app=1" className="mt-6 block text-xs text-faint transition hover:text-green">
          {t.appUseCode}
        </a>
      </>
    );
  }

  const getCode = () =>
    start(async () => {
      setStartError(null);
      const result = await startAppLogin();
      if ("link" in result) {
        setAsked(true);
        window.location.href = result.link;
      } else {
        setStartError(result.error === "too_many" ? t.tooMany : t.offline);
      }
    });

  const error = state.error
    ? state.error === "format"
      ? t.appErrFormat
      : state.error === "wrong"
        ? t.appErrWrong(state.tries ?? 0)
        : state.error === "spent"
          ? t.appErrSpent
          : state.error === "expired"
            ? t.appErrExpired
            : state.error === "used"
              ? t.appErrUsed
              : state.error === "no_request"
                ? t.appErrNoRequest
                : state.error === "too_many"
                  ? t.tooMany
                  : state.error === "offline"
                    ? t.offline
                    : t.appErrNone
    : startError;

  return (
    <div className="mt-6">
      <p className="text-sm leading-relaxed text-muted">{t.appIntro}</p>
      <button
        type="button"
        onClick={getCode}
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-green px-5 py-3 text-sm font-semibold text-ink transition hover:bg-green-dim disabled:opacity-60"
      >
        {pending ? t.appOpening : asked || state.error ? t.appGetCodeAgain : t.appGetCode}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-faint">{t.appStep}</p>
      {/* Start в боте не сработал (так было у владельца 25.10.2026) — код
          без ссылки: /code или кнопка внизу чата, к этому же входу. */}
      {asked || state.error ? <p className="mt-2 text-xs leading-relaxed text-faint">{t.appFallback}</p> : null}

      <form action={submit} className="mt-6 flex flex-col gap-3">
        <label className="text-xs text-faint" htmlFor="app-code">
          {t.appCodeLabel}
        </label>
        <input
          id="app-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={7}
          placeholder="000000"
          required
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-text outline-none focus:border-green/50"
        />
        <button
          type="submit"
          disabled={checking}
          className="w-full rounded-xl border border-line bg-surface-2 px-5 py-3 text-sm font-semibold transition hover:border-green/40 hover:text-green disabled:opacity-60"
        >
          {t.appSignIn}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
