"use client";

import { useEffect, useRef, useState } from "react";

import { goal } from "@/lib/visit/goal";

export type PlayableLabels = {
  /** Подпись игры для скринридера: «Karvon Run: играбельная реклама». */
  screen: string;
  restart: string;
  open: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  close: string;
};

/**
 * Играбельная реклама на экране айфона — страница кейса с игрой.
 *
 * Владелец, 09.10.2026: «попадая на эту страницу в наших кейсах открывается
 * экран айфона и внутри экрана появляется эта игра со всем чем надо… Размер
 * айфона на экране страницы большой, не мельчи».
 *
 * Корпус нарисован CSS (`.iphone` в globals.css): резиновый, по высоте окна
 * на компьютере и по ширине на телефоне, с островом, строкой состояния и
 * полоской «домой». Игра — отдельный HTML-файл в iframe, ровно тот, что
 * ушёл бы в рекламную сеть: показываем настоящий плейбл, а не его запись.
 *
 * Игра сообщает о себе через postMessage (`source: "devuz-playable"`):
 * начало партии и нажатие «Скачать» уходят целями в Метрику, а после
 * нажатия снизу появляется объяснение — что эта кнопка делает в настоящей
 * рекламе и как заказать свою игру.
 */
export function PlayablePhone({
  src,
  labels,
  glow,
}: {
  src: string;
  labels: PlayableLabels;
  /** Цвет подсветки за корпусом — оттенок кейса. */
  glow: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [round, setRound] = useState(0);
  const [ready, setReady] = useState(false);
  const [callout, setCallout] = useState(false);
  const started = useRef(false);

  // Чёрный «экран загрузки» гаснет, когда игра готова. Событие load у
  // iframe приходит, бывает, раньше, чем React успевает на него подписаться
  // (игра лёгкая и грузится вместе со страницей), поэтому три пути: load,
  // сообщение «load» от самой игры и проверка при монтировании; на крайний
  // случай — таймер, чтобы экран не остался чёрным навсегда.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (doc && doc.readyState === "complete" && doc.URL !== "about:blank") setReady(true);
    const fallback = window.setTimeout(() => setReady(true), 3000);
    return () => window.clearTimeout(fallback);
  }, [round]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string; name?: string } | null;
      if (!data || data.source !== "devuz-playable") return;
      if (data.type === "event" && data.name === "load") setReady(true);
      if (data.type === "cta") {
        goal("playable_cta");
        setCallout(true);
      }
      if (data.type === "event" && data.name === "start" && !started.current) {
        started.current = true;
        goal("playable_start");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const restart = () => {
    setReady(false);
    setRound((n) => n + 1);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="iphone-wrap relative">
        {/* Подсветка за корпусом — чтобы тёмный телефон не тонул в тёмной странице. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[30%] inset-y-[5%] -z-10 rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }}
        />
        <div className="iphone">
          <span aria-hidden="true" className="iphone-btn left" style={{ top: "18%", height: "4.5%" }} />
          <span aria-hidden="true" className="iphone-btn left" style={{ top: "26%", height: "8.5%" }} />
          <span aria-hidden="true" className="iphone-btn left" style={{ top: "36.5%", height: "8.5%" }} />
          <span aria-hidden="true" className="iphone-btn right" style={{ top: "29%", height: "13%" }} />
          <div className="iphone-bezel">
            <div className="iphone-screen">
              <iframe
                key={round}
                ref={frame}
                src={src}
                title={labels.screen}
                allow="autoplay; clipboard-write"
                onLoad={() => window.setTimeout(() => setReady(true), 250)}
                className="absolute inset-0 h-full w-full border-0"
              />
              <StatusBar />
              <span aria-hidden="true" className="iphone-island" />
              <span aria-hidden="true" className="iphone-home" />
              <span aria-hidden="true" className="iphone-boot" data-ready={ready}>
                <span className="iphone-boot-dot" />
              </span>
              <span aria-hidden="true" className="iphone-glare" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[0.9rem] font-semibold text-text transition-colors hover:border-green/40 hover:text-green"
        >
          <span aria-hidden="true">↻</span>
          {labels.restart}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[0.9rem] font-semibold text-muted transition-colors hover:border-green/40 hover:text-green"
        >
          {labels.open}
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {callout ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-5 z-[60] mx-auto max-w-md rounded-2xl border border-green/30 bg-surface-2/95 p-5 shadow-2xl backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setCallout(false)}
            aria-label={labels.close}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:text-text"
          >
            ✕
          </button>
          <p className="pr-8 font-semibold text-text">{labels.ctaTitle}</p>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">{labels.ctaText}</p>
          <a
            href="#contact"
            onClick={() => {
              goal("cta_contact");
              setCallout(false);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green px-4 py-2.5 text-[0.9rem] font-semibold text-ink transition-colors hover:bg-white"
          >
            {labels.ctaButton}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      ) : null}
    </div>
  );
}

/** Строка состояния iOS: время слева, связь, Wi-Fi и батарея справа. */
function StatusBar() {
  return (
    <span aria-hidden="true" className="iphone-status">
      <span>9:41</span>
      <span className="flex items-center gap-[1.4cqw]">
        <svg viewBox="0 0 18 12" className="h-[2.9cqw] w-auto" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[2.9cqw] w-auto" fill="currentColor">
          <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.4A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .7 3.3L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.4l1.3-1.4A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.7 1.9l1.3 1.4C5.5 6.4 6.7 5.9 8 5.9Zm0 3.6c.4 0 .8.2 1.1.4L8 11.6 6.9 9.9c.3-.2.7-.4 1.1-.4Z" />
        </svg>
        <svg viewBox="0 0 27 13" className="h-[3cqw] w-auto">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor" />
          <path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </span>
  );
}
