"use client";

import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

/**
 * Плавающая кнопка чата.
 *
 * Появляется не сразу, а после того, как посетитель прокрутил первый экран:
 * всплывающее окно поверх ещё не прочитанного заголовка раздражает и его
 * закрывают не глядя, вместе с шансом на разговор.
 */
export function ChatWidget({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();

  useEffect(() => {
    // Появляется только после сцены сборки. Иначе на телефоне кнопка чата
    // наезжает на терминал ровно в тот момент, когда там дорисовывается
    // галочка, — то есть перекрывает кульминацию.
    const onScroll = () => {
      // Ищем именно сцену героя по атрибуту, а не первый попавшийся <section>:
      // на внутренних страницах сцены нет, и первым окажется обычный блок —
      // порог получился бы случайным.
      const scene = document.querySelector<HTMLElement>("[data-hero-scene]");
      // Сцена доигрывает ровно тогда, когда её липкий экран упирается в
      // нижний край: дальше её высоты вычитать нечего, иначе кнопка ждёт
      // ещё половину следующего блока и посетитель её просто не находит.
      const after = scene
        ? scene.offsetHeight - window.innerHeight
        : window.innerHeight * 0.6;
      setReady(window.scrollY > after);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Расчёт из калькулятора должен куда-то приземлиться: раскрываем виджет,
    // даже если посетитель ещё не долистал до порога появления.
    const onPrefill = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      // Текст держим в состоянии, а не ловим слушателем внутри панели:
      // панель монтируется только вместе с открытием виджета, то есть уже
      // после того, как событие отправлено, и слушатель бы его не застал.
      if (typeof text === "string") setPrefill(text);
      setReady(true);
      setOpen(true);
    };
    window.addEventListener("devuz:prefill", onPrefill);
    return () => window.removeEventListener("devuz:prefill", onPrefill);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className={cn(
        "fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 transition-all duration-500 sm:right-6",
        ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      {open ? (
        <div className="w-[min(24rem,calc(100vw-2rem))] shadow-[0_30px_90px_rgba(0,0,0,.7)]">
          <ChatPanel locale={locale} dict={dict} compact prefill={prefill} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-2xl bg-green px-5 py-3.5 font-semibold text-ink shadow-[0_14px_40px_-8px_var(--color-green)] transition-transform hover:scale-[1.03]"
      >
        {open ? (
          <>
            <span aria-hidden="true">✕</span>
            {dict.chat.close}
          </>
        ) : (
          <>
            <span aria-hidden="true">💬</span>
            {dict.chat.open}
          </>
        )}
      </button>
    </div>
  );
}
