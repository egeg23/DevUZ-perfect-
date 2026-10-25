"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { bellDoneAction } from "@/app/admin/bell/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { bellDict } from "@/content/admin-panel/bell";

type Item = { id: number; title: string; body: string; href: string; at: string; done: boolean };

/** Пока вкладка видна — раз в полторы минуты, как пульс «Главной»: счёт базы без строк. */
const POLL_MS = 90_000;

/**
 * Колокольчик в шапке (lib/admin/bell.ts): что бот писал мне, с «✓ Сделано».
 * Число — не отмеченное за 14 дней. Список грузится только по нажатию:
 * в шапке каждой страницы висит лишь счёт.
 */
export function Bell() {
  const t = usePanelDict(bellDict);
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(async (list: boolean) => {
    try {
      const r = await fetch(list ? "/admin/bell?list=1" : "/admin/bell", { cache: "no-store" });
      if (!r.ok) return;
      const body = (await r.json()) as { count?: unknown; items?: Item[] };
      setCount(Number(body.count) || 0);
      if (list) setItems(Array.isArray(body.items) ? body.items : []);
    } catch {
      // Нет связи — колокольчик молчит, страница работает.
    }
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    void refresh(false);
    setOpen(false);
  }, [pathname, refresh]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh(false);
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setFailed(false);
    if (next) void refresh(true);
  };

  const mark = async (id: number | "all") => {
    const before = items;
    const was = count;
    setFailed(false);
    setItems((list) => list?.map((item) => (id === "all" || item.id === id ? { ...item, done: true } : item)) ?? list);
    setCount((n) => (id === "all" ? 0 : Math.max(0, n - (before?.some((i) => i.id === id && !i.done) ? 1 : 0))));
    const ok = await bellDoneAction(id).catch(() => false);
    if (!ok) {
      setItems(before);
      setCount(was);
      setFailed(true);
    }
  };

  const now = Date.now();
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={t.button(count)}
        aria-label={t.button(count)}
        className="relative text-base leading-none text-faint transition hover:text-green"
      >
        <span aria-hidden>🔔</span>
        {count ? (
          <span className="absolute -right-2 -top-1.5 min-w-[1rem] rounded-full bg-gold px-1 py-px text-center font-mono text-[10px] leading-none text-ink">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open && mounted
        ? createPortal(
            <div className="admin-panel fixed inset-0 z-50" onPointerDown={() => setOpen(false)}>
              <div
                role="dialog"
                aria-label={t.title}
                onPointerDown={(e) => e.stopPropagation()}
                className="fixed inset-x-4 top-14 flex max-h-[75vh] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/50 sm:left-auto sm:w-[26rem]"
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{t.title}</p>
                    <p className="text-xs text-faint">{t.note}</p>
                  </div>
                  {count ? (
                    <button type="button" onClick={() => void mark("all")} className="shrink-0 text-xs text-green hover:underline">
                      {t.allDone}
                    </button>
                  ) : null}
                </div>
                {failed ? <p className="px-4 pt-2 text-xs text-red-300">{t.failed}</p> : null}
                <ul className="flex-1 overflow-y-auto">
                  {items === null ? (
                    <li className="px-4 py-6 text-center text-sm text-faint">{t.loading}</li>
                  ) : items.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-faint">{t.empty}</li>
                  ) : (
                    items.map((item) => (
                      <li key={item.id} className={`border-b border-line px-4 py-3 last:border-b-0 ${item.done ? "opacity-55" : ""}`}>
                        <p className="text-sm text-text">{item.title}</p>
                        {item.body ? <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-xs leading-snug text-muted">{item.body}</p> : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="text-faint">{t.ago(Math.max(0, Math.floor((now - Date.parse(item.at)) / 60_000)))}</span>
                          <Link href={item.href} onClick={() => setOpen(false)} className="text-green hover:underline">
                            {t.open}
                          </Link>
                          {item.done ? (
                            <span className="text-faint">{t.doneMark}</span>
                          ) : (
                            <button type="button" onClick={() => void mark(item.id)} className="text-muted transition hover:text-green">
                              {t.done}
                            </button>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
