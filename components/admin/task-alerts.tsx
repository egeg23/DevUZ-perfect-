"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { tasksDict } from "@/content/admin-panel/tasks";
import type { Picked } from "@/lib/admin/i18n";
import { FEED_POLL_SECONDS, type FeedItem } from "@/lib/admin/tasks";

/**
 * Звук и уведомление в браузере о задачах — пока панель открыта.
 *
 * Владелец, 01.10: «Сделай звуковое уведомление и чтобы показывалось
 * уведомлением в браузере». Панель раз в 45 секунд спрашивает сервер, что
 * нового для этого человека (app/admin/tasks/feed): новая задача ему или шаг
 * по задаче, которую поставил он.
 *
 * Звук — синтезированный, через Web Audio: файла нет, грузить нечего.
 * Браузер не даёт играть звук странице, которой ещё ни разу не касались, —
 * поэтому звук «просыпается» с первым нажатием где угодно в панели.
 * Системное уведомление — только с разрешения, а разрешение браузер
 * спрашивает только по нажатию: кнопка «Включить уведомления» в блоке задач.
 * Без разрешения остаются звук и плашка в углу панели.
 */

type Item = FeedItem & { actorName: string };

let audioContext: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/** Два коротких тона вверх — «динь-дон», около трети секунды. */
export function chime(): void {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const start = ctx.currentTime + 0.02;
  [880, 1320].forEach((freq, i) => {
    const at = start + i * 0.17;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.18);
  });
}

function textOf(t: Picked<typeof tasksDict>, item: Item): string {
  if (item.kind === "assigned") return t.feedAssigned(item.actorName, item.title);
  if (item.kind === "taken") return t.feedTaken(item.actorName, item.title);
  if (item.kind === "done") return t.feedDone(item.actorName, item.title);
  if (item.kind === "failed") return t.feedFailed(item.actorName, item.title);
  if (item.kind === "cancelled") return t.feedCancelled(item.actorName, item.title);
  return t.feedMoved(item.actorName, item.title);
}

/** Опрос и оповещение. Стоит в каркасе панели — работает в любом разделе. */
export function TaskPulse() {
  const t = usePanelDict(tasksDict);
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<(Item & { text: string })[]>([]);

  // Опрос живёт весь сеанс страницы, а язык и адрес могут смениться.
  const live = useRef({ t, pathname, router });
  live.current = { t, pathname, router };

  useEffect(() => {
    const wake = () => void audio()?.resume();
    window.addEventListener("pointerdown", wake, { once: true });

    let since: string | null = null;
    let busy = false;
    async function poll() {
      if (busy) return;
      busy = true;
      try {
        const url = since ? `/admin/tasks/feed?since=${encodeURIComponent(since)}` : "/admin/tasks/feed";
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { now?: string; items?: Item[] };
        if (data.now) since = data.now;
        const fresh = data.items ?? [];
        if (!fresh.length) return;

        const { t: dict, pathname: path, router: nav } = live.current;
        const shown = fresh.map((item) => ({ ...item, text: textOf(dict, item) }));
        chime();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const item of shown) {
            // Метка склеивает одно и то же событие из нескольких открытых вкладок.
            const note = new Notification(dict.notifTitle, { body: item.text, tag: `task-${item.id}-${item.kind}` });
            note.onclick = () => {
              window.focus();
              window.location.assign("/admin#tasks");
              note.close();
            };
          }
        }
        setItems((prev) => [...shown, ...prev].slice(0, 4));
        // На главной блок задач перерисовывается сам — новое видно сразу.
        if (path === "/admin") nav.refresh();
      } catch {
        // Сеть моргнула — спросим в следующий раз.
      } finally {
        busy = false;
      }
    }

    void poll();
    const timer = setInterval(poll, FEED_POLL_SECONDS * 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", wake);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-30 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" role="status">
      {items.map((item) => (
        <div
          key={`${item.id}-${item.kind}-${item.text}`}
          className="rounded-xl border border-gold/40 bg-surface px-4 py-3 text-sm shadow-lg"
        >
          <p>{item.text}</p>
          <div className="mt-2 flex gap-3 text-xs">
            <Link href="/admin#tasks" className="text-green hover:underline" onClick={() => setItems([])}>
              {t.openTasks}
            </Link>
            <button
              type="button"
              className="text-faint hover:text-text"
              onClick={() => setItems((prev) => prev.filter((p) => p !== item))}
            >
              {t.close}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Permission = "unknown" | "unsupported" | NotificationPermission;

/** «Включить уведомления» — разрешение браузер даёт только по нажатию. */
export function TaskAlertsButton() {
  const t = usePanelDict(tasksDict);
  const [permission, setPermission] = useState<Permission>("unknown");

  useEffect(() => {
    // Узнать можно только в браузере; на сервере кнопки нет вовсе.
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  if (permission === "unknown") return null;
  if (permission === "granted") return <span className="text-xs text-green">{t.alertsGranted}</span>;
  if (permission === "denied") return <span className="text-xs text-faint">{t.alertsDenied}</span>;
  if (permission === "unsupported") return <span className="text-xs text-faint">{t.alertsUnsupported}</span>;
  return (
    <button
      type="button"
      onClick={async () => {
        // Нажатие заодно будит звук и даёт его услышать.
        chime();
        setPermission(await Notification.requestPermission());
      }}
      className="rounded-lg border border-green/40 bg-green/10 px-3 py-1 text-xs text-green transition hover:bg-green/20"
    >
      {t.alertsOn}
    </button>
  );
}
