"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { crashDict } from "@/content/admin-panel/crash";
import { PANEL_LANG_COOKIE, panelLocale, pick } from "@/lib/admin/i18n";

/**
 * Сбой страницы панели — вместо стандартной заглушки Next.js.
 *
 * Менеджер, 13.10.2026: «Периодически выходит „This page couldn't load“ в
 * панели, нажимаю Reload, зависает на 2.5 секунды и всё нормально
 * прогружается… 3 раза за час». Это заглушка Next на ошибку в браузере:
 * своего обработчика у панели не было, и любой короткий сбой — не дошёл
 * ответ сервера на переход или на кнопку — ронял страницу целиком.
 *
 * Теперь: сбой отправляется на сервер (app/admin/crash), чтобы найти
 * причину, и страница сама тихо перезапрашивается — то же, что делал
 * человек кнопкой Reload. Не поднялась и со второго раза (за минуту) —
 * показываем понятный текст и кнопку «Обновить», без петли перезагрузок.
 */
const RETRY_KEY = "devuz_admin_retry";
const RETRY_WINDOW_MS = 60_000;

function locale() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PANEL_LANG_COOKIE}=([^;]*)`));
  return panelLocale(match ? decodeURIComponent(match[1]) : undefined);
}

/** Повторяли ли уже за последнюю минуту — тогда не повторяем снова. */
function retriedRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RETRY_KEY) ?? 0);
    return Date.now() - at < RETRY_WINDOW_MS;
  } catch {
    return true;
  }
}

function markRetry() {
  try {
    sessionStorage.setItem(RETRY_KEY, String(Date.now()));
  } catch {
    // Без хранилища — без тихого повтора: лучше кнопка, чем петля.
  }
}

function report(error: Error & { digest?: string }, retried: boolean) {
  const body = JSON.stringify({
    path: location.pathname,
    message: String(error?.message ?? error),
    digest: error?.digest ?? "",
    stack: String(error?.stack ?? ""),
    retried,
  });
  try {
    if (navigator.sendBeacon?.("/admin/crash", new Blob([body], { type: "application/json" }))) return;
  } catch {
    // ниже — запасной путь
  }
  fetch("/admin/crash", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(
    () => undefined,
  );
}

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  const t = pick(crashDict, typeof document === "undefined" ? "ru" : locale());

  useEffect(() => {
    const again = retriedRecently();
    report(error, again);
    if (again) {
      setGaveUp(true);
      return;
    }
    markRetry();
    const timer = setTimeout(() => {
      startTransition(() => {
        router.refresh();
        reset();
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [error, reset, router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {gaveUp ? (
        <>
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm text-muted">{t.text}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink"
          >
            {t.reload}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">{t.retrying}</p>
      )}
    </main>
  );
}
