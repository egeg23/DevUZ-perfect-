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

/** Высота полосы минуты: на неё опускается шапка сайта (`--minute-bar`). */
export const MINUTE_BAR_HEIGHT = 40;

/**
 * Полоса минуты на скидку — на самом верху страницы, во всю ширину
 * (владелец, 06.11.2026: «Плашка пусть будет вверху полоской, на самом
 * верху страницы вдоль всей длины страницы»). До этого плашкой над кнопкой
 * чата она закрывала первый экран: на компьютере переписку ИИ-сотрудника,
 * на телефоне кнопки.
 *
 * Обещание, которое не видно, не работает: таймер, убывающая полоска снизу
 * и оба способа успеть — написать здесь или в Telegram. На телефоне — без
 * пояснения и с одной иконкой Telegram: полоса в одну строку.
 */
export function MinuteBar({
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
      className="sk fixed inset-x-0 top-0 z-[60] border-b border-gold/30 bg-[linear-gradient(90deg,#1d170c,#120f0a_50%,#1d170c)] text-text"
      style={{ height: MINUTE_BAR_HEIGHT }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1320px] items-center gap-3 px-4 sm:px-8 lg:px-12">
        <span aria-hidden="true" className="text-base leading-none">
          🎁
        </span>
        <button
          type="button"
          onClick={onChat}
          className="min-w-0 flex-1 truncate text-left text-[0.84rem]"
        >
          <span className="font-semibold">{dict.chat.minuteTitle}</span>
          {/* На телефоне — без пояснения: полоса в одну строку и не толкает
              первый экран. Что делать, говорят кнопки рядом. */}
          <span className="hidden text-[0.78rem] leading-snug text-muted lg:inline">{" · "}{dict.chat.minuteText}</span>
        </button>
        <span className="shrink-0 font-mono text-[0.95rem] tabular-nums text-gold" aria-hidden="true">
          {clock(left)}
        </span>
        <button
          type="button"
          onClick={onChat}
          className="hidden shrink-0 whitespace-nowrap rounded-md bg-green px-3 py-1 text-[0.76rem] font-semibold text-ink transition-opacity hover:opacity-90 sm:block"
        >
          {dict.chat.minuteChat}
        </button>
        <a
          href={telegramMinuteUrl(company.telegramUrl, state.token, locale)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={dict.chat.minuteTelegram}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-soft/40 bg-blue/10 px-2.5 py-1 text-[0.76rem] font-medium text-blue-soft transition-colors hover:border-blue-soft hover:bg-blue/20"
        >
          <span aria-hidden="true">✈</span>
          <span className="hidden sm:inline">{dict.chat.minuteTelegram}</span>
        </a>
        <button
          type="button"
          onClick={onHide}
          aria-label={dict.chat.minuteHide}
          className="shrink-0 rounded-md px-1.5 py-0.5 text-faint transition-colors hover:text-text"
        >
          ✕
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px]" aria-hidden="true">
        <div className="h-full bg-gold transition-[width] duration-300 ease-linear" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}
