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
 */
const SRC = "/home/office.mp4";
const POSTER = "/home/office.webp";

export function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (calm || save) return;

    node.src = SRC;
    let seen = true;
    const play = () => {
      if (!seen || document.hidden) return;
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
    play();
    return () => {
      watch.disconnect();
      document.removeEventListener("visibilitychange", onVis);
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
