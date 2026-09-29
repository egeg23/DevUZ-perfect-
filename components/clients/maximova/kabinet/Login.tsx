"use client";

import { useEffect, useRef, useState } from "react";

import s from "./kabinet.module.css";

type Phase = "idle" | "starting" | "waiting" | "expired" | "error";

/**
 * Вход в кабинет через бота Дарьи.
 *
 * Без паролей и без кодов, которые надо переписывать руками: человек
 * нажимает кнопку, Telegram открывает бота, бот получает /start с токеном —
 * и страница, которая всё это время тихо спрашивала сервер, открывает
 * кабинет. Первый вход и есть регистрация: имя берётся из Telegram.
 */
export function Login({ ready, invite = "" }: { ready: boolean; invite?: string }) {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const poll = (token: string) => {
    const started = Date.now();
    timer.current = setInterval(async () => {
      if (Date.now() - started > 10 * 60 * 1000) {
        if (timer.current) clearInterval(timer.current);
        setPhase("expired");
        return;
      }
      const response = await fetch(`/api/maximova/auth/status?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { status?: string } | null;
      if (data?.status === "ok") {
        if (timer.current) clearInterval(timer.current);
        window.location.reload();
      } else if (data?.status === "expired") {
        if (timer.current) clearInterval(timer.current);
        setPhase("expired");
      }
    }, 2000);
  };

  const start = async () => {
    setError("");
    setPhase("starting");
    const response = await fetch("/api/maximova/auth/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consent, invite }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; link?: string; token?: string; error?: string } | null;
    if (!data?.ok || !data.link || !data.token) {
      setPhase("error");
      setError(data?.error || "Не получилось начать вход. Попробуйте ещё раз.");
      return;
    }
    setLink(data.link);
    setPhase("waiting");
    // Новая вкладка, а не переход: эта страница должна остаться открытой и
    // дождаться подтверждения. На телефоне ссылка t.me откроет приложение.
    window.open(data.link, "_blank", "noopener");
    poll(data.token);
  };

  if (!ready) {
    return (
      <div className={s.card}>
        <p className={s.lead}>
          Вход через Telegram заработает, как только я подключу своего бота. Пока записаться можно на{" "}
          <a href="/maximova#zapis">главной странице</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <ol className={s.how}>
        <li>Нажмите «Войти через Telegram» — откроется мой бот.</li>
        <li>В боте нажмите «Старт».</li>
        <li>Вернитесь сюда — кабинет откроется сам.</li>
      </ol>

      {phase === "waiting" ? (
        <div className={s.waiting} role="status">
          <p>Ждём подтверждения в Telegram…</p>
          <p className={s.hint}>
            Бот не открылся?{" "}
            <a href={link} target="_blank" rel="noopener noreferrer">
              Открыть бота ещё раз
            </a>
          </p>
        </div>
      ) : (
        <>
          <label className={s.consent}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Согласен(на) на обработку персональных данных по{" "}
              <a href="/maximova/privacy" target="_blank">
                политике
              </a>
              .
            </span>
          </label>
          <button type="button" className={s.button} disabled={!consent || phase === "starting"} onClick={start}>
            {phase === "starting" ? "Открываем бота…" : "Войти через Telegram"}
          </button>
          {phase === "expired" ? <p className={s.error}>Время на вход вышло. Нажмите кнопку ещё раз.</p> : null}
          {error ? <p className={s.error}>{error}</p> : null}
        </>
      )}
    </div>
  );
}
