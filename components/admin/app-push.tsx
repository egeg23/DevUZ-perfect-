"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { isStandalone } from "@/components/admin/app-login";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { usePanelDict } from "@/components/admin/panel-locale";
import { appDict } from "@/content/admin-panel/app";
import type { Picked } from "@/lib/admin/i18n";

/**
 * Панель — приложение на телефоне и пуш (CLAUDE.md, раздел с тем же
 * названием).
 *
 * `card` — на «Главной»: на телефоне, пока приложение не поставлено или
 * уведомления не включены, — «Установить приложение» (Android), подсказка
 * «Поделиться → На экран „Домой“» (iPhone, Safari) или «Включить
 * уведомления» (в приложении). На компьютере — одна тихая строка: включить
 * можно, навязывать нельзя. Карточку можно скрыть — это помнит браузер.
 *
 * `row` — в «Команде» у самого себя: «Это устройство: уведомления включены
 * / выключить» и «Проверить» — тестовый пуш себе.
 *
 * Разрешение спрашивается только по нажатию: на iPhone иначе нельзя, и это
 * первое, что делает нажатие, — до любого запроса к серверу.
 */

const HIDE_KEY = "devuz-app-card-hidden";
const SYNC_KEY = "devuz-push-synced";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Status = "loading" | "unsupported" | "on" | "off" | "denied";

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function api(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch("/admin/push", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok ? ((await response.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function platform() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  return { ios, android, mobile: ios || android, iosSafari: ios && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua) };
}

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin", updateViaCache: "none" });
}

function usePush() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supported()) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("denied");
      try {
        const reg = await registration();
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return alive && setStatus("off");
        // Подписка в браузере есть — сервер о ней знает (раз за вкладку
        // напоминаем: строку могли удалить после 410 или передать устройство).
        const session = storage("session");
        if (!session?.getItem(SYNC_KEY)) {
          await api({ action: "subscribe", subscription: sub.toJSON(), standalone: isStandalone() });
          session?.setItem(SYNC_KEY, "1");
        }
        if (alive) setStatus("on");
      } catch {
        if (alive) setStatus("off");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enable = useCallback(async (failed: string) => {
    setBusy(true);
    setNote(null);
    try {
      // Первым делом — разрешение: на iPhone его можно спросить только
      // прямо из нажатия.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const key = await fetch("/admin/push", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null));
      if (!key?.publicKey) throw new Error("key");
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(String(key.publicKey)) }));
      const saved = await api({ action: "subscribe", subscription: sub.toJSON(), standalone: isStandalone() });
      if (!saved?.ok) throw new Error("save");
      storage("session")?.setItem(SYNC_KEY, "1");
      setStatus("on");
    } catch {
      setNote(failed);
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api({ action: "unsubscribe", endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async (sent: string, failed: string) => {
    setBusy(true);
    const result = await api({ action: "test" });
    setNote(result?.ok ? sent : failed);
    setBusy(false);
  }, []);

  return { status, busy, note, enable, disable, test };
}

const LINK = "text-xs text-faint transition hover:text-green disabled:opacity-60";
const PRIMARY =
  "rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-green-dim disabled:opacity-60";

/** Включено: строка с «Проверить» и «Выключить». */
function OnLine({ push, t }: { push: ReturnType<typeof usePush>; t: Picked<typeof appDict> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="text-green">🔔 {t.on}</span>
      <button type="button" disabled={push.busy} onClick={() => push.test(t.testSent, t.testFailed)} className={LINK}>
        {t.test}
      </button>
      <button type="button" disabled={push.busy} onClick={push.disable} className={LINK}>
        {t.turnOff}
      </button>
      {push.note ? <span className="w-full text-faint">{push.note}</span> : null}
    </div>
  );
}

export function AppPush({ variant }: { variant: "card" | "row" }) {
  const t = usePanelDict(appDict);
  const push = usePush();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [install, setInstall] = useState<InstallEvent | null>(null);

  useEffect(() => {
    setMounted(true);
    setHidden(storage("local")?.getItem(HIDE_KEY) === "1");
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!mounted || push.status === "loading") return null;
  const { ios, android, mobile, iosSafari } = platform();
  const app = isStandalone();

  if (variant === "row") {
    if (push.status === "on") return <OnLine push={push} t={t} />;
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-faint">🔕 {t.off}</span>
        {push.status === "off" ? (
          <button type="button" disabled={push.busy} onClick={() => push.enable(t.failed)} className={LINK}>
            {push.busy ? t.enabling : t.enable}
          </button>
        ) : null}
        {push.status === "denied" ? <span className="w-full text-faint">{t.denied}</span> : null}
        {push.status === "unsupported" ? <span className="w-full text-faint">{ios && !app ? t.iosHow : t.unsupported}</span> : null}
        {push.note ? <span className="w-full text-faint">{push.note}</span> : null}
      </div>
    );
  }

  // ── Карточка на «Главной» ──────────────────────────────────────────────
  if (push.status === "on") {
    return (
      <div className="mb-4">
        <OnLine push={push} t={t} />
      </div>
    );
  }
  if (hidden) return null;

  const hide = () => {
    storage("local")?.setItem(HIDE_KEY, "1");
    setHidden(true);
  };

  // На компьютере — тихая строка, без карточки.
  if (!mobile) {
    if (push.status !== "off") return null;
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-3 text-xs">
        <button type="button" disabled={push.busy} onClick={() => push.enable(t.failed)} className={LINK}>
          🔔 {push.busy ? t.enabling : t.enableDesktop}
        </button>
        <button type="button" onClick={hide} className={LINK}>
          {t.hide}
        </button>
        {push.note ? <span className="w-full text-faint">{push.note}</span> : null}
      </div>
    );
  }

  let action: ReactNode = null;
  if (!app && ios) {
    action = <p className="text-sm leading-relaxed text-muted">{iosSafari ? t.iosHow : t.iosSafari}</p>;
  } else if (!app && android && install) {
    action = (
      <button
        type="button"
        className={PRIMARY}
        onClick={async () => {
          await install.prompt();
          setInstall(null);
        }}
      >
        {t.install}
      </button>
    );
  } else if (push.status === "off") {
    action = (
      <>
        <button type="button" disabled={push.busy} onClick={() => push.enable(t.failed)} className={PRIMARY}>
          {push.busy ? t.enabling : t.enable}
        </button>
        {!app && android ? <p className="mt-2 text-xs leading-relaxed text-faint">{t.androidHow}</p> : null}
      </>
    );
  } else if (push.status === "denied") {
    action = <p className="text-sm leading-relaxed text-gold">{t.denied}</p>;
  } else if (push.status === "unsupported") {
    action = <p className="text-sm leading-relaxed text-muted">{ios ? t.iosOld : android ? t.androidHow : t.unsupported}</p>;
  }
  if (!action) return null;

  return (
    <section className="mb-5 rounded-xl border border-green/25 bg-green/5 px-4 py-4">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pwa/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {t.cardTitle}
            <HelpHint topic={helpAnchor("/admin/hq", "app")} />
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t.cardWhy}</p>
        </div>
        <button type="button" onClick={hide} className={`${LINK} shrink-0`}>
          {t.hide}
        </button>
      </div>
      <div className="mt-3">{action}</div>
      {push.note ? <p className="mt-2 text-xs text-gold">{push.note}</p> : null}
      <p className="mt-3 text-[11px] leading-snug text-faint">{t.sameAsBot}</p>
    </section>
  );
}
