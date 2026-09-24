"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { company } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  clock,
  minuteSnapshot,
  serverMinuteSnapshot,
  subscribeMinute,
  telegramMinuteUrl,
  type MinuteState,
} from "@/lib/minute-client";

/** Минута на скидку — общее состояние для кнопки чата и окна чата. */
export function useMinute(): MinuteState {
  return useSyncExternalStore(subscribeMinute, minuteSnapshot, serverMinuteSnapshot);
}

/** Сколько миллисекунд осталось, с перерисовкой четыре раза в секунду. */
export function useMinuteLeft(state: MinuteState): number {
  const [now, setNow] = useState(() => Date.now());
  const running = state.phase === "running";
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [running]);
  return state.phase === "running" ? Math.max(0, state.until - now) : 0;
}

/**
 * Любая ссылка на бота, нажатая во время минуты, несёт окно.
 *
 * Ссылки на Telegram есть в подвале, в контактах, в списке телефонов — и
 * человек, который пишет нам в Telegram по любой из них, пока идёт таймер,
 * тоже успел. Переписывать каждую ссылку в разметке незачем: адрес
 * подменяется в момент нажатия и сразу возвращается обратно — разметка
 * остаётся той, что отрисовал React.
 */
export function useTelegramMinuteLinks(locale: Locale): void {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const current = minuteSnapshot();
      if (current.phase !== "running") return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Только голая ссылка на бота: у передачи разговора и у заказов свой
      // параметр start, и его трогать нельзя.
      if (href.replace(/\/$/, "") !== company.telegramUrl) return;
      anchor.setAttribute("href", telegramMinuteUrl(company.telegramUrl, current.token, locale));
      window.setTimeout(() => anchor.setAttribute("href", href), 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [locale]);
}

/**
 * Плашка над кнопкой чата, пока идёт минута.
 *
 * Обещание, которое не видно, не работает: таймер крупно, полоса убывает, и
 * рядом — оба способа успеть: написать здесь или в Telegram.
 */
export function MinuteBubble({
  locale,
  dict,
  state,
  left,
  onChat,
  onHide,
}: {
  locale: Locale;
  dict: Dictionary;
  state: Extract<MinuteState, { phase: "running" }>;
  left: number;
  onChat: () => void;
  onHide: () => void;
}) {
  const total = Math.max(1, state.until - state.from);
  const share = Math.min(100, Math.max(0, (left / total) * 100));

  return (
    <div
      role="status"
      className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gold/40 bg-surface p-4 shadow-[0_24px_70px_rgba(0,0,0,.65)]"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-lg leading-none">
          🎁
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem] font-semibold leading-snug">{dict.chat.minuteTitle}</p>
          <p className="mt-1 text-[0.78rem] leading-snug text-muted">{dict.chat.minuteText}</p>
        </div>
        <button
          type="button"
          onClick={onHide}
          aria-label={dict.chat.minuteHide}
          className="-mr-1 -mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-faint transition-colors hover:text-text"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-2xl tabular-nums text-gold" aria-hidden="true">
          {clock(left)}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onChat}
            className="rounded-lg bg-green px-3 py-2 text-[0.78rem] font-semibold text-ink transition-opacity hover:opacity-90"
          >
            {dict.chat.minuteChat}
          </button>
          <a
            href={telegramMinuteUrl(company.telegramUrl, state.token, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-blue-soft/40 bg-blue/10 px-3 py-2 text-[0.78rem] font-medium text-blue-soft transition-colors hover:border-blue-soft hover:bg-blue/20"
          >
            <span aria-hidden="true">✈</span>
            {dict.chat.minuteTelegram}
          </a>
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="h-full rounded-full bg-gold transition-[width] duration-300 ease-linear" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}
