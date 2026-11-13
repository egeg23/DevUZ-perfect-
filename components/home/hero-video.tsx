"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Фон первого экрана — пролёт по офису студии (владелец, 13.11.2026:
 * «Убери здание с фона… У нас же есть видео с пролетом через офис, сделай
 * просто гиф анимацией, чтобы выглядело как видео на заднем фоне, но
 * затемни сам фон»).
 *
 * Как гифка: без звука, по кругу, без кнопок. Ролик — первые секунды фильма
 * студии (public/film), замедлены и склеены вперёд-назад, поэтому шва в
 * петле нет (как собран — public/home/README.md). Постер стоит сразу; при
 * «меньше движения» и экономии трафика ролик не грузится вовсе. Вне экрана и
 * на скрытой вкладке — пауза: фон не жжёт батарею, пока его не видно.
 *
 * Ролик начинает грузиться только после загрузки страницы (разбор трафика
 * 13.11.2026: 1,2 МБ ролика шли вместе с первым экраном, Lighthouse на
 * телефоне — 50 из 100, главный блок через 5,5 с). Телефону — своя версия
 * 720 точек (office-m.mp4, ~440 КБ), на медленной сети (2g/3g) — только
 * постер.
 */
const SRC = "/home/office.mp4";
const SRC_PHONE = "/home/office-m.mp4";
const PHONE = "(max-width: 767px)";
const SLOW = new Set(["slow-2g", "2g", "3g"]);
const POSTER = "/home/office.webp";

export function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (calm || net?.saveData || (net?.effectiveType && SLOW.has(net.effectiveType))) return;

    let seen = true;
    let started = false;
    const play = () => {
      if (!started || !seen || document.hidden) return;
      const p = node.play();
      if (p) p.then(() => setOn(true)).catch(() => undefined);
    };
    const watch = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      if (seen) play();
      else node.pause();
    });
    watch.observe(node);
    const onVis = () => (document.hidden ? node.pause() : play());
    document.addEventListener("visibilitychange", onVis);

    // Не раньше, чем страница загрузилась, и в свободную минуту браузера.
    let idle = 0;
    const start = () => {
      if (started) return;
      started = true;
      node.src = window.matchMedia(PHONE).matches ? SRC_PHONE : SRC;
      play();
    };
    const later = () => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 600);
    };
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    return () => {
      watch.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("load", later);
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      node.pause();
    };
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- постер фона с маской, оптимизатор не нужен */}
      <img src={POSTER} alt="" width={1280} height={536} fetchPriority="high" decoding="async" />
      <video ref={ref} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} data-on={on || undefined} />
    </>
  );
}
